# Module Order / Waiter

Kind: software — ứng dụng nội bộ Expo / React Native, ưu tiên điện thoại.

Thiết kế: giữ palette đỏ `#AE1824`, nền `#F7F5F1`, font hệ thống và component hiện có. Màu đỏ theo logo RestoSphere. Brief yêu cầu màn hình nghiệp vụ gọn, nên không áp dụng hero marketing, hiệu ứng, ảnh minh họa, shader hay animation trang trí của skill website.

Voice: tiếng Việt nghiệp vụ, câu ngắn; dùng nhất quán bàn giao, tiếp nhận, gửi bếp, đã phục vụ, yêu cầu thanh toán, khách đã rời, đã dọn.

## Kiến trúc

- Một `AppProvider` và một bản lưu AsyncStorage cho lễ tân lẫn phục vụ.
- `TableSession` tham chiếu bàn và reservation hiện có. Bàn giao của lễ tân tạo session chờ tiếp nhận trong cùng transaction.
- Orders là các lượt gọi; items giữ giá tại lúc gửi. Draft gắn với lượt phục vụ và nhân viên, tách khỏi món đã gửi.
- Commands kiểm tra vai trò, permission, quyền phụ trách và trạng thái trước mọi thay đổi.
- Thanh toán xong giữ bàn OCCUPIED. Khách rời mới chuyển CLEANING; dọn xong kết thúc reservation, giải phóng assignment và chuyển AVAILABLE nếu không có ràng buộc khác.
- Dữ liệu demo cũ được nâng cấp tại chỗ; không tạo bản sao bàn hoặc đơn hàng trong store khác.

## Màn hình

1. Tổng quan: tên, ca, số liệu công việc, bàn chờ, món sẵn sàng, thanh toán, bàn đang phục vụ.
2. Bàn: tìm kiếm, bộ lọc, thông tin bàn và số món chưa phục vụ.
3. Chi tiết bàn: khách, bàn giao, món, tổng tiền, hành động hợp lệ.
4. Thực đơn: tìm không dấu, danh mục, trạng thái bán, thêm nhanh, giỏ cố định cuối màn hình.
5. Giỏ món: số lượng, ghi chú, xóa, kiểm tra trước gửi, lượt mới.
6. Tiến độ: lọc trạng thái; chỉ món READY có thao tác phục vụ.
7. Món sẵn sàng: chỉ món của nhân viên hiện tại.
8. Thanh toán: tổng tiền từ món chưa hủy; yêu cầu chỉ khi đã phục vụ hết và không còn draft.
9. Kết thúc: xác nhận khách thực sự rời và xác nhận dọn riêng biệt.
10. Thông báo: sự kiện theo quyền, đánh dấu đã đọc, điều hướng.
11. Lịch sử: lượt đã hoàn tất của nhân viên.
12. Cá nhân: thông tin nhân viên, lịch sử, đăng xuất.

## Tài liệu API đã đối chiếu

- https://docs.expo.dev/versions/v58.0.0/
- https://docs.expo.dev/llms.txt
- https://docs.expo.dev/versions/v58.0.0/sdk/router/
- https://docs.expo.dev/router/advanced/protected/
- https://docs.expo.dev/router/advanced/tabs/
- https://docs.expo.dev/versions/v58.0.0/sdk/ui/

Thông tin nhân viên, menu, giá và lượt phục vụ bổ sung là dữ liệu mô phỏng theo brief. Không dùng ảnh thay thế hoặc bịa thông tin kinh doanh thật.

## Chạy và dùng thử

`npm start` hoặc `npm run web`. Đăng nhập `waiter` / `123456`; `waiter2` / `123456` dùng kiểm tra quyền phụ trách. Lễ tân tiếp tục dùng `receptionist` / `123456`.

Với dữ liệu mới: A03 chờ tiếp nhận; B04 có món đang chế biến, READY, SERVED và SUBMITTED; G04 chờ thu ngân; G05 đã thanh toán nhưng khách còn tại bàn; A04 đang dọn; G01 có lượt lịch sử. B04/G04/G05 là các bàn mock bổ sung trong cùng danh sách bàn dùng chung, không lấy mất bàn trống của fixture lễ tân cũ.

Với dữ liệu đã lưu từ phiên bản lễ tân: giữ nguyên bàn và lịch đặt, bổ sung menu và chuyển các bàn đã bàn giao thành session chờ nhận. Không ghi đè dữ liệu cũ bằng toàn bộ các tình huống mẫu mới. Dữ liệu demo được reseed vào lần mở app trong ngày mới theo chính sách đã có.

## Mô phỏng bếp / thu ngân

Trong bản development: **Cá nhân → Công cụ kiểm thử luồng mô phỏng**. Phát từng sự kiện bếp tiếp nhận → món hoàn thành; quay lại Món sẵn sàng hoặc Tiến độ để xác nhận phục vụ. Với yêu cầu thanh toán, phát sự kiện thu ngân đã thanh toán rồi quay lại xác nhận khách rời và dọn bàn. Có thể phát bếp từ chối món chưa chế biến kèm lý do hết nguyên liệu.

Công cụ không nằm trên màn công việc chính, không có timer và không tự chạy theo thao tác mở màn hình. Cả route lẫn phương thức store đều khóa công cụ khi `__DEV__` là false. Không có nút PAID, PREPARING hoặc READY trong API thao tác WAITER. Khi tích hợp backend, thay mock event adapter bằng sự kiện server và kiểm tra lại quyền ở server.

Chính sách thanh toán demo: phải có ít nhất một món chưa hủy, tất cả món hợp lệ đã SERVED, không còn draft. Sau yêu cầu, không có quyền mở lại hóa đơn trong module này; liên hệ quy trình thu ngân/quản lý khi tích hợp thật.

## Kiểm thử tự động

```bash
npm test
npm run lint
npm run typecheck
npx expo export --platform web --output-dir .cache/waiter-web
npx expo serve .cache/waiter-web --port 8094
```

Trong terminal khác, Node 22+ và Chrome/Edge:

```bash
node tests/waiter-web.mjs
```

Để thử cả công cụ phát sự kiện trên Web development, khởi động `npx expo start --web --port 8096`, rồi chạy trong PowerShell:

```powershell
$env:WAITER_TEST_URL = 'http://127.0.0.1:8096'
node tests/waiter-web.mjs --development
```

Script dùng profile trình duyệt riêng trong OS temp, không đụng phiên trình duyệt cá nhân. `tests/waiter-preview.mjs` là proxy riêng ở 8093 để chụp giao diện bằng fixture đăng nhập và giỏ nháp; cần bản production trên 8094 và đã chạy `npm test`. Proxy không nằm trong sản phẩm.

Kết quả đã chạy và các giới hạn của checker thiết kế được ghi trong [báo cáo kiểm tra](waiter-qa.md). Ảnh tham khảo: [320px](waiter-ui/overview-320.png), [thực đơn](waiter-ui/menu.png), [giỏ món](waiter-ui/cart.png), [kết thúc phục vụ](waiter-ui/finish.png).
