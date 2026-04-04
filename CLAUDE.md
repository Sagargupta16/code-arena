# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Code Arena is a real-time competitive coding platform where 2-5 friends race to solve LeetCode problems with built-in C++ and Python code execution. Monolith FARM stack architecture.

**Status:** Phase 1 implementation complete. Backend (FastAPI + WebSocket + all services) and frontend (React 19 + Vite + all pages) are built. 21 backend tests passing. Needs Docker Compose end-to-end testing.

## Tech Stack

- **Backend:** FastAPI (Python 3.13), Motor (async MongoDB), WebSocket, python-jose (JWT), httpx
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Monaco Editor
- **Database:** MongoDB 7
- **Code Execution:** Piston (self-hosted Docker container)
- **Problem Source:** alfa-leetcode-api (self-hosted Docker container)
- **Orchestration:** Docker Compose (5 services)

## Common Commands

```bash
# Start everything (Docker)
docker compose up -d

# Dev mode (both backend + frontend from root)
pnpm install && pnpm dev

# Backend only
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000

# Frontend only
cd frontend && pnpm install && pnpm dev

# Run backend tests
cd backend && python -m pytest tests/ -v

# Run a single test file or test
cd backend && python -m pytest tests/test_scoring.py -v
cd backend && python -m pytest tests/test_scoring.py::test_full_solve_scoring -v

# Install Piston runtimes (first time only)
curl -X POST http://localhost:2000/api/v2/packages -H "Content-Type: application/json" -d '{"language": "python", "version": "3.10.0"}'
curl -X POST http://localhost:2000/api/v2/packages -H "Content-Type: application/json" -d '{"language": "c++", "version": "10.2.0"}'
```

## Architecture

```
docker-compose.yml
  |- frontend        React 19 + Vite + Tailwind        :5173
  |- backend         FastAPI + WebSocket                :8000
  |- piston          Code execution engine              :2000
  |- leetcode-api    alfa-leetcode-api                  :3000
  |- mongodb         MongoDB 7                          :27017
```

- Backend serves REST API on `/api/*` and WebSocket on `/ws/{room_code}`
- Frontend proxies `/api` and `/ws` to backend in dev mode (vite.config.ts)
- Piston runs code in isolated sandboxes with time/memory limits
- alfa-leetcode-api wraps LeetCode's undocumented GraphQL API
- Timer is server-authoritative -- runs on backend, ticks broadcast every second via WebSocket

## Key Patterns

### WebSocket Event Protocol

All WebSocket messages follow `{ "event": "namespace:action", ...data }` format:
- `room:player_joined`, `room:player_left`
- `match:start`, `match:problem`, `match:timer_tick`, `match:submit`, `match:result`, `match:status_update`, `match:finished`
- In blind mode, `match:status_update` is NOT emitted

### Auth Flow

GitHub OAuth. Frontend redirects to GitHub -> GitHub redirects back to `/auth/callback` with a code -> Backend exchanges code for GitHub access token -> fetches GitHub user info -> creates/updates user in MongoDB -> returns JWT. REST uses `Authorization: Bearer <token>` header. WebSocket passes token as query param: `/ws/{room_code}?token=<jwt>`. No passwords stored.

### Scoring

- **Full Solve (Mode B):** `score = 1000 - seconds - (50 * failed_attempts)`, floor 100
- **Partial (Mode C, fallback):** `score = (passed/total) * 1000 - time_penalty`, floor 0
- Mode B when anyone gets AC, Mode C when timer expires with no AC

### Problem Flow

1. LeetCode problem metadata fetched from alfa-leetcode-api
2. Sample test cases parsed from problem description HTML
3. Problems cached in MongoDB (keyed by slug) to avoid re-fetching
4. LeetCode does NOT expose full test suites -- only sample cases are available

### Code Execution

Piston API at `POST /api/v2/execute`. Language map: `cpp` -> `c++ 10.2.0`, `python` -> `python 3.10.0`. Each submission runs all test cases sequentially, stops on first failure. Submissions rate-limited: 1 per 10 seconds per user.

### Difficulty-Based Time Limits

When `time_mode` is `difficulty_based`: Easy 15min, Medium 30min, Hard 60min. Custom mode: host picks 5-120 minutes.

## Code Rules

- **Max 150 lines per file.** If a file exceeds this, split it into focused modules.
- **One route per file** in `routes/` -- each resource (auth, rooms, problems, users) stays separate.
- **One Pydantic model per file** in `models/` -- no multi-model files.
- **One React component per file** -- no exporting multiple components from a single file.
- **No business logic in route handlers** -- routes validate input and call `services/`, services contain the logic.
- **No direct DB access outside `services/` and `db.py`** -- routes never import `db` or call Motor directly.
- **No `any` in TypeScript** -- use proper interfaces from `types/index.ts`.
- **All backend errors return `{ "detail": "..." }`** -- consistent error shape across every endpoint.
- **WebSocket handlers must not block the event loop** -- offload CPU/IO work with `asyncio`.
- **Every service function must be independently testable** -- no hidden global state, accept dependencies as parameters.

## Coding Conventions

- **Python:** Type hints everywhere, `from __future__ import annotations`, f-strings, Pydantic v2
- **TypeScript/React:** Functional components with hooks only, no class components
- **CSS:** Tailwind only, no inline styles for layouts
- **Git:** Conventional commits -- `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- **Commits:** Never add `Co-Authored-By` trailers. Keep messages concise.
- **Imports:** Absolute imports in Python (`from app.services.auth import ...`), relative in frontend (`../hooks/useAuth`)

## Environment Variables

All config in `.env` (see `.env.example`). Key vars:
- `MONGO_URI` -- MongoDB connection string
- `JWT_SECRET` -- Must change in production
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` -- GitHub OAuth app credentials
- `GITHUB_REDIRECT_URI` -- OAuth callback URL (default: `http://localhost:5173/auth/callback`)
- `PISTON_URL` -- Piston container URL
- `LEETCODE_API_URL` -- alfa-leetcode-api container URL
- `VITE_API_URL` / `VITE_WS_URL` -- Frontend env vars for API/WS URLs

## Design Documents

- **Spec:** `docs/superpowers/specs/2026-04-03-code-arena-design.md` -- data models, API endpoints, WebSocket events, arena layout, security
- **Plan:** `docs/superpowers/plans/2026-04-03-code-arena-plan.md` -- step-by-step implementation with exact file contents and commit points
