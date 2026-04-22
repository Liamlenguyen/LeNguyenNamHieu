/**
 * layout-loader.js
 * Fetches shared HTML partials (header, footer) and injects them into
 * <div data-partial="header"> and <div data-partial="footer"> slots.
 *
 * Falls back gracefully when running on file:// (no fetch support for
 * local files in most browsers) by showing an inline warning message.
 *
 * Usage: <script src="/assets/js/layout-loader.js" defer></script>
 */

(function () {
  'use strict';

  /** Resolve partial path relative to site root, handling both / and file:// */
  function resolvePartialPath(name) {
    var protocol = window.location.protocol;
    if (protocol === 'file:') {
      // Cannot reliably fetch on file:// — return null to trigger fallback
      return null;
    }
    return '/partials/' + name + '.html';
  }

  /** Inject a simple fallback message when partials cannot be fetched */
  function injectFallback(el, name) {
    if (name === 'header') {
      el.innerHTML = [
        '<div style="background:#fff;border-bottom:1px solid #e2e8f0;padding:12px 16px;',
        'font-family:system-ui,sans-serif;display:flex;align-items:center;gap:12px;">',
        '<strong style="color:#16a34a;">Sân Bóng Nam Hiếu</strong>',
        '<span style="color:#94a3b8;font-size:12px;">',
        '⚠ Mở bằng server cục bộ (<code>npm run dev</code>) để tải đầy đủ giao diện.</span>',
        '</div>'
      ].join('');
    } else if (name === 'footer') {
      el.innerHTML = [
        '<footer style="background:#0f172a;color:#94a3b8;text-align:center;',
        'padding:24px 16px;font-family:system-ui,sans-serif;font-size:13px;">',
        '&copy; 2021–2026 Nam Hiếu · FX11106 · FUNiX',
        '</footer>'
      ].join('');
    }
  }

  /** Fetch one partial and inject into target element */
  async function loadPartial(el) {
    var name = el.dataset.partial;
    if (!name) return;

    var path = resolvePartialPath(name);

    // file:// fallback — skip fetch entirely
    if (path === null) {
      injectFallback(el, name);
      return;
    }

    try {
      var response = await fetch(path);
      if (!response.ok) {
        throw new Error('HTTP ' + response.status + ' loading partial: ' + path);
      }
      var html = await response.text();
      el.innerHTML = html;

      // Re-run any inline <script> tags injected via innerHTML
      // (innerHTML does NOT execute scripts — we must re-create them)
      el.querySelectorAll('script').forEach(function (oldScript) {
        var newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(function (attr) {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });

      // Mark current page link as active in the nav
      if (name === 'header') {
        highlightActiveNavLink();
        // Load auth chip after header partial is injected
        // Use dynamic import so it doesn't block pages that don't need auth
        if (window.__ENV__ || true) {
          import('/assets/js/header-auth.js').catch(function (e) {
            console.warn('[layout-loader] header-auth load failed:', e.message);
          });
        }
      }
    } catch (err) {
      console.warn('[layout-loader] Could not load partial "' + name + '":', err.message);
      injectFallback(el, name);
    }
  }

  /** Add nav-link-active class to link matching current page URL */
  function highlightActiveNavLink() {
    var currentPath = window.location.pathname;
    // Normalise: strip trailing slash, treat /index.html and / as same
    var normPath = currentPath.replace(/\/$/, '') || '/index.html';

    document.querySelectorAll('[data-partial="header"] a[href]').forEach(function (link) {
      var href = link.getAttribute('href');
      if (!href) return;
      // Normalise href too
      var normHref = href.replace(/\/$/, '') || '/index.html';
      if (normPath === normHref || normPath.endsWith(normHref)) {
        link.classList.add('nav-link-active', 'text-pitch-600');
        link.classList.remove('text-slate-700');
      }
    });
  }

  /** Main entry: find all partial slots and load them */
  async function loadAllPartials() {
    var slots = document.querySelectorAll('[data-partial]');
    if (slots.length === 0) return;

    // Load header first (sequential), then footer — preserves DOM order
    // and ensures header scripts (hamburger menu) run before footer
    for (var i = 0; i < slots.length; i++) {
      await loadPartial(slots[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadAllPartials);
  } else {
    // DOMContentLoaded already fired (script loaded async/defer late)
    loadAllPartials();
  }

  // ─── Toast notification system (Phase 05) ──────────────────────────────────
  // Listens for custom `nh:toast` events dispatched by email-notify.js,
  // vietqr-mock.js, admin-bookings.js, my-bookings-page.js, etc.
  // Renders a floating toast bottom-right, auto-dismisses after 4 seconds.

  var _toastContainer = null;

  function _getToastContainer() {
    if (_toastContainer) return _toastContainer;
    _toastContainer = document.createElement('div');
    _toastContainer.setAttribute('aria-live', 'polite');
    _toastContainer.setAttribute('aria-atomic', 'false');
    _toastContainer.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'right:20px',
      'z-index:9999',
      'display:flex',
      'flex-direction:column',
      'gap:8px',
      'max-width:360px',
      'pointer-events:none',
    ].join(';');
    document.body.appendChild(_toastContainer);
    return _toastContainer;
  }

  function _showToast(message) {
    var container = _getToastContainer();

    var toast = document.createElement('div');
    toast.style.cssText = [
      'background:#1e293b',
      'color:#f8fafc',
      'padding:12px 16px',
      'border-radius:12px',
      'font-size:13px',
      'line-height:1.4',
      'box-shadow:0 4px 20px rgba(0,0,0,0.25)',
      'pointer-events:auto',
      'opacity:0',
      'transform:translateY(8px)',
      'transition:opacity 0.2s ease,transform 0.2s ease',
      'max-width:360px',
      'word-break:break-word',
    ].join(';');
    toast.textContent = message;
    container.appendChild(toast);

    // Trigger entrance animation (next frame)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      });
    });

    // Auto-dismiss after 4 seconds
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 220);
    }, 4000);
  }

  document.addEventListener('nh:toast', function (e) {
    var message = e && e.detail && e.detail.message;
    if (message) _showToast(String(message));
  });
})();
