# Hướng dẫn Tiếp nhận (Handover Guide)

> ĐỌC FILE NÀY ĐẦU TIÊN trước khi xem bất kỳ tài liệu nào khác.

---

## Tóm tắt bàn giao

### Những gì đã có (shipped)

| Hạng mục | Trạng thái |
|----------|-----------|
| Giao diện đầy đủ (8 trang HTML + Tailwind v4) | ✅ hoàn chỉnh |
| Danh sách sân (8 sân, lọc giá/sức chứa) | ✅ hoàn chỉnh |
| Luồng đặt sân (chọn slot → form → xác nhận) | ✅ hoàn chỉnh |
| Validation VN (SĐT, VND, ngày dd/mm/yyyy) | ✅ hoàn chỉnh |
| Auth email/password (Supabase) | ✅ hoàn chỉnh |
| Chống double-booking (DB-level UNIQUE index) | ✅ hoàn chỉnh |
| Admin panel (3 tab: bookings, fields, users) | ✅ hoàn chỉnh |
| Lịch sử đặt sân + hủy sân | ✅ hoàn chỉnh |
| Mock mode (chạy không cần Supabase) | ✅ hoàn chỉnh |
| Email xác nhận | ⚠️ dev-mode (console.log + toast) |
| VietQR thanh toán | ⚠️ mock (QR mẫu + disclaimer) |
| Ảnh sân | ⚠️ placeholder (LoremFlickr CC-BY) |
| Deploy lên hosting | ➡️ tuỳ chọn (xem deployment-guide.md) |

### Những gì KHÔNG có (not included)

- Không có URL public / live demo (chạy local)
- Không có SMS notification
- Không có payment gateway thật (VNPay, Momo)
- Không có PWA / offline support
- Không có i18n tiếng Anh
- Không có multi-city / field owner onboarding

---

## Quick Start — Chạy local trong 5 bước

```bash
# 1. Clone
git clone https://github.com/Liamlenguyen/LeNguyenNamHieu.git
cd LeNguyenNamHieu

# 2. Install dependencies
npm install

# 3. Build CSS (bắt buộc — styles.css bị gitignore)
npm run build:css

# 4. Serve (chọn 1 trong 2 lệnh)
npx serve public
# hoặc
npx http-server public -p 3000

# 5. Mở trình duyệt
# http://localhost:3000  (hoặc port được in ra terminal)
```

Site chạy ở **mock mode** ngay lập tức — không cần Supabase.

---

## Mock mode vs Supabase mode

### Mock mode (mặc định)

- Không cần setup gì thêm
- 8 sân mẫu được hardcode trong `public/assets/js/mock-api.js`
- Bookings lưu trong `localStorage` của trình duyệt
- Auth giả lập: bất kỳ email/password nào đều hoạt động
- Dữ liệu mất khi xoá localStorage hoặc đổi trình duyệt

**Khi nào dùng:** Demo nhanh, phát triển UI, review code.

### Supabase mode (real backend)

- Cần tài khoản Supabase (free tier đủ dùng)
- Dữ liệu lưu trong Postgres thật
- Auth thật với JWT
- Double-booking được chặn ở DB level
- Email xác nhận vẫn là dev-mode (xem upgrade path bên dưới)

**Khi nào dùng:** Demo cho khách hàng / giáo viên, kiểm thử thực tế.

Setup chi tiết: [docs/supabase-setup.md](./supabase-setup.md)

---

## Kiểm tra tính năng

Sau khi site chạy, kiểm tra từng mục:

- [ ] **Trang chủ** — load không lỗi console
- [ ] **Danh sách sân** (`/fields.html`) — hiển thị 8 sân, filter hoạt động
- [ ] **Chi tiết sân** (`/field.html?id=1`) — slot grid 14 ngày hiển thị
- [ ] **Đặt sân** — chọn slot → điền form → submit → trang confirmation
- [ ] **Confirmation** (`/confirmation.html`) — booking ID, QR VietQR mock có disclaimer
- [ ] **Auth** (`/auth.html`) — đăng ký / đăng nhập (mock: bất kỳ email)
- [ ] **Admin** (`/admin.html`) — set `nh_mock_role=admin` trong localStorage
- [ ] **Lịch sử** (`/my-bookings.html`) — danh sách bookings, nút hủy

---

## Upgrade path — Từ dev-mode lên production

