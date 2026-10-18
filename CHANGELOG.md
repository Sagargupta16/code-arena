# Changelog

All notable changes to this project are documented here.

## 0.2.0 - 2026-10-18

The hosted site can now play a whole match without a backend.

### Added

- Demo mode at `/demo` (also "Try the demo" on the landing and login pages): an in-browser server plays the backend's half of the WebSocket protocol, with two bots, a 3-minute server-side clock, a simulated judge, live status updates and the spec's scoring. Joining any room code puts you in a bot-hosted room. Demo matches count toward the dashboard stats.
- The WebSocket client reconnects with exponential backoff (0.5s up to 8s, 5 retries) and skips retries when the server refuses the connection (close code 1008 or 4000-4999).
- Connection pill (Live, Connecting, Reconnecting, Offline, or Demo) in the lobby and the arena top bar.
- Vitest suite, 24 tests: scoring, the demo judge, a full demo match on fake timers, and the socket's dispatch and reconnect logic. CI and the Pages deploy run it.
- README screenshots of the landing page, lobby, arena and results at desktop and phone widths, captured by `pnpm screenshots` (Playwright).

### Changed

- The Pages deploy runs on every push to `main` that touches `frontend/`, not only by hand.
- `[WS]` trace logs (which include submitted code) only print in dev builds.
- The test panel switches to the result tab when a submission starts.
- The editor footer shows the real cursor position and line count instead of a fixed "Saved" and "Ln 1, Col 1".
- The scoreboard shows usernames when the server sends them, and attempt counts read "1 attempt".
- The arena clock starts from the match's time limit instead of 00:00.

### Fixed

- The lobby shows an error with a link back to the dashboard when the room cannot be loaded, instead of an uncaught promise rejection.
- The editor footer is no longer pushed under the test panel.
- `frontend/README.md` was the stock Vite template; it now points to the root README.

## 0.1.0 - 2026-10-18

First versioned release of the frontend-only sample.

### Fixed

- Arena no longer overflows the screen: it now fills the viewport below the navbar instead of `h-screen` plus the navbar, so the status bar and test panel stay visible.
- Arena is usable on phones: problem, editor and test panel stack vertically below the `md` breakpoint, and the Run and Submit buttons are no longer clipped off-screen at 375px.
- Results page shows the standings: the arena now forwards the `match:finished` payload through router state, because that event fires once before the results page opens its own socket.
- GitHub OAuth code is exchanged once: `AuthCallback` guards the single-use code against StrictMode double effects and provider re-renders.
- "Try again" on a failed sign-in now stays under the `/code-arena/` base path (router `Link` instead of a raw `/login` href).
- Page effects resubscribe when the socket changes: `useWebSocket` returns the socket instance instead of a ref read during render.
- The arena's problem handler no longer uses a stale language when a problem arrives after a language switch.
- Removed committed merge-conflict markers from `CLAUDE.md`.

### Changed

- Lint works again and runs in CI: `typescript` is aliased to `@typescript/typescript6` for typescript-eslint, while `@typescript/native` (TypeScript 7) provides `tsc` for the build.
- Server WebSocket payloads are typed (`ServerEvents`), and every `any` in the app is replaced with real types.
- CI pins `contents: read` permissions (closes the code-scanning alert) and runs on Node 24 to match the deploy workflow.
- Dependencies: React 19.3.1, React Router 8.4.0, Vite 8.3.4, ESLint 10.13.0, typescript-eslint 8.71.2, DOMPurify 3.4.17, plus minor dev-tool bumps.

### Docs

- README: architecture and match-flow diagrams, WebSocket protocol table, design decisions, scripts table, known limitations, live demo badge.
