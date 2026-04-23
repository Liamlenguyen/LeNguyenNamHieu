/**
 * header-auth.js — Renders auth state chip in the site header.
 *
 * Behaviour:
 *   - Supabase mode, logged in:  shows user email + "Đăng xuất" button
 *   - Supabase mode, logged out: shows "Đăng nhập" link → /auth.html
 *   - Mock mode:                 shows nothing (demo site, no auth needed)
 *
 * Loaded via layout-loader.js after the header partial is injected.
 * Targets: #header-auth-chip (desktop) and #header-auth-chip-mobile.
 */

import { isSupabaseConfigured, getSupabaseClient } from './supabase-client.js';

// ─── Nav link visibility ──────────────────────────────────────────────────────

/**
 * Shows or hides the "Lịch sử đặt sân" and "Quản trị" nav links
 * based on auth state and role.
 * @param {{ loggedIn: boolean, isAdmin: boolean }} state
 */
function _updateNavLinks({ loggedIn, isAdmin }) {
  // Desktop links
  const historyLink = document.getElementById('nav-my-bookings');
  const adminLink   = document.getElementById('nav-admin-link');
  // Mobile links
  const historyLinkMobile = document.getElementById('nav-my-bookings-mobile');
  const adminLinkMobile   = document.getElementById('nav-admin-link-mobile');

  [historyLink, historyLinkMobile].forEach((el) => {
    if (!el) return;
    el.classList.toggle('hidden', !loggedIn);
  });

  [adminLink, adminLinkMobile].forEach((el) => {
    if (!el) return;
    el.classList.toggle('hidden', !isAdmin);
  });
}

// ─── Render helpers ───────────────────────────────────────────────────────────

function _renderLoggedIn(email, chipEl) {
  if (!chipEl) return;
  chipEl.innerHTML = '';

  const emailSpan = document.createElement('span');
  emailSpan.className = 'text-xs text-slate-600 truncate max-w-[120px]';
  emailSpan.textContent = email;
  emailSpan.title = email;

  const signOutBtn = document.createElement('button');
  signOutBtn.type = 'button';
  signOutBtn.className = 'text-xs text-slate-500 hover:text-red-600 font-medium transition-colors';
  signOutBtn.textContent = 'Đăng xuất';
  signOutBtn.addEventListener('click', async () => {
    try {
      const sb = getSupabaseClient();
      await sb.auth.signOut();
      window.location.reload();
    } catch (err) {
      console.error('[header-auth] signOut error:', err);
    }
  });

  chipEl.appendChild(emailSpan);
  chipEl.appendChild(signOutBtn);
}

function _renderLoggedOut(chipEl) {
  if (!chipEl) return;
  chipEl.innerHTML = '';

  const loginLink = document.createElement('a');
  loginLink.href = `/auth.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
  loginLink.className = 'text-xs text-pitch-600 hover:text-pitch-700 font-medium transition-colors';
  loginLink.textContent = 'Đăng nhập';

  chipEl.appendChild(loginLink);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  const desktopChip = document.getElementById('header-auth-chip');
  const mobileChip  = document.getElementById('header-auth-chip-mobile');

  if (!isSupabaseConfigured()) {
    // Mock mode: show "Lịch sử đặt sân" always (no auth gate in mock).
    // Show admin link if mock role is set.
    const isAdmin = localStorage.getItem('nh_mock_role') === 'admin';
    _updateNavLinks({ loggedIn: true, isAdmin });
    return;
  }

  // Show chips
  if (desktopChip) desktopChip.classList.remove('hidden');

  try {
    const sb = getSupabaseClient();
    const { data: { user } } = await sb.auth.getUser();

    if (user) {
      const isAdmin = user.user_metadata?.role === 'admin';
      _renderLoggedIn(user.email ?? 'Tài khoản', desktopChip);
      _renderLoggedIn(user.email ?? 'Tài khoản', mobileChip);
      _updateNavLinks({ loggedIn: true, isAdmin });
    } else {
      _renderLoggedOut(desktopChip);
      _renderLoggedOut(mobileChip);
      _updateNavLinks({ loggedIn: false, isAdmin: false });
    }

    // React to auth state changes (sign-in/out in other tabs)
    sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const isAdmin = session.user.user_metadata?.role === 'admin';
        _renderLoggedIn(session.user.email ?? 'Tài khoản', desktopChip);
        _renderLoggedIn(session.user.email ?? 'Tài khoản', mobileChip);
        _updateNavLinks({ loggedIn: true, isAdmin });
      } else {
        _renderLoggedOut(desktopChip);
        _renderLoggedOut(mobileChip);
        _updateNavLinks({ loggedIn: false, isAdmin: false });
      }
    });
  } catch (err) {
    // Non-fatal: auth chip fails gracefully (site still works)
    console.warn('[header-auth] Could not load auth state:', err.message);
  }
}

init();