### Email xác nhận (hiện tại: console.log + toast)

**Vị trí code:** `public/assets/js/email-notify.js`

Để bật email thật:
1. Tạo tài khoản [Resend](https://resend.com) (free 3000 emails/tháng)
2. Verify domain của bạn trên Resend
3. Tạo Supabase Edge Function `send-booking-email`:

```typescript
// supabase/functions/send-booking-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { to, bookingId, fieldName, slot } = await req.json()
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'booking@yourdomain.com',
      to,
      subject: `Xác nhận đặt sân — ${fieldName}`,
      html: `<p>Booking #${bookingId}: ${fieldName} lúc ${slot}</p>`,
    }),
  })
  return new Response(JSON.stringify(await res.json()))
})
```

4. Trong `email-notify.js`, thay `console.log` bằng `fetch('/functions/v1/send-booking-email', ...)`
5. Set `RESEND_API_KEY` trong Supabase Edge Function secrets (không phải Netlify env)

### VietQR payment (hiện tại: QR mẫu)

**Vị trí code:** `public/assets/js/vietqr-mock.js`, `public/confirmation.html`

Để bật thanh toán thật:
1. Chọn cổng thanh toán: [SePay](https://sepay.vn) hoặc [VietQR.io](https://vietqr.io)
2. Đăng ký merchant account
3. Thay URL ảnh QR bằng QR được generate từ API với số tài khoản thật:
   ```
   https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-{TEMPLATE}.png?amount={AMOUNT}&addInfo={BOOKING_ID}
   ```
4. Implement webhook để nhận xác nhận thanh toán
5. Cập nhật booking status sau khi thanh toán xong

### Admin role (hiện tại: set thủ công)

**Cách set trong Supabase Dashboard:**
1. Dashboard → Authentication → Users
2. Click user cần nâng quyền
3. Edit → User Metadata → thêm: `{ "role": "admin" }`
4. Save

Để tự động hóa (nâng cấp): tạo Supabase Function trigger gán role khi user đăng ký với email whitelist.

### Ảnh placeholder (hiện tại: LoremFlickr CC-BY)

1. Chụp ảnh thật của các sân bóng
2. Hoặc mua license từ Shutterstock / Getty
3. Thay file trong `public/assets/images/`
4. Xoá `docs/credits.md` sau khi thay xong

---

## Giới hạn đã biết

| Hạn chế | Mô tả |
|---------|-------|
| Không có real payment | VietQR chỉ hiển thị QR mẫu + disclaimer |
| Không có SMS | Chưa tích hợp VNPT SMS / Twilio |
| Không có i18n | Giao diện tiếng Việt only |
| Không có PWA | Không offline, không push notification |
| Ảnh placeholder | CC-BY — cần thay trước khi dùng thương mại |
| Admin role thủ công | Không có trang onboarding admin |

---

## Troubleshooting FAQ

**`npm install` lỗi EACCES / permission denied**
- Windows: chạy terminal với quyền Administrator
- Mac/Linux: dùng `sudo npm install` hoặc fix npm prefix

**`npm run build:css` không tạo ra `styles.css`**
- Kiểm tra Tailwind CLI đã install: `npx tailwindcss --version`
- Xoá `node_modules` và chạy lại `npm install`

**Site hiển thị không có style (trang trắng / text thuần)**
- `public/assets/styles.css` chưa được build — chạy `npm run build:css`
- File bị gitignore nên không có sẵn trong repo

**`npx serve public` báo lỗi port đã dùng**
- Dùng port khác: `npx serve public -l 8080`

**Supabase: "window.__ENV__ is not defined"**
- `public/env.js` chưa được tạo — chạy `npm run dev:env` sau khi set env vars
- Hoặc bỏ qua: mock mode không cần env.js

**Supabase auth redirect về localhost:3000 bị lỗi**
- Dashboard → Authentication → URL Configuration
- Thêm `http://localhost:3000` vào Site URL
- Thêm `http://localhost:3000/**` vào Redirect URLs

**Admin panel trắng / không load**
- Mock mode: set `nh_mock_role=admin` trong localStorage (DevTools → Application → Local Storage)
- Supabase mode: set `user_metadata.role = "admin"` (xem hướng dẫn trên)

---

## Liên hệ

Lê Nguyễn Nam Hiếu — FX11106 — FUNiX (2021–2026)
