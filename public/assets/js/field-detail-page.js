/**
 * field-detail-page.js — Field detail + booking flow controller
 * Reads ?id= from URL, renders field info, slot grid, and booking form.
 * On successful booking redirects to /confirmation.html?id=<booking_id>.
 */

import { api } from './api.js';
import { formatVnd, formatVnDate, formatVnTime, formatSlotLabel, toLocalDateStr } from './format-vn.js';
import { validateBookingForm, normalizePhone } from './validators.js';
import { notifyBookingCreated } from './email-notify.js';

// ─── URL param ────────────────────────────────────────────────────────────────

const params = new URLSearchParams(window.location.search);
const FIELD_ID = params.get('id');

if (!FIELD_ID) {
  window.location.href = '/fields.html';
}

// ─── State ────────────────────────────────────────────────────────────────────

const _state = {
  field: null,
  slots: [],
  selectedSlot: null,
  selectedDate: toLocalDateStr(new Date()), // "YYYY-MM-DD" in Bangkok TZ
  isSubmitting: false,
};

// ─── DOM refs ────────────────────────────────────────────────────────────────

const fieldHero = document.getElementById('field-hero');
const fieldInfoCard = document.getElementById('field-info-card');
const slotGridContainer = document.getElementById('slot-grid');
const slotLoadingEl = document.getElementById('slot-loading');
const dateInput = document.getElementById('date-picker');
const selectedSlotSummary = document.getElementById('selected-slot-summary');
const bookingFormSection = document.getElementById('booking-form-section');
const bookingForm = document.getElementById('booking-form');
const submitBtn = document.getElementById('booking-submit-btn');
const submitSpinner = document.getElementById('submit-spinner');
const slotErrorBanner = document.getElementById('slot-error-banner');
const fieldNameBreadcrumb = document.getElementById('field-name-breadcrumb');

// ─── Date picker setup ────────────────────────────────────────────────────────

function _initDatePicker() {
  if (!dateInput) return;
  const today = toLocalDateStr(new Date());
  dateInput.value = today;
  dateInput.min = today;

  // Max = today + 14 days
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);
  dateInput.max = toLocalDateStr(maxDate);

  dateInput.addEventListener('change', () => {
    _state.selectedDate = dateInput.value;
    _state.selectedSlot = null;
    _hideBookingForm();
    _loadSlots();
  });
}

// ─── Field info render ────────────────────────────────────────────────────────

/** @param {import('./mock-api.js').Field} field */
function _renderFieldInfo(field) {
  document.title = `${field.name} — Sân Bóng Nam Hiếu`;

  // Breadcrumb
  if (fieldNameBreadcrumb) fieldNameBreadcrumb.textContent = field.name;

  // Hero
  if (fieldHero) {
    const img = fieldHero.querySelector('#field-hero-img');
    const title = fieldHero.querySelector('#field-hero-title');
    const subtitle = fieldHero.querySelector('#field-hero-subtitle');
    if (img) { img.src = field.image_url; img.alt = field.name; }
    if (title) title.textContent = field.name;
    if (subtitle) subtitle.textContent = `${field.district}, ${field.city}`;
  }

  // Info card
  if (fieldInfoCard) {
    const setEl = (id, text) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };
    setEl('info-location', field.location);
    setEl('info-district', `${field.district}, ${field.city}`);
    setEl('info-capacity', `${field.capacity} người / đội`);
    setEl('info-surface', field.surface);
    setEl('info-price', `từ ${formatVnd(field.price_per_hour_vnd)}/giờ`);
    setEl('info-description', field.description);
  }
}

// ─── Slot grid render ────────────────────────────────────────────────────────

