/**
 * supabase-api.js — Real Supabase backend implementation.
 *
 * Exports the same `api` object shape as mock-api.js.
 * UI controllers import from api.js (the router) — never directly from here.
 *
 * Slot generation strategy:
 *   Supabase has no pre-generated slot rows. We generate 12 candidate slots
 *   client-side (same logic as mock-api.js) then LEFT JOIN against
 *   availability_view to mark which are booked.
 *
 * Double-booking guard:
 *   createBooking catches Postgres error code 23505 (unique_violation) thrown
 *   by the partial UNIQUE index on bookings(field_id, slot_datetime) and
 *   re-throws as { code: 'SLOT_TAKEN' } — same contract as mock-api.js.
 */

import { getSupabaseClient } from './supabase-client.js';

// ─── Slot config (must match mock-api.js exactly) ─────────────────────────────
const SLOT_START_HOURS_LOCAL = [6, 7.5, 9, 10.5, 12, 13.5, 15, 16.5, 18, 19.5, 21, 22.5];
const SLOT_DURATION_MIN = 90;
const PEAK_HOURS_LOCAL = [17, 18, 19, 20]; // Asia/Bangkok local hours

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Returns "YYYY-MM-DD" in Asia/Bangkok timezone for a given Date.
 * @param {Date} d
 * @returns {string}
 */
function _toLocalDateStr(d) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(d);
}

/**
 * Converts a Bangkok local date string + fractional hour to UTC ISO string.
 * e.g. "2026-04-25" + 18 → "2026-04-25T11:00:00.000Z"
 * @param {string} dateStr - "YYYY-MM-DD" in Bangkok time
 * @param {number} hourLocal - fractional hour (7.5 = 07:30)
 * @returns {string} UTC ISO string
 */
function _buildSlotIso(dateStr, hourLocal) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const hourInt = Math.floor(hourLocal);
  const minuteInt = (hourLocal % 1) * 60;
  // UTC = Bangkok local - 7h
  const utcDate = new Date(Date.UTC(year, month - 1, day, hourInt - 7, minuteInt, 0, 0));
  return utcDate.toISOString();
}

// ─── API methods ──────────────────────────────────────────────────────────────

/**
 * Lists active fields with optional filtering.
 * Filters: district, priceMin, priceMax, capacity, sort
 * @param {import('./mock-api.js').BookingFilters} [filters]
 * @returns {Promise<import('./mock-api.js').Field[]>}
 */
async function listFields(filters = {}) {
  const sb = getSupabaseClient();
  let query = sb
    .from('fields')
    .select('*')
    .eq('is_active', true);

  if (filters.district) {
    query = query.eq('district', filters.district);
  }
  if (typeof filters.priceMin === 'number') {
    query = query.gte('price_per_hour_vnd', filters.priceMin);
  }
  if (typeof filters.priceMax === 'number') {
    query = query.lte('price_per_hour_vnd', filters.priceMax);
  }
  if (typeof filters.capacity === 'number') {
    query = query.eq('capacity', filters.capacity);
  }

  // Sorting
  if (filters.sort === 'price_asc') {
    query = query.order('price_per_hour_vnd', { ascending: true });
  } else if (filters.sort === 'price_desc') {
    query = query.order('price_per_hour_vnd', { ascending: false });
  } else {
    query = query.order('name', { ascending: true });
  }

  const { data, error } = await query;
  if (error) throw new Error(`listFields failed: ${error.message}`);
  return data ?? [];
}

/**
 * Returns a single field by ID (uuid).
 * @param {string} id
 * @returns {Promise<import('./mock-api.js').Field>}
 */
async function getField(id) {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('fields')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') throw new Error(`Field not found: ${id}`);
    throw new Error(`getField failed: ${error.message}`);
  }
  return data;
}

/**
 * Returns 12 slots (90-min each, 06:00–23:00 Bangkok) for a given field and date.
 * Marks each slot as 'available' or 'booked' by checking availability_view.
 * @param {string} fieldId
 * @param {string} dateISO - "YYYY-MM-DD" in Bangkok local time
 * @returns {Promise<import('./mock-api.js').Slot[]>}
 */
