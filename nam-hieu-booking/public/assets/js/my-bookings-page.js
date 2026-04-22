/**
 * my-bookings-page.js — User booking history page controller (Phase 05D).
 *
 * Fetches bookings via api.listMyBookings() (works in both mock + real mode).
 * Partitions results into three tabs:
 *   - Sắp tới : future pending/confirmed
 *   - Đã qua  : completed / no_show / past confirmed
 *   - Đã hủy  : cancelled
 *
 * Cancel button shown when: status=pending|confirmed AND slot > now + 24h.
 * Cancel confirmation modal uses <dialog>.
 */

import { api } from './api.js';
import { formatVnd, formatVnDate, formatVnTime, formatSlotLabel, shortBookingCode } from './format-vn.js';

// ─── State ────────────────────────────────────────────────────────────────────

let _allBookings  = [];
let _activeTab    = 'upcoming';

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const loadingEl   = document.getElementById('bookings-loading');
const contentEl   = document.getElementById('bookings-content');
const emptyEl     = document.getElementById('bookings-empty');
const errorEl     = document.getElementById('bookings-error');

const tabButtons  = document.querySelectorAll('[data-tab-btn]');
const tabPanels   = document.querySelectorAll('[data-tab-panel]');

const cancelDialog    = document.getElementById('cancel-dialog');
const cancelBookingId = document.getElementById('cancel-booking-id');   // hidden input
const cancelFieldName = document.getElementById('cancel-field-name');
const cancelSlotLabel = document.getElementById('cancel-slot-label');
const cancelConfirmBtn = document.getElementById('btn-cancel-confirm');
const cancelAbortBtn   = document.getElementById('btn-cancel-abort');

// ─── Utility ─────────────────────────────────────────────────────────────────

function _dispatchToast(message) {
  document.dispatchEvent(new CustomEvent('nh:toast', { detail: { message } }));
}

function _escape(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:   { label: 'Chờ xác nhận', cls: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Đã xác nhận',  cls: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã hủy',       cls: 'bg-red-100 text-red-700' },
  completed: { label: 'Hoàn thành',   cls: 'bg-slate-100 text-slate-700' },
  no_show:   { label: 'Không đến',    cls: 'bg-orange-100 text-orange-700' },
};

function _statusBadge(status) {
  const s = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.cls}">${s.label}</span>`;
}

// ─── Partition logic ──────────────────────────────────────────────────────────

/**
 * Returns true if the booking slot has already passed (slot end < now).
 * @param {import('./mock-api.js').Booking} b
 */
function _isPastSlot(b) {
  const slotEnd = new Date(b.slot_datetime_iso).getTime() + b.duration_min * 60000;
  return slotEnd < Date.now();
}

/**
 * Splits all bookings into three display buckets.
 * @param {import('./mock-api.js').Booking[]} bookings
 */
function _partition(bookings) {
  const upcoming = [];
  const past     = [];
  const cancelled = [];

  bookings.forEach((b) => {
    if (b.status === 'cancelled') {
      cancelled.push(b);
    } else if (b.status === 'completed' || b.status === 'no_show' || _isPastSlot(b)) {
      past.push(b);
    } else {
      upcoming.push(b);
    }
  });

  return { upcoming, past, cancelled };
}

// ─── Cancellability check ─────────────────────────────────────────────────────

/**
 * Returns true if the user may cancel this booking (UX rule).
 * Server-side RLS is the real guard.
 * @param {import('./mock-api.js').Booking} b
 */
function _canCancel(b) {
  if (b.status !== 'pending' && b.status !== 'confirmed') return false;
  // Must be > 24h before slot start
  const now = Date.now();
  const slotMs = new Date(b.slot_datetime_iso).getTime();
  return slotMs - now > 24 * 60 * 60 * 1000;
}

// ─── Field name cache ─────────────────────────────────────────────────────────

const _fieldCache = new Map();

async function _resolveFieldName(fieldId) {
  if (_fieldCache.has(fieldId)) return _fieldCache.get(fieldId);
  try {
    const f = await api.getField(fieldId);
    _fieldCache.set(fieldId, f.name);
    return f.name;
  } catch {
    _fieldCache.set(fieldId, fieldId);
    return fieldId;
  }
}

// ─── Table render ─────────────────────────────────────────────────────────────

/**
 * Renders a list of bookings into a target tbody element.
 * @param {import('./mock-api.js').Booking[]} bookings
 * @param {string} tbodyId
 * @param {string} emptyMessage
 */
