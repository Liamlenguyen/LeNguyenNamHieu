/**
 * auth-page.js — Sign-in / Sign-up page controller for /auth.html
 *
 * Behaviour:
 *   - Two tabs: "Đăng nhập" (sign in) and "Đăng ký" (sign up)
 *   - On success: redirect to ?next=<url> or / (index)
 *   - Mock mode (no Supabase): shows a notice and skips real auth,
 *     treating the user as "always authenticated" for demo purposes.
 *
 * Auth flow (real mode):
 *   Sign in  → supabase.auth.signInWithPassword({ email, password })
 *   Sign up  → supabase.auth.signUp({ email, password }) then redirect
 */

import { isSupabaseConfigured, getSupabaseClient } from './supabase-client.js';

// ─── Redirect helper ──────────────────────────────────────────────────────────

function _getNextUrl() {
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next');
  // Only allow relative redirects (no open-redirect)
  if (next && next.startsWith('/') && !next.startsWith('//')) return next;
  return '/index.html';
}

function _redirectAfterAuth() {
  window.location.href = _getNextUrl();
}

// ─── Mock-mode guard ──────────────────────────────────────────────────────────

function _handleMockMode() {
  const mockBanner = document.getElementById('mock-mode-banner');
  if (mockBanner) mockBanner.classList.remove('hidden');

  // In mock mode, clicking "Continue as guest" just redirects
  const guestBtn = document.getElementById('btn-guest-continue');
  if (guestBtn) {
    guestBtn.addEventListener('click', _redirectAfterAuth);
  }
}

// ─── Tab switching ────────────────────────────────────────────────────────────

function _initTabs() {
  const tabSignin = document.getElementById('tab-signin');
  const tabSignup = document.getElementById('tab-signup');
  const panelSignin = document.getElementById('panel-signin');
  const panelSignup = document.getElementById('panel-signup');

  if (!tabSignin || !tabSignup) return;

  function activateTab(which) {
    const isSignin = which === 'signin';
    tabSignin.setAttribute('aria-selected', String(isSignin));
    tabSignup.setAttribute('aria-selected', String(!isSignin));
    tabSignin.classList.toggle('tab-active', isSignin);
    tabSignup.classList.toggle('tab-active', !isSignin);
    if (panelSignin) panelSignin.classList.toggle('hidden', !isSignin);
    if (panelSignup) panelSignup.classList.toggle('hidden', isSignin);
  }

  tabSignin.addEventListener('click', () => activateTab('signin'));
  tabSignup.addEventListener('click', () => activateTab('signup'));

  // Default: open sign-in tab
  activateTab('signin');
}

// ─── Error / success display ──────────────────────────────────────────────────

function _showError(containerId, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
}

function _clearError(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}

function _setButtonLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.classList.toggle('opacity-60', loading);
  btn.classList.toggle('cursor-not-allowed', loading);
  btn.textContent = loading
    ? 'Đang xử lý...'
    : btn.dataset.defaultLabel ?? btn.textContent;
}

// ─── Sign-in form ─────────────────────────────────────────────────────────────

function _initSigninForm() {
  const form = document.getElementById('form-signin');
  if (!form) return;

  const btn = document.getElementById('btn-signin');
  if (btn) btn.dataset.defaultLabel = btn.textContent;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    _clearError('signin-error');

    const email    = form.querySelector('#signin-email')?.value?.trim() ?? '';
    const password = form.querySelector('#signin-password')?.value ?? '';

    if (!email || !password) {
      _showError('signin-error', 'Vui lòng nhập email và mật khẩu.');
      return;
    }

    _setButtonLoading('btn-signin', true);

    try {
      const sb = getSupabaseClient();
      const { error } = await sb.auth.signInWithPassword({ email, password });

      if (error) {
        const msg = error.message?.includes('Invalid login credentials')
          ? 'Email hoặc mật khẩu không đúng.'
          : `Đăng nhập thất bại: ${error.message}`;
        _showError('signin-error', msg);
        return;
      }

      _redirectAfterAuth();
    } catch (err) {
      _showError('signin-error', 'Có lỗi xảy ra. Vui lòng thử lại.');
      console.error('[auth-page] signin error:', err);
    } finally {
      _setButtonLoading('btn-signin', false);
    }
  });
}

// ─── Sign-up form ─────────────────────────────────────────────────────────────

function _initSignupForm() {
  const form = document.getElementById('form-signup');
  if (!form) return;

  const btn = document.getElementById('btn-signup');
  if (btn) btn.dataset.defaultLabel = btn.textContent;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    _clearError('signup-error');

    const email    = form.querySelector('#signup-email')?.value?.trim() ?? '';
    const password = form.querySelector('#signup-password')?.value ?? '';
    const confirm  = form.querySelector('#signup-confirm')?.value ?? '';

    if (!email || !password) {
      _showError('signup-error', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    if (password.length < 8) {
      _showError('signup-error', 'Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    if (password !== confirm) {
      _showError('signup-error', 'Mật khẩu xác nhận không khớp.');
      return;
    }

    _setButtonLoading('btn-signup', true);

    try {
      const sb = getSupabaseClient();
      const { error } = await sb.auth.signUp({ email, password });

      if (error) {
        const msg = error.message?.includes('already registered')
          ? 'Email này đã được đăng ký. Vui lòng đăng nhập.'
          : `Đăng ký thất bại: ${error.message}`;
        _showError('signup-error', msg);
        return;
      }

      // Show success message (email confirmation may be required)
      const successEl = document.getElementById('signup-success');
      if (successEl) {
        successEl.classList.remove('hidden');
        form.classList.add('hidden');
      } else {
        _redirectAfterAuth();
      }
    } catch (err) {
      _showError('signup-error', 'Có lỗi xảy ra. Vui lòng thử lại.');
      console.error('[auth-page] signup error:', err);
    } finally {
      _setButtonLoading('btn-signup', false);
    }
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  if (!isSupabaseConfigured()) {
    _handleMockMode();
    return;
  }

  _initTabs();
  _initSigninForm();
  _initSignupForm();

  // If user is already logged in, redirect immediately
  const sb = getSupabaseClient();
  sb.auth.getUser().then(({ data: { user } }) => {
    if (user) _redirectAfterAuth();
  });
}

init();
