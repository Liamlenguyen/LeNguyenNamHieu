/**
 * vietqr-mock.js — Mock VietQR payment display (Phase 05C).
 *
 * Per validation decision #6: MOCK/DISPLAY-ONLY.
 * No real bank account, no real payment processor.
 * Shows a prominent disclaimer banner + static demo QR + fake bank info.
 *
 * Usage:
 *   import { renderQrSection } from './vietqr-mock.js';
 *   renderQrSection(booking, field);  // injects section into #vietqr-section container
 */

import { formatVnd } from './format-vn.js';
import { api } from './api.js';
import { isSupabaseConfigured } from './supabase-client.js';

// ─── Inline SVG demo QR (no external image needed) ───────────────────────────

/**
 * Generates an inline SVG that looks like a QR placeholder with amount text.
 * No real QR data — purely decorative for demo.
 * @param {number} amountVnd
 * @returns {string} data-URL or inline SVG string
 */
function _buildDemoQrSvg(amountVnd) {
  const amountStr = formatVnd(amountVnd);
  // Simple grid pattern that resembles a QR code visually
  const cells = [];
  // Deterministic "QR-like" pattern using a fixed seed
  const seed = [
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,0,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0],
    [0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1],
    [1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1],
    [0,0,0,0,0,0,0,0,0,1,0,1,0,0,1,1,0],
    [1,1,1,1,1,1,1,0,1,0,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,1,0],
    [1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,1,0,1,0,0,0,1,0],
    [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],
  ];

  const cellSize = 10;
  const gridSize = seed.length;
  const svgSize = gridSize * cellSize;

  seed.forEach((row, r) => {
    row.forEach((val, c) => {
      if (val === 1) {
        cells.push(`<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#1e293b"/>`);
      }
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}"
    width="${svgSize}" height="${svgSize}" role="img" aria-label="Demo QR code">
    <rect width="${svgSize}" height="${svgSize}" fill="white"/>
    ${cells.join('')}
  </svg>`;
}

// ─── Toast dispatcher ─────────────────────────────────────────────────────────

function _dispatchToast(message) {
  document.dispatchEvent(new CustomEvent('nh:toast', { detail: { message } }));
}

// ─── Render ───────────────────────────────────────────────────────────────────

/**
 * Injects the mock VietQR payment section into #vietqr-section on the page.
 * Called from confirmation-page.js after booking summary renders.
 *
 * @param {import('./mock-api.js').Booking} booking
 * @param {import('./mock-api.js').Field} field
 */
export function renderQrSection(booking, field) {
  const container = document.getElementById('vietqr-section');
  if (!container) return;

  const depositVnd = Math.round(booking.total_vnd * 0.5);
  const qrSvg = _buildDemoQrSvg(depositVnd);
  const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(qrSvg);

  container.innerHTML = `
    <!-- MOCK VIETQR PAYMENT SECTION -->
    <div class="mt-6 rounded-2xl border-2 border-red-400 overflow-hidden">

      <!-- Disclaimer banner -->
      <div class="bg-amber-400 border-b-2 border-red-400 px-4 py-3 flex items-center gap-2">
        <span class="text-xl" aria-hidden="true">⚠️</span>
        <p class="text-red-800 font-bold text-sm leading-tight">
          DEMO — Đây là mã QR mẫu, không thực hiện giao dịch thật.<br>
          <span class="font-normal text-red-700">Hệ thống demo, chưa xác minh chuyển khoản.</span>
        </p>
      </div>

      <div class="bg-white px-6 py-5">
        <h3 class="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-pitch-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
          </svg>
          Thanh toán cọc 50% (MẪU)
        </h3>

        <div class="flex flex-col sm:flex-row gap-6 items-center sm:items-start">

          <!-- QR image -->
          <div class="shrink-0 flex flex-col items-center gap-2">
            <div class="p-3 border-2 border-dashed border-amber-300 rounded-xl bg-amber-50">
              <img
                src="${svgDataUrl}"
                alt="Demo QR code — không dùng để thanh toán thật"
                class="w-40 h-40 object-contain"
              />
            </div>
            <span class="text-xs text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
              QR MẪU — KHÔNG THẬT
            </span>
          </div>

          <!-- Payment info -->
          <div class="flex-1 space-y-3 text-sm w-full">
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-slate-500">Số tiền cọc (50%)</span>
                <span class="font-bold text-pitch-600 text-base">${formatVnd(depositVnd)} ₫ <span class="text-xs text-red-500">(MẪU)</span></span>
              </div>
              <div class="border-t border-amber-200 pt-2 space-y-1 text-xs text-slate-600">
                <div class="flex items-center gap-1">
                  <span class="font-semibold text-slate-700">Ngân hàng:</span>
                  <span>Vietcombank <span class="text-red-500">(MẪU)</span></span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="font-semibold text-slate-700">Số TK:</span>
                  <span class="font-mono">9999 9999 99 <span class="text-red-500">(DEMO)</span></span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="font-semibold text-slate-700">Chủ TK:</span>
                  <span>SAN BONG NAM HIEU <span class="text-red-500">(DEMO)</span></span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="font-semibold text-slate-700">Nội dung CK:</span>
                  <span class="font-mono">DATSAN ${booking.id.slice(0,8).toUpperCase()}</span>
                </div>
              </div>
            </div>

            <!-- Confirm button -->
            <button
              type="button"
              id="btn-demo-paid"
              data-booking-id="${booking.id}"
              data-deposit="${depositVnd}"
              class="w-full btn-primary py-3 text-sm font-semibold"
            >
              Tôi đã chuyển khoản (demo)
            </button>

            <p class="text-xs text-slate-400 text-center">
              Nhấn nút trên để xác nhận demo — không có xác minh thực tế nào được thực hiện.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Wire the "Tôi đã chuyển khoản (demo)" button
  const payBtn = document.getElementById('btn-demo-paid');
  if (payBtn) {
    payBtn.addEventListener('click', () => _handleDemoPaid(booking, depositVnd));
  }
}

// ─── Demo payment handler ─────────────────────────────────────────────────────

/**
 * Handles the demo "Tôi đã chuyển khoản" click.
 * Calls adminUpdateBooking if available (admin mode), otherwise falls back to
 * a mock status update. Works in both mock and real API modes for demo purposes.
 * @param {import('./mock-api.js').Booking} booking
 * @param {number} depositVnd
 */
async function _handleDemoPaid(booking, depositVnd) {
  const btn = document.getElementById('btn-demo-paid');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Đang xử lý...';
  }

  try {
    // Demo payment confirmation — DB write only in mock mode.
    // In real (Supabase) mode, the booking owner cannot promote status to 'confirmed'
    // via RLS (owners can only cancel); admin must confirm via /admin panel.
    // So we flip the UI only and show a disclaimer in the real-mode branch.
    if (!isSupabaseConfigured() && typeof api.adminUpdateBooking === 'function') {
      await api.adminUpdateBooking(booking.id, {
        status: 'confirmed',
        deposit_paid_vnd: depositVnd,
      });
    }

    // Update the status badge on the page if present
    const statusBadge = document.getElementById('booking-status-badge');
    if (statusBadge) {
      statusBadge.textContent = 'Đã xác nhận';
      statusBadge.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700';
    }

    // Replace QR section with success state
    const container = document.getElementById('vietqr-section');
    if (container) {
      container.innerHTML = `
        <div class="mt-6 rounded-2xl border border-green-200 bg-green-50 px-6 py-5 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
          </div>
          <div>
            <p class="font-bold text-green-800 text-sm">Đã xác nhận thanh toán demo</p>
            <p class="text-green-700 text-xs mt-0.5">
              Cọc 50%: ${formatVnd(depositVnd)} ₫ — đây là xác nhận demo, không có giao dịch thật nào được thực hiện.
            </p>
          </div>
        </div>
      `;
    }

    _dispatchToast('Đã xác nhận thanh toán demo — trạng thái cập nhật thành Đã xác nhận');
  } catch (err) {
    console.error('[vietqr-mock] demo payment confirm failed:', err);
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Tôi đã chuyển khoản (demo)';
    }
    _dispatchToast('Có lỗi khi xác nhận demo. Vui lòng thử lại.');
  }
}
