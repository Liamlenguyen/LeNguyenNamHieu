# Concurrency Test: Double-Booking Prevention

**Type:** Manual test procedure (documented)
**Automated equivalent:** Deferred to Phase 06 (requires live Supabase project)
**Guard mechanism:** Partial UNIQUE index `bookings_slot_active_uniq` on `(field_id, slot_datetime) WHERE status IN ('pending','confirmed')`

---

## Purpose

Verify that two simultaneous booking attempts for the same `(field_id, slot_datetime)` result in exactly one success and one `SLOT_TAKEN` error — enforced at the database level, not the application level.

---

## Prerequisites

- Supabase project set up per `docs/supabase-setup.md`
- Site running locally with real backend (Supabase env vars configured)
- Two browser tabs open to the same field detail page (`/field.html?id=...`)
- Both tabs have the same date selected
- One available slot visible (not yet booked)

---

## Test Procedure

### Step 1 — Prepare both tabs

1. Open Tab A: `http://localhost:3000/field.html?id=<any-field-id>`
2. Open Tab B: same URL
3. In both tabs, select the **same date** and the **same available slot**
4. In both tabs, fill in the booking form:
   - Name: `Test User A` / `Test User B`
   - Phone: `0901234567`
   - Email: (optional)
5. Do **not** submit yet — have both tabs ready with the submit button visible

### Step 2 — Simultaneous submit

1. Focus Tab A
2. Quickly switch to Tab B
3. Press submit in Tab B, immediately switch back to Tab A and press submit
4. (For stricter test: use browser DevTools → Network throttling to slow one request)

### Step 3 — Observe results

Expected outcomes:
- **One tab** shows the confirmation page (`/confirmation.html?id=...`) — booking succeeded
- **The other tab** shows the red error banner:
  > "Khung giờ này đã được đặt. Vui lòng chọn khung giờ khác."
  And the slot grid refreshes automatically, showing that slot as "Đã đặt"

### Step 4 — Verify in Supabase Dashboard

1. Go to Supabase Dashboard → Table Editor → `bookings`
2. Filter by `field_id` and `slot_datetime` used in the test
3. **Expected:** Exactly **one row** with `status = 'pending'`
4. No duplicate rows for the same `(field_id, slot_datetime)` with active status

---

## Expected Error Flow (Technical)

```
Tab A INSERT bookings(field_id='X', slot_datetime='T', status='pending') → succeeds
Tab B INSERT bookings(field_id='X', slot_datetime='T', status='pending')
  → Postgres: ERROR 23505 unique_violation on bookings_slot_active_uniq
  → supabase-api.js: catches error.code === '23505'
  → throws { code: 'SLOT_TAKEN', message: 'Khung giờ này đã được đặt...' }
  → field-detail-page.js: shows slotErrorBanner, refreshes slot grid
```

---

## Edge Case: Cancelled Slot Becomes Available

If a booking is cancelled (status → `'cancelled'`), the partial index no longer
covers it, and the slot becomes bookable again:

1. Cancel the booking from Step 3 (Tab A) via the API or dashboard
2. Confirm the slot appears as "available" in the slot grid
3. New booking for that slot should succeed

This is intentional behaviour — the partial index only blocks `pending` and
`confirmed` bookings.

---

## Notes for Phase 06 Automation

A scripted version of this test would:
1. Use `supabase-js` with two separate client instances (simulating two users)
2. Call `Promise.all([createBooking(payload), createBooking(payload)])` for the same slot
3. Assert: exactly one resolves, one rejects with `{ code: 'SLOT_TAKEN' }`
4. Assert: `SELECT COUNT(*) FROM bookings WHERE field_id=X AND slot_datetime=T AND status IN ('pending','confirmed')` = 1

See `phase-06-testing.md` for implementation details.
