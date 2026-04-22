/**
 * admin-page.js — Admin panel main controller (Phase 05A).
 *
 * Auth gate:
 *   Mock mode: localStorage.getItem('nh_mock_role') === 'admin'
 *              Dev toggle button on page sets this key.
 *   Supabase mode: supabase.auth.getUser() → user.user_metadata.role === 'admin'
 *
 * IMPORTANT: Client gate is UX only. Server-side RLS is the real enforcement.
 *
 * Tab routing: simple JS — no router library needed.
 * Delegates field/booking/user rendering to:
 *   admin-fields.js, admin-bookings.js, admin-users.js
 */

import { isSupabaseConfigured, getSupabaseClient } from './supabase-client.js';

// ─── Role detection ───────────────────────────────────────────────────────────

/**
 * Returns the current user's role and email.
 * In mock mode, reads from localStorage (dev toggle).
 * In Supabase mode, reads from auth JWT user_metadata.
 * @returns {Promise<{ isAdmin: boolean, email: string }>}
 */
async function _detectRole() {
  if (!isSupabaseConfigured()) {
    // Mock mode: honour dev toggle
    const mockRole = localStorage.getItem('nh_mock_role');
    const mockEmail = localStorage.getItem('nh_mock_email') || 'admin@demo.local';
    return { isAdmin: mockRole === 'admin', email: mockEmail };
  }

  try {
    const sb = getSupabaseClient();
    const { data: { user }, error } = await sb.auth.getUser();
    if (error || !user) return { isAdmin: false, email: '' };
    const role = user.user_metadata?.role;
    return { isAdmin: role === 'admin', email: user.email ?? '' };
  } catch {
    return { isAdmin: false, email: '' };
  }
}

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const accessDeniedEl       = document.getElementById('admin-access-denied');
const adminPanelEl         = document.getElementById('admin-panel');
const adminEmailBadge      = document.getElementById('admin-email-badge');
// Two distinct toggle containers: one in the denied state, one in the panel header
const devToggleDenied      = document.getElementById('admin-dev-toggle-denied');
const devTogglePanel       = document.getElementById('admin-dev-toggle');
const devToggleBtn         = document.getElementById('btn-admin-dev-toggle');

// Tab buttons + panels
const tabButtons = document.querySelectorAll('[data-tab-btn]');
const tabPanels  = document.querySelectorAll('[data-tab-panel]');

// ─── Tab routing ──────────────────────────────────────────────────────────────

/** @type {string} */
let _activeTab = 'fields';

function _showTab(tabName) {
  _activeTab = tabName;

  tabButtons.forEach((btn) => {
    const isActive = btn.dataset.tabBtn === tabName;
    btn.classList.toggle('admin-tab-active', isActive);
    btn.classList.toggle('admin-tab-inactive', !isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  tabPanels.forEach((panel) => {
    const isActive = panel.dataset.tabPanel === tabName;
    panel.classList.toggle('hidden', !isActive);
  });

  // Lazy-load tab content
  if (tabName === 'fields') {
    import('./admin-fields.js').then((m) => m.initFieldsTab()).catch(console.error);
  } else if (tabName === 'bookings') {
    import('./admin-bookings.js').then((m) => m.initBookingsTab()).catch(console.error);
  } else if (tabName === 'users') {
    import('./admin-users.js').then((m) => m.initUsersTab()).catch(console.error);
  }
}

function _initTabs() {
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => _showTab(btn.dataset.tabBtn));
  });
}

// ─── Dev toggle (mock mode) ───────────────────────────────────────────────────

function _initDevToggle() {
  if (isSupabaseConfigured()) return; // Not shown in real mode

  // Show whichever toggle container is currently visible (denied or panel)
  // Both are hidden by default; the correct one becomes visible after auth check
  if (devToggleDenied) devToggleDenied.classList.remove('hidden');
  // devTogglePanel is shown by admin-panel reveal path below

  _updateDevToggleBtn();

  if (devToggleBtn) {
    devToggleBtn.addEventListener('click', () => {
      const current = localStorage.getItem('nh_mock_role');
      if (current === 'admin') {
        localStorage.removeItem('nh_mock_role');
      } else {
        localStorage.setItem('nh_mock_role', 'admin');
      }
      // Reload so the auth gate re-evaluates
      window.location.reload();
    });
  }
}

function _updateDevToggleBtn() {
  if (!devToggleBtn) return;
  const isAdmin = localStorage.getItem('nh_mock_role') === 'admin';
  devToggleBtn.textContent = isAdmin
    ? 'Tắt chế độ Admin (demo)'
    : 'Bật chế độ Admin (demo)';
  devToggleBtn.className = isAdmin
    ? 'text-xs px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-medium transition-colors'
    : 'text-xs px-3 py-1.5 rounded-lg bg-pitch-100 text-pitch-700 hover:bg-pitch-200 font-medium transition-colors';
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  // Always show dev toggle setup first (so user can toggle even before gate)
  _initDevToggle();

  const { isAdmin, email } = await _detectRole();

  if (!isAdmin) {
    // Show access denied (with denied-section dev toggle); hide panel toggle
    if (accessDeniedEl)  accessDeniedEl.classList.remove('hidden');
    if (adminPanelEl)    adminPanelEl.classList.add('hidden');
    if (devTogglePanel)  devTogglePanel.classList.add('hidden');
    return;
  }

  // Show panel; hide the denied-section toggle, show the panel-header toggle
  if (accessDeniedEl)  accessDeniedEl.classList.add('hidden');
  if (adminPanelEl)    adminPanelEl.classList.remove('hidden');
  if (devToggleDenied) devToggleDenied.classList.add('hidden');
  if (!isSupabaseConfigured() && devTogglePanel) {
    devTogglePanel.classList.remove('hidden');
  }

  // Populate email badge
  if (adminEmailBadge) adminEmailBadge.textContent = email;

  // Init tabs
  _initTabs();

  // Show default tab (fields)
  _showTab('fields');
}

init();
