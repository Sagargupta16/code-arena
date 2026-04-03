# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

Code Arena is a real-time competitive coding platform where 2-5 friends race to solve LeetCode problems with built-in C++ and Python code execution. Monolith FARM stack architecture.

## Tech Stack

- **Backend:** FastAPI (Python 3.13), Motor (async MongoDB), WebSocket, python-jose (JWT), httpx
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Monaco Editor
- **Database:** MongoDB 7
- **Code Execution:** Piston (self-hosted Docker container)
- **Problem Source:** alfa-leetcode-api (self-hosted Docker container)
- **Orchestration:** Docker Compose (5 services)

## Common Commands

```bash
# Start everything
docker compose up -d

# Backend dev (outside Docker)
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000

# Frontend dev (outside Docker)
cd frontend && pnpm install && pnpm dev

# Run backend tests
cd backend && python -m pytest tests/ -v

# Install Piston runtimes (first time)
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

## Project Structure

```
backend/
  main.py                    # FastAPI app entry, lifespan, CORS, router wiring
  app/
    config.py                # Pydantic Settings from env vars
    db.py                    # Motor MongoDB connection + index setup
    deps.py                  # FastAPI dependencies (get_current_user)
    models/                  # Pydantic models (user, room, problem, submission, match_result)
    routes/                  # REST endpoints (auth, rooms, problems, users)
    ws/
      manager.py             # WebSocket ConnectionManager (rooms, broadcast)
      handlers.py            # WebSocket endpoint + match lifecycle (start, submit, timer, finish)
    services/
      auth.py                # JWT creation/decode, password hashing
      judge.py               # Piston API integration, test case judging
      problem.py             # LeetCode API integration, problem caching
      scoring.py             # Full-solve and partial scoring formulas
      room.py                # Room CRUD operations
  tests/                     # pytest tests (test_auth, test_rooms, test_judge, test_scoring, test_problems, test_ws)

frontend/
  src/
    pages/                   # Landing, Login, Register, Dashboard, Lobby, Arena, Results
    components/              # Editor, Timer, StatusBar, Scoreboard, ProblemPanel, TestResults, PlayerList, Navbar, ProtectedRoute
    hooks/                   # useWebSocket, useTimer, useAuth
    services/
      api.ts                 # REST API client (fetch wrapper with JWT)
      ws.ts                  # ArenaSocket class (WebSocket client with event system)
    context/AuthContext.tsx   # Auth state (token, login, register, logout)
    types/index.ts           # TypeScript interfaces
```

## Coding Conventions

- **Python:** Type hints everywhere, `from __future__ import annotations`, f-strings, Pydantic v2
- **TypeScript/React:** Functional components with hooks only, no class components
- **CSS:** Tailwind only, no inline styles for layouts
- **Git:** Conventional commits - `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- **Commits:** Never add `Co-Authored-By` trailers. Keep messages concise.
- **Imports:** Absolute imports in Python (`from app.services.auth import ...`), relative in frontend (`../hooks/useAuth`)

## Key Patterns

### WebSocket Events

All WebSocket messages follow `{ "event": "namespace:action", ...data }` format:
- `room:player_joined`, `room:player_left`
- `match:start`, `match:problem`, `match:timer_tick`, `match:submit`, `match:result`, `match:status_update`, `match:finished`

### Auth Flow

JWT-based. REST uses `Authorization: Bearer <token>` header. WebSocket passes token as query param: `/ws/{room_code}?token=<jwt>`.

### Scoring

- **Full Solve (Mode B):** `score = 1000 - seconds - (50 * failed_attempts)`, floor 100
- **Partial (Mode C, fallback):** `score = (passed/total) * 1000 - time_penalty`, floor 0
- Mode B when anyone gets AC, Mode C when timer expires with no AC

### Problem Flow

1. LeetCode problem metadata fetched from alfa-leetcode-api
2. Sample test cases parsed from problem description HTML
3. Problems cached in MongoDB (keyed by slug) to avoid re-fetching
4. LeetCode does NOT expose full test suites - only sample cases are available

### Code Execution

Piston API at `POST /api/v2/execute`. Language map: `cpp` -> `c++ 10.2.0`, `python` -> `python 3.10.0`. Each submission runs all test cases sequentially, stops on first failure.

## Environment Variables

All config in `.env` (see `.env.example`). Key vars:
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Must change in production
- `PISTON_URL` - Piston container URL
- `LEETCODE_API_URL` - alfa-leetcode-api container URL
- `VITE_API_URL` / `VITE_WS_URL` - Frontend env vars for API/WS URLs

## Design Documents

- **Spec:** `docs/superpowers/specs/2026-04-03-code-arena-design.md`
- **Plan:** `docs/superpowers/plans/2026-04-03-code-arena-plan.md`

## Phase Scope

### Phase 1 (current)
- Friends/study group mode, 2-5 players per room
- Random problem selection with difficulty/tag filters
- C++ and Python only
- Blind race + live status board modes

### Future
- Tournament/bracket mode with leaderboards
- Classroom/interview mode
- Host picks / vote / playlist problem selection
- More languages
