# RestoSphere Staff · Demo Lễ tân

## Chạy và đăng nhập

```bash
npm ci
npm start
```

Mở bằng Expo Go tương thích SDK 58 trên iOS/Android. Đăng nhập bằng tài khoản
`receptionist`, mật khẩu `123456`. Đây là thông tin cố định chỉ dùng demo.
Không chọn vai trò trong giao diện. Không có màn hình của phục vụ, bếp, thu ngân
hoặc admin; thư mục route của các khu vực này (`src/app/waiter`, `cashier`,
`kitchen`, `admin`) đã được tạo sẵn.

## Phạm vi đã triển khai

| Khu vực | Màn hình và thao tác |
| --- | --- |
| Đăng nhập | Hiện/ẩn mật khẩu, lỗi thông tin đăng nhập, khôi phục phiên demo, protected routes |
| Tổng quan | Số liệu tính từ state, lịch chờ xác nhận, khách sắp đến, khách trễ, khách đã đến, thao tác nhanh |
| Đặt bàn | Danh sách theo ngày, ngày trước/sau/hôm nay, tìm tên không dấu/phone/mã, lọc trạng thái |
| Chi tiết | Thông tin khách, giờ, số lượng dự kiến/thực tế, bàn, nguồn, ghi chú, lịch sử và thao tác theo trạng thái |
| Form | Tạo qua điện thoại, sửa lịch, validation, kiểm tra khả năng tiếp nhận và bàn dự kiến |
| Gán/đổi bàn | Lý do từng bàn không phù hợp, chọn bàn, xác nhận bàn cũ/mới, kiểm tra lại khi lưu |
| Check-in | Tìm lịch đã xác nhận, số khách thực tế, thời điểm đến, cảnh báo sức chứa/lịch bàn, chặn check-in trùng |
| Khách trực tiếp | Tên/phone tùy chọn, chọn bàn sẵn sàng, tạo ARRIVED rồi tiếp tục bàn giao |
| Bàn giao | Kiểm tra đã đến, có bàn, sức chứa, trạng thái vật lý và xung đột từ giờ bắt đầu phục vụ thực tế |
| Bàn | Lọc khu vực, trạng thái, sức chứa; chi tiết khách đang dùng, lịch liên quan và khung giữ chỗ |
| Thông báo | Chưa đọc/đã đọc, đánh dấu tất cả đã đọc, mở lịch liên quan, tạo thông báo sau thao tác |
| Cá nhân | Thông tin nhân viên, ca demo, tài khoản, xác nhận đăng xuất |

Có đúng 4 tab: Tổng quan, Đặt bàn, Bàn, Cá nhân. Màn hình nghiệp vụ chi tiết
nằm trong Stack. Chuông ở header mở Thông báo. Các route nằm dưới `/reception`
(ví dụ `/reception/overview`). Màn hình rộng từ 1024px hiển thị 4 tab thành
sidebar bên trái; màn hình hẹp hơn giữ tab dưới.

## Chính sách mô phỏng

- PENDING chưa giữ chỗ. Có thể lưu chưa gán bàn khi vẫn có ít nhất một bàn phù hợp.
- Khi xác nhận, hệ thống giữ bàn dự kiến đã chọn hoặc tự chọn bàn phù hợp nhỏ nhất.
  Giao diện thông báo rõ chính sách này trước xác nhận; cách này tránh nhận quá
  khả năng khi chưa có bộ phân bổ sức chứa riêng của backend.
- Không ghép nhiều bàn. Bàn phải đủ cho toàn bộ nhóm khách.
- Mỗi lượt có thời lượng dự kiến và **15 phút đệm**. So sánh timestamp, bao gồm
  trường hợp qua nửa đêm. Lịch đã hủy/từ chối/không đến/kết thúc không chặn bàn.
- Bàn đang dọn chưa có thời điểm sẵn sàng nên không nhận thêm lịch vào bàn đó.
  Bàn tạm ngưng không được chọn. Bàn đang có khách chỉ nhận lịch tương lai sau
  thời gian dự kiến kết thúc cộng đệm; vẫn kiểm tra lại khi bàn giao thực tế.
- Khách đang ngồi quá giờ vẫn chặn nhận khách ngay. Lễ tân không được tự giải phóng
  bàn vật lý. Không có nút hoàn thành, checkout, thanh toán hoặc xác nhận đã dọn.
- Check-in ghi ARRIVED và số khách thực tế, không đổi bàn thành OCCUPIED.
  Số khách vượt sức chứa vẫn có thể được ghi nhận đã đến; phải đổi bàn trước bàn giao.
- Bàn giao kiểm tra lại khoảng sử dụng bắt đầu **ngay lúc thao tác**, để xử lý
  khách đến sớm/trễ. Sau bàn giao: SEATED + OCCUPIED, lượt chỉ được xem bởi lễ tân.
- NO_SHOW chỉ là thao tác thủ công sau **30 phút** chờ; phải nhập lý do.
  Hủy và từ chối cũng yêu cầu lý do và xác nhận.
- Khách trực tiếp bắt buộc chọn bàn có thể nhận ngay; không có bàn thì không tạo lượt.

## Dữ liệu và kiến trúc

