# Code Arena

[![CI](https://github.com/Sagargupta16/code-arena/actions/workflows/ci.yml/badge.svg)](https://github.com/Sagargupta16/code-arena/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Frontend of a real-time competitive coding platform where 2-5 friends race to solve LeetCode problems.

> **Note:** This is a sample/reference project -- it is not actively deployed. The FastAPI backend was removed from this repository on 2026-04-16, so the [live demo](https://sagargupta.online/code-arena/) is a UI-only preview: sign-in and matches do not work.

## Features

The UI implements the full arena flow, designed to run against a WebSocket backend:

- **GitHub OAuth** -- sign in with GitHub, no passwords
- **Private rooms** -- 6-character code, 2-5 players
- **Random LeetCode problems** -- filtered by difficulty and tags, with real function signatures
- **Built-in code execution** -- C++ and Python in sandboxed containers via Piston
- **Two modes** -- Blind Race (no peeking) and Live Status Board
- **LeetCode-style editor** -- Monaco Editor with language toggle, test cases panel, submission results
- **Server-authoritative timer** -- real-time sync via WebSocket
- **Scoring** -- speed + attempts + test cases passed

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19, TypeScript |
| Build | Vite |
| Styling | Tailwind CSS 4 |
| Editor | Monaco Editor |
| Routing | React Router 7 |

The former backend stack (FastAPI, MongoDB, Piston, alfa-leetcode-api, Docker Compose) was removed on 2026-04-16 and is not part of this repo.

## Quick Start

```bash
git clone https://github.com/Sagargupta16/code-arena.git
cd code-arena/frontend
pnpm install
pnpm dev
```

- Frontend: http://localhost:5173

To point the UI at your own backend, set `VITE_API_URL` and `VITE_WS_URL` (see `.env.example`). In dev mode, `/api` and `/ws` are proxied to `localhost:8000` (vite.config.ts).

## Project Structure

```
code-arena/
  frontend/
    src/
      pages/                   # Landing, Login, AuthCallback, Dashboard, Lobby, Arena, Results
      components/              # Editor, ProblemPanel, TestResults, Timer, Navbar, etc.
      hooks/                   # useAuth, useWebSocket, useTimer
      services/                # REST API client, WebSocket client
      context/                 # AuthContext (GitHub OAuth + JWT)
      types/                   # TypeScript interfaces
```

## How It Works

1. **Sign in** with GitHub OAuth
2. **Create a room** -- pick difficulty, mode (blind/live), timer settings
3. **Share the code** -- friends join with the 6-character room code
4. **Start the match** -- host starts, a random LeetCode problem is fetched with real function signatures
5. **Compete** -- write and submit code in the LeetCode-style editor
6. **Results** -- scored by speed, attempts, and test cases passed

## Scoring

- **Full Solve:** `1000 - seconds - (50 * failed_attempts)`, minimum 100
- **Partial (fallback):** when nobody fully solves, scored by `(passed/total) * 1000 - time_penalty`

## License

MIT
