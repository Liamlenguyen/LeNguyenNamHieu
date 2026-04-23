-- ============================================================
-- Migration 001: Initial Schema
-- Project: Nam Hieu Booking System
-- Created: 2026-04-22
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
-- uuid-ossp is available on Supabase by default
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Tables ──────────────────────────────────────────────────

-- fields: sports field catalogue
CREATE TABLE IF NOT EXISTS public.fields (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                text NOT NULL,
  slug                text NOT NULL UNIQUE,
  location            text NOT NULL,
  district            text NOT NULL,
  city                text NOT NULL DEFAULT 'TP. Hồ Chí Minh',
  capacity            integer NOT NULL CHECK (capacity IN (5, 7, 11)),
  price_per_hour_vnd  integer NOT NULL CHECK (price_per_hour_vnd > 0),
  surface             text NOT NULL,
  image_url           text NOT NULL DEFAULT '/assets/images/san-bong.jpg',
  description         text,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.fields IS 'Sports field catalogue. All timestamps in UTC; display in Asia/Bangkok (UTC+7).';
COMMENT ON COLUMN public.fields.price_per_hour_vnd IS 'Base price per hour in VND (no decimal). Peak-hour multiplier applied at API layer.';

-- bookings: individual booking records
CREATE TABLE IF NOT EXISTS public.bookings (
  id                       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name                text NOT NULL,
  user_phone               text NOT NULL
                           CHECK (user_phone ~ '^(0|\+84)(3|5|7|8|9)[0-9]{8}$'),
  user_email               text,
  user_note                text,
  field_id                 uuid NOT NULL REFERENCES public.fields(id) ON DELETE RESTRICT,
  -- slot_datetime: UTC ISO timestamp of slot start (UTC+7 offset applied at insert)
  slot_datetime            timestamptz NOT NULL,
  duration_min             integer NOT NULL DEFAULT 90
                           CHECK (duration_min = 90),
  total_vnd                integer NOT NULL CHECK (total_vnd > 0),
  status                   text NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','confirmed','cancelled','completed','no_show')),
  note                     text,
  -- cancellation_deadline: computed as slot_datetime - 24h; enforced server-side
  cancellation_deadline    timestamptz NOT NULL
                           GENERATED ALWAYS AS (slot_datetime - INTERVAL '24 hours') STORED,
  created_at               timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.bookings IS 'Booking records. Double-booking prevented by partial UNIQUE index on (field_id, slot_datetime) WHERE status is active.';
COMMENT ON COLUMN public.bookings.slot_datetime IS 'UTC start time of the booked slot. e.g. 18:00 Asia/Bangkok = 11:00 UTC stored here.';
COMMENT ON COLUMN public.bookings.user_phone IS 'Vietnamese phone number; validated by CHECK constraint at DB level.';

-- ─── Double-booking guard (THE critical constraint) ───────────
-- Partial UNIQUE index: only one active (pending/confirmed) booking
-- per (field_id, slot_datetime) at any time.
-- Concurrent inserts that hit the same key trigger error code 23505.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_slot_active_uniq
  ON public.bookings (field_id, slot_datetime)
  WHERE status IN ('pending', 'confirmed');

COMMENT ON INDEX public.bookings_slot_active_uniq IS 'DB-level double-booking guard. Concurrent second INSERT throws 23505 (unique_violation). Cancelled bookings free the slot.';

-- ─── Performance Indexes ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS bookings_user_idx
  ON public.bookings (user_id);

CREATE INDEX IF NOT EXISTS bookings_field_dt_idx
  ON public.bookings (field_id, slot_datetime);

CREATE INDEX IF NOT EXISTS fields_district_active_idx
  ON public.fields (district, is_active);

-- ─── Availability view (public — leaks no PII) ───────────────
-- Used by slot grid to check booked status without exposing who booked.
CREATE OR REPLACE VIEW public.availability_view AS
  SELECT
    field_id,
    slot_datetime,
    status
  FROM public.bookings
  WHERE status IN ('pending', 'confirmed');

COMMENT ON VIEW public.availability_view IS 'Public view exposing only (field_id, slot_datetime, status) — no PII. Used by slot grid.';
