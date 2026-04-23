# Development Roadmap — Sân Bóng Nam Hiếu

## Phiên bản hiện tại: v1.0.0 (2026-04-22)

### Phase Status

| # | Phase | Mô tả | Status | Effort |
|---|-------|-------|--------|--------|
| 01 | Foundation & Cleanup | Restructure repo, Tailwind setup, branch | ✅ done | 2.5h |
| 02 | UI Modernization | Tailwind redesign, partials, responsive | ✅ done | 7h |
| 03 | Booking Core (Frontend) | Field list, slot grid, booking form, VN validators | ✅ done | 9h |
| 04 | Backend & Database | Supabase schema, RLS, auth, mock↔real router | ✅ done | 11h |
| 05 | Admin & Enhancements | Admin panel, email dev-mode, VietQR mock, history | ✅ done | 7h |
| 06 | Handover & Docs | README, LICENSE, docs, deploy configs | ✅ done | 3.5h |

**Total effort:** ~40h

---

## Lộ trình tương lai

### v1.1 — Real Integrations (ưu tiên cao)

- [ ] **Email thật** — Tích hợp Resend API + Supabase Edge Function
  - Gửi email xác nhận khi booking thành công
  - Gửi email nhắc nhở 2h trước giờ đặt
- [ ] **VietQR thật** — Tích hợp SePay hoặc VietQR.io
  - QR với số tài khoản thật
  - Webhook xác nhận thanh toán
  - Tự động cập nhật booking status sau khi thanh toán
- [ ] **Ảnh thật** — Thay LoremFlickr bằng ảnh có bản quyền
  - Chụp ảnh thật của các sân
  - Hoặc dùng Unsplash/Pexels với license rõ ràng

### v1.2 — Mobile & Notifications

- [ ] **PWA** — Progressive Web App
  - Service Worker cho offline viewing
  - Web Push Notifications (nhắc nhở đặt sân)
  - Add to Home Screen
- [ ] **SMS notifications** — Tích hợp VNPT SMS hoặc Twilio
  - Xác nhận SMS khi đặt sân thành công
  - OTP đăng nhập qua SĐT

### v1.3 — Analytics & i18n

- [ ] **Analytics** — Plausible hoặc Umami (privacy-friendly, GDPR-safe)
  - Tracking pages views, booking funnel
  - Không dùng Google Analytics (quá nặng)
- [ ] **i18n** — Hỗ trợ tiếng Anh
  - Language toggle (VI / EN)
  - Chuỗi dịch trong `locales/vi.json`, `locales/en.json`

### v1.4 — Scale & Onboarding

- [ ] **Multi-city** — Mở rộng ra Hà Nội, Đà Nẵng
  - Filter theo thành phố
  - Timezone handling cho mỗi thành phố
- [ ] **Field owner onboarding** — Chủ sân tự đăng ký
  - Dashboard riêng cho chủ sân
  - Quản lý lịch trống, giá theo giờ/ngày
  - Báo cáo doanh thu

### v2.0 — Payments & Loyalty

- [ ] **Payment gateway thật** — VNPay hoặc Momo
  - Thanh toán online đầy đủ
  - Refund flow khi hủy sân
- [ ] **Recurring bookings** — Đặt sân định kỳ
  - Đặt hàng tuần (vd: thứ 5, 18:00–19:30 mỗi tuần)
  - Discount cho lịch cố định
- [ ] **Loyalty points** — Tích điểm đổi quà
  - Điểm cho mỗi booking
  - Đổi điểm lấy discount hoặc giờ miễn phí

---

## Notes

- Mỗi tính năng tương lai nên có plan folder riêng: `plans/YYMMDD-HHMM-feature-name/`
- Ưu tiên v1.1 (real email + VietQR) trước khi bất kỳ real-money transaction nào
- PWA nên implement trước multi-city (mobile users là đa số ở VN)
