-- Migration 003: Payment columns for bookings (Phase 05C — VietQR mock)
-- Adds deposit_paid_vnd to track 50% deposit confirmation (trust-based MVP).
-- Real payment verification is out of scope; this column is set client-side.

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS deposit_paid_vnd INT DEFAULT 0
  CHECK (deposit_paid_vnd >= 0);

COMMENT ON COLUMN bookings.deposit_paid_vnd IS
  'Amount of deposit paid in VND (trust-based, not verified). '
  '0 = no deposit recorded. Set by client after "Đã chuyển khoản" click. '
  'Phase 05C — VietQR mock only.';
