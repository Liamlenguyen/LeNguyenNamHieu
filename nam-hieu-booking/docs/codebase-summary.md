# Codebase Summary — Sân Bóng Nam Hiếu

Per-file description of every source file in the repo.

---

## Root

| File | Mô tả |
|------|-------|
| `README.md` | Entry point: badges, quick start, scripts table, docs index |
| `LICENSE` | MIT license 2026, Le Nguyen Nam Hieu |
| `.env.example` | Template env vars — copy to `.env.local`, never commit |
| `.gitignore` | Excludes node_modules, env.js, styles.css, .env.* |
| `netlify.toml` | Netlify build config, security headers, asset cache rules |
| `package.json` | npm scripts (build:css, watch:css, dev, dev:env, build) + devDeps |

---

## public/ — Site root

| File | Mô tả |
|------|-------|
| `index.html` | Trang chủ: hero section, features grid, CTA đặt sân |
| `about.html` | Giới thiệu dự án và tác giả |
| `fields.html` | Danh sách 8 sân: filter giá/sức chứa, card grid |
| `field.html` | Chi tiết sân + calendar 14 ngày + booking form |
| `confirmation.html` | Xác nhận booking: ID, tóm tắt, VietQR mock, disclaimer |
| `auth.html` | Login / đăng ký email+password (Supabase Auth / mock) |
| `admin.html` | Admin panel: 3 tabs — bookings, fields, users |
| `my-bookings.html` | Lịch sử đặt sân của user + nút hủy |
| `404.html` | Trang lỗi 404 styled + link về trang chủ |
| `robots.txt` | Allow all crawlers |
| `sitemap.xml` | Danh sách 8 trang chính cho SEO |
| `_headers` | Netlify security headers (CSP, X-Frame, Cache-Control) |
| `_redirects` | Netlify: unknown routes → 404.html |
| `env.js` | **GENERATED** — gitignored. Sets `window.__ENV__` với Supabase creds |

## public/sports/

| File | Mô tả |
|------|-------|
| `football.html` | Thông tin bóng đá: FIFA, World Cup, players |
| `basketball.html` | Thông tin bóng rổ: NBA, legends |
| `tennis.html` | Thông tin tennis: Grand Slam, luật chơi |

## public/partials/

| File | Mô tả |
|------|-------|
| `header.html` | Shared navigation header (logo, nav links, auth state) |
| `footer.html` | Shared footer (links, copyright) |

## public/assets/

| File | Mô tả |
|------|-------|
| `styles.css` | **GENERATED** — gitignored. Tailwind compiled output |
| `images/*.jpg` | 14 placeholder images (LoremFlickr CC-BY, xem docs/credits.md) |

---

## public/assets/js/ — Client Logic

| File | Mô tả |
|------|-------|
| `api.js` | **API router** — kiểm tra `window.__ENV__` → delegate mock hoặc supabase |
| `mock-api.js` | Mock backend: 8 hardcoded fields, bookings trong localStorage |
| `supabase-api.js` | Real Supabase backend: cùng interface với mock-api.js |
| `supabase-client.js` | Khởi tạo Supabase JS client từ `window.__ENV__` |
| `fields-page.js` | Logic trang fields.html: load list, filter, render cards |
| `field-detail-page.js` | Logic trang field.html: slot calendar, booking form, submit |
| `confirmation-page.js` | Logic trang confirmation.html: hiển thị booking details, VietQR |
| `auth-page.js` | Logic trang auth.html: login/signup forms, error handling |
| `admin-page.js` | Orchestrator admin.html: tab switching, auth guard |
| `admin-bookings.js` | Admin tab 1: danh sách bookings, approve/reject/cancel |
| `admin-fields.js` | Admin tab 2: danh sách sân, edit status |
| `admin-users.js` | Admin tab 3: danh sách users |
| `my-bookings-page.js` | Logic trang my-bookings.html: load history, cancel booking |
| `email-notify.js` | Email notification — dev-mode: console.log + toast UI |
| `vietqr-mock.js` | VietQR display: generate QR URL mẫu + disclaimer text |
| `format-vn.js` | VN formatters: `formatVND()`, `formatDate()`, Asia/Bangkok TZ |
| `validators.js` | Form validators: VN phone regex, date range, required fields |
| `header-auth.js` | Auth state trong header: show/hide menu items theo login status |
| `layout-loader.js` | Load partials (header/footer) vào `data-partial` placeholders |

---

## src/styles/

| File | Mô tả |
|------|-------|
| `input.css` | Tailwind CSS input: `@import "tailwindcss"`, custom `@theme` tokens (pitch-* colors) |

---

## scripts/

| File | Mô tả |
|------|-------|
| `inject-env.mjs` | Build-time: đọc env vars → ghi `public/env.js`. Guard chống service-role key |

---

## supabase/

| File | Mô tả |
|------|-------|
| `migrations/001_initial_schema.sql` | Tables: `fields`, `bookings`. Views: `availability_view`. Partial UNIQUE index double-booking guard |
| `migrations/002_rls_policies.sql` | Row-Level Security: public read fields, owner-only bookings, admin all |
| `seed.sql` | 8 sân mẫu tại các quận HCM (Quận 1, 3, 5, 7, 10, Bình Thạnh, Tân Bình, Gò Vấp) |

---

## docs/

| File | Mô tả |
|------|-------|
| `handover-guide.md` | **ĐỌC ĐẦU TIÊN** — tóm tắt bàn giao, quick start, mock vs real, upgrade paths |
| `supabase-setup.md` | 10-step hướng dẫn setup Supabase từ đầu |
| `deployment-guide.md` | Deploy Netlify/Vercel/GitHub Pages (tuỳ chọn) |
| `system-architecture.md` | ASCII diagrams, data flow, file tree, design decisions |
| `code-standards.md` | Naming, JS patterns, Tailwind, commits, security |
| `codebase-summary.md` | File này — mô tả từng file |
| `development-roadmap.md` | Phase table (01–06 done) + future v1.1–v2.0 plans |
| `project-changelog.md` | v0.0.1 (legacy) → v1.0.0 (booking system) |
| `credits.md` | Attribution cho 14 placeholder images (LoremFlickr CC-BY) |

---

## tests/

| File | Mô tả |
|------|-------|
| `concurrency-test.md` | Thủ tục test thủ công double-booking (concurrent requests, race condition) |
