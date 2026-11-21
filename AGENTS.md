This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## File cá nhân và file dùng chung

- File cá nhân gồm thiết lập IDE riêng, cấu hình agent riêng, cache, báo cáo chạy thử, file tạm và file hệ điều hành. Đặt báo cáo/cache cá nhân trong `/.local/`, file tạm trong `/.tmp/`; cấu hình agent riêng dùng `opencode.local.json`, `opencode.local.jsonc`, `.opencode/*.local.json`, `.opencode/*.local.jsonc` hoặc `AGENTS.local.md`. Đây là quy ước đặt tên để ignore, không bảo đảm công cụ tự nạp cấu hình.
- File dùng chung phải giữ khả năng theo dõi: `AGENTS.md`, `README.md`, `.env.example`, cấu hình formatter, lockfile ứng dụng, source, test, seed, `scripts/`, `docs/`, cấu hình opencode dùng chung và workflow GitHub. Giữ quy tắc Expo phía trên; không mở rộng các ignore cũ để che file dùng chung. Không coi script chưa rõ mục đích (như `api-performance-probe.mjs`, `runtime-performance-probe.mjs`) là file cá nhân.
- Không đọc/in bí mật hoặc sửa `.env`; không commit token, khóa ký hay mật khẩu.
- `.gitignore` không bỏ theo dõi file đã tracked. Kiểm tra bằng `git ls-files -ci --exclude-standard` ở từng repo và báo các đường dẫn cần xem xét; **không chạy `git rm --cached` nếu chưa được chấp thuận rõ ràng**. Không xóa file hoặc thay đổi staging của người khác.
- Khi sửa ignore, dùng `git check-ignore -v --no-index <đường-dẫn>` để kiểm tra cả file cá nhân và file dùng chung; xem diff trước khi kết luận. Agent chỉ commit khi được yêu cầu rõ ràng, không push.
