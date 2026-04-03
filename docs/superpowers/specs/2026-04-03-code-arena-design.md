# Code Arena - Design Specification

**Date:** 2026-04-03
**Status:** Approved
**Authors:** Sagar Gupta, Pranshu Singh

## Overview

Code Arena is a real-time competitive coding platform where 2-5 friends race to solve coding problems. Players join a room, a random problem is fetched (filtered by difficulty/tags), and they compete with a timer, live submissions, and scoring.

## Phase Scope

### Phase 1 (Current)
- Friends/study group mode (2-5 players per room)
- Random problem selection with difficulty/tag filters
- C++ and Python language support
- Blind race + live status board modes
- Points-based scoring with partial scoring fallback

### Future Phases
- Tournament/bracket mode with leaderboards and rankings
- Classroom/interview mode (host sets problems, others solve)
- Host picks problem, vote on problem, playlist mode
- Additional languages (Java, JavaScript, Go, etc.)

## Architecture

### System Components

```
docker-compose.yml
  |
  |- frontend        React 19 + Vite + Tailwind        :5173
  |- backend         FastAPI + WebSocket                :8000
  |- piston          Code execution engine (MIT)        :2000
  |- leetcode-api    alfa-leetcode-api (MIT)            :3000
  |- mongodb         MongoDB 7                          :27017
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 19, Vite, Tailwind CSS | Modern, fast, matches team expertise |
| Code Editor | Monaco Editor | VS Code-level editing in browser |
| Backend | FastAPI (Python 3.13) | Async support, WebSocket native, type-safe |
| Real-time | WebSocket (FastAPI native) | Low-latency bidirectional communication |
| Database | MongoDB 7 | Flexible schema, good for nested docs |
| Code Execution | Piston (self-hosted) | MIT license, 100+ languages, Docker-ready |
| Problem Source | alfa-leetcode-api | MIT license, fetches LeetCode problem metadata |
| Auth | JWT (python-jose + bcrypt) | Stateless, simple |
| Containerization | Docker Compose | Single command to spin up everything |

### Request Flow

1. User creates a room via REST API - backend stores room in MongoDB
2. Players join room - WebSocket connection established per player
3. Host starts match - backend fetches random problem from leetcode-api (filtered by difficulty/tags)
4. Players write code in Monaco Editor - submit via WebSocket
5. Backend forwards code to Piston container - gets result (stdout, stderr, time, memory)
6. Backend compares output against stored test cases - scores submission
7. Backend broadcasts match state to all players via WebSocket
8. Timer expires or all solve - final scoreboard calculated and broadcast

## Data Models

### User
```
{
  _id: ObjectId,
  username: string (unique),
  email: string (unique),
  password_hash: string,
  avatar: string (URL),
  stats: {
    matches_played: int,
    wins: int,
    total_score: float,
    problems_solved: int
  },
  created_at: datetime
}
```

### Room
```
{
  _id: ObjectId,
  code: string (6-char alphanumeric, unique, e.g. "ABC123"),
  host_id: ObjectId (ref User),
  players: ObjectId[] (ref User, max 5),
  status: "waiting" | "in_progress" | "finished",
  settings: {
    mode: "blind" | "live_status",
    time_limit: int (seconds),
    time_mode: "custom" | "difficulty_based",
    difficulty_filter: "Easy" | "Medium" | "Hard" | null,
    tag_filters: string[]
  },
  problem_id: ObjectId (ref Problem, set when match starts),
  created_at: datetime
}
```

### Problem
```
{
  _id: ObjectId,
  leetcode_id: int,
  title: string,
  slug: string,
  difficulty: "Easy" | "Medium" | "Hard",
  description: string (HTML/markdown from LeetCode),
  tags: string[],
  test_cases: [
    {
      input: string,
      expected_output: string,
      is_sample: bool
    }
  ],
  time_limit_ms: int (default per difficulty: Easy 2000, Medium 3000, Hard 5000),
  memory_limit_mb: int (default 256),
  fetched_at: datetime
}
```

### Submission
```
{
  _id: ObjectId,
  room_id: ObjectId (ref Room),
  user_id: ObjectId (ref User),
  problem_id: ObjectId (ref Problem),
  language: "cpp" | "python",
  code: string,
  result: "accepted" | "wrong_answer" | "time_limit" | "runtime_error" | "compile_error",
  test_cases_passed: int,
  total_test_cases: int,
  execution_time_ms: int,
  memory_used_mb: float,
  submitted_at: datetime
}
```

### MatchResult
```
{
  _id: ObjectId,
  room_id: ObjectId (ref Room),
  problem_id: ObjectId (ref Problem),
  rankings: [
    {
      user_id: ObjectId,
      score: float,
      solve_time_ms: int,
      attempts: int,
      test_cases_passed: int
    }
  ],
  scoring_mode: "full_solve" | "partial",
  finished_at: datetime
}
```

### Scoring Logic

**Mode B - Full Solve (primary):**
When at least one player passes all test cases:
```
score = 1000 - (time_penalty * seconds_taken) - (attempt_penalty * failed_submissions)
```
- `time_penalty`: 1 point per second
- `attempt_penalty`: 50 points per failed submission
- Minimum score: 100 (floor)

**Mode C - Partial (fallback):**
When no player passes all test cases (timer expires):
```
score = (test_cases_passed / total_test_cases) * 1000 - (time_of_last_submission_penalty)
```

## API Endpoints

### REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/users/me` | Current user profile + stats |
| POST | `/api/rooms` | Create room (returns join code) |
| GET | `/api/rooms/:code` | Get room details |
| POST | `/api/rooms/:code/join` | Join a room |
| GET | `/api/problems/random` | Fetch random problem (query: difficulty, tags) |
| GET | `/api/problems/:id` | Get problem details |

