# RestoSphere Mobile

Ứng dụng mobile của RestoSphere, xây dựng bằng **Expo SDK 58**, **React Native** và **TypeScript**, sử dụng **Expo Router** để điều hướng.

Hiện tại dự án có một màn hình hiển thị: **Giao diện mobile đã khởi tạo thành công**. Chưa cần cấu hình `.env`, API hay cơ sở dữ liệu để chạy.

## 1. Chuẩn bị môi trường

- **Git** để clone repository.
- **Node.js 22**, phiên bản **22.13.0 trở lên trong nhánh 22.x**, kèm npm. Có thể tải tại [nodejs.org](https://nodejs.org/).
- Nếu chạy trên điện thoại: cài [Expo Go](https://expo.dev/go) tương thích với **Expo SDK 58**.

Kiểm tra Node.js và npm sau khi cài:

```bash
node --version
npm --version
```

## 2. Clone và cài đặt

Nếu đã clone và đang mở terminal trong thư mục dự án, chỉ cần chạy `npm ci`.

```bash
git clone https://github.com/Vertex-Organization/restosphere-fe-mobile.git
cd restosphere-fe-mobile
npm ci
```

Dự án sử dụng **npm** và `package-lock.json`. Lệnh `npm ci` cài đúng các phiên bản đã được khóa trong repository.

## 3. Chạy dự án

### Trên điện thoại Android hoặc iPhone

Khởi động Expo:

```bash
npm start
```

Giữ terminal này mở trong khi phát triển, sau đó:

1. Kết nối máy tính và điện thoại vào cùng mạng Wi-Fi.
2. Android: mở Expo Go và quét mã QR trong terminal.
3. iPhone: dùng Camera quét mã QR, rồi mở bằng Expo Go.

Trên iPhone thật, Expo CLI trên máy tính và Expo Go cần đăng nhập **cùng tài khoản Expo**. Đăng nhập trên máy tính bằng lệnh sau, sau đó đăng nhập cùng tài khoản trong Expo Go:

```bash
npx expo login
```

Khi kết nối thành công, ứng dụng sẽ hiện dòng **Giao diện mobile đã khởi tạo thành công**.

### Trên trình duyệt

```bash
npm run web
```

Mở địa chỉ được hiển thị trong terminal nếu trình duyệt chưa tự mở. Cách này không cần điện thoại hoặc phần mềm giả lập.

### Trên máy giả lập

| Nền tảng | Chuẩn bị | Lệnh chạy |
| --- | --- | --- |
| Android | Cài Android Studio, tạo và mở Android Emulator | `npm run android` |
| iOS | Dùng macOS, cài Xcode và thiết lập iOS Simulator | `npm run ios` |

Trên Windows hoặc Linux, có thể dùng iPhone thật với Expo Go để xem ứng dụng iOS.

Nếu đã chạy `npm start`, có thể nhấn `a` để mở Android Emulator, `i` để mở iOS Simulator hoặc `w` để mở web. Nhấn `Ctrl + C` để dừng server.

## 4. Chỉnh sửa và kiểm tra code

Chỉnh nội dung màn hình tại `src/app/index.tsx`. Lưu file để xem thay đổi qua Fast Refresh.

Chạy các kiểm tra trước khi commit:

```bash
npm run lint
npm run typecheck
```

Khi cần thêm thư viện Expo hoặc React Native, dùng lệnh sau để Expo chọn phiên bản tương thích với SDK:

```bash
npx expo install TEN_THU_VIEN
```

## 5. Xử lý lỗi thường gặp

**Điện thoại không kết nối được:** kiểm tra lại Wi-Fi và quyền truy cập mạng của Node.js trong firewall. Nếu mạng chặn kết nối giữa các thiết bị, thử tunnel:

```bash
npm start -- --tunnel
```

**Expo Go báo SDK không tương thích:** kiểm tra phiên bản Expo Go hỗ trợ SDK 58 tại [trang tải Expo Go](https://expo.dev/go).

**Thay đổi chưa hiển thị hoặc gặp lỗi cache Metro:** dừng server, rồi chạy lại với cache mới:

```bash
npm start -- --clear
```

**`npm ci` báo Node.js không được hỗ trợ:** kiểm tra `node --version`, chuyển sang Node.js 22.13.0 trở lên trong nhánh 22.x rồi chạy lại `npm ci`.

## Cấu trúc dự án

```text
src/app/
  _layout.tsx       # Điều hướng và thanh trạng thái
  index.tsx         # Màn hình chính và style
assets/             # Icon ứng dụng
app.json            # Cấu hình Expo
package.json        # Dependency và các lệnh npm
package-lock.json   # Khóa phiên bản dependency
eslint.config.js    # Cấu hình lint
tsconfig.json       # Cấu hình TypeScript
```

Component, hook và tiện ích dùng chung khi bổ sung sau này đặt ngoài `src/app/`, vì thư mục này dành cho route và layout của Expo Router.

## Tài liệu tham khảo

- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/)
- [Thiết lập môi trường](https://docs.expo.dev/get-started/set-up-your-environment/)
- [Chạy ứng dụng và kết nối thiết bị](https://docs.expo.dev/get-started/start-developing/)
