-- ============================================================
-- Seed Data: Demo Fields
-- Project: Nam Hieu Booking System
-- Created: 2026-04-22
-- IMPORTANT: Run AFTER both migrations (001 and 002).
-- These records match the mock-api.js FIELDS array exactly
-- so the UI looks identical between mock and real backends.
-- ============================================================

-- Truncate to allow re-running idempotently (dev only)
TRUNCATE TABLE public.bookings CASCADE;
TRUNCATE TABLE public.fields CASCADE;

INSERT INTO public.fields
  (id, name, slug, location, district, city, capacity, price_per_hour_vnd, surface, image_url, description, is_active)
VALUES
  (
    'a1000001-0000-4000-8000-000000000001',
    'Sân bóng đá Nam Hiếu A',
    'san-bong-nam-hieu-a',
    '12 Nguyễn Thị Minh Khai, Phường Đa Kao',
    'Quận 1',
    'TP. Hồ Chí Minh',
    5,
    180000,
    'Cỏ nhân tạo',
    '/assets/images/san-bong.jpg',
    'Sân 5 người tiêu chuẩn, cỏ nhân tạo thế hệ mới, đèn LED chiếu sáng tốt, phù hợp thi đấu buổi tối.',
    true
  ),
  (
    'a1000001-0000-4000-8000-000000000002',
    'Sân bóng đá Nam Hiếu B',
    'san-bong-nam-hieu-b',
    '45 Võ Văn Tần, Phường 6',
    'Quận 3',
    'TP. Hồ Chí Minh',
    7,
    280000,
    'Cỏ nhân tạo',
    '/assets/images/the-football-king.jpg',
    'Sân 7 người rộng rãi, mặt cỏ chất lượng cao, có mái che chống nắng mưa, bãi giữ xe miễn phí.',
    true
  ),
  (
    'a1000001-0000-4000-8000-000000000003',
    'Sân bóng đá Bình Thạnh',
    'san-bong-binh-thanh',
    '78 Phan Văn Trị, Phường 10',
    'Bình Thạnh',
    'TP. Hồ Chí Minh',
    7,
    250000,
    'Cỏ tự nhiên',
    '/assets/images/messi.jpg',
    'Sân cỏ tự nhiên được chăm sóc kỹ, không khí thoáng mát, lý tưởng cho các trận giao hữu cuối tuần.',
    true
  ),
  (
    'a1000001-0000-4000-8000-000000000004',
    'Sân bóng đá Thủ Đức Arena',
    'san-bong-thu-duc-arena',
    '123 Võ Văn Ngân, Phường Bình Thọ',
    'Thủ Đức',
    'TP. Hồ Chí Minh',
    11,
    450000,
    'Cỏ nhân tạo',
    '/assets/images/ronaldo.jpg',
    'Sân 11 người chuẩn thi đấu, hệ thống đèn cao áp, khán đài mini, phù hợp tổ chức giải đấu.',
    true
  ),
  (
    'a1000001-0000-4000-8000-000000000005',
    'Sân bóng đá Tân Bình FC',
    'san-bong-tan-binh-fc',
    '56 Hoàng Văn Thụ, Phường 4',
    'Tân Bình',
    'TP. Hồ Chí Minh',
    5,
    160000,
    'Cỏ nhân tạo',
    '/assets/images/neymar.jpg',
    'Sân 5 người trung tâm Tân Bình, tiện di chuyển, có phòng thay đồ và dịch vụ cho thuê giày.',
    true
  ),
  (
    'a1000001-0000-4000-8000-000000000006',
    'Sân bóng đá Gò Vấp Sport',
    'san-bong-go-vap-sport',
    '90 Nguyễn Oanh, Phường 17',
    'Gò Vấp',
    'TP. Hồ Chí Minh',
    7,
    220000,
    'Cỏ nhân tạo',
    '/assets/images/goldenball.jpg',
    'Sân 7 người tại Gò Vấp, khuôn viên rộng, có căng-tin phục vụ nước uống và đồ ăn nhẹ.',
    true
  ),
  (
    'a1000001-0000-4000-8000-000000000007',
    'Sân bóng đá Quận 1 Premium',
    'san-bong-quan-1-premium',
    '5 Đinh Tiên Hoàng, Phường Bến Nghé',
    'Quận 1',
    'TP. Hồ Chí Minh',
    5,
    350000,
    'Cỏ nhân tạo cao cấp',
    '/assets/images/san-bong.jpg',
    'Sân premium trung tâm Quận 1, cỏ nhân tạo thế hệ 4, hệ thống điều hòa không khí, dịch vụ VIP.',
    true
  ),
  (
    'a1000001-0000-4000-8000-000000000008',
    'Sân bóng đá Thủ Đức Mini',
    'san-bong-thu-duc-mini',
    '200 Kha Vạn Cân, Phường Hiệp Bình Chánh',
    'Thủ Đức',
    'TP. Hồ Chí Minh',
    5,
    140000,
    'Cỏ nhân tạo',
    '/assets/images/the-football-king.jpg',
    'Sân 5 người giá rẻ khu vực Thủ Đức, phù hợp sinh viên và nhóm bạn trẻ.',
    true
  );

-- Verify
SELECT id, name, district, capacity, price_per_hour_vnd FROM public.fields ORDER BY name;
