# System Architecture — Sân Bóng Nam Hiếu

## Tech Stack

| Layer | Technology | Ghi chú |
|-------|-----------|---------|
| Markup | HTML5 semantic | 8 trang + 3 partials |
| Styling | Tailwind CSS v4 | Utility-first, custom color tokens |
| Logic | Vanilla JS ESM | Không framework, module per page |
| Backend | Supabase (Postgres + Auth + RLS) | Cloud-hosted |
| Build | Tailwind CLI + inject-env.mjs | Không webpack/vite |
| Hosting | Netlify (tuỳ chọn) | Static CDN |

---

## Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────┐
│                      BROWSER                            │
│                                                         │
│  HTML Pages         JS Modules          CSS             │
│  ─────────          ──────────          ───             │
│  index.html  ──►  api.js (router)  ◄──  styles.css      │
│  fields.html       │                    (Tailwind out)  │
│  field.html        ├─► mock-api.js  (mock mode)         │
│  booking form      └─► supabase-api.js (real mode)      │
│  confirmation                │                          │
│  auth.html                   ▼                          │
│  admin.html          supabase-client.js                 │
│  my-bookings.html    (reads window.__ENV__)              │
└──────────────────────────────┼──────────────────────────┘
                               │ HTTPS / REST + WebSocket
                               ▼
┌──────────────────────────────────────────────────────────┐
│                    SUPABASE CLOUD                        │
│                                                         │
│  PostgreSQL          Auth              Storage           │
│  ──────────          ────              ───────           │
│  fields table        JWT tokens        (unused)          │
│  bookings table      email/password                      │
│  availability_view   user_metadata                       │
│                      {role: "admin"}                     │
│                                                         │
│  RLS Policies:                                          │
│  - fields: public SELECT, admin-only write              │
│  - bookings: owner SELECT/INSERT/UPDATE, admin ALL      │
└──────────────────────────────────────────────────────────┘
```

---

## Data Flow: Mock mode vs Real mode

```
                   ┌─────────────────┐
                   │   api.js        │  ← single entry point
                   │  (API router)   │
                   └────────┬────────┘
                            │
              window.__ENV__?.SUPABASE_URL?
                    /                 \
                 YES                   NO
                  /                     \
    ┌─────────────────────┐   ┌──────────────────────┐
    │   supabase-api.js   │   │    mock-api.js        │
    │  Real Supabase DB   │   │  In-memory + lStorage │
    │  JWT auth           │   │  Fake auth (any email)│
    │  RLS enforced       │   │  8 hardcoded fields   │
    └─────────────────────┘   └──────────────────────┘
