Sports Hub & Football Field Booking System
Dự án: Hệ thống thông tin thể thao và nền tảng hỗ trợ đặt sân trực tuyến.
Tác giả: Nam hieu - FX11106 (Funix)
1. Giới thiệu dự án (Project Overview)
Dự án được xây dựng nhằm cung cấp một nền tảng bưu chính điện tử cho những người yêu thích thể thao. Website không chỉ dừng lại ở việc cung cấp kiến thức chuyên sâu về các môn "Thể thao Vua" mà còn được thiết kế để mở rộng thành một hệ thống quản lý và đặt sân bóng đá (Football Field Booking) chuyên nghiệp.

Mục tiêu chính:

Số hóa thông tin các môn thể thao phổ biến: Bóng đá, Bóng rổ, Tennis.

Xây dựng giao diện thân thiện, dễ điều hướng cho người dùng cuối.

Chuẩn bị cấu trúc dữ liệu cho tính năng đặt lịch sân bãi.
2. Tính năng nổi bật (Key Features)
Dựa trên mã nguồn hiện tại, dự án đã hoàn thiện các tính năng cốt lõi sau:

Hệ thống điều hướng đa tầng (Multi-page Navigation): Kết nối mạch lạc từ trang chủ (index.html) đến các trang chi tiết (Details).

Cấu trúc Semantic HTML: Sử dụng các thẻ chuẩn như <header>, <main>, <footer>, <article>, và <figure> để tối ưu hóa SEO và cấu trúc trang.

Kho dữ liệu thể thao phong phú:

Football: Thông tin về FIFA, World Cup và các siêu sao như Messi, Ronaldo.

Basketball: Lịch sử bộ môn và các huyền thoại Kobe Bryant, Michael Jordan.

Tennis: Luật chơi và hệ thống giải Grand Slam (Wimbledon, US Open...).

Quản lý tài nguyên hình ảnh: Tích hợp hình ảnh minh họa cho từng nội dung cụ thể để tăng tính trực quan.
3. Công nghệ sử dụng (Tech Stack)
Ngôn ngữ chính: HTML5.

Cấu trúc: Semantic Web Design.

Công cụ phát triển: VS Code.

Quản lý phiên bản: GitHub.
4. Cấu trúc thư mục (Folder Structure)
Để đảm bảo code chạy đúng, cấu trúc thư mục được sắp xếp như sau:
├── index.html          # Cổng thông tin chính (Main Portal)
├── Details-1.html      # Chuyên trang Bóng đá & Booking
├── Details-2.html      # Chuyên trang Bóng rổ
├── Details-3.html      # Chuyên trang Tennis
├── images/             # Lưu trữ toàn bộ hình ảnh dự án (Goldenball, Messi,...)
└── README.md           # Tài liệu hướng dẫn dự án
5. Hướng dẫn sử dụng & Cài đặt
Sao chép mã nguồn: Tải toàn bộ file hoặc sử dụng lệnh git clone.

Kiểm tra hình ảnh: Đảm bảo thư mục images chứa đầy đủ các file ảnh như Goldenball.jpg, Ronaldo.jpg để giao diện hiển thị đúng.

Khởi chạy: Nhấp đúp chuột vào file index.html để mở trang web trên trình duyệt.
6. Lộ trình phát triển (Future Roadmap)
Để hoàn thiện hệ thống "Book football field" hoàn chỉnh, các bước tiếp theo bao gồm:

Giai đoạn 2: Tích hợp CSS (Sass/Tailwind) để làm đẹp giao diện và hỗ trợ hiển thị trên di động (Responsive).

Giai đoạn 3: Thêm Form đặt sân bằng JavaScript để ghi nhận thông tin khách hàng và giờ đặt.

Giai đoạn 4: Kết nối Database (Firebase/MySQL) để quản lý lịch trống của sân theo thời gian thực.
