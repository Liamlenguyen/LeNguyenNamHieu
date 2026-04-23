# Changelog — Sân Bóng Nam Hiếu

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/)

---

## [v1.0.0] — 2026-04-22

**Initial Football Field Booking System — FUNiX Graduation Project**

### Phase 01 — Foundation & Cleanup (`b0e0a98`)
- Restructured flat HTML repo into `public/`, `src/`, `docs/`, `scripts/` layout
- Created `feat/booking-system` branch for all development
- Added Tailwind CSS v4 toolchain (`package.json`, `tailwind.config`, `src/styles/input.css`)
- Moved legacy Detail pages into `public/sports/`
- Downloaded 13 placeholder images from LoremFlickr (CC-BY) + retained original `goldenball.jpg`
- Added `.gitignore`, `.env.example`

### Phase 02 — UI Modernization (`6c1fc15`)
- Redesigned all 6 pages with Tailwind utility classes
- Extracted shared `header.html` + `footer.html` partials loaded via `layout-loader.js`
- Implemented custom Tailwind color tokens (`pitch-*` green palette)
- Added Be Vietnam Pro font (Vietnamese diacritics support)
- Mobile-responsive layout (≥360px breakpoint)
- New pages: `auth.html`, `admin.html`, `my-bookings.html`, `confirmation.html`

### Phase 03 — Booking Core Frontend (`7ae0182`)
- Implemented `fields.html` with filter (price, capacity, district)
- Implemented `field.html` with 14-day slot calendar (90-min slots, 06:00–23:00)
- Implemented booking form with VN validators (phone, date, VND price)
- Implemented `confirmation.html` with booking summary
- Created mock API (`mock-api.js`) — localStorage persistence, 8 sample fields
- Created API router (`api.js`) — zero-change swap between mock and real
- VN formatting utilities (`format-vn.js`): `Intl.NumberFormat('vi-VN')`, Asia/Bangkok TZ
- Form validators (`validators.js`): VN phone regex, date range, required fields

### Phase 04 — Backend & Database (`631b90c`)
- Created Supabase SQL migrations:
  - `001_initial_schema.sql`: `fields`, `bookings` tables, `availability_view`, performance indexes
  - `002_rls_policies.sql`: RLS policies for public/owner/admin access
- Partial UNIQUE index `bookings_slot_active_uniq` for DB-level double-booking prevention
- `supabase-api.js`: real Supabase implementation matching mock-api.js interface
- `supabase-client.js`: reads `window.__ENV__` set by `inject-env.mjs`
- `scripts/inject-env.mjs`: build-time env injector (service-role key guard)
- `seed.sql`: 8 HCM-district fields with realistic data
- Auth flow: email/password via Supabase Auth + JWT
- `docs/supabase-setup.md` with 10-step setup guide

### Phase 05 — Admin & Enhancements (`1df78ef`, `b784c01`)
- Admin panel (`admin.html`) with 3 tabs: Bookings, Fields, Users
- Admin role detection via `user_metadata.role = 'admin'` (JWT check)
- `email-notify.js`: dev-mode email (console.log + UI toast, no SMTP)
- `vietqr-mock.js`: VietQR display with "Demo — không giao dịch thật" disclaimer
- `my-bookings.html`: booking history with cancel functionality
- `header-auth.js`: auth state reflected in shared header (show/hide menu items)

### Phase 06 — Handover & Docs (this release)
- Rewrote `README.md` from scratch (Vietnamese primary, badges, quick start ≤10 min)
- Added `LICENSE` (MIT 2026, Le Nguyen Nam Hieu)
- Created `docs/handover-guide.md` — mock vs real breakdown, upgrade paths
- Created `docs/deployment-guide.md` — Netlify/Vercel/GitHub Pages (optional)
- Created `docs/system-architecture.md` — ASCII diagrams, data flow, design decisions
- Created `docs/code-standards.md` — naming, JS patterns, Tailwind conventions
- Created `docs/development-roadmap.md` — phase table + v1.1–v2.0 future plans
- Created `docs/codebase-summary.md` — per-file descriptions
- Created `netlify.toml`, `public/_headers`, `public/_redirects`
- Created `public/404.html`, `public/robots.txt`, `public/sitemap.xml`
- Merged `feat/booking-system` → `main`, tagged `v1.0.0`

---

## [v0.0.1] — 2021 (Legacy)

Original static HTML blog (4 pages):
- `index.html` — Sports hub homepage
- `Details-1.html` — Football info
- `Details-2.html` — Basketball info
- `Details-3.html` — Tennis info

No CSS framework, no JavaScript, no backend. Preserved as sports info pages in `public/sports/`.