async function listSlots(fieldId, dateISO) {
  const sb = getSupabaseClient();

  // Fetch field for base price
  const field = await getField(fieldId);

  // Generate all 12 slot UTC timestamps for this date
  const slotIsos = SLOT_START_HOURS_LOCAL.map((h) => _buildSlotIso(dateISO, h));

  // Fetch booked slots for this field+date from availability_view
  const dayStart = _buildSlotIso(dateISO, 0);   // midnight Bangkok = 17:00 prev day UTC
  const dayEnd   = _buildSlotIso(dateISO, 24);  // midnight+1 Bangkok

  const { data: bookedRows, error } = await sb
    .from('availability_view')
    .select('slot_datetime')
    .eq('field_id', fieldId)
    .gte('slot_datetime', dayStart)
    .lt('slot_datetime', dayEnd);

  if (error) throw new Error(`listSlots availability query failed: ${error.message}`);

  const bookedSet = new Set((bookedRows ?? []).map((r) => new Date(r.slot_datetime).toISOString()));

  return SLOT_START_HOURS_LOCAL.map((hourLocal, i) => {
    const slotIso = slotIsos[i];
    const hourInt = Math.floor(hourLocal);
    const isPeak = PEAK_HOURS_LOCAL.includes(hourInt);
    const priceVnd = isPeak
      ? Math.round(field.price_per_hour_vnd * 1.4)
      : field.price_per_hour_vnd;
    const status = bookedSet.has(slotIso) ? 'booked' : 'available';

    return {
      field_id: fieldId,
      slot_datetime_iso: slotIso,
      status,
      duration_min: SLOT_DURATION_MIN,
      price_vnd: priceVnd,
    };
  });
}

/**
 * Creates a booking.
 * Throws { code: 'SLOT_TAKEN', message: '...' } on double-booking (Postgres 23505).
 * @param {import('./mock-api.js').BookingPayload} payload
 * @returns {Promise<{ id: string, status: 'pending' }>}
 */
async function createBooking(payload) {
  const sb = getSupabaseClient();
  const { fieldId, slotDatetimeIso, userName, userPhone, userEmail = '', userNote = '' } = payload;

  if (!fieldId || !slotDatetimeIso || !userName || !userPhone) {
    throw new Error('Thiếu thông tin đặt sân bắt buộc');
  }

  // Calculate total price
  const field = await getField(fieldId);
  const slotHourUtc = new Date(slotDatetimeIso).getUTCHours();
  const slotHourLocal = (slotHourUtc + 7) % 24;
  const isPeak = PEAK_HOURS_LOCAL.includes(slotHourLocal);
  const priceVnd = isPeak
    ? Math.round(field.price_per_hour_vnd * 1.4)
    : field.price_per_hour_vnd;
  const totalVnd = Math.round(priceVnd * (SLOT_DURATION_MIN / 60));

  // Get current user
  const { data: { user } } = await sb.auth.getUser();

  const { data, error } = await sb
    .from('bookings')
    .insert({
      user_id:          user?.id ?? null,
      user_name:        userName.trim(),
      user_phone:       userPhone.trim(),
      user_email:       userEmail.trim() || null,
      user_note:        userNote.trim() || null,
      field_id:         fieldId,
      slot_datetime:    slotDatetimeIso,
      duration_min:     SLOT_DURATION_MIN,
      total_vnd:        totalVnd,
      status:           'pending',
    })
    .select('id, status')
    .single();

  if (error) {
    // 23505 = unique_violation — the partial index caught a double-booking
    if (error.code === '23505') {
      throw { code: 'SLOT_TAKEN', message: 'Khung giờ này đã được đặt. Vui lòng chọn khung giờ khác.' };
    }
    // 42501 = RLS denied (user not authenticated in real-backend mode)
    if (error.code === '42501') {
      throw { code: 'AUTH_REQUIRED', message: 'Vui lòng đăng nhập để đặt sân.' };
    }
    throw new Error(`createBooking failed: ${error.message}`);
  }

  return { id: data.id, status: 'pending' };
}

/**
 * Retrieves a booking by ID.
 * @param {string} id
 * @returns {Promise<import('./mock-api.js').Booking>}
 */
async function getBooking(id) {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') throw new Error(`Booking not found: ${id}`);
    throw new Error(`getBooking failed: ${error.message}`);
  }

  // Normalize DB column names to match mock-api.js Booking shape
  return _normalizeBooking(data);
}

/**
 * Returns all bookings for the current authenticated user, newest first.
 * @returns {Promise<import('./mock-api.js').Booking[]>}
 */
async function listMyBookings() {
  const sb = getSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];

  const { data, error } = await sb
    .from('bookings')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`listMyBookings failed: ${error.message}`);
  return (data ?? []).map(_normalizeBooking);
}

/**
 * Cancels a booking owned by the current user.
 * Server enforces: user_id = auth.uid() via RLS + status check.
 * @param {string} id
 * @returns {Promise<void>}
 */
