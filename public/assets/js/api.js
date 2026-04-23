/**
 * api.js — Smart API router: Supabase when configured, mock otherwise.
 *
 * This is THE import point for all page controllers. Never import
 * mock-api.js or supabase-api.js directly from page controllers.
 *
 * Decision logic:
 *   isSupabaseConfigured() true  → supabase-api.js (real DB)
 *   isSupabaseConfigured() false → mock-api.js (localStorage, no creds needed)
 *
 * This enables the handover workflow:
 *   - Recipient runs site locally without any env vars → mock mode, full demo
 *   - After Supabase project created + env vars set → real backend, zero UI changes
 */

import { isSupabaseConfigured } from './supabase-client.js';

// Dynamic import at module evaluation time; await is allowed at top-level
// in modules (supported in all modern browsers and Node 14+).
const impl = isSupabaseConfigured()
  ? await import('./supabase-api.js')
  : await import('./mock-api.js');

/**
 * The unified API object. Shape defined in mock-api.js JSDoc.
 *
 * Standard methods: listFields, getField, listSlots, createBooking, getBooking,
 *   listMyBookings, cancelBooking, getDistricts
 *
 * Admin methods (Phase 05): adminListBookings, adminUpdateBooking,
 *   adminUpsertField, adminDeactivateField, adminListFields
 *   — Client-side gate: check role before calling.
 *   — Server-side gate: RLS admin policies are the real enforcement.
 *
 * @type {typeof import('./mock-api.js').api}
 */
export const { api } = impl;
