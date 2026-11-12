software — RestoSphere, ứng dụng vận hành nhà hàng hải sản cho Lễ tân và Phục vụ.

Hệ thống hiện có được tinh chỉnh bằng xanh biển trầm #14665F, mực xanh đậm #16323B,
nền sáng #F3F6F5 và kiểu chữ hệ thống. Giữ nguyên logo khách hàng. Màu hổ phách cho
việc chờ xử lý, xanh lá cho sẵn sàng/hoàn tất, đỏ cho lỗi/hủy; luôn đi cùng chữ và icon.

Yêu cầu người dùng ưu tiên mobile, thông tin dày vừa phải và không đổi nghiệp vụ.
Vì vậy không áp dụng hero, section toàn màn hình, palette ngẫu nhiên, shader,
WebGL, landing-page moments hoặc footer quảng bá của Taste vào màn hình thao tác.
Áp dụng nguyên tắc căn lề, phân cấp, copy rõ nghĩa, hình thật, phản hồi nhấn,
khả năng đọc và kiểm tra trực quan; tiếp tục dùng theme/component React Native.

Voice: Tiếng Việt, trực tiếp, ngắn, gọi đúng bàn/món/trạng thái; không dùng lời quảng cáo.

| Màn hình | Thông tin ưu tiên | Cách trình bày |
| --- | --- | --- |
| Lễ tân / Tổng quan | Khách chờ bàn giao, lịch cần xác nhận, khách sắp đến/trễ | Dải số liệu nhỏ, thao tác 48px, danh sách nhóm theo việc |
| Lễ tân / Bàn | Mã bàn, trạng thái vật lý, lịch giữ chỗ | Ô bàn gọn, vạch + icon + chữ, giờ giữ riêng, bộ lọc khu vực |
| Phục vụ / Tổng quan | Món cần mang, bàn cần nhận, bàn chờ thanh toán | Dải số liệu, hàng món có ảnh, danh sách bàn gọn |
| Phục vụ / Bàn | Bàn phụ trách, sẵn sàng, chờ bếp/thanh toán/dọn | Hàng bàn có mã lớn và việc tiếp theo |
| Tra cứu / Gọi món | Ảnh, tên, giá, thành phần, tình trạng bán | FlatList, ảnh 72px, tìm không dấu, nhóm món, chi tiết mở tại hàng |
| Thông báo | Chưa đọc, loại sự kiện, nội dung, thời gian | Danh sách liền, nền/độ đậm/vạch/chấm khác biệt, lọc chưa đọc |
| Cá nhân | Danh tính, vai trò, ca, thông tin tài khoản, lối tắt | Avatar chữ, native account List, hàng thao tác chung |
| Chi tiết / Lịch sử | Thao tác tiếp theo và thông tin liên quan | CTA trước ghi chú dài, bỏ bản ghi lặp, lịch sử nhấn cả hàng |

Ảnh: JPEG 320×320 đóng gói cục bộ, có fallback nếu thiếu/lỗi. Danh sách nguồn và
ảnh thật cần thay: assets/images/menu/CREDITS.md. Bốn món hải sản và giá mới là dữ
liệu demo, không phải xác nhận thực đơn thật. Migration chỉ thêm ID chưa có,
không thay đổi giá, tồn món, đơn, giỏ hoặc dữ liệu ca đã lưu.

Kiểm tra: Expo lint, TypeScript, toàn bộ unit tests; export web; smoke test nghiệp vụ
Chrome headless; ảnh 320/390/768/1024/1440 qua script Taste. Ghi rõ giới hạn
web/native và kết quả checker landing-page trong report.md.
