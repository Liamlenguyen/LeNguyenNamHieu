/**
 * validators.js — Vietnamese input validation utilities
 * Used by booking forms in field-detail-page.js and other pages.
 * All regexes are anchored to prevent bypass via embedded newlines.
 */

/**
 * Validates a Vietnamese mobile phone number.
 * Covers post-2018 mobile prefixes: 03x, 05x, 07x, 08x, 09x
 * Does NOT cover landlines (deferred — out of scope for booking).
 * @param {string} str
 * @returns {boolean}
 */
export function isValidVnPhone(str) {
  return /^(0|\+84)(3|5|7|8|9)\d{8}$/.test(String(str || '').trim());
}

/**
 * Normalizes a Vietnamese phone number to 10-digit format (0xxxxxxxxx).
 * Strips spaces/dashes, converts +84 prefix to 0.
 * @param {string} str
 * @returns {string}
 */
export function normalizePhone(str) {
  const s = String(str || '').replace(/[\s\-]/g, '');
  if (s.startsWith('+84')) return '0' + s.slice(3);
  return s;
}

/**
 * RFC-lite email validation (covers >99% of real addresses).
 * @param {string} str
 * @returns {boolean}
 */
export function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(str || '').trim());
}

/**
 * Validates a Vietnamese full name.
 * Allows Vietnamese diacritics, spaces, hyphens.
 * Min 2 chars, max 60 chars.
 * @param {string} str
 * @returns {boolean}
 */
export function isValidVnName(str) {
  const s = String(str || '').trim();
  if (s.length < 2 || s.length > 60) return false;
  // Unicode word characters + Vietnamese diacritic ranges + space/hyphen
  return /^[\p{L}\p{M}\s\-]+$/u.test(s);
}

/**
 * Validates the full booking form.
 * @param {{ name: string, phone: string, email: string, note?: string }} form
 * @returns {{ ok: boolean, errors: Record<string, string> }}
 */
export function validateBookingForm(form) {
  const errors = {};

  const name = String(form.name || '').trim();
  if (!name) {
    errors.name = 'Vui lòng nhập họ và tên';
  } else if (!isValidVnName(name)) {
    errors.name = 'Tên không hợp lệ (2–60 ký tự, chỉ chữ cái và dấu)';
  }

  const phone = normalizePhone(form.phone);
  if (!phone) {
    errors.phone = 'Vui lòng nhập số điện thoại';
  } else if (!isValidVnPhone(phone)) {
    errors.phone = 'Số điện thoại không hợp lệ (dạng 0xxxxxxxxx)';
  }

  const email = String(form.email || '').trim();
  if (email && !isValidEmail(email)) {
    errors.email = 'Địa chỉ email không hợp lệ';
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
