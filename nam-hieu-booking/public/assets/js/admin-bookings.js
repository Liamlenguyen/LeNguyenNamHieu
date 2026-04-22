/**
 * admin-bookings.js — Admin tab: Bookings list + status management (Phase 05A).
 *
 * Loaded lazily by admin-page.js when the "Lịch đặt" tab is activated.
 * Features: date range filter, status filter, inline status transitions.
 * Wires email-notify.js for dev-mode notifications on status change.
 */

import { api } from './api.js';
import { formatVnd, formatVnDate, formatVnTime } from './format-vn.js';
import { notifyBookingStatusChanged } from './email-notify.js';

// ─── State ────────────────────────────────────────────────────────────────────

let _bookings = [];
let _initialized = false;

// Field cache to resolve field names in booking rows
const _fieldCache = new Map();

// ─── DOM helpers ──────────────────────────────────────────────────────────────

const tableBody     = () => document.getElementById('admin-bookings-tbody');
const filterStatus  = () => document.getElementById('admin-filter-status');
const filterDateFrom = () => document.getElementById('admin-filter-date-from');
const filterDateTo  = () => document.getElementById('admin-filter-date-to');
const applyBtn      = () => document.getElementById('btn-admin-filter-apply');

function _dispatchToast(message) {
  document.dispatchEvent(new CustomEvent('nh:toast', { detail: { message } }));
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABELS = {
  pending:   { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Đã xác nhận',  cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã hủy',       cls: 'bg-red-100 text-red-700' },
  completed: { label: 'Hoàn thành',   cls: 'bg-slate-100 text-slate-700' },
  no_show:   { label: 'Không đến',    cls: 'bg-orange-100 text-orange-700' },
};

function _statusBadge(status) {
  const s = STATUS_LABELS[status] ?? STATUS_LABELS.pending;
  return `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${s.cls}">${s.label}</span>`;
}

// ─── Field name resolution ────────────────────────────────────────────────────

async function _resolveFieldName(fieldId) {
  if (_fieldCache.has(fieldId)) return _fieldCache.get(fieldId);
  try {
    const field = await api.getField(fieldId);
    _fieldCache.set(fieldId, field.name);
    return field.name;
  } catch {
    return fieldId;
  }
}

// ─── Table render ─────────────────────────────────────────────────────────────

async function _renderTable() {
  const tbody = tableBody();
  if (!tbody) return;

  if (_bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-4 py-8 text-center text-slate-400 text-sm">
          Không có lịch đặt nào phù hợp.
        </td>
      </tr>`;
    return;
  }

  // Resolve all field names in parallel before rendering
  await Promise.all(
    [...new Set(_bookings.map((b) => b.field_id))].map(_resolveFieldName)
  );

  tbody.innerHTML = _bookings.map((b) => {
    const fieldName  = _fieldCache.get(b.field_id) ?? b.field_id;
    const slotDate   = formatVnDate(b.slot_datetime_iso);
    const slotTime   = formatVnTime(b.slot_datetime_iso);
    const shortId    = b.id.slice(0, 8).toUpperCase();

    // Determine available actions based on current status
    const actions = _buildActionButtons(b);

    return `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors" data-booking-id="${b.id}">
        <td class="px-4 py-3 text-xs font-mono text-slate-500">${shortId}</td>
        <td class="px-4 py-3 text-sm text-slate-800 font-medium">${_escape(b.user_name)}</td>
        <td class="px-4 py-3 text-sm text-slate-600">${_escape(fieldName)}</td>
        <td class="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">${slotDate}<br><span class="text-xs text-slate-400">${slotTime}</span></td>
        <td class="px-4 py-3 text-sm font-semibold text-pitch-600">${formatVnd(b.total_vnd)}</td>
        <td class="px-4 py-3">${_statusBadge(b.status)}</td>
        <td class="px-4 py-3">
          <div class="flex items-center gap-1 flex-wrap">${actions}</div>
        </td>
      </tr>`;
  }).join('');

  // Wire action buttons
  tbody.querySelectorAll('[data-status-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const { bookingId, statusAction } = btn.dataset;
      _handleStatusChange(bookingId, statusAction);
    });
  });
}

/** Builds status action button HTML for a given booking */
function _buildActionButtons(booking) {
  const transitions = {
    pending:   [
      { action: 'confirmed', label: 'Xác nhận',  cls: 'bg-green-50 text-green-700 hover:bg-green-100' },
      { action: 'cancelled', label: 'Hủy',        cls: 'bg-red-50 text-red-600 hover:bg-red-100' },
    ],
    confirmed: [
      { action: 'completed', label: 'Hoàn tất',  cls: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
      { action: 'no_show',   label: 'Không đến', cls: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
      { action: 'cancelled', label: 'Hủy',        cls: 'bg-red-50 text-red-600 hover:bg-red-100' },
    ],
    cancelled:  [],
    completed:  [],
    no_show:    [],
  };

  const btns = (transitions[booking.status] ?? []);
  if (btns.length === 0) return '<span class="text-xs text-slate-300">—</span>';

  return btns.map((t) => `
    <button type="button"
      class="text-xs px-2.5 py-1.5 rounded-lg ${t.cls} font-medium transition-colors whitespace-nowrap"
      data-status-action="${t.action}"
      data-booking-id="${booking.id}">
      ${t.label}
    </button>
  `).join('');
}

// ─── Status transition ────────────────────────────────────────────────────────

async function _handleStatusChange(bookingId, newStatus) {
  const booking = _bookings.find((b) => b.id === bookingId);
  if (!booking) return;

  const label = STATUS_LABELS[newStatus]?.label ?? newStatus;
  if (!confirm(`Cập nhật trạng thái thành "${label}"?`)) return;

  // Optimistic UI update on the row button area
  const row = tableBody()?.querySelector(`[data-booking-id="${bookingId}"]`);
  if (row) {
    const actionsCell = row.querySelector('td:last-child');
    if (actionsCell) actionsCell.innerHTML = '<span class="text-xs text-slate-400">Đang lưu...</span>';
  }

  try {
    await api.adminUpdateBooking(bookingId, { status: newStatus });

    // Dev-mode email notification
    try {
      const field = await api.getField(booking.field_id);
      // Merge updated status into booking object for the notification
      notifyBookingStatusChanged({ ...booking, status: newStatus }, field, newStatus);
    } catch (emailErr) {
      console.warn('[admin-bookings] email notify failed (non-fatal):', emailErr);
    }

    _dispatchToast(`Đã cập nhật trạng thái: ${label}`);
    await _loadBookings();
  } catch (err) {
    console.error('[admin-bookings] status update error:', err);
    _dispatchToast('Có lỗi khi cập nhật trạng thái. Vui lòng thử lại.');
    await _loadBookings(); // Re-render to restore correct state
  }
}

// ─── Data loading ─────────────────────────────────────────────────────────────

async function _loadBookings() {
  const tbody = tableBody();
  if (tbody) {
    tbody.innerHTML = `
      <tr><td colspan="7" class="px-4 py-6 text-center text-slate-400 text-sm">
        <div class="inline-block w-5 h-5 border-2 border-pitch-200 border-t-pitch-600 rounded-full animate-spin mr-2"></div>
        Đang tải...
      </td></tr>`;
  }

  const filters = {};
  const statusEl = filterStatus();
  const fromEl   = filterDateFrom();
  const toEl     = filterDateTo();

  if (statusEl?.value)  filters.status   = statusEl.value;
  if (fromEl?.value)    filters.dateFrom = fromEl.value;
  if (toEl?.value)      filters.dateTo   = toEl.value;

  try {
    _bookings = await api.adminListBookings(filters);
    await _renderTable();
  } catch (err) {
    console.error('[admin-bookings] load error:', err);
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-4 text-center text-red-500 text-sm">
        Có lỗi khi tải lịch đặt.
      </td></tr>`;
    }
  }
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function _escape(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// ─── Public init ──────────────────────────────────────────────────────────────

/**
 * Called by admin-page.js when the "Lịch đặt" tab is activated.
 * Idempotent — subsequent calls refresh data.
 */
export async function initBookingsTab() {
  if (!_initialized) {
    _initialized = true;

    const apply = applyBtn();
    if (apply) apply.addEventListener('click', _loadBookings);

    // Allow pressing Enter in date inputs to trigger filter
    [filterDateFrom(), filterDateTo()].forEach((el) => {
      el?.addEventListener('keydown', (e) => { if (e.key === 'Enter') _loadBookings(); });
    });
  }

  await _loadBookings();
}
