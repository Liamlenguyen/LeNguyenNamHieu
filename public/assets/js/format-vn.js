/**
 * format-vn.js — Vietnamese locale formatting utilities
 * Centralizes VND currency, date, time display for the entire app.
 * All display functions use Asia/Bangkok (UTC+7) timezone.
 */

const TZ = 'Asia/Bangkok';
const LOCALE = 'vi-VN';

/**
 * Formats a number as Vietnamese Dong currency.
 * Output: "350.000₫" (dot thousands separator, no decimals)
 * @param {number} n - amount in VND (integer)
 * @returns {string}
 */
export function formatVnd(n) {
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Formats an ISO date string as dd/mm/yyyy in Asia/Bangkok.
 * @param {string} iso - ISO 8601 string (e.g. "2026-04-25T11:00:00.000Z")
 * @returns {string} e.g. "25/04/2026"
 */
export function formatVnDate(iso) {
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: TZ,
  }).format(new Date(iso));
}

/**
 * Formats an ISO date string as HH:mm in Asia/Bangkok.
 * @param {string} iso
 * @returns {string} e.g. "18:00"
 */
export function formatVnTime(iso) {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TZ,
  }).format(new Date(iso));
}

/**
 * Formats a slot label combining start time, end time, and date.
 * @param {string} startIso - UTC ISO string of slot start
 * @param {number} durationMin - duration in minutes (e.g. 90)
 * @returns {string} e.g. "18:00 – 19:30, 25/04/2026"
 */
export function formatSlotLabel(startIso, durationMin) {
  const start = new Date(startIso);
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  const startTime = formatVnTime(startIso);
  const endTime = formatVnTime(end.toISOString());
  const date = formatVnDate(startIso);
  return `${startTime} – ${endTime}, ${date}`;
}

/**
 * Formats date + time together in a readable long form.
 * @param {string} iso
 * @returns {string} e.g. "18:00, thứ Sáu 25/04/2026"
 */
export function formatVnDateTime(iso) {
  const d = new Date(iso);
  const weekday = new Intl.DateTimeFormat(LOCALE, {
    weekday: 'long',
    timeZone: TZ,
  }).format(d);
  const time = formatVnTime(iso);
  const date = formatVnDate(iso);
  return `${time}, ${weekday} ${date}`;
}

/**
 * Returns YYYY-MM-DD date string in Asia/Bangkok timezone.
 * Used for comparing slot dates without timezone mismatch.
 * @param {string|Date} dateOrIso
 * @returns {string} e.g. "2026-04-25"
 */
export function toLocalDateStr(dateOrIso) {
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d);
}

/**
 * Generates a short booking code from a UUID-like string.
 * @param {string} id
 * @returns {string} e.g. "NH-A1B2C3"
 */
export function shortBookingCode(id) {
  return 'NH-' + String(id).replace(/-/g, '').slice(0, 6).toUpperCase();
}
