/**
 * confirmation-page.js — Booking confirmation page controller
 * Reads ?id= from URL, fetches booking from localStorage via mock-api,
 * and renders the full booking summary.
 */

import { api } from './api.js';
import { formatVnd, formatVnDate, formatVnTime, formatSlotLabel, shortBookingCode } from './format-vn.js';
import { renderQrSection } from './vietqr-mock.js';
// formatSlotLabel used for booking-slot-label display

// ─── URL param ────────────────────────────────────────────────────────────────

const params = new URLSearchParams(window.location.search);
const BOOKING_ID = params.get('id');

// ─── DOM refs ────────────────────────────────────────────────────────────────

const loadingEl = document.getElementById('confirmation-loading');
const contentEl = document.getElementById('confirmation-content');
const errorEl = document.getElementById('confirmation-error');

// ─── Render ───────────────────────────────────────────────────────────────────

/**
 * @param {import('./mock-api.js').Booking} booking
 * @param {import('./mock-api.js').Field} field
 */
function _render(booking, field) {
  if (loadingEl) loadingEl.classList.add('hidden');
  if (contentEl) contentEl.classList.remove('hidden');

  const setEl = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  const setHtml = (id, html) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };

  // Booking code
  setEl('booking-code', shortBookingCode(booking.id));

  // Field info
  setEl('booking-field-name', field.name);
  setEl('booking-field-location', `${field.location}, ${field.district}, ${field.city}`);

  // Date + time
  const slotLabel = formatSlotLabel(booking.slot_datetime_iso, booking.duration_min);
  setEl('booking-slot-label', slotLabel);

  // Duration
  const durationHours = booking.duration_min / 60;
  setEl('booking-duration', `${durationHours} giờ (${booking.duration_min} phút)`);

  // Price
  setEl('booking-total', formatVnd(booking.total_vnd));

  // Customer info
  setEl('booking-user-name', booking.user_name);
  setEl('booking-user-phone', booking.user_phone);
  setEl('booking-user-email', booking.user_email || 'Không có');
  if (booking.user_note) {
    setEl('booking-user-note', booking.user_note);
    const noteRow = document.getElementById('booking-note-row');
    if (noteRow) noteRow.classList.remove('hidden');
  }

  // Status badge
  const statusBadge = document.getElementById('booking-status-badge');
  if (statusBadge) {
    const statusMap = {
      pending: { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700' },
      confirmed: { label: 'Đã xác nhận', cls: 'bg-green-100 text-green-700' },
      cancelled: { label: 'Đã hủy', cls: 'bg-red-100 text-red-700' },
      completed: { label: 'Hoàn thành', cls: 'bg-slate-100 text-slate-700' },
    };
    const s = statusMap[booking.status] ?? statusMap.pending;
    statusBadge.textContent = s.label;
    statusBadge.className = `inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${s.cls}`;
  }

  // Cancellation deadline
  const cancelDeadlineEl = document.getElementById('booking-cancel-deadline');
  if (cancelDeadlineEl) {
    cancelDeadlineEl.textContent = `${formatVnTime(booking.cancellation_deadline_iso)}, ${formatVnDate(booking.cancellation_deadline_iso)}`;
  }

  // Created at
  setEl('booking-created-at', `${formatVnTime(booking.created_at_iso)}, ${formatVnDate(booking.created_at_iso)}`);

  // Wire CTA: book another field
  const bookMoreBtn = document.getElementById('btn-book-more');
  if (bookMoreBtn) {
    bookMoreBtn.href = `/field.html?id=${encodeURIComponent(booking.field_id)}`;
  }

  // Phase 05C: inject VietQR mock payment section
  // Only shown for pending/confirmed bookings (not cancelled/completed)
  if (booking.status === 'pending' || booking.status === 'confirmed') {
    renderQrSection(booking, field);
  }
}

function _showError(message) {
  if (loadingEl) loadingEl.classList.add('hidden');
  if (errorEl) {
    errorEl.classList.remove('hidden');
    const msgEl = errorEl.querySelector('#error-message');
    if (msgEl) msgEl.textContent = message;
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  if (!BOOKING_ID) {
    _showError('Không tìm thấy mã đặt sân. Vui lòng kiểm tra lại đường dẫn.');
    return;
  }

  try {
    const booking = await api.getBooking(BOOKING_ID);
    const field = await api.getField(booking.field_id);
    _render(booking, field);
    document.title = `Đặt sân thành công — ${shortBookingCode(BOOKING_ID)}`;
  } catch (err) {
    console.error('[confirmation-page] error:', err);
    _showError('Không tìm thấy thông tin đặt sân. Dữ liệu có thể đã bị xóa khỏi trình duyệt.');
  }
}

init();