async function _renderList(bookings, tbodyId, emptyMessage) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;

  if (bookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="px-4 py-8 text-center text-slate-400 text-sm">${emptyMessage}</td>
      </tr>`;
    return;
  }

  // Pre-fetch all field names
  await Promise.all([...new Set(bookings.map((b) => b.field_id))].map(_resolveFieldName));

  tbody.innerHTML = bookings.map((b) => {
    const fieldName = _fieldCache.get(b.field_id) ?? b.field_id;
    const slotLabel = formatSlotLabel(b.slot_datetime_iso, b.duration_min);
    const canCancel = _canCancel(b);

    return `
      <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
        <td class="px-4 py-3">
          <p class="text-sm font-semibold text-slate-800">${_escape(fieldName)}</p>
          <p class="text-xs text-slate-400 font-mono mt-0.5">${shortBookingCode(b.id)}</p>
        </td>
        <td class="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
          ${formatVnDate(b.slot_datetime_iso)}<br>
          <span class="text-xs text-slate-400">${formatVnTime(b.slot_datetime_iso)}</span>
        </td>
        <td class="px-4 py-3 text-sm font-semibold text-pitch-600 whitespace-nowrap">
          ${formatVnd(b.total_vnd)}
        </td>
        <td class="px-4 py-3">${_statusBadge(b.status)}</td>
        <td class="px-4 py-3">
          ${canCancel
            ? `<button type="button"
                class="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
                data-cancel-id="${b.id}"
                data-cancel-field="${_escape(fieldName)}"
                data-cancel-slot="${_escape(slotLabel)}">
                Hủy đặt sân
              </button>`
            : '<span class="text-xs text-slate-300">—</span>'}
        </td>
      </tr>`;
  }).join('');

  // Wire cancel buttons
  tbody.querySelectorAll('[data-cancel-id]').forEach((btn) => {
    btn.addEventListener('click', () => _openCancelDialog(
      btn.dataset.cancelId,
      btn.dataset.cancelField,
      btn.dataset.cancelSlot,
    ));
  });
}

// ─── Tab routing ──────────────────────────────────────────────────────────────

function _showTab(tabName) {
  _activeTab = tabName;

  tabButtons.forEach((btn) => {
    const active = btn.dataset.tabBtn === tabName;
    btn.classList.toggle('tab-active', active);
    btn.classList.toggle('tab-inactive', !active);
    btn.setAttribute('aria-selected', String(active));
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.tabPanel !== tabName);
  });
}

function _initTabs() {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => _showTab(btn.dataset.tabBtn));
  });
}

// ─── Cancel modal ─────────────────────────────────────────────────────────────

function _openCancelDialog(bookingId, fieldName, slotLabel) {
  if (!cancelDialog) return;
  if (cancelBookingId) cancelBookingId.value = bookingId;
  if (cancelFieldName) cancelFieldName.textContent = fieldName;
  if (cancelSlotLabel) cancelSlotLabel.textContent = slotLabel;
  cancelDialog.showModal();
}

function _initCancelDialog() {
  if (!cancelDialog) return;

  // Close on backdrop click
  cancelDialog.addEventListener('click', (e) => {
    if (e.target === cancelDialog) cancelDialog.close();
  });

  if (cancelAbortBtn) {
    cancelAbortBtn.addEventListener('click', () => cancelDialog.close());
  }

  if (cancelConfirmBtn) {
    cancelConfirmBtn.addEventListener('click', async () => {
      const id = cancelBookingId?.value;
      if (!id) return;

      cancelConfirmBtn.disabled = true;
      cancelConfirmBtn.textContent = 'Đang hủy...';

      try {
        await api.cancelBooking(id);
        cancelDialog.close();
        _dispatchToast('Đã hủy đặt sân thành công.');
        await _loadBookings();
      } catch (err) {
        console.error('[my-bookings] cancel error:', err);
        _dispatchToast('Có lỗi khi hủy đặt sân. Vui lòng thử lại.');
        cancelConfirmBtn.disabled = false;
        cancelConfirmBtn.textContent = 'Xác nhận hủy';
      }
    });
  }
}

// ─── Data load + render ───────────────────────────────────────────────────────

async function _loadBookings() {
  try {
    _allBookings = await api.listMyBookings();
  } catch (err) {
    console.error('[my-bookings] listMyBookings error:', err);
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl)   errorEl.classList.remove('hidden');
    return;
  }

  if (loadingEl) loadingEl.classList.add('hidden');

  if (_allBookings.length === 0) {
    if (emptyEl)   emptyEl.classList.remove('hidden');
    if (contentEl) contentEl.classList.add('hidden');
    return;
  }

  if (contentEl) contentEl.classList.remove('hidden');
  if (emptyEl)   emptyEl.classList.add('hidden');

  const { upcoming, past, cancelled } = _partition(_allBookings);

  // Update tab badges with counts
  const upcomingCount  = document.getElementById('tab-count-upcoming');
  const pastCount      = document.getElementById('tab-count-past');
  const cancelledCount = document.getElementById('tab-count-cancelled');

  if (upcomingCount)  upcomingCount.textContent  = upcoming.length  || '';
  if (pastCount)      pastCount.textContent       = past.length      || '';
  if (cancelledCount) cancelledCount.textContent  = cancelled.length || '';

  await Promise.all([
    _renderList(upcoming,  'bookings-upcoming-tbody',  'Không có lịch đặt sắp tới.'),
    _renderList(past,      'bookings-past-tbody',      'Không có lịch đặt đã qua.'),
    _renderList(cancelled, 'bookings-cancelled-tbody', 'Không có lịch đặt đã hủy.'),
  ]);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  _initTabs();
  _initCancelDialog();
  _showTab('upcoming');

  try {
    await _loadBookings();
  } catch (err) {
    console.error('[my-bookings] init error:', err);
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl)   errorEl.classList.remove('hidden');
  }
}

init();
