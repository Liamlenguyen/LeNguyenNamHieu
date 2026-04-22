# Supabase Setup Guide — Nam Hieu Booking System

Step-by-step for the project recipient to connect a real Supabase backend.
Estimated time: 20–30 minutes.

---

## Prerequisites

- Node.js 20+ installed
- Project cloned and `npm install` done
- A free Supabase account (supabase.com)

---

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Organization: your personal org (or create one)
3. Name: `nam-hieu-booking`
4. Database password: choose a strong password (save it — needed for direct DB access)
5. Region: **Southeast Asia (Singapore)** — lowest latency for VN users
6. Click **Create new project** and wait ~2 minutes for provisioning

---

## Step 2: Run Migration 001 — Initial Schema

1. In Supabase Dashboard → **SQL Editor** → **New query**
2. Paste the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run** (Ctrl+Enter)
4. Verify: go to **Table Editor** — you should see `fields` and `bookings` tables

SQL summary (for reference — run the file, not this snippet):

```sql
-- Creates: fields, bookings tables
-- Creates: partial UNIQUE index bookings_slot_active_uniq (double-booking guard)
-- Creates: availability_view (public, no PII)
-- Creates: performance indexes
```

---

## Step 3: Run Migration 002 — RLS Policies

1. SQL Editor → **New query**
2. Paste contents of `supabase/migrations/002_rls_policies.sql`
3. Click **Run**
4. Verify: **Table Editor** → click `fields` → **RLS** tab → policies visible

SQL summary:
```sql
-- fields: public SELECT (anon), admin-only write
-- bookings: owner SELECT/INSERT/UPDATE(cancel), admin ALL
-- availability_view: public SELECT granted
```

---

## Step 4: Run Seed Data

1. SQL Editor → **New query**
2. Paste contents of `supabase/seed.sql`
3. Click **Run**
4. Verify: **Table Editor** → `fields` → should show 8 rows (HCM districts)

> Re-running seed.sql is safe — it TRUNCATEs first (dev only). In production,
> remove the TRUNCATE lines before re-running.

---

## Step 5: Enable Email Auth

1. Dashboard → **Authentication** → **Providers**
2. Find **Email** → toggle **Enable** (should be on by default)
3. Optional: disable **Confirm email** for faster local testing
   (Authentication → Settings → uncheck "Enable email confirmations")
4. Set **Site URL** to your local server: `http://localhost:3000` (or whatever port `npx serve` uses)

---

## Step 6: Get Your Credentials

1. Dashboard → **Project Settings** → **API**
2. Copy:
   - **Project URL** → `SUPABASE_URL` (looks like `https://xxxxxxxxxxxx.supabase.co`)
   - **anon / public** key → `SUPABASE_ANON_KEY` (long JWT string)
3. **DO NOT copy** the `service_role` key — it bypasses all RLS policies

---

## Step 7: Configure Local Environment

```bash
# In the project root:
cp .env.example .env.local

# Edit .env.local:
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
```

---

## Step 8: Inject Env and Build CSS

```bash
# Load .env.local into shell (bash/zsh):
export $(grep -v '^#' .env.local | xargs)

# Generate public/env.js (gitignored):
npm run dev:env

# Build Tailwind CSS:
npm run build:css
```

On Windows PowerShell:
```powershell
# Set env vars manually or use a tool like dotenv-cli
$env:SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
$env:SUPABASE_ANON_KEY="eyJhbGci..."
node scripts/inject-env.mjs
npm run build:css
```

---

## Step 9: Serve the Site Locally

The site is static HTML — serve the `public/` folder with any local server:

```bash
# Option A: npx serve (zero install)
npx serve public -p 3000

# Option B: Python
python -m http.server 3000 --directory public

# Option C: VS Code Live Server extension
# Right-click public/index.html → Open with Live Server
```

Open `http://localhost:3000` in your browser.

---

## Step 10: Verify Integration

Run through this smoke-test checklist:

- [ ] Home page loads with no console errors
- [ ] `/fields.html` shows 8 real fields from Supabase (not mock data)
- [ ] Click a field → slot grid loads for today's date
- [ ] Select an available slot → booking form appears
- [ ] Go to `/auth.html` → sign-up with a test email → check email for confirmation
- [ ] Sign in → booking form → submit → confirmation page with real booking ID
- [ ] Open Supabase Dashboard → Table Editor → `bookings` → verify row exists
- [ ] Try booking the same slot in a second tab → should get "Khung giờ này đã được đặt" error

---

## Setting Admin Role (Optional)

To access admin features (update/delete bookings from dashboard):

1. Supabase Dashboard → **Authentication** → **Users**
2. Click your user → **Edit** → set `user_metadata`:
   ```json
   { "role": "admin" }
   ```
3. The RLS policies check `auth.jwt() ->> 'role' = 'admin'`

---

## Netlify Deployment (Phase 06)

Add these as environment variables in Netlify:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Add a build command in `netlify.toml`:
```toml
[build]
  command = "npm run build"
  publish = "public"
```

The `npm run build` script runs `inject-env.mjs` first, then builds CSS.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Fields list empty, no errors | RLS `fields_public_read` policy missing | Re-run migration 002 |
| "Booking not found" after submit | RLS blocks anon INSERT | Ensure user is logged in |
| 23505 error on first booking | Partial index OK — slot already booked | Expected behaviour — UI shows SLOT_TAKEN |
| `supabase-client.js` throws | `public/env.js` missing or wrong values | Re-run `npm run dev:env` with correct env vars |
| Console: "window.__ENV__ is not defined" | `<script src="/env.js">` missing from HTML | Check HTML head section |
