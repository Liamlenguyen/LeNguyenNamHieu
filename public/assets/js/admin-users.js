/**
 * admin-users.js — Admin tab: Users list (read-only) (Phase 05A).
 *
 * Loaded lazily by admin-page.js when the "Người dùng" tab is activated.
 *
 * Real Supabase mode: auth.admin.listUsers() requires service_role key which
 * is NOT safe to expose in the browser. Shows own profile + disclaimer banner
 * pointing to Supabase Dashboard.
 *
 * Mock mode: shows sample user entries built from booking data.
 */

import { isSupabaseConfigured, getSupabaseClient } from './supabase-client.js';
import { api } from './api.js';

// ─── State ────────────────────────────────────────────────────────────────────

let _initialized = false;

// ─── DOM helpers ──────────────────────────────────────────────────────────────

const panel = () => document.getElementById('tab-panel-users');

function _container() {
  return document.getElementById('admin-users-content');
}

// ─── Mock mode render ─────────────────────────────────────────────────────────

async function _renderMock() {
  const container = _container();
  if (!container) return;

  container.innerHTML = `
    <div class="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 mb-4">
      <svg class="w-4 h-4 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
      <p><strong>Chế độ Demo:</strong> Danh sách bên dưới được tổng hợp từ dữ liệu đặt sân trong localStorage.</p>
    </div>
    <div id="admin-users-loading" class="text-center py-8 text-slate-400 text-sm">
      <div class="inline-block w-5 h-5 border-2 border-pitch-200 border-t-pitch-600 rounded-full animate-spin mr-2"></div>
      Đang tải...
    </div>
    <div id="admin-users-table-wrap" class="hidden overflow-x-auto rounded-xl border border-slate-200">
      <table class="min-w-full text-left">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Họ tên</th>
            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Số điện thoại</th>
            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Email</th>
            <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Số lần đặt</th>
          </tr>
        </thead>
        <tbody id="admin-users-tbody"></tbody>
      </table>
    </div>`;

  try {
    const bookings = await api.adminListBookings();

    // Deduplicate by phone number as a proxy for user identity
    const userMap = new Map();
    bookings.forEach((b) => {
      const key = b.user_phone;
      if (!userMap.has(key)) {
        userMap.set(key, { name: b.user_name, phone: b.user_phone, email: b.user_email, count: 0 });
      }
      userMap.get(key).count += 1;
    });

    const users = Array.from(userMap.values()).sort((a, b) => b.count - a.count);

    const loadingEl = document.getElementById('admin-users-loading');
    const tableWrap = document.getElementById('admin-users-table-wrap');
    const tbody     = document.getElementById('admin-users-tbody');

    if (loadingEl) loadingEl.classList.add('hidden');

    if (users.length === 0) {
      if (tableWrap) tableWrap.innerHTML = `<p class="text-center text-slate-400 text-sm py-6">Chưa có dữ liệu người dùng.</p>`;
      return;
    }

    if (tbody) {
      tbody.innerHTML = users.map((u) => `
        <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
          <td class="px-4 py-3 text-sm font-medium text-slate-800">${_escape(u.name)}</td>
          <td class="px-4 py-3 text-sm text-slate-600 font-mono">${_escape(u.phone)}</td>
          <td class="px-4 py-3 text-sm text-slate-500">${_escape(u.email || '—')}</td>
          <td class="px-4 py-3 text-sm text-slate-600 text-center">${u.count}</td>
        </tr>
      `).join('');
    }

    if (tableWrap) tableWrap.classList.remove('hidden');
  } catch (err) {
    console.error('[admin-users] mock load error:', err);
    const loadingEl = document.getElementById('admin-users-loading');
    if (loadingEl) loadingEl.textContent = 'Có lỗi khi tải dữ liệu.';
  }
}

// ─── Supabase mode render ─────────────────────────────────────────────────────

async function _renderSupabase() {
  const container = _container();
  if (!container) return;

  // Show disclaimer — full user list needs service_role key (not safe in browser)
  container.innerHTML = `
    <div class="p-4 bg-amber-50 border border-amber-300 rounded-xl text-sm text-amber-800 mb-4 flex items-start gap-2">
      <svg class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
      </svg>
      <div>
        <p class="font-semibold mb-1">Danh sách người dùng cần service_role key</p>
        <p>
          <code>auth.admin.listUsers()</code> yêu cầu <code>service_role</code> key — không an toàn khi để trong mã nguồn frontend.<br>
          Xem danh sách đầy đủ tại:
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener"
            class="underline hover:text-amber-900 font-medium">
            Supabase Dashboard → Authentication → Users
          </a>
        </p>
      </div>
    </div>

    <div class="card card-body">
      <h3 class="text-sm font-bold text-slate-700 mb-3">Hồ sơ của bạn</h3>
      <div id="admin-own-profile" class="text-sm text-slate-500">Đang tải...</div>
    </div>`;

  try {
    const sb = getSupabaseClient();
    const { data: { user } } = await sb.auth.getUser();
    const profileEl = document.getElementById('admin-own-profile');
    if (!profileEl) return;

    if (!user) {
      profileEl.textContent = 'Không tìm thấy thông tin tài khoản.';
      return;
    }

    profileEl.innerHTML = `
      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <dt class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">ID</dt>
          <dd class="font-mono text-xs text-slate-700 break-all">${_escape(user.id)}</dd>
        </div>
        <div>
          <dt class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Email</dt>
          <dd class="text-slate-700">${_escape(user.email ?? '—')}</dd>
        </div>
        <div>
          <dt class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Role</dt>
          <dd class="text-slate-700">${_escape(user.user_metadata?.role ?? 'user')}</dd>
        </div>
        <div>
          <dt class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Đăng ký lúc</dt>
          <dd class="text-slate-700">${user.created_at ? new Date(user.created_at).toLocaleString('vi-VN') : '—'}</dd>
        </div>
      </dl>`;
  } catch (err) {
    console.error('[admin-users] supabase profile error:', err);
    const profileEl = document.getElementById('admin-own-profile');
    if (profileEl) profileEl.textContent = 'Có lỗi khi tải hồ sơ.';
  }
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function _escape(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// ─── Public init ──────────────────────────────────────────────────────────────

/**
 * Called by admin-page.js when the "Người dùng" tab is activated.
 * Idempotent — only renders once.
 */
export async function initUsersTab() {
  if (_initialized) return;
  _initialized = true;

  if (isSupabaseConfigured()) {
    await _renderSupabase();
  } else {
    await _renderMock();
  }
}
