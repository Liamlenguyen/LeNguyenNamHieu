/**
 * mock-api.js — Contract-first mock API for Phase 03
 * Exports the same interface that phase-04 (supabase-api.js) will implement.
 * Data is stored in-memory + persisted to localStorage key "nh_bookings_v1".
 * Simulates ~300ms network latency on all calls.
 *
 * PHASE-04 HANDOFF NOTE:
 *   Replace this file with supabase-api.js exporting the same `api` object.
 *   All field/slot/booking shapes use snake_case to match DB columns.
 *   JS callers never see DB internals — mapping lives in supabase-api.js only.
 */

// ─── Seed Data ────────────────────────────────────────────────────────────────

/** @type {Field[]} */
const FIELDS = [
  {
    id: 'field-001',
    name: 'Sân bóng đá Nam Hiếu A',
    slug: 'san-bong-nam-hieu-a',
    location: '12 Nguyễn Thị Minh Khai, Phường Đa Kao',
    district: 'Quận 1',
    city: 'TP. Hồ Chí Minh',
    capacity: 5,
    price_per_hour_vnd: 180000,
    surface: 'Cỏ nhân tạo',
    image_url: '/assets/images/san-bong.jpg',
    description: 'Sân 5 người tiêu chuẩn, cỏ nhân tạo thế hệ mới, đèn LED chiếu sáng tốt, phù hợp thi đấu buổi tối.',
    is_active: true,
  },
  {
    id: 'field-002',
    name: 'Sân bóng đá Nam Hiếu B',
    slug: 'san-bong-nam-hieu-b',
    location: '45 Võ Văn Tần, Phường 6',
    district: 'Quận 3',
    city: 'TP. Hồ Chí Minh',
    capacity: 7,
    price_per_hour_vnd: 280000,
    surface: 'Cỏ nhân tạo',
    image_url: '/assets/images/the-football-king.jpg',
    description: 'Sân 7 người rộng rãi, mặt cỏ chất lượng cao, có mái che chống nắng mưa, bãi giữ xe miễn phí.',
    is_active: true,
  },
  {
    id: 'field-003',
    name: 'Sân bóng đá Bình Thạnh',
    slug: 'san-bong-binh-thanh',
    location: '78 Phan Văn Trị, Phường 10',
    district: 'Bình Thạnh',
    city: 'TP. Hồ Chí Minh',
    capacity: 7,
    price_per_hour_vnd: 250000,
    surface: 'Cỏ tự nhiên',
    image_url: '/assets/images/messi.jpg',
    description: 'Sân cỏ tự nhiên được chăm sóc kỹ, không khí thoáng mát, lý tưởng cho các trận giao hữu cuối tuần.',
    is_active: true,
  },
  {
    id: 'field-004',
    name: 'Sân bóng đá Thủ Đức Arena',
    slug: 'san-bong-thu-duc-arena',
    location: '123 Võ Văn Ngân, Phường Bình Thọ',
    district: 'Thủ Đức',
    city: 'TP. Hồ Chí Minh',
    capacity: 11,
    price_per_hour_vnd: 450000,
    surface: 'Cỏ nhân tạo',
    image_url: '/assets/images/ronaldo.jpg',
    description: 'Sân 11 người chuẩn thi đấu, hệ thống đèn cao áp, khán đài mini, phù hợp tổ chức giải đấu.',
    is_active: true,
  },
  {
    id: 'field-005',
    name: 'Sân bóng đá Tân Bình FC',
    slug: 'san-bong-tan-binh-fc',
    location: '56 Hoàng Văn Thụ, Phường 4',
    district: 'Tân Bình',
    city: 'TP. Hồ Chí Minh',
    capacity: 5,
    price_per_hour_vnd: 160000,
    surface: 'Cỏ nhân tạo',
    image_url: '/assets/images/neymar.jpg',
    description: 'Sân 5 người trung tâm Tân Bình, tiện di chuyển, có phòng thay đồ và dịch vụ cho thuê giày.',
    is_active: true,
  },
  {
    id: 'field-006',
    name: 'Sân bóng đá Gò Vấp Sport',
    slug: 'san-bong-go-vap-sport',
    location: '90 Nguyễn Oanh, Phường 17',
    district: 'Gò Vấp',
    city: 'TP. Hồ Chí Minh',
    capacity: 7,
    price_per_hour_vnd: 220000,
    surface: 'Cỏ nhân tạo',
    image_url: '/assets/images/goldenball.jpg',
    description: 'Sân 7 người tại Gò Vấp, khuôn viên rộng, có căng-tin phục vụ nước uống và đồ ăn nhẹ.',
    is_active: true,
  },
  {
    id: 'field-007',
    name: 'Sân bóng đá Quận 1 Premium',
    slug: 'san-bong-quan-1-premium',
    location: '5 Đinh Tiên Hoàng, Phường Bến Nghé',
    district: 'Quận 1',
    city: 'TP. Hồ Chí Minh',
    capacity: 5,
    price_per_hour_vnd: 350000,
    surface: 'Cỏ nhân tạo cao cấp',
    image_url: '/assets/images/san-bong.jpg',
    description: 'Sân premium trung tâm Quận 1, cỏ nhân tạo thế hệ 4, hệ thống điều hòa không khí, dịch vụ VIP.',
    is_active: true,
  },
  {
    id: 'field-008',
    name: 'Sân bóng đá Thủ Đức Mini',
    slug: 'san-bong-thu-duc-mini',
    location: '200 Kha Vạn Cân, Phường Hiệp Bình Chánh',
    district: 'Thủ Đức',
    city: 'TP. Hồ Chí Minh',
    capacity: 5,
    price_per_hour_vnd: 140000,
    surface: 'Cỏ nhân tạo',
    image_url: '/assets/images/the-football-king.jpg',
    description: 'Sân 5 người giá rẻ khu vực Thủ Đức, phù hợp sinh viên và nhóm bạn trẻ.',
    is_active: true,
  },
];

