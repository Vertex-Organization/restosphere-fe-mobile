# Taste Skill trong dự án

Đã cài skill **`design-taste-frontend`**, phiên bản upstream **tasteskill 2.5.1**,
từ [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill), thư mục
`skills/taste-skill`, tại commit
[`f6b76575f949707b4e3c37cd86cb44b0b98643e8`](https://github.com/Leonxlnx/taste-skill/tree/f6b76575f949707b4e3c37cd86cb44b0b98643e8/skills/taste-skill).

## Cài đặt theo dự án

Các file skill chỉ được cài cục bộ và được `.gitignore` bỏ qua cùng `.agents/`
và `.claude/`. Sau khi clone, cài riêng bằng lệnh ở mục Cài đặt và cập nhật.

| Công cụ | Đường dẫn |
| --- | --- |
| Codex | `.agents/skills/design-taste-frontend/SKILL.md` |
| Claude Code | `.claude/skills/design-taste-frontend/SKILL.md` |

Hai nơi chứa bản sao độc lập, gồm SKILL.md, references, scripts, library và assets
của upstream. Giấy phép repo được giữ trong `LICENSE` của mỗi bản cài. Cài ở phạm
vi dự án, không cài global hoặc plugin marketplace. Bản cài được cố định theo
commit trên, không tự cập nhật.

Đã bổ sung metadata hiển thị riêng cho Codex trong `SKILL.json` và
`agents/openai.yaml`, với tên hiển thị **Taste Skill**. Nội dung SKILL.md và các
script/assets upstream được giữ nguyên. Hai file bổ sung giúp tương thích với
các phiên bản Codex đọc metadata theo định dạng khác nhau.

Việc cài skill không chạy các script thiết kế/checker, không sửa giao diện ứng
dụng và không thêm dependency vào package.json.

## Cách gọi

Sau khi cài, bắt đầu lượt mới để Codex nhận skill. Nếu chưa thấy trong danh sách,
mở phiên mới hoặc tải lại IDE. Nhập vào ô chat, không chạy trong PowerShell:

```text
$design-taste-frontend Thiết kế trang giới thiệu website RestoSphere theo brief của tôi.
```

Trong Claude Code, mở phiên mới tại thư mục dự án rồi nhập:

```text
/design-taste-frontend Thiết kế trang giới thiệu website RestoSphere theo brief của tôi.
```

Tên gọi là `design-taste-frontend`, khác tên repo `taste-skill`. Đây là skill dạng
file trong dự án nên Claude Code dùng tên trực tiếp, không có prefix plugin.

## Khi Codex không hiện skill trong VS Code

Bản cài đã được kiểm tra bằng `skills/list` với `forceReload: true` của Codex CLI
`0.164.0-alpha.11.1` đi kèm extension trên máy này. Kết quả nhận đúng skill ở
scope `repo`, `enabled: true`, không có lỗi; metadata trả về tên **Taste Skill**,
mô tả ngắn và default prompt.

Nếu danh sách trong IDE vẫn chưa hiện:

1. Lưu nội dung đang chỉnh sửa.
2. Nhấn `Ctrl + Shift + P`, chạy **Developer: Reload Window**.
3. Mở chat Codex mới trong workspace `restosphere-fe-staff`.
4. Gõ `$design-taste-frontend` hoặc tìm **Taste Skill** trong danh sách skill.

Có thể nhập thẳng `$design-taste-frontend <yêu cầu>` dù menu chưa gợi ý.
Theo [OpenAI Docs về App Server](https://learn.chatgpt.com/docs/app-server),
`skills/list` có thể trả danh sách từ cache; `forceReload` quét lại từ ổ đĩa.
Việc backend nhận skill đã được xác minh; trạng thái menu sau khi reload cần
kiểm tra trong cửa sổ VS Code của người dùng.

## Phạm vi với RestoSphere Staff

Upstream tập trung vào **website**: HTML/CSS, layout landing page, ảnh, hiệu ứng,
kiểm tra trong trình duyệt và finish gate. Đây không phải thư viện component
React Native hay bộ quy tắc nghiệp vụ nhà hàng.

Khi làm ứng dụng mobile, tiếp tục theo `AGENTS.md`, `expo-ui`, `expo-router` và
`expo-design-system`. Không tự áp dụng cấu trúc hero/footer, HTML/CSS, hiệu ứng
WebGL hoặc yêu cầu mỗi section chiếm một màn hình vào giao diện Lễ tân.
Nếu muốn tham khảo nguyên tắc thiết kế của Taste cho native, cần nêu rõ phạm vi
thích nghi trong yêu cầu; ưu tiên quy tắc mobile và nghiệp vụ đã có của dự án.

## Công cụ đi kèm

Theo upstream, script checker cần Node.js 22+ và Chrome/Edge/Chromium. ffmpeg là
tùy chọn cho một số thao tác ảnh. Có tài nguyên ảnh đi kèm; tìm thêm ảnh hoặc icon
cần mạng. Xem hướng dẫn và tham số trong SKILL.md trước khi chạy script.

SKILL.md có Stop hook dành cho Claude Code. Hook upstream dùng cú pháp shell
Bash và gọi `scripts/gate.mjs`; khi dùng workflow đó trên Windows, môi trường
shell cần chạy được Bash. Không thêm hook riêng vào `.claude/settings.json`.

## Cài đặt và cập nhật

Từ thư mục gốc dự án, có thể cài mới hoặc cập nhật upstream cho cả hai agent:

```bash
npx skills@latest add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend --agent codex claude-code --copy --yes
```

Sau đó kiểm tra các file cục bộ, đối chiếu hai bản cài, giữ giấy phép và
ghi lại commit/phiên bản mới tại đây. Giữ hoặc cập nhật các file metadata Codex
đã bổ sung; chạy lint và typecheck trước khi commit.
