# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

RestoSphere Staff: an Expo SDK 58 / React Native / TypeScript app for restaurant
staff. One codebase runs on phones, tablets and desktop web. Each role has its own
workspace: `/reception` and `/waiter` are implemented; `/cashier`, `/kitchen` and
`/admin` are empty placeholders. There is no backend yet. All data is mock data
persisted locally, and `EXPO_PUBLIC_API_URL` in `.env.example` is reserved and
not read by the app.

UI copy and error messages are Vietnamese. Keep the domain vocabulary consistent
(bàn giao, tiếp nhận, gửi bếp, đã phục vụ, yêu cầu thanh toán, khách đã rời, đã dọn).
Demo logins all use password `123456`: `receptionist`, `waiter`, `waiter2` (a second
waiter, used to test the rule that a waiter can only act on their own tables).

## Commands

The project uses **npm** (`package-lock.json`); install with `npm ci`. Requires Node 22.13+ (22.x).

```bash
npm start                 # Expo dev server (add -- --clear for Metro cache issues, -- --tunnel for LAN problems)
npm run web               # web dev server
npm run lint              # expo lint
npm run typecheck         # tsc --noEmit
npm test                  # compiles business logic to .cache/tests, then node --test tests/*.test.cjs
```

Run a single test file or test by name (compile first; the tests load the compiled JS):

```bash
npx tsc -p tsconfig.tests.json
node --test tests/waiter.test.cjs
node --test --test-name-pattern="WAITER login" tests/waiter.test.cjs
```

Browser smoke test for the waiter flow (needs Chrome or Edge; set `CHROME_PATH` if neither is in a standard location):

```bash
npx expo export --platform web --output-dir .cache/waiter-web
npx expo serve .cache/waiter-web --port 8094
node tests/waiter-web.mjs                      # in another terminal
# The dev-only mock tools run against a dev server instead:
# npx expo start --web --port 8096, then WAITER_TEST_URL=http://127.0.0.1:8096 node tests/waiter-web.mjs --development
```

`tests/waiter-preview.mjs` is a proxy on :8093 for visual review. It seeds a signed-in
waiter and a cart draft into localStorage, and it needs the :8094 production
server and a prior `npm test`.

## Architecture

**Routes vs. features.** `src/app/` holds only routes and layouts. Route files are
one-line re-exports of screens from `src/features/<domain>/screens/`. Features are
split by domain (reservations, tables, orders, menu, billing, notifications, waiter,
auth), not by role, so that different roles' workspaces can share them.

**Role gating.** `src/app/_layout.tsx` wraps each role's route group in
`Stack.Protected` keyed on `state.session.role`. `src/app/index.tsx` redirects to
`workspaceHref(role)` from `features/auth/roles.ts`. Each role's tab layout uses
`WorkspaceTabs` (`components/layout/workspace-tabs.tsx`), which renders a bottom tab
bar below `layout.wideMinWidth` (1024px) and a left sidebar at or above it. To add a role,
follow the steps in the README section "Thêm khu vực cho một vai trò".

**Single state and command pattern.** One `AppProvider` (`src/store/app-store.tsx`)
holds a single `ReceptionState`, which serves the whole app despite its name: it
extends `ServiceData` with the waiter's sessions, orders, bills, drafts and menu.
All mutations are pure functions `(state, command, now) => newState`:
- `executeCommand` (`features/reservations/commands.ts`): reception commands, checked against the receptionist role.
- `executeWaiterCommand` (`features/waiter/commands.ts`): waiter commands. Each command type maps to a permission in `features/auth/permissions.ts` and also checks that the session belongs to this waiter and that the state allows the action.
- `applyMockServiceEvent` (`mocks/service-workflow.ts`): kitchen and cashier events (READY, PAID…) that waiter commands must never produce. They are exposed only through the `__DEV__`-only `/waiter/dev-workflow` screen and `runDevelopmentMock`.

Commands deep-clone the state with `JSON.parse(JSON.stringify(...))`, not
`structuredClone`, because of Hermes. They throw `Error` with a Vietnamese message
when a rule is violated. The store commits the new state and queues an AsyncStorage
save.

**Persistence and migration.** `mocks/reception-repository.ts` saves the state under
the AsyncStorage key `restosphere.staff.demo.v1`. On load, `restoreDemoState`
(`mocks/demo-data.ts`) validates the shape and reseeds fresh demo data when the saved
`seedDay` is not today. It only restores the session of a known demo identity. Older
reception-only saves are upgraded in place with `emptyServiceData` + `syncHandovers`.
`syncHandovers` (`features/waiter/handover.ts`) is also what turns a reception
handover into a waiter `TableSession`. When you change the state shape, update
`isValidServiceData`/`restoreDemoState` too.

**Mocks are the backend seam.** `src/mocks/` (auth repository, reception repository,
demo data, service workflow) is what gets replaced by API-backed repositories later.
Keep data access behind these repositories.

## Conventions

- **Import style decides testability.** In `.tsx` UI files, import through the `@/` alias. Pure logic files (`types`, `labels`, `rules`, `commands`, `selectors`, `mocks`, `utils`) must use **relative imports** and no React Native imports, because `npm test` compiles them with plain `tsc` (Node16 modules) and runs them in Node.
- `tsconfig.tests.json` lists entry files. Anything they import is compiled transitively. A new pure-logic module that tests require directly and that none of those entries import must be added to `include`. Tests `require` from `../.cache/tests/<path>.js`.
- Tests pin time to `new Date("2026-11-11T12:00:00+07:00")` and build state with `createMockState(now)` plus a session (`DEMO_STAFF`, `DEMO_WAITER`, `OTHER_WAITER`).
- Shared UI in `components/ui/` is stateless and exported from `components/ui/index.ts`. Components that need the store go in `components/layout/` or inside a feature. Platform variants use the `.web.tsx` suffix (e.g. `date-field.web.tsx`).
- Design tokens (colors, radius, typography, layout) live in `src/theme.ts`. The brand palette is red `#AE1824` on background `#F7F5F1`. Screens are dense work screens, not marketing pages. Don't add decorative hero sections, illustrations or animation.
- `app.json` enables `typedRoutes` and `reactCompiler`, and the app has a light theme only.

## Expo skills

Project skills are installed in `.claude/skills/`. For Expo/EAS implementation
tasks, start with `expo-overview`, then load the relevant skill. If the user
explicitly names a skill, load it directly.

Usage and the installed version: [docs/expo-skills.md](docs/expo-skills.md).

## Website design skill

`design-taste-frontend` is installed for website design tasks. Its HTML/CSS,
landing-page layouts and browser checks do not replace the Expo/React Native
rules for the staff mobile app. Apply it to native UI only when the user
explicitly requests an adaptation, keeping the project's mobile requirements.

Usage and the installed version: [docs/taste-skill.md](docs/taste-skill.md).

## Further docs

- `docs/reception-demo.md`: reception demo walkthrough, policies, test coverage.
- `docs/waiter-implementation.md`: the waiter module's design, demo table scenarios (A03, B04, G04, G05, A04, G01) and the mock kitchen/cashier flow.