```

---

## File Structure

```
d:/Projects/NAM HIEU/
├── README.md                     # Entry point cho recipient
├── LICENSE                       # MIT 2026
├── .env.example                  # Template cho env vars
├── .gitignore                    # Excludes env.js, styles.css, node_modules
├── netlify.toml                  # Build config + security headers
├── package.json                  # Scripts + devDependencies
│
├── public/                       # Site root (served as-is)
│   ├── index.html                # Trang chủ + hero + CTA
│   ├── about.html                # Giới thiệu dự án
│   ├── fields.html               # Danh sách sân (filter + grid)
│   ├── field.html                # Chi tiết sân + slot calendar + booking form
│   ├── confirmation.html         # Booking confirmation + VietQR mock
│   ├── auth.html                 # Login / signup
│   ├── admin.html                # Admin panel (3 tabs)
│   ├── my-bookings.html          # User booking history
│   ├── 404.html                  # Custom 404 page
│   ├── robots.txt                # Allow all crawlers
│   ├── sitemap.xml               # 8 main pages
│   ├── _headers                  # Netlify security headers
│   ├── _redirects                # Netlify 404 fallback
│   ├── env.js                    # GENERATED — gitignored (window.__ENV__)
│   │
│   ├── sports/
│   │   ├── football.html         # Sports info: bóng đá
│   │   ├── basketball.html       # Sports info: bóng rổ
│   │   └── tennis.html           # Sports info: tennis
│   │
│   ├── partials/
│   │   ├── header.html           # Shared nav header (loaded via layout-loader.js)
│   │   └── footer.html           # Shared footer
│   │
│   └── assets/
│       ├── styles.css            # GENERATED — gitignored (Tailwind output)
│       ├── images/               # 14 placeholder images (LoremFlickr CC-BY)
│       └── js/
│           ├── api.js            # API router: mock ↔ supabase
│           ├── mock-api.js       # Mock backend (localStorage)
│           ├── supabase-api.js   # Real Supabase backend
│           ├── supabase-client.js# Supabase JS client init
│           ├── fields-page.js    # Fields list page logic
│           ├── field-detail-page.js # Field detail + booking form
│           ├── confirmation-page.js # Confirmation + VietQR display
│           ├── auth-page.js      # Login/signup form logic
│           ├── admin-page.js     # Admin panel orchestrator
│           ├── admin-bookings.js # Admin: bookings tab
│           ├── admin-fields.js   # Admin: fields tab
│           ├── admin-users.js    # Admin: users tab
│           ├── my-bookings-page.js # Booking history + cancel
│           ├── email-notify.js   # Email notification (dev-mode)
│           ├── vietqr-mock.js    # VietQR QR display (mock)
│           ├── format-vn.js      # VN number/date formatters
│           ├── validators.js     # Form validation (phone, date, etc.)
│           ├── header-auth.js    # Auth state in header
│           └── layout-loader.js  # Loads partials via fetch
│
├── src/
│   └── styles/
│       └── input.css             # Tailwind CSS input + custom tokens
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql  # Tables: fields, bookings, availability_view
│   │   └── 002_rls_policies.sql    # Row-Level Security policies
│   └── seed.sql                    # 8 sample fields (HCM districts)
│
├── scripts/
│   └── inject-env.mjs            # Build: writes public/env.js from process.env
│
├── docs/                         # Tài liệu handover
│   ├── handover-guide.md         # ĐỌC ĐẦU TIÊN
│   ├── supabase-setup.md         # Hướng dẫn setup Supabase
│   ├── deployment-guide.md       # Deploy lên Netlify/Vercel (tuỳ chọn)
│   ├── system-architecture.md    # File này
│   ├── code-standards.md         # Quy ước code
│   ├── codebase-summary.md       # Mô tả từng file
│   ├── development-roadmap.md    # Lộ trình tương lai
│   ├── project-changelog.md      # Changelog
│   └── credits.md                # Attribution ảnh
│
└── tests/
    └── concurrency-test.md       # Thủ tục test double-booking
```

---

## Key Design Decisions

### 1. Contract-first API router (`api.js`)

Tất cả page modules gọi `api.js` — không gọi trực tiếp mock hay Supabase.
`api.js` kiểm tra `window.__ENV__.SUPABASE_URL` khi khởi động và delegate sang đúng implementation.
Kết quả: **zero UI change** khi chuyển mock ↔ real. Cùng một interface, hai implementations.

### 2. DB-level double-booking prevention

```sql
-- supabase/migrations/001_initial_schema.sql
CREATE UNIQUE INDEX bookings_slot_active_uniq
  ON bookings (field_id, slot_start)
  WHERE status != 'cancelled';
```

Partial UNIQUE index: cùng một (field_id, slot_start) không thể book 2 lần nếu không cancelled.
Concurrent requests: chỉ 1 INSERT thành công, cái còn lại nhận `23505 unique_violation`.

### 3. Env injection không cần bundler

`scripts/inject-env.mjs` chạy ở build time → tạo `public/env.js` → set `window.__ENV__`.
Browser đọc `window.__ENV__` trước khi load bất kỳ JS module nào.
Không cần webpack, vite, hay bundler — phù hợp với static hosting đơn giản.

### 4. Row-Level Security (RLS)

Anon key được expose public (trong `env.js`) — intentional, safe by Supabase design.
Bảo vệ dữ liệu dựa vào RLS policies trong Postgres, không phải ẩn key.
- User chỉ đọc/sửa booking của chính họ (kiểm tra `auth.uid() = user_id`)
- Admin (`user_metadata.role = 'admin'`) có full access
- Fields: public read (anon), write chỉ admin

### 5. Vietnamese-first

- Timezone: `Asia/Bangkok` (UTC+7) — tất cả display dates convert qua TZ này
- Phone: regex VN chuẩn `/(03|05|07|08|09|01[2|6|8|9])[0-9]{8}$/`
- Currency: `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`
- Dates: `dd/mm/yyyy` display, ISO8601 internal storage

---

## Security Model

| Threat | Mitigation |
|--------|-----------|
| Double booking race condition | Partial UNIQUE index + DB constraint |
| Unauthorized data access | Supabase RLS policies |
| Clickjacking | `X-Frame-Options: DENY` header |
| MIME sniffing | `X-Content-Type-Options: nosniff` |
| XSS via inline scripts | CSP `script-src 'self'` |
| Service-role key leak | `inject-env.mjs` detects + rejects service-role JWT |
| Sensitive data in repo | `.gitignore` excludes `env.js`, `.env.*` |
