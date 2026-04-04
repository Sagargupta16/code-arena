# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-04-04

### Added

- **Auth:** GitHub OAuth login (replaced username/password), JWT session management
- **Backend:** FastAPI with WebSocket support, Motor (async MongoDB), full REST API
  - Routes: auth (GitHub OAuth), rooms (CRUD + join), problems (fetch), users (profile/stats)
  - Services: judge (Piston code execution), scoring (full solve + partial), problem (LeetCode fetch + cache), room (create/join/manage)
  - WebSocket: real-time room events, match lifecycle, timer ticks, submission results
  - 21 unit tests covering auth, judge, problems, rooms, scoring, WebSocket manager
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
  - Pages: Landing, Login, AuthCallback, Dashboard, Lobby, Arena, Results
  - LeetCode-style Arena: split-pane layout, Monaco Editor with real function signatures, tabbed test cases + results
  - Components: Editor (language toggle, Run/Submit), ProblemPanel, TestResults, Timer, Navbar, PlayerList, Scoreboard, StatusBar
  - WebSocket hook with event-driven architecture
  - GitHub OAuth flow with token persistence
- **Infrastructure:** Docker Compose with 5 services (MongoDB, Piston, LeetCode API, backend, frontend)
  - Custom Dockerfile for alfa-leetcode-api (TypeScript build)
  - Root `package.json` with `concurrently` for single-command dev
  - Vite proxy for API/WebSocket in dev mode
- **Code Execution:** Piston integration for sandboxed C++ and Python execution
- **Problem Fetching:** alfa-leetcode-api for problem lists + LeetCode GraphQL for code snippets
- **Scoring:** Full solve mode (speed-based) with partial scoring fallback
- **Docs:** Design spec, implementation plan, CLAUDE.md, README, .env.example
