# Expo Skills trong RestoSphere

Đã cài 23 skill từ [expo/skills](https://github.com/expo/skills), thư mục
`plugins/expo/skills`, tại commit
[`a9e5bd3fa00b4e61f632e43f85da73aee1942582`](https://github.com/expo/skills/tree/a9e5bd3fa00b4e61f632e43f85da73aee1942582/plugins/expo/skills).
Đây là bản sao cố định trong dự án; không tự cập nhật theo upstream.
Không bao gồm skill thử nghiệm và skill nội bộ dùng đánh giá repo Expo.

## Vị trí cài đặt

| Công cụ | Thư mục |
| --- | --- |
| Codex | `.agents/skills/<tên-skill>/SKILL.md` |
| Claude Code | `.claude/skills/<tên-skill>/SKILL.md` |

Mỗi skill được giữ nguyên cùng references, scripts và metadata của upstream.
Hai thư mục chứa bản sao độc lập để dùng được trên Windows mà không cần symlink.
Giấy phép Expo được giữ trong `LICENSE-expo` của mỗi thư mục skills; giấy phép
riêng đi kèm skill cũng được giữ nguyên.

Các file skill chỉ được cài cục bộ. `.agents/` và `.claude/` đều được
`.gitignore` bỏ qua; sau khi clone, cài riêng bằng lệnh ở mục Cài đặt và cập nhật.
`CLAUDE.md` nhập `AGENTS.md` để Claude Code đọc cùng quy tắc dự án với Codex.

Đây là cài đặt **skill dạng file**. Chưa cài plugin marketplace hoặc Expo MCP.
Nếu cần plugin kèm MCP, xem [hướng dẫn chính thức của Expo](https://docs.expo.dev/skills/).
Không cần cài thêm plugin để dùng các skill đã có trong dự án này.

## Gọi trong Codex

Mở dự án trong Codex và bắt đầu lượt mới để nhận các skill vừa cài.
Nếu phiên đang mở chưa hiện skill, mở phiên mới hoặc tải lại cửa sổ IDE.
Gõ `$` rồi chọn skill; trong Codex CLI có thể mở danh sách bằng `/skills`.
Nhập ví dụ sau vào **ô chat Codex**, không chạy trong PowerShell:

```text
$expo-overview Thêm màn hình danh sách nhà hàng cho RestoSphere theo AGENTS.md.
```

Khi đã biết skill cần dùng:

```text
$expo-router Thêm route chi tiết nhà hàng src/app/restaurants/[id].tsx.
```

```text
$expo-data-fetching Kết nối API danh sách nhà hàng, có loading, error và retry.
```

```text
$expo-design-system Tạo theme màu, spacing và component dùng chung cho RestoSphere.
```

Skill cũng có thể được chọn tự động khi yêu cầu khớp mô tả. Chỉ định `$tên-skill`
giúp chọn rõ workflow cần dùng.

## Gọi trong Claude Code

Mở Claude Code tại thư mục gốc dự án, hoặc chạy `claude` trong terminal ở đó.
Mở phiên mới để nhận cấu hình dự án. Nhập vào **ô chat Claude Code**:

```text
/expo-overview Thêm màn hình danh sách nhà hàng cho RestoSphere theo AGENTS.md.
```

```text
/expo-router Thêm route chi tiết nhà hàng src/app/restaurants/[id].tsx.
```

```text
/expo-data-fetching Kết nối API danh sách nhà hàng, có loading, error và retry.
```

Gõ `/` để tìm tên skill. Có thể yêu cầu bằng lời:
`Dùng skill expo-native-ui để làm giao diện chi tiết nhà hàng.`
Claude Code cũng tự chọn skill dựa trên mô tả khi yêu cầu phù hợp.
Vì đây là skill trong dự án, dùng `/expo-router`, không dùng tên có prefix plugin.

## Chọn skill theo công việc

| Skill | Công việc |
| --- | --- |
| `expo-overview` | Điểm bắt đầu, chọn workflow Expo/EAS phù hợp |
| `expo-router` | Route, stack, tab, modal, điều hướng |
| `expo-native-ui` | Giao diện màn hình và bố cục theo nền tảng |
| `expo-ui` | Component native của `@expo/ui` |
| `expo-design-system` | Theme, design token, component dùng chung |
| `expo-animation` | Animation, gesture, haptic |
| `expo-data-fetching` | API, cache, offline và trạng thái tải dữ liệu |
| `expo-dev-client` | Development build |
| `expo-upgrade` | Nâng SDK, xử lý dependency |
| `expo-project-structure` | Cấu trúc dự án mới |
| `expo-examples` | Ví dụ tích hợp chính thức |
| `expo-dom` | Dùng web component trong native |
| `expo-web-to-native` | Chuyển ứng dụng web sang native |
| `expo-module` | Native module và view |
| `expo-brownfield` | Nhúng Expo vào ứng dụng native có sẵn |
| `expo-app-clip` | iOS App Clip |
| `eas-app-stores` | Build, TestFlight, submit lên store |
| `eas-hosting` | Deploy web và API route |
| `eas-workflows` | CI/CD bằng EAS Workflow |
| `eas-simulator` | Simulator trên cloud |
| `eas-update` | OTA update |
| `eas-update-insights` | Theo dõi chất lượng OTA update |
| `eas-observe` | Theo dõi hiệu năng và lỗi |

Trước khi sửa API Expo/React Native, vẫn đọc phiên bản `expo` trong
`package.json` và tài liệu SDK tương ứng theo `AGENTS.md`. Skill không thay thế
tài liệu phiên bản. Dự án hiện dùng Expo SDK 58 và npm.

## Cài đặt và cập nhật

Để cài mới hoặc chuyển sang bản upstream mới, chạy ở thư mục gốc dự án:

```bash
npx skills@latest add expo/skills --skill '*' --agent codex claude-code --copy --yes
```

Lệnh này dùng skills CLI để cài lại cho cả hai agent; `--copy` giữ dạng bản sao.
Sau đó kiểm tra bản cài và các file mới (kể cả lockfile do CLI tạo), đối chiếu
hai thư mục skills và ghi lại commit nguồn mới trong tài liệu này. Các file
skill bị Git bỏ qua; không dùng `git add -f` để đưa chúng vào commit.
Nếu upstream đổi tên hoặc bỏ skill, cần rà soát bản cũ còn trong dự án.

Kiểm tra sau khi cập nhật:

```bash
npm run lint
npm run typecheck
```

## Tài liệu

- [Repo Expo Skills](https://github.com/expo/skills)
- [Expo: cài skill và plugin](https://docs.expo.dev/skills/)
- [OpenAI: gọi skill bằng `$` hoặc `/skills`](https://developers.openai.com/blog/eval-skills/)
- [Claude Code: project skills và cách gọi `/tên-skill`](https://code.claude.com/docs/en/skills)