// Slot times: 12 slots × 90 min = 06:00 → 23:00 (UTC+7)
// Store start hours in local time (UTC+7 = UTC-7h offset internally)
const SLOT_START_HOURS_LOCAL = [6, 7.5, 9, 10.5, 12, 13.5, 15, 16.5, 18, 19.5, 21, 22.5];
const SLOT_DURATION_MIN = 90;

// In-memory booking store: key = `${fieldId}::${slotDatetimeIso}`
/** @type {Map<string, Booking>} */
let _bookingsBySlot = new Map();

/** @type {Map<string, Booking>} */
let _bookingsById = new Map();

// Seed some already-booked slots so the grid looks realistic
// We'll mark ~20% of today + next 3 days as booked
const _preBookedSlotKeys = new Set();

function _seedPreBookedSlots() {
  const now = new Date();
  // Seed booked slots for the next 5 days
  for (let dayOffset = 0; dayOffset <= 5; dayOffset++) {
    const date = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = _toLocalDateStr(date);
    FIELDS.forEach((field) => {
      SLOT_START_HOURS_LOCAL.forEach((hourLocal, idx) => {
        // Mark ~25% of slots as pre-booked using a deterministic pattern
        const hash = (field.id.charCodeAt(field.id.length - 1) + idx + dayOffset) % 4;
        if (hash === 0) {
          const slotIso = _buildSlotIso(dateStr, hourLocal);
          _preBookedSlotKeys.add(`${field.id}::${slotIso}`);
        }
      });
    });
  }
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Returns YYYY-MM-DD string for a Date in Asia/Bangkok (UTC+7).
 * @param {Date} d
 * @returns {string}
 */
function _toLocalDateStr(d) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(d);
}

/**
 * Builds a UTC ISO string for a slot given a local date string and local hour.
 * E.g. dateStr="2026-04-25", hourLocal=18 → "2026-04-25T11:00:00.000Z" (UTC+7)
 * @param {string} dateStr - "YYYY-MM-DD" in Bangkok time
 * @param {number} hourLocal - fractional hour (e.g. 7.5 = 07:30)
 * @returns {string} ISO UTC string
 */
function _buildSlotIso(dateStr, hourLocal) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const hourInt = Math.floor(hourLocal);
  const minuteInt = (hourLocal % 1) * 60;
  // UTC = local - 7h
  const utcDate = new Date(Date.UTC(year, month - 1, day, hourInt - 7, minuteInt, 0, 0));
  return utcDate.toISOString();
}

/**
 * Generates a simple unique ID.
 * @returns {string}
 */
