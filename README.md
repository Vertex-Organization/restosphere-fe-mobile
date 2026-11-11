# RestoSphere Staff

Ứng dụng dành cho nhân viên RestoSphere, xây dựng bằng **Expo SDK 58**, **React Native** và **TypeScript**, sử dụng **Expo Router** để điều hướng. Một codebase chạy trên điện thoại, tablet (iOS/Android) và trình duyệt desktop: màn hình hẹp dùng tab dưới, màn hình rộng từ 1024px (desktop, tablet ngang) dùng sidebar bên trái.

Mỗi vai trò có khu vực làm việc riêng: **Lễ tân** (`/reception`), **Phục vụ/Order** (`/waiter`), **Thu ngân** (`/cashier`), **Bếp** (`/kitchen`) và **Admin** (`/admin`). Hiện đã có module **Lễ tân** với đăng nhập nhân viên, đặt bàn, quản lý lịch và bàn, check-in, tiếp nhận khách trực tiếp, bàn giao, thông báo và hồ sơ. Các khu vực còn lại mới có thư mục, chưa có màn hình. Toàn bộ nghiệp vụ sử dụng dữ liệu mô phỏng lưu cục bộ; không cần `.env`, API hay cơ sở dữ liệu.

Đăng nhập demo: tài khoản **`receptionist`**, mật khẩu **`123456`**. Xem [hướng dẫn dùng thử, chính sách và kiểm thử](docs/reception-demo.md).

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
git clone https://github.com/Vertex-Organization/restosphere-fe-staff.git
cd restosphere-fe-staff
npm ci
```

Dự án sử dụng **npm** và `package-lock.json`. Lệnh `npm ci` cài đúng các phiên bản đã được khóa trong repository.

### Biến môi trường (tùy chọn)

Sao chép `.env.example` thành `.env` tại thư mục gốc. Trên PowerShell:

```powershell
Copy-Item .env.example .env
```

`EXPO_PUBLIC_API_URL` đang để trống, dành cho lúc tích hợp backend; ứng dụng demo hiện chưa đọc biến này. `.env` và các biến thể môi trường được Git bỏ qua; `.env.example` được giữ trong repository.

Theo [tài liệu Expo về biến môi trường](https://docs.expo.dev/guides/environment-variables/), các biến có tiền tố `EXPO_PUBLIC_` được đưa vào mã ứng dụng khi sử dụng. Chỉ dùng chúng cho cấu hình công khai, không chứa mật khẩu, token bí mật hoặc khóa riêng tư.

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

Khi kết nối thành công, ứng dụng sẽ hiện màn hình **Đăng nhập nhân viên**. Sau đăng nhập, bạn có thể thử các luồng Lễ tân bằng dữ liệu mẫu theo ngày hiện tại.

### Trên trình duyệt

```bash
npm run web
```

Mở địa chỉ được hiển thị trong terminal nếu trình duyệt chưa tự mở. Cách này không cần điện thoại hoặc phần mềm giả lập. Cửa sổ rộng từ 1024px hiển thị giao diện desktop với sidebar; thu hẹp cửa sổ để xem giao diện điện thoại.

### Trên máy giả lập

| Nền tảng | Chuẩn bị | Lệnh chạy |
| --- | --- | --- |
| Android | Cài Android Studio, tạo và mở Android Emulator | `npm run android` |
| iOS | Dùng macOS, cài Xcode và thiết lập iOS Simulator | `npm run ios` |

Trên Windows hoặc Linux, có thể dùng iPhone thật với Expo Go để xem ứng dụng iOS.

Nếu đã chạy `npm start`, có thể nhấn `a` để mở Android Emulator, `i` để mở iOS Simulator hoặc `w` để mở web. Nhấn `Ctrl + C` để dừng server.

## 4. Chỉnh sửa và kiểm tra code

Routes và layout nằm tại `src/app/`, chia theo khu vực vai trò (`src/app/reception/`…). Màn hình và nghiệp vụ nằm tại `src/features/`, chia theo domain để các vai trò dùng chung (xem [Cấu trúc dự án](#cấu-trúc-dự-án)). Lưu file để xem thay đổi qua Fast Refresh.

Chạy các kiểm tra trước khi commit:

```bash
npm run lint
npm run typecheck
npm test
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
src/
  app/                    # Expo Router: chỉ chứa route và layout
    _layout.tsx           # Provider, chặn route theo vai trò (Stack.Protected)
    index.tsx             # Chuyển nhân viên tới khu vực của vai trò
    login.tsx, +html.tsx, +not-found.tsx
    reception/            # Lễ tân: /reception/... (4 tab + màn hình chi tiết)
    waiter/               # Phục vụ/Order: /waiter/...   (chuẩn bị sẵn)
    cashier/              # Thu ngân: /cashier/...       (chuẩn bị sẵn)
    kitchen/              # Bếp: /kitchen/...            (chuẩn bị sẵn)
    admin/                # Admin: /admin/...            (chuẩn bị sẵn)
  features/               # Nghiệp vụ theo domain, dùng chung giữa các vai trò
    auth/                 # Vai trò, nhân viên, đăng nhập, trang cá nhân
    reservations/         # Đặt bàn: types, labels, rules, commands, components, screens
    tables/               # Bàn: types, labels, components, screens
    notifications/        # Thông báo
  components/
    ui/                   # Button, Field, Select, DateField, ConfirmDialog… (mỗi component một file)
    layout/               # Screen, WorkspaceTabs (tab dưới/sidebar), WorkspaceHeader
    brand-logo.tsx
  hooks/                  # use-wide-layout: nhận biết màn hình rộng
  mocks/                  # Dữ liệu demo, lưu cục bộ, đăng nhập giả (thay bằng API khi có backend)
  store/                  # Context state, phiên đăng nhập và hàng đợi lưu
  utils/                  # Hàm ngày giờ và tìm kiếm không dấu
  theme.ts                # Màu, bo góc, chữ, kích thước layout