`src/features/reservations/rules.ts` chứa validation và các quy tắc. `commands.ts`
kiểm tra quyền, trạng thái và điều kiện ngay khi thao tác rồi cập nhật một bản
state mới; lỗi không làm thay đổi state hiện tại. UI không tự đổi trạng thái bàn
hoặc lịch. `getReservationActions` quyết định các hành động theo role và trạng thái.

`AppProvider` giữ chung dữ liệu, phiên và đồng hồ cập nhật 15 giây/lần. Hàng đợi
lưu tuần tự tránh thao tác nhanh ghi đè dữ liệu mới bằng dữ liệu cũ. Repository
interfaces nằm trong `features/auth/types.ts` và `features/reservations/types.ts`;
bản demo của chúng nằm trong `src/mocks/`. Có thể thay adapter và command transport
khi tích hợp backend sau này.

AsyncStorage lưu dữ liệu demo và thông tin nhân viên; không lưu mật khẩu.
Protected stack chỉ mở khi phiên có role RECEPTIONIST. Đăng xuất xóa phiên khỏi
state và kho demo; Expo Router loại các màn hình được bảo vệ khỏi lịch sử.
Đây là phân quyền phía client cho demo, chưa phải xác thực bảo mật với server.

Dữ liệu được giữ qua lần mở lại trong cùng ngày. Khi mở lại vào ngày mới, bộ mẫu
được tạo lại theo ngày/giờ thiết bị để các tình huống không lỗi thời; giữ phiên
nhân viên nếu đang đăng nhập. Chưa hỗ trợ đồng bộ nhiều thiết bị.

Chỉ thêm `@expo/ui` và `@react-native-async-storage/async-storage` qua
`expo install`; giữ nguyên SDK. Dùng universal Picker và List của Expo UI,
datetime picker của Expo UI trên native, HTML date/time input trên web.
Danh sách đặt bàn, công việc, bàn và thông báo dùng FlatList/SectionList.
SafeAreaView và KeyboardAvoidingView bao quanh nội dung, form cuộn được.

## Kiểm tra tự động

```bash
npm run lint
npm run typecheck
npm test
npx expo export --platform all --output-dir .cache/staff-export
```

`npm test` biên dịch riêng business logic vào `.cache/tests` và dùng Node test
runner, không cần thêm test dependency. Test kiểm tra auth, quyền, tạo/sửa,
xác nhận, xung đột thời gian và sức chứa, assignment history, check-in, bàn giao,
NO_SHOW, hủy/từ chối, walk-in, Dashboard, tìm kiếm/bộ lọc, thông báo và khôi phục dữ liệu.

Lint, typecheck, unit test và export Android/iOS/web đã được chạy trong môi trường
phát triển. Giao diện web đã được chụp kiểm tra bằng Chrome headless ở độ rộng
điện thoại (390px), tablet (768px, 1024px) và desktop (1440px). Xuất bundle và
ảnh chụp web không tương đương chạy UI trên thiết bị iOS/Android thật.

## Checklist chạy thử trên iPhone và Android

1. Nhập sai mật khẩu, kiểm tra lỗi; nhập đúng và kiểm tra 4 tab.
2. Mở link `restospherefestaff://reception/reservations/r3` khi chưa đăng nhập: không lộ màn hình nội bộ.
3. Tạo lịch thiếu tên/số khách sai/ngày quá khứ/phone sai; kiểm tra lỗi rồi lưu lịch hợp lệ.
4. Xác nhận một yêu cầu chờ; kiểm tra số chờ trên Tổng quan và bàn giữ trong chi tiết bàn.
5. Tìm bằng tên không dấu, phone, mã; đổi ngày và lọc trạng thái; kiểm tra empty state.
6. Đổi bàn: bàn nhỏ/trùng giờ/đang dọn/tạm ngưng không chọn được và có lý do.
7. Check-in lịch đã xác nhận, tăng số khách vượt sức chứa; đổi bàn rồi bàn giao.
8. Kiểm tra trạng thái ARRIVED chưa chiếm bàn, SEATED chuyển bàn sang OCCUPIED.
9. Mở lại lịch SEATED: không có sửa/đổi bàn/hủy/check-in; không có checkout hoặc dọn bàn.
10. Thử lịch trễ ít hơn 30 phút và ít nhất 30 phút; chỉ lịch đủ điều kiện có NO_SHOW.
11. Tiếp nhận khách trực tiếp không tên/phone, chọn bàn và bàn giao; không có bàn thì không tiếp nhận.
12. Hủy lịch đã xác nhận và kiểm tra khung giữ bàn được giải phóng; từ chối yêu cầu chờ với lý do.
13. Mở thông báo, kiểm tra đúng lịch và trạng thái đã đọc; đánh dấu tất cả đã đọc.
14. Mở lại ứng dụng trong cùng ngày: phiên và thao tác đã lưu được khôi phục.
15. Đăng xuất rồi dùng Back/deep link: không vào được nội bộ. Route vai trò khác không tồn tại.
16. Kiểm tra notch/Dynamic Island, thanh home, bàn phím, cỡ chữ lớn và cuộn danh sách dài.

Các kiểm tra trực tiếp trên thiết bị ở checklist này **chưa được thực hiện** trong
phiên triển khai. Backend, push notification, nhận bàn của phục vụ, thanh toán và
cập nhật trạng thái dọn bàn nằm ngoài phạm vi.
