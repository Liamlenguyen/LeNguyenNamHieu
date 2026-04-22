-- ============================================================
-- Migration 002: Row Level Security Policies
-- Project: Nam Hieu Booking System
-- Created: 2026-04-22
-- Run AFTER: 001_initial_schema.sql
-- ============================================================

-- ─── Enable RLS on all tables ─────────────────────────────────
ALTER TABLE public.fields   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- ─── fields policies ─────────────────────────────────────────

-- Anyone (including anonymous) can read active fields
CREATE POLICY "fields_public_read"
  ON public.fields
  FOR SELECT
  USING (is_active = true);

-- Only admins can insert/update/delete fields
-- Admin role: set user_metadata.role = 'admin' via Supabase dashboard or service-role key
CREATE POLICY "fields_admin_write"
  ON public.fields
  FOR ALL
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- ─── bookings policies ────────────────────────────────────────

-- Users can only read their own bookings; admins see all
CREATE POLICY "bookings_owner_read"
  ON public.bookings
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  );

-- Authenticated users can insert bookings; user_id must match their JWT uid
CREATE POLICY "bookings_insert_authenticated"
  ON public.bookings
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
  );

-- Owner can cancel their own booking (status → 'cancelled' only)
-- Admin can make any status transition
CREATE POLICY "bookings_owner_cancel"
  ON public.bookings
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  )
  WITH CHECK (
    -- Owner: only allowed to set status = 'cancelled'
    -- Admin: any status transition allowed
    (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
    OR (user_id = auth.uid() AND status = 'cancelled')
  );

-- Only admins can delete bookings (hard delete is discouraged; prefer cancel)
CREATE POLICY "bookings_admin_delete"
  ON public.bookings
  FOR DELETE
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- ─── availability_view: grant public SELECT ──────────────────
-- The view itself exposes no PII (see migration 001); allow anon reads
-- so the slot grid can show booked slots to unauthenticated visitors.
GRANT SELECT ON public.availability_view TO anon, authenticated;
