# Code Arena

Real-time competitive coding platform where 2-5 friends race to solve LeetCode problems with built-in C++ and Python execution.

## Features

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
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Monaco Editor |
| Backend | FastAPI, Python 3.13, WebSocket, Motor (async MongoDB) |
| Auth | GitHub OAuth, JWT (python-jose) |
| Database | MongoDB 7 |
| Code Execution | Piston (self-hosted, sandboxed) |
| Problem Source | alfa-leetcode-api + LeetCode GraphQL |
| Orchestration | Docker Compose |

## Quick Start

### Prerequisites

- Docker Desktop
- Python 3.13+
- Node.js 20+ with pnpm

### Run with Docker Compose (full stack)

```bash
git clone https://github.com/Sagargupta16/code-arena.git
cd code-arena
cp .env.example .env
# Fill in GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET (see Auth Setup below)
docker compose up -d
```

### Run locally (dev mode)

```bash
# Start MongoDB and LeetCode API via Docker
docker compose up mongodb leetcode-api -d

# Fill in .env with GitHub OAuth credentials and set:
#   MONGO_URI=mongodb://localhost:27017/code_arena
#   LEETCODE_API_URL=http://localhost:3000
#   VITE_API_URL=  (leave empty)
#   VITE_WS_URL=   (leave empty)

# Start both backend and frontend
pnpm install
pnpm dev
```

- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs

### Auth Setup (GitHub OAuth)

1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** `Code Arena`
   - **Homepage URL:** `http://localhost:5173`
   - **Authorization callback URL:** `http://localhost:5173/auth/callback`
4. Copy **Client ID** and generate a **Client Secret**
5. Add them to `.env`:
   ```
   GITHUB_CLIENT_ID=your-client-id
   GITHUB_CLIENT_SECRET=your-client-secret
   ```

## Development

```bash
# Both backend + frontend (from root)
pnpm dev

# Backend only
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000

# Frontend only
cd frontend && pnpm install && pnpm dev

# Run backend tests
cd backend && python -m pytest tests/ -v

# Run a single test
cd backend && python -m pytest tests/test_scoring.py -v
```

## Project Structure

```
code-arena/
  docker-compose.yml           # MongoDB, Piston, LeetCode API, backend, frontend
  leetcode-api.Dockerfile      # Custom build for alfa-leetcode-api
  package.json                 # Root scripts (pnpm dev runs both)
  backend/
    main.py                    # FastAPI app entry point
    app/
      config.py                # Pydantic settings from .env
      db.py                    # MongoDB connection (Motor)
      deps.py                  # Auth dependency (JWT verification)
      routes/                  # auth, rooms, problems, users
      services/                # auth, judge, problem, room, scoring
      models/                  # Pydantic models (user, room, problem, submission)
      ws/                      # WebSocket handlers + connection manager
    tests/                     # 21 tests (auth, judge, problems, rooms, scoring, ws)
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
