/**
 * email-notify.js — Dev-mode email notification stubs (Phase 05B).
 *
 * Per validation decision #8: NO real email is sent.
 * Functions log the full email payload to console and dispatch an `nh:toast`
 * event for the UI to display a toast notification.
 *
 * Future upgrade path:
 * TODO upgrade: replace console.log with fetch('https://api.resend.com/emails', {
 *   method: 'POST',
 *   headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ from: 'noreply@yourdomain.com', to: [userEmail], subject, html: body })
 * })
 * Reference: docs/handover-guide.md → "Email Notifications — Production Upgrade"
 */

import { formatVnd, formatVnDate, formatVnTime } from './format-vn.js';

// ─── Template builder ─────────────────────────────────────────────────────────

/**
 * Builds a short booking ID prefix for subject lines.
 * @param {string} id - full UUID
 * @returns {string}
 */
function _shortId(id) {
  return id ? id.slice(0, 8).toUpperCase() : 'UNKNOWN';
}

/**
 * Renders a Vietnamese booking confirmation email.
 * @param {import('./mock-api.js').Booking} booking
 * @param {import('./mock-api.js').Field} field
 * @returns {{ subject: string, body: string }}
 */
function _buildConfirmationEmail(booking, field) {
  const subject = `[Sân Bóng Nam Hiếu] Xác nhận đặt sân - ${_shortId(booking.id)}`;

  const slotDate = formatVnDate(booking.slot_datetime_iso);
  const slotTime = formatVnTime(booking.slot_datetime_iso);
  const endDate  = new Date(new Date(booking.slot_datetime_iso).getTime() + booking.duration_min * 60000);
  const endTime  = formatVnTime(endDate.toISOString());
  const deadline = booking.cancellation_deadline_iso
    ? `${formatVnTime(booking.cancellation_deadline_iso)}, ${formatVnDate(booking.cancellation_deadline_iso)}`
    : 'Không có';

  const body = `
Xin chào ${booking.user_name},

Chúng tôi xác nhận đặt sân của bạn:

  Mã đặt sân : NH-${_shortId(booking.id)}
  Sân        : ${field.name}
  Địa chỉ    : ${field.location}, ${field.district}, ${field.city}
  Ngày       : ${slotDate}
  Giờ        : ${slotTime} – ${endTime}
  Thời lượng : ${booking.duration_min} phút
  Tổng tiền  : ${formatVnd(booking.total_vnd)} ₫
  Trạng thái : Chờ xác nhận

Hủy miễn phí trước: ${deadline}
Nếu cần hủy, đăng nhập và vào mục "Lịch sử đặt sân".

Cảm ơn bạn đã sử dụng dịch vụ Sân Bóng Nam Hiếu!

─────────────────────────────────────────────
⚠ Email dev-mode — không gửi thực tế.
  Để kích hoạt email thật, xem docs/handover-guide.md.
─────────────────────────────────────────────
`.trim();

  return { subject, body };
}

/**
 * Renders a Vietnamese status-change notification email.
 * @param {import('./mock-api.js').Booking} booking
 * @param {import('./mock-api.js').Field} field
 * @param {'confirmed'|'cancelled'|'completed'|'no_show'} newStatus
 * @returns {{ subject: string, body: string }}
 */
function _buildStatusEmail(booking, field, newStatus) {
  const statusLabels = {
    confirmed:  'Đã xác nhận',
    cancelled:  'Đã hủy',
    completed:  'Hoàn thành',
    no_show:    'Không đến',
  };
  const statusLabel = statusLabels[newStatus] ?? newStatus;
  const subject = `[Sân Bóng Nam Hiếu] Cập nhật trạng thái đặt sân - ${_shortId(booking.id)}`;

  const body = `
Xin chào ${booking.user_name},

Trạng thái đặt sân của bạn đã được cập nhật:

  Mã đặt sân  : NH-${_shortId(booking.id)}
  Sân         : ${field.name}
  Trạng thái  : ${statusLabel}

Nếu có thắc mắc, vui lòng liên hệ qua trang web hoặc đăng nhập và vào "Lịch sử đặt sân".

Cảm ơn bạn đã sử dụng dịch vụ Sân Bóng Nam Hiếu!

─────────────────────────────────────────────
⚠ Email dev-mode — không gửi thực tế.
  Để kích hoạt email thật, xem docs/handover-guide.md.
─────────────────────────────────────────────
`.trim();

  return { subject, body };
}

// ─── Toast dispatcher ─────────────────────────────────────────────────────────

/**
 * Dispatches a global `nh:toast` event that layout-loader.js listens for.
 * @param {string} message
 */
function _dispatchToast(message) {
  document.dispatchEvent(new CustomEvent('nh:toast', { detail: { message } }));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Dev-mode booking creation notification.
 * Logs email payload to console + shows UI toast.
 * @param {import('./mock-api.js').Booking} booking
 * @param {import('./mock-api.js').Field} field
 */
export function notifyBookingCreated(booking, field) {
  try {
    const { subject, body } = _buildConfirmationEmail(booking, field);
    const toEmail = booking.user_email || '(không có email)';

    console.log(
      '%c[EMAIL DEV-MODE]%c\nTo: %s\nSubject: %s\n\n%s',
      'color:#6366f1;font-weight:bold',
      'color:inherit',
      toEmail,
      subject,
      body,
    );

    const toastMsg = `Email xác nhận đã gửi tới ${toEmail} (dev-mode)`;
    _dispatchToast(toastMsg);
  } catch (err) {
    console.warn('[email-notify] notifyBookingCreated failed silently:', err);
  }
}

/**
 * Dev-mode booking status change notification.
 * Logs email payload to console + shows UI toast.
 * @param {import('./mock-api.js').Booking} booking
 * @param {import('./mock-api.js').Field} field
 * @param {'confirmed'|'cancelled'|'completed'|'no_show'} newStatus
 */
export function notifyBookingStatusChanged(booking, field, newStatus) {
  try {
    const { subject, body } = _buildStatusEmail(booking, field, newStatus);
    const toEmail = booking.user_email || '(không có email)';

    console.log(
      '%c[EMAIL DEV-MODE]%c\nTo: %s\nSubject: %s\n\n%s',
      'color:#6366f1;font-weight:bold',
      'color:inherit',
      toEmail,
      subject,
      body,
    );

    const statusLabels = {
      confirmed: 'đã xác nhận',
      cancelled:  'đã hủy',
      completed:  'hoàn thành',
      no_show:    'không đến',
    };
    const label = statusLabels[newStatus] ?? newStatus;
    const toastMsg = `Email thông báo trạng thái "${label}" đã gửi tới ${toEmail} (dev-mode)`;
    _dispatchToast(toastMsg);
  } catch (err) {
    console.warn('[email-notify] notifyBookingStatusChanged failed silently:', err);
  }
}