/** @param {import('./mock-api.js').Slot[]} slots */
function _renderSlots(slots) {
  if (!slotGridContainer) return;
  if (slotLoadingEl) slotLoadingEl.classList.add('hidden');
  slotGridContainer.innerHTML = '';

  slots.forEach((slot) => {
    const btn = document.createElement('button');
    btn.type = 'button';

    const startTime = formatVnTime(slot.slot_datetime_iso);
    const endDate = new Date(new Date(slot.slot_datetime_iso).getTime() + slot.duration_min * 60000);
    const endTime = formatVnTime(endDate.toISOString());
    const price = formatVnd(slot.price_vnd);

    btn.setAttribute('aria-label', `Slot ${startTime}–${endTime}, ${slot.status === 'available' ? 'còn trống' : 'đã đặt'}, ${price}`);

    const isSelected = _state.selectedSlot?.slot_datetime_iso === slot.slot_datetime_iso;

    if (isSelected) {
      btn.className = 'slot-selected w-full';
    } else if (slot.status === 'booked') {
      btn.className = 'slot-booked w-full';
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
    } else {
      btn.className = 'slot-available w-full';
    }

    btn.innerHTML = `
      <div class="font-semibold text-xs leading-tight">${startTime}–${endTime}</div>
      <div class="text-xs mt-0.5 opacity-80">${price}</div>
      ${slot.status === 'booked' ? '<div class="text-xs mt-0.5 opacity-60">Đã đặt</div>' : ''}
    `;

    if (slot.status === 'available') {
      btn.addEventListener('click', () => _selectSlot(slot));
      // Keyboard: Enter or Space already fires click on button
    }

    slotGridContainer.appendChild(btn);
  });
}

function _showSlotLoading() {
  if (!slotGridContainer) return;
  if (slotLoadingEl) slotLoadingEl.classList.remove('hidden');
  slotGridContainer.innerHTML = '';
  // Build skeleton buttons
  for (let i = 0; i < 12; i++) {
    const sk = document.createElement('div');
    sk.className = 'h-16 bg-slate-100 rounded-md animate-pulse';
    slotGridContainer.appendChild(sk);
  }
}

async function _loadSlots() {
  if (!FIELD_ID || !_state.selectedDate) return;
  _showSlotLoading();
  try {
    const slots = await api.listSlots(FIELD_ID, _state.selectedDate);
    _state.slots = slots;
    _renderSlots(slots);
  } catch (err) {
    if (slotGridContainer) {
      slotGridContainer.innerHTML = '<p class="col-span-full text-slate-500 text-sm text-center py-6">Có lỗi khi tải khung giờ. Vui lòng thử lại.</p>';
    }
    console.error('[field-detail] listSlots error:', err);
  }
}

// ─── Slot selection ────────────────────────────────────────────────────────────