### WebSocket Events

| Direction | Event | Payload |
|-----------|-------|---------|
| Server -> All | `room:player_joined` | `{ user, player_count }` |
| Server -> All | `room:player_left` | `{ user_id }` |
| Host -> Server | `match:start` | `{}` |
| Server -> All | `match:problem` | `{ problem, time_limit }` |
| Server -> All | `match:timer_tick` | `{ remaining_seconds }` |
| Client -> Server | `match:submit` | `{ code, language }` |
| Server -> Client | `match:result` | `{ result, test_cases_passed, time, memory }` |
| Server -> All (live mode only) | `match:status_update` | `{ user_id, status, attempts, test_cases_passed }` |
| Server -> All | `match:finished` | `{ rankings[], scoring_mode }` |

### Key API Decisions

- JWT auth for REST, token passed in WebSocket handshake query param
- Timer runs server-side (authoritative), ticks broadcast every second
- In blind mode, `match:status_update` is not emitted
- Submissions rate-limited: 1 per 10 seconds per user

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Landing | `/` | Hero, login/register buttons |
| Auth | `/login`, `/register` | Forms, JWT stored in localStorage |
| Dashboard | `/dashboard` | User stats, recent matches, create/join room |
| Room Lobby | `/room/:code` | Player list, settings (host only), start button |
| Arena | `/room/:code/arena` | Competition view (see layout below) |
| Results | `/room/:code/results` | Final scoreboard, stats breakdown |

### Arena Layout

```
+--------------------------------------------------+
|  Timer: 24:31          Problem: Two Sum (Easy)    |
+------------------------+-------------------------+
|                        |                          |
|  Problem Description   |  Code Editor (Monaco)    |
|  (left panel,          |  Language toggle: C++/Py  |
|   scrollable)          |                          |
|                        |  [Run] [Submit]          |
|                        |                          |
+------------------------+-------------------------+
|  Test Results Panel (collapsible)                 |
|  Input: [1,2,3] | Expected: [2,1] | Got: [2,1]  |
|  Status: Passed (3/3)  |  Time: 45ms  Mem: 12MB  |
+--------------------------------------------------+
|  Live Status Bar (only in live mode)              |
|  @alice: 2 attempts... | @bob: AC in 5:02        |
+--------------------------------------------------+
```

### UX Decisions

- Monaco Editor with syntax highlighting and autocomplete for C++/Python
- Split pane: problem left, editor right (resizable via drag handle)
- "Run" tests against sample cases only (quick feedback, no scoring impact)
- "Submit" runs against all test cases (counts as an attempt)
- Toast notifications for opponent events in live mode
- Celebration animation when someone gets AC

## Test Case Strategy

LeetCode does not expose full test suites. Strategy:

1. **Sample cases**: Extract the 2-3 example cases from the problem description (always available)
2. **Edge cases**: Auto-generate common edge cases per problem type (empty array, single element, negative numbers, etc.)
3. **Community test cases**: Allow room host to add custom test cases before starting a match
4. **Future**: Build a curated test case database that grows over time

For Phase 1, sample cases + basic edge case generation is sufficient. The competition is primarily about speed and correctness on visible cases.

## Security Considerations

- Code execution is fully sandboxed in Piston containers (no filesystem access, no network, resource limits)
- Piston enforces per-submission time limits (configurable, default 5s) and memory limits (256MB)
- WebSocket connections require valid JWT
- Room codes are random 6-char alphanumeric (not guessable)
- Rate limiting on submissions prevents resource abuse
- No secrets in code - all config via environment variables

## Project Structure

```
code-arena/
  |- docker-compose.yml
  |- .env.example
  |- backend/
  |    |- main.py              (FastAPI app entry)
  |    |- requirements.txt
  |    |- Dockerfile
  |    |- app/
  |         |- config.py       (settings from env)
  |         |- models/         (Pydantic models)
  |         |- routes/         (REST endpoints)
  |         |- ws/             (WebSocket handlers)
  |         |- services/       (business logic)
  |         |    |- judge.py   (Piston integration)
  |         |    |- problem.py (LeetCode API integration)
  |         |    |- scoring.py (scoring engine)
  |         |    |- room.py    (room management)
  |         |- db.py           (MongoDB connection)
  |- frontend/
  |    |- package.json
  |    |- Dockerfile
  |    |- vite.config.ts
  |    |- src/
  |         |- main.tsx
  |         |- App.tsx
  |         |- pages/          (Landing, Auth, Dashboard, Lobby, Arena, Results)
  |         |- components/     (Editor, Timer, StatusBar, Scoreboard, etc.)
  |         |- hooks/          (useWebSocket, useTimer, useRoom)
  |         |- services/       (api.ts, ws.ts)
  |         |- types/          (TypeScript interfaces)
  |- docs/
       |- superpowers/specs/   (this file)
```

## Difficulty-Based Time Limits

When `time_mode` is `difficulty_based`:
- Easy: 15 minutes
- Medium: 30 minutes
- Hard: 60 minutes

When `time_mode` is `custom`:
- Host sets any value between 5-120 minutes
