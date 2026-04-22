/**
 * supabase-client.js — Lazy Supabase singleton + configuration check.
 *
 * Reads credentials from window.__ENV__ (injected by scripts/inject-env.mjs
 * via public/env.js at build time or dev time).
 *
 * Usage:
 *   import { supabase, isSupabaseConfigured } from './supabase-client.js';
 *   if (isSupabaseConfigured()) { ... }
 *
 * Security note:
 *   Only the public ANON key is placed here — safe by design (Supabase pattern).
 *   RLS policies on the DB are the real access control layer.
 *   The service-role key must NEVER appear in frontend code or env.js.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ─── Config check ─────────────────────────────────────────────────────────────

/**
 * Returns true when Supabase credentials are present in window.__ENV__.
 * False when env.js was not generated (dev/demo without DB creds).
 * @returns {boolean}
 */
export function isSupabaseConfigured() {
  const env = window.__ENV__;
  return (
    typeof env === 'object' &&
    env !== null &&
    typeof env.SUPABASE_URL === 'string' &&
    env.SUPABASE_URL.startsWith('https://') &&
    typeof env.SUPABASE_ANON_KEY === 'string' &&
    env.SUPABASE_ANON_KEY.length > 0
  );
}

// ─── Singleton client ─────────────────────────────────────────────────────────

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let _client = null;

/**
 * Returns the Supabase client singleton.
 * Throws if credentials are not configured (call isSupabaseConfigured() first).
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getSupabaseClient() {
  if (_client) return _client;

  if (!isSupabaseConfigured()) {
    throw new Error(
      '[supabase-client] Supabase is not configured. ' +
      'Set SUPABASE_URL and SUPABASE_ANON_KEY in .env.local and run npm run dev:env.'
    );
  }

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.__ENV__;
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      // Persist session in localStorage (Supabase default) so refreshes keep user logged in
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return _client;
}

/**
 * Convenience export: the supabase client (null if not configured).
 * Prefer getSupabaseClient() with an isSupabaseConfigured() guard.
 * @type {import('@supabase/supabase-js').SupabaseClient | null}
 */
export const supabase = isSupabaseConfigured() ? getSupabaseClient() : null;