/** @param {import('./mock-api.js').Slot} slot */
function _selectSlot(slot) {
  // Toggle deselect
  if (_state.selectedSlot?.slot_datetime_iso === slot.slot_datetime_iso) {
    _state.selectedSlot = null;
    _hideBookingForm();
    _renderSlots(_state.slots);
    return;
  }
  _state.selectedSlot = slot;
  _renderSlots(_state.slots);
  _showSlotSummary(slot);
  _showBookingForm();
  // Smooth scroll to form
  if (bookingFormSection) {
    bookingFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/** @param {import('./mock-api.js').Slot} slot */
function _showSlotSummary(slot) {
  if (!selectedSlotSummary) return;
  selectedSlotSummary.classList.remove('hidden');

  const label = formatSlotLabel(slot.slot_datetime_iso, slot.duration_min);
  const price = formatVnd(slot.price_vnd);
  const totalVnd = Math.round(slot.price_vnd * (slot.duration_min / 60));

  const labelEl = document.getElementById('summary-slot-label');
  const priceEl = document.getElementById('summary-price');
  if (labelEl) labelEl.textContent = label;
  if (priceEl) priceEl.textContent = formatVnd(totalVnd);
}

function _showBookingForm() {
  if (bookingFormSection) bookingFormSection.classList.remove('hidden');
}

function _hideBookingForm() {
  if (bookingFormSection) bookingFormSection.classList.add('hidden');
  if (selectedSlotSummary) selectedSlotSummary.classList.add('hidden');
  _clearFormErrors();
}

// ─── Booking form ─────────────────────────────────────────────────────────────

function _clearFormErrors() {
  document.querySelectorAll('[data-field-error]').forEach((el) => {
    el.textContent = '';
    el.classList.add('hidden');
  });
  if (slotErrorBanner) slotErrorBanner.classList.add('hidden');
}

/** @param {Record<string, string>} errors */
function _showFormErrors(errors) {
  Object.entries(errors).forEach(([field, msg]) => {
    const errEl = document.querySelector(`[data-field-error="${field}"]`);
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.remove('hidden');
    }
  });
}

function _setSubmitting(active) {
  _state.isSubmitting = active;
  if (submitBtn) {
    submitBtn.disabled = active;
    submitBtn.classList.toggle('opacity-60', active);
    submitBtn.classList.toggle('cursor-not-allowed', active);
  }
  if (submitSpinner) submitSpinner.classList.toggle('hidden', !active);
}

async function _handleSubmit(e) {
  e.preventDefault();
  if (_state.isSubmitting) return;
  if (!_state.selectedSlot) return;

  _clearFormErrors();

  const form = bookingForm;
  const name = form.querySelector('#input-name')?.value ?? '';
  const phone = form.querySelector('#input-phone')?.value ?? '';
  const email = form.querySelector('#input-email')?.value ?? '';
  const note = form.querySelector('#input-note')?.value ?? '';

  const { ok, errors } = validateBookingForm({ name, phone, email });
  if (!ok) {
    _showFormErrors(errors);
    // Focus first error field
    const firstErrField = Object.keys(errors)[0];
    form.querySelector(`#input-${firstErrField}`)?.focus();
    return;
  }

  _setSubmitting(true);

  try {
    const result = await api.createBooking({
      fieldId: FIELD_ID,
      slotDatetimeIso: _state.selectedSlot.slot_datetime_iso,
      userName: name.trim(),
      userPhone: normalizePhone(phone),
      userEmail: email.trim(),
      userNote: note.trim(),
    });

    // Phase 05B: dev-mode email notification (fire-and-forget, non-blocking)
    try {
      const bookingForEmail = await api.getBooking(result.id);
      notifyBookingCreated(bookingForEmail, _state.field);
    } catch (emailErr) {
      // Non-fatal — email notify should never block redirect
      console.warn('[field-detail] email notify failed (non-fatal):', emailErr);
    }

    window.location.href = `/confirmation.html?id=${encodeURIComponent(result.id)}`;
  } catch (err) {
    _setSubmitting(false);
    if (err && err.code === 'SLOT_TAKEN') {
      if (slotErrorBanner) {
        slotErrorBanner.textContent = err.message || 'Khung giờ này đã được đặt. Vui lòng chọn khung giờ khác.';
        slotErrorBanner.classList.remove('hidden');
      }
      // Refresh slots to show updated availability
      _state.selectedSlot = null;
      _hideBookingForm();
      await _loadSlots();
    } else {
      if (slotErrorBanner) {
        slotErrorBanner.textContent = 'Có lỗi xảy ra. Vui lòng thử lại.';
        slotErrorBanner.classList.remove('hidden');
      }
      console.error('[field-detail] createBooking error:', err);
    }
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  if (!FIELD_ID) return;

  _initDatePicker();

  try {
    const field = await api.getField(FIELD_ID);
    _state.field = field;
    _renderFieldInfo(field);
  } catch (err) {
    console.error('[field-detail] getField error:', err);
    document.body.innerHTML = `
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <p class="text-slate-500 mb-4">Không tìm thấy sân. Vui lòng thử lại.</p>
          <a href="/fields.html" class="btn-primary">Quay lại danh sách sân</a>
        </div>
      </div>`;
    return;
  }

  await _loadSlots();

  if (bookingForm) {
    bookingForm.addEventListener('submit', _handleSubmit);
  }
}

init();
