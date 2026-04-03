# Code Arena

Real-time competitive coding platform where friends race to solve coding problems.

## Features

- Create private rooms (2-5 players) with a shareable 6-character code
- Random LeetCode problems filtered by difficulty and tags
- Built-in C++ and Python code execution (sandboxed via Piston)
- Two competition modes: Blind Race and Live Status Board
- Points-based scoring with partial scoring fallback
- Server-authoritative timer with real-time sync

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Monaco Editor |
| Backend | FastAPI, Python 3.13, WebSocket |
| Database | MongoDB 7 |
| Code Execution | Piston (self-hosted, MIT) |
| Problem Source | alfa-leetcode-api (MIT) |
| Containerization | Docker Compose |

## Quick Start

```bash
# Clone
git clone https://github.com/Sagargupta16/code-arena.git
cd code-arena

# Copy env
cp .env.example .env

# Start all services
docker compose up -d

# Install language runtimes (first time only)
curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language": "python", "version": "3.10.0"}'

curl -X POST http://localhost:2000/api/v2/packages \
  -H "Content-Type: application/json" \
  -d '{"language": "c++", "version": "10.2.0"}'
```

- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/docs

## Development

```bash
# Backend only
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# Frontend only
cd frontend && pnpm install && pnpm dev

# Run tests
cd backend && python -m pytest tests/ -v
```

## Project Structure

```
code-arena/
  docker-compose.yml        # All 5 services
  backend/                   # FastAPI + WebSocket
    app/
      routes/                # REST API endpoints
      ws/                    # WebSocket handlers
      services/              # Business logic (judge, scoring, room, problem)
      models/                # Pydantic models
  frontend/                  # React 19 + Vite
    src/
      pages/                 # Landing, Auth, Dashboard, Lobby, Arena, Results
      components/            # Editor, Timer, StatusBar, Scoreboard
      hooks/                 # useWebSocket, useTimer, useAuth
      services/              # API and WebSocket clients
```

## How It Works

1. **Create a room** - Pick difficulty, mode (blind/live), and timer settings
2. **Share the code** - Friends join with the 6-character room code
3. **Start the match** - Host starts, a random problem is fetched
4. **Compete** - Write and submit code in the browser editor
5. **Results** - Scored by speed, attempts, and test cases passed

## Scoring

- **Full Solve (primary):** `1000 - (1 * seconds) - (50 * failed_attempts)`, minimum 100
- **Partial (fallback):** When nobody fully solves it, scored by test cases passed

## Roadmap

- [ ] Phase 1: Friends/study group mode (current)
- [ ] Phase 2: Tournament/bracket mode with leaderboards
- [ ] Phase 3: Classroom/interview mode
- [ ] More languages (Java, JavaScript, Go)
- [ ] Host picks problem, vote on problem, playlist mode

## License

MIT