async function cancelBooking(id) {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id);

  if (error) throw new Error(`cancelBooking failed: ${error.message}`);
}

// ─── Admin methods ────────────────────────────────────────────────────────────

/**
 * Admin: returns ALL bookings (no user_id filter — RLS admin policy handles access).
 * @param {{ status?: string, dateFrom?: string, dateTo?: string }} [filters]
 * @returns {Promise<import('./mock-api.js').Booking[]>}
 */
async function adminListBookings(filters = {}) {
  const sb = getSupabaseClient();
  let query = sb.from('bookings').select('*');

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.dateFrom) {
    query = query.gte('slot_datetime', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('slot_datetime', filters.dateTo);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) throw new Error(`adminListBookings failed: ${error.message}`);
  return (data ?? []).map(_normalizeBooking);
}

/**
 * Admin: updates any booking (status transitions, deposit_paid_vnd, etc).
 * RLS admin policy allows this; regular users are blocked server-side.
 * @param {string} id
 * @param {object} patch
 * @returns {Promise<import('./mock-api.js').Booking>}
 */
async function adminUpdateBooking(id, patch) {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('bookings')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(`adminUpdateBooking failed: ${error.message}`);
  return _normalizeBooking(data);
}

/**
 * Admin: creates or updates a field (upsert by id).
 * @param {object} fieldData
 * @returns {Promise<import('./mock-api.js').Field>}
 */
async function adminUpsertField(fieldData) {
  const sb = getSupabaseClient();
  const payload = { ...fieldData };
  // Remove id for insert (let DB generate), keep for update
  const { data, error } = await sb
    .from('fields')
    .upsert(payload)
    .select('*')
    .single();

  if (error) throw new Error(`adminUpsertField failed: ${error.message}`);
  return data;
}

/**
 * Admin: soft-deletes a field by setting is_active = false.
 * @param {string} id
 * @returns {Promise<void>}
 */
async function adminDeactivateField(id) {
  const sb = getSupabaseClient();
  const { error } = await sb
    .from('fields')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw new Error(`adminDeactivateField failed: ${error.message}`);
}

/**
 * Admin: lists ALL fields including inactive ones.
 * @returns {Promise<import('./mock-api.js').Field[]>}
 */
async function adminListFields() {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('fields')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(`adminListFields failed: ${error.message}`);
  return data ?? [];
}

/**
 * Returns the distinct list of districts present in active fields.
 * Fetches from DB rather than hard-coding.
 * @returns {Promise<string[]>}
 */
async function getDistrictsAsync() {
  const sb = getSupabaseClient();
  const { data, error } = await sb
    .from('fields')
    .select('district')
    .eq('is_active', true);

  if (error) return [];
  const unique = [...new Set((data ?? []).map((r) => r.district))].sort();
  return unique;
}

// Sync wrapper for compatibility with mock-api.js getDistricts() (sync)
// Returns cached value; UI calls this after listFields() so data is warm.
let _cachedDistricts = [];
async function _warmDistricts() {
  _cachedDistricts = await getDistrictsAsync();
}
_warmDistricts().catch(() => {}); // fire-and-forget; non-critical

function getDistricts() {
  return _cachedDistricts;
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

/**
 * Converts a DB bookings row to the mock-api.js Booking shape.
 * DB uses snake_case columns; some field names differ slightly.
 * @param {object} row
 * @returns {import('./mock-api.js').Booking}
 */
function _normalizeBooking(row) {
  return {
    id:                         row.id,
    user_name:                  row.user_name,
    user_phone:                 row.user_phone,
    user_email:                 row.user_email ?? '',
    user_note:                  row.user_note ?? '',
    field_id:                   row.field_id,
    slot_datetime_iso:          row.slot_datetime,  // DB timestamptz → ISO string
    duration_min:               row.duration_min,
    total_vnd:                  row.total_vnd,
    status:                     row.status,
    created_at_iso:             row.created_at,
    cancellation_deadline_iso:  row.cancellation_deadline,
  };
}

// ─── Public API export ────────────────────────────────────────────────────────

export const api = {
  // ── Standard user API ──────────────────────────────────────────────────────
  listFields,
  getField,
  listSlots,
  createBooking,
  getBooking,
  listMyBookings,
  cancelBooking,
  getDistricts,
  // ── Admin API ──────────────────────────────────────────────────────────────
  adminListBookings,
  adminUpdateBooking,
  adminUpsertField,
  adminDeactivateField,
  adminListFields,
};
