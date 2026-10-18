# Changelog

All notable changes to this project are documented here.

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
