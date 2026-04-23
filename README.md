# Sân Bóng Nam Hiếu — Football Field Booking System

> Nền tảng đặt sân bóng đá / bóng rổ / tennis trực tuyến cho người dùng Việt Nam.
> Đồ án tốt nghiệp FUNiX của Lê Nguyễn Nam Hiếu (FX11106).

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind%20CSS%20v4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/Vanilla%20JS-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Vietnamese](https://img.shields.io/badge/Language-Vietnamese-red?style=flat)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

---

## Tính năng

- Danh sách sân theo quận (TP.HCM), lọc giá / sức chứa
- Đặt sân theo time-slot 90 phút (06:00–23:00), lịch 14 ngày
- Validation chuẩn VN (SĐT, VND, dd/mm/yyyy, Asia/Bangkok)
- Chống double-booking ở DB level (partial UNIQUE index)
- Xác thực email/password (Supabase Auth) + admin panel
- Thông báo email (dev-mode: console.log + toast) + VietQR thanh toán (mock)
- Lịch sử đặt sân + hủy sân
- **Mock mode:** chạy hoàn toàn không cần Supabase — 8 sân mẫu, bookings lưu localStorage

---

## Chạy locally (< 10 phút)

### Yêu cầu

- Node.js ≥ 20
- npm (đi kèm Node.js)

### Bước 1 — Clone & install

```bash
git clone https://github.com/Liamlenguyen/LeNguyenNamHieu.git
cd LeNguyenNamHieu
npm install
```

### Bước 2 — Build CSS

```bash
npm run build:css
```

Lệnh này tạo ra `public/assets/styles.css` từ Tailwind input.

### Bước 3 — Chạy site

```bash
npx serve public
# hoặc
npx http-server public -p 3000
```

Mở trình duyệt tại `http://localhost:3000` (hoặc port được in ra terminal).

**Mặc định chạy ở mock mode** — có 8 sân mẫu, bookings lưu trong localStorage. Không cần tài khoản Supabase.

### Bước 4 (tuỳ chọn) — Bật Supabase mode

Xem [docs/supabase-setup.md](./docs/supabase-setup.md) để kết nối database thật (~10 phút).

---

## Cấu trúc thư mục

```
public/                         # Site root (HTML + assets)
  index.html                    # Trang chủ
  about.html                    # Giới thiệu
  fields.html                   # Danh sách sân
  field.html                    # Chi tiết & đặt sân
  confirmation.html             # Xác nhận đặt sân
  auth.html                     # Đăng nhập / đăng ký
  admin.html                    # Admin panel
  my-bookings.html              # Lịch sử đặt sân
  sports/                       # Trang thông tin thể thao
  partials/                     # Header / footer dùng chung
  assets/
    styles.css                  # Tailwind output (generated — gitignored)
    images/                     # 14 ảnh placeholder (LoremFlickr CC-BY)
    js/                         # Toàn bộ client logic
src/styles/                     # Tailwind input CSS
supabase/                       # SQL migrations + seed data
scripts/                        # Build helpers (inject-env.mjs)
docs/                           # Tài liệu handover & setup
tests/                          # Thủ tục test thủ công
```

---

## Scripts

| Lệnh | Mô tả |
|------|-------|
| `npm run build:css` | Build Tailwind một lần |
| `npm run watch:css` | Watch mode cho development |
| `npm run dev` | Alias của `watch:css` |
| `npm run dev:env` | Inject `.env.local` vars vào `public/env.js` |
| `npm run build` | Build đầy đủ: inject env + build CSS |

---

## Tài liệu

| File | Nội dung |
|------|---------|
| [docs/handover-guide.md](./docs/handover-guide.md) | **ĐỌC ĐẦU TIÊN** — Tóm tắt bàn giao, mock vs real, upgrade path |
| [docs/supabase-setup.md](./docs/supabase-setup.md) | Setup Supabase từ đầu |
| [docs/deployment-guide.md](./docs/deployment-guide.md) | Deploy lên Netlify / Vercel (tuỳ chọn) |
| [docs/system-architecture.md](./docs/system-architecture.md) | Kiến trúc hệ thống |
| [docs/code-standards.md](./docs/code-standards.md) | Quy ước code |
| [docs/codebase-summary.md](./docs/codebase-summary.md) | Mô tả từng file |
| [docs/credits.md](./docs/credits.md) | Attribution ảnh placeholder |
| [docs/development-roadmap.md](./docs/development-roadmap.md) | Lộ trình tương lai |
| [docs/project-changelog.md](./docs/project-changelog.md) | Changelog |

---

## Tính năng dev-mode (giả lập)

| Tính năng | Trạng thái | Cách nâng cấp |
|-----------|-----------|---------------|
| Email xác nhận | console.log + toast UI | Thêm Resend API key + Edge Function |
| VietQR payment | QR mẫu + disclaimer | Thêm TK thật + SePay/VietQR.io verify |
| Admin role | Set thủ công trên Supabase dashboard | Xem [handover-guide](./docs/handover-guide.md) |
| Ảnh sân | LoremFlickr CC-BY (placeholder) | Thay bằng ảnh thật có bản quyền |

---

## Tác giả

**Lê Nguyễn Nam Hiếu** — FX11106 — FUNiX (2021–2026)

---

## License

MIT — xem [LICENSE](./LICENSE)