tests/                    # Unit test nghiệp vụ bằng Node test runner
assets/                   # Icon ứng dụng
app.json                  # Cấu hình Expo
```

Quy ước:

- `src/app/` chỉ chứa route; mỗi file route chỉ re-export màn hình từ `src/features/`.
- Import trong file giao diện (`.tsx`) dùng alias `@/` (ví dụ `@/components/ui`). File nghiệp vụ thuần (`types`, `labels`, `rules`, `commands`, `mocks`, `utils`) dùng import tương đối để `npm test` chạy được bằng Node.
- Thành phần UI dùng chung không phụ thuộc state; thành phần cần state đặt trong `components/layout/` hoặc trong feature.

### Thêm khu vực cho một vai trò

Ví dụ thu ngân:

1. Tạo `src/app/cashier/_layout.tsx` (Stack) và `src/app/cashier/(tabs)/_layout.tsx` dùng `WorkspaceTabs` với danh sách tab của thu ngân.
2. Thêm `Stack.Protected` cho `cashier` trong `src/app/_layout.tsx` và hướng chuyển trang trong `src/app/index.tsx`.
3. Đặt màn hình và nghiệp vụ mới trong `src/features/<domain>/` (ví dụ `orders/`, `payments/`), tái sử dụng `tables/`, `reservations/` khi cần.

## Expo Skills cho Codex và Claude Code

Có thể cài cục bộ 23 Expo skill tại `.agents/skills/` (Codex) và `.claude/skills/`
(Claude Code). Các thư mục này được Git bỏ qua, cần cài riêng sau khi clone.
Xem [cách gọi skill, danh sách và cài đặt](docs/expo-skills.md).

Trong chat Codex, dùng `$expo-overview <yêu cầu>`; trong Claude Code, dùng
`/expo-overview <yêu cầu>`. Mở lượt hoặc phiên mới sau khi cài để agent nhận skill.

## Taste Skill

Có thể cài cục bộ `design-taste-frontend` cho Codex và Claude Code; file skill
được Git bỏ qua. Skill này chuyên thiết kế website; xem
[cách cài, cách gọi và phạm vi dùng với mobile](docs/taste-skill.md).

## Tài liệu tham khảo

- [Expo SDK 58](https://docs.expo.dev/versions/v58.0.0/)
- [Thiết lập môi trường](https://docs.expo.dev/get-started/set-up-your-environment/)
- [Chạy ứng dụng và kết nối thiết bị](https://docs.expo.dev/get-started/start-developing/)
