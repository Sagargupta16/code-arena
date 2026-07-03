# CLAUDE.md

> This file stacks on top of the workspace root at `C:\Code\GitHub\`:
> - Root [`CLAUDE.md`](../../CLAUDE.md) -- voice, rules, routing map, references, skills, slash commands, conventions.
> - Root [`MEMORY.md`](../../MEMORY.md) -- live facts across repos.
> - Root [`STATUS.md`](../../STATUS.md) -- live PR/CI/security dashboard.
> - [`.claude/resources/`](../../.claude/resources/README.md) -- deep reference for collaboration, workflow, git, OSS, debugging, voice.
>
> Read those first. The guidance below only adds **repo-specific context** -- it does not override anything in the root.


This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Code Arena is the frontend of a real-time competitive coding platform where 2-5 friends race to solve LeetCode problems.

**Status:** Sample/reference project. The FastAPI backend (and its Docker Compose stack) was removed from this repo on 2026-04-16. Only the React frontend remains; the live demo is UI-only.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Monaco Editor, React Router 7
- **Former backend (removed):** FastAPI, MongoDB, Piston, alfa-leetcode-api, Docker Compose

## Common Commands

```bash
# Dev server
cd frontend && pnpm install && pnpm dev

# Lint / build
cd frontend && pnpm lint
cd frontend && pnpm build
```

## Architecture

- Frontend proxies `/api` and `/ws` to `localhost:8000` in dev mode (vite.config.ts); no backend ships in this repo
- The protocol/scoring notes below describe the backend contract the UI was built against -- kept for reference

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

All config in `.env` (see `.env.example`):
- `VITE_API_URL` / `VITE_WS_URL` -- API/WS base URLs (leave empty to use the dev proxy)

## Design Documents

- **Spec:** `docs/superpowers/specs/2026-04-03-code-arena-design.md` -- data models, API endpoints, WebSocket events, arena layout, security
- **Plan:** `docs/superpowers/plans/2026-04-03-code-arena-plan.md` -- step-by-step implementation with exact file contents and commit points