function _generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Simulates async network delay */
function _delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── LocalStorage persistence ──────────────────────────────────────────────────

const LS_KEY = 'nh_bookings_v1';
const MAX_STORED_BOOKINGS = 50;

function _loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return;
    data.forEach((booking) => {
      _bookingsById.set(booking.id, booking);
      _bookingsBySlot.set(`${booking.field_id}::${booking.slot_datetime_iso}`, booking);
    });
  } catch (_e) {
    // Corrupt storage — start fresh
    localStorage.removeItem(LS_KEY);
  }
}

function _saveToStorage() {
  try {
    let all = Array.from(_bookingsById.values());
    // LRU: keep only the last MAX_STORED_BOOKINGS by created_at
    if (all.length > MAX_STORED_BOOKINGS) {
      all.sort((a, b) => a.created_at_iso.localeCompare(b.created_at_iso));
      all = all.slice(all.length - MAX_STORED_BOOKINGS);
      // Rebuild maps after pruning
      _bookingsById.clear();
      _bookingsBySlot.clear();
      all.forEach((b) => {
        _bookingsById.set(b.id, b);
        _bookingsBySlot.set(`${b.field_id}::${b.slot_datetime_iso}`, b);
      });
    }
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch (_e) {
    // Storage quota exceeded — non-fatal
  }
}

// ─── API implementation ────────────────────────────────────────────────────────

/**
 * @typedef {Object} Field
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string} location
 * @property {string} district
 * @property {string} city
 * @property {number} capacity - players per side (5, 7, or 11)
 * @property {number} price_per_hour_vnd
 * @property {string} surface
 * @property {string} image_url
 * @property {string} description
 * @property {boolean} is_active
 */

/**
 * @typedef {Object} Slot
 * @property {string} field_id
 * @property {string} slot_datetime_iso - UTC ISO string of slot start
 * @property {'available'|'booked'} status
 * @property {number} duration_min
 * @property {number} price_vnd
 */

/**
 * @typedef {Object} Booking
 * @property {string} id
 * @property {string} user_name
 * @property {string} user_phone
 * @property {string} user_email
 * @property {string} user_note
 * @property {string} field_id
 * @property {string} slot_datetime_iso
 * @property {number} duration_min
 * @property {number} total_vnd
 * @property {'pending'|'confirmed'|'cancelled'|'completed'|'no_show'} status
 * @property {number} [deposit_paid_vnd]
 * @property {string} created_at_iso
 * @property {string} cancellation_deadline_iso
 */

/**
 * @typedef {Object} BookingFilters
 * @property {string} [district]
 * @property {number} [priceMin]
 * @property {number} [priceMax]
 * @property {number} [capacity]
 */

/**
 * @typedef {Object} BookingPayload
 * @property {string} fieldId
 * @property {string} slotDatetimeIso
 * @property {string} userName
 * @property {string} userPhone
 * @property {string} [userEmail]
 * @property {string} [userNote]
 */

/**
 * Lists fields with optional filtering.
 * @param {BookingFilters} [filters]
 * @returns {Promise<Field[]>}
 */
async function listFields(filters = {}) {
  await _delay();
  let results = FIELDS.filter((f) => f.is_active);

  if (filters.district) {
    results = results.filter((f) => f.district === filters.district);
  }
  if (typeof filters.priceMin === 'number') {
    results = results.filter((f) => f.price_per_hour_vnd >= filters.priceMin);
  }
  if (typeof filters.priceMax === 'number') {
    results = results.filter((f) => f.price_per_hour_vnd <= filters.priceMax);
  }
  if (typeof filters.capacity === 'number') {
    results = results.filter((f) => f.capacity === filters.capacity);
  }
  if (filters.sort === 'price_asc') {
    results = [...results].sort((a, b) => a.price_per_hour_vnd - b.price_per_hour_vnd);
  } else if (filters.sort === 'price_desc') {
    results = [...results].sort((a, b) => b.price_per_hour_vnd - a.price_per_hour_vnd);
  }

  return results;
}

/**
 * Returns a single field by ID.
 * @param {string} id
 * @returns {Promise<Field>}
 */
async function getField(id) {
  await _delay();
  const field = FIELDS.find((f) => f.id === id);
  if (!field) throw new Error(`Field not found: ${id}`);
  return field;
}

/**
 * Returns 12 slots (90-min each, 06:00–23:00 Bangkok) for a given field and date.
 * @param {string} fieldId
 * @param {string} dateISO - "YYYY-MM-DD" in local (Bangkok) time
 * @returns {Promise<Slot[]>}
 */
async function listSlots(fieldId, dateISO) {
  await _delay();
  const field = FIELDS.find((f) => f.id === fieldId);
  if (!field) throw new Error(`Field not found: ${fieldId}`);

  // Peak hours: 17:00–21:00 local → price 1.4×
  const peakHours = [17, 18, 19, 20];

  return SLOT_START_HOURS_LOCAL.map((hourLocal) => {
    const slotIso = _buildSlotIso(dateISO, hourLocal);
    const slotKey = `${fieldId}::${slotIso}`;
    const hourInt = Math.floor(hourLocal);
    const isPeak = peakHours.includes(hourInt);
    const priceVnd = isPeak
      ? Math.round(field.price_per_hour_vnd * 1.4)
      : field.price_per_hour_vnd;

    // Status: check live bookings first, then pre-seeded booked slots
    let status = 'available';
    if (_bookingsBySlot.has(slotKey)) {
      const b = _bookingsBySlot.get(slotKey);
      if (b.status !== 'cancelled') status = 'booked';
    } else if (_preBookedSlotKeys.has(slotKey)) {
      status = 'booked';
    }

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
 * Creates a booking. Throws { code: 'SLOT_TAKEN' } if the slot is already booked.
 * @param {BookingPayload} payload
 * @returns {Promise<{ id: string, status: 'pending' }>}
 */
async function createBooking(payload) {
  await _delay();

  const { fieldId, slotDatetimeIso, userName, userPhone, userEmail = '', userNote = '' } = payload;

  if (!fieldId || !slotDatetimeIso || !userName || !userPhone) {
    throw new Error('Thiếu thông tin đặt sân bắt buộc');
  }

  const slotKey = `${fieldId}::${slotDatetimeIso}`;

  // Check live conflict
  if (_bookingsBySlot.has(slotKey)) {
    const existing = _bookingsBySlot.get(slotKey);
    if (existing.status !== 'cancelled') {
      throw { code: 'SLOT_TAKEN', message: 'Khung giờ này đã được đặt. Vui lòng chọn khung giờ khác.' };
    }
  }

  // Check pre-seeded conflict
  if (_preBookedSlotKeys.has(slotKey)) {
    throw { code: 'SLOT_TAKEN', message: 'Khung giờ này đã được đặt. Vui lòng chọn khung giờ khác.' };
  }

  // Find field for price calculation
  const field = FIELDS.find((f) => f.id === fieldId);
  if (!field) throw new Error(`Field not found: ${fieldId}`);

  const peakHours = [17, 18, 19, 20];
  const slotHourUtc = new Date(slotDatetimeIso).getUTCHours();
  const slotHourLocal = (slotHourUtc + 7) % 24;
  const isPeak = peakHours.includes(slotHourLocal);
  const priceVnd = isPeak
    ? Math.round(field.price_per_hour_vnd * 1.4)
    : field.price_per_hour_vnd;
  const totalVnd = Math.round(priceVnd * (SLOT_DURATION_MIN / 60));

  // Cancellation deadline: 24h before slot
  const slotDate = new Date(slotDatetimeIso);
  const cancellationDeadline = new Date(slotDate.getTime() - 24 * 60 * 60 * 1000);

  /** @type {Booking} */
  const booking = {
    id: _generateId(),
    user_name: userName,
    user_phone: userPhone,
    user_email: userEmail,
    user_note: userNote,
    field_id: fieldId,
    slot_datetime_iso: slotDatetimeIso,
    duration_min: SLOT_DURATION_MIN,
    total_vnd: totalVnd,
    status: 'pending',
    created_at_iso: new Date().toISOString(),
    cancellation_deadline_iso: cancellationDeadline.toISOString(),
  };

  _bookingsById.set(booking.id, booking);
  _bookingsBySlot.set(slotKey, booking);
  _saveToStorage();

  return { id: booking.id, status: 'pending' };
}

/**
 * Retrieves a booking by ID.
 * @param {string} id
 * @returns {Promise<Booking>}
 */
async function getBooking(id) {
  await _delay(100);
  const booking = _bookingsById.get(id);
  if (!booking) throw new Error(`Booking not found: ${id}`);
  return booking;
}

/**
 * Returns all bookings stored in localStorage (for my-bookings page).
 * Mock mode has no auth, so it returns all bookings.
 * @returns {Promise<Booking[]>}
 */
async function listMyBookings() {
  await _delay(100);
  return Array.from(_bookingsById.values())
    .sort((a, b) => b.created_at_iso.localeCompare(a.created_at_iso));
}

/**
 * Cancels a booking by ID (mock: no auth enforcement).
 * @param {string} id
 * @returns {Promise<void>}
 */
async function cancelBooking(id) {
  await _delay(200);
  const booking = _bookingsById.get(id);
  if (!booking) throw new Error(`Booking not found: ${id}`);
  booking.status = 'cancelled';
  _saveToStorage();
}

// ─── Admin methods ────────────────────────────────────────────────────────────

/**
 * Admin: returns ALL bookings (no user filter), with optional filters.
 * @param {{ status?: string, dateFrom?: string, dateTo?: string }} [filters]
 * @returns {Promise<Booking[]>}
 */
async function adminListBookings(filters = {}) {
  await _delay(200);
  let results = Array.from(_bookingsById.values());

  if (filters.status) {
    results = results.filter((b) => b.status === filters.status);
  }
  if (filters.dateFrom) {
    results = results.filter((b) => b.slot_datetime_iso >= filters.dateFrom);
  }
  if (filters.dateTo) {
    results = results.filter((b) => b.slot_datetime_iso <= filters.dateTo);
  }

  return results.sort((a, b) => b.created_at_iso.localeCompare(a.created_at_iso));
}

/**
 * Admin: updates a booking with arbitrary patch data (status transitions, deposit, etc).
 * @param {string} id
 * @param {Partial<Booking>} patch
 * @returns {Promise<Booking>}
 */
async function adminUpdateBooking(id, patch) {
  await _delay(200);
  const booking = _bookingsById.get(id);
  if (!booking) throw new Error(`Booking not found: ${id}`);
  Object.assign(booking, patch);
  _saveToStorage();
  return { ...booking };
}

/**
 * Admin: creates or updates a field (upsert by id).
 * @param {Partial<Field> & { id?: string }} fieldData
 * @returns {Promise<Field>}
 */
async function adminUpsertField(fieldData) {
  await _delay(300);

  if (fieldData.id) {
    // Update existing
    const idx = FIELDS.findIndex((f) => f.id === fieldData.id);
    if (idx === -1) throw new Error(`Field not found: ${fieldData.id}`);
    Object.assign(FIELDS[idx], fieldData);
    return { ...FIELDS[idx] };
  }

  // Create new
  const newField = {
    id: _generateId(),
    name: fieldData.name ?? 'Sân mới',
    slug: (fieldData.name ?? 'san-moi').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    location: fieldData.location ?? '',
    district: fieldData.district ?? '',
    city: fieldData.city ?? 'TP. Hồ Chí Minh',
    capacity: fieldData.capacity ?? 5,
    price_per_hour_vnd: fieldData.price_per_hour_vnd ?? 150000,
    surface: fieldData.surface ?? 'Cỏ nhân tạo',
    image_url: fieldData.image_url ?? '/assets/images/san-bong.jpg',
    description: fieldData.description ?? '',
    is_active: fieldData.is_active !== undefined ? fieldData.is_active : true,
  };
  FIELDS.push(newField);
  return { ...newField };
}

/**
 * Admin: soft-deletes a field by setting is_active = false.
 * @param {string} id
 * @returns {Promise<void>}
 */
async function adminDeactivateField(id) {
  await _delay(200);
  const field = FIELDS.find((f) => f.id === id);
  if (!field) throw new Error(`Field not found: ${id}`);
  field.is_active = false;
}

/**
 * Admin: lists ALL fields including inactive ones.
 * @returns {Promise<Field[]>}
 */
async function adminListFields() {
  await _delay(200);
  return [...FIELDS];
}

/**
 * Returns the list of all distinct districts in the field dataset.
 * @returns {string[]}
 */
function getDistricts() {
  return [...new Set(FIELDS.map((f) => f.district))].sort();
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

_seedPreBookedSlots();
_loadFromStorage();

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
