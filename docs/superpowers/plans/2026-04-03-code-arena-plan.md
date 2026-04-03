# Code Arena Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real-time competitive coding arena where 2-5 friends race to solve LeetCode problems with built-in C++ and Python execution.

**Architecture:** Monolith FARM stack - FastAPI backend with WebSocket support, React 19 frontend with Monaco Editor, MongoDB for persistence, Piston for sandboxed code execution, alfa-leetcode-api for problem fetching. All services orchestrated via Docker Compose.

**Tech Stack:** Python 3.13, FastAPI, Motor (async MongoDB), React 19, TypeScript, Vite, Tailwind CSS, Monaco Editor, Piston, Docker Compose

**Spec:** `docs/superpowers/specs/2026-04-03-code-arena-design.md`

---

## File Structure

```
code-arena/
  docker-compose.yml
  .env.example
  .gitignore
  backend/
    Dockerfile
    requirements.txt
    main.py
    app/
      __init__.py
      config.py
      db.py
      models/
        __init__.py
        user.py
        room.py
        problem.py
        submission.py
        match_result.py
      routes/
        __init__.py
        auth.py
        rooms.py
        problems.py
        users.py
      ws/
        __init__.py
        manager.py
        handlers.py
      services/
        __init__.py
        judge.py
        problem.py
        scoring.py
        room.py
    tests/
      __init__.py
      conftest.py
      test_auth.py
      test_rooms.py
      test_judge.py
      test_scoring.py
      test_problems.py
      test_ws.py
  frontend/
    Dockerfile
    package.json
    tsconfig.json
    vite.config.ts
    index.html
    tailwind.config.js
    src/
      main.tsx
      App.tsx
      pages/
        Landing.tsx
        Login.tsx
        Register.tsx
        Dashboard.tsx
        Lobby.tsx
        Arena.tsx
        Results.tsx
      components/
        Editor.tsx
        Timer.tsx
        StatusBar.tsx
        Scoreboard.tsx
        ProblemPanel.tsx
        TestResults.tsx
        RoomSettings.tsx
        PlayerList.tsx
        Navbar.tsx
        ProtectedRoute.tsx
      hooks/
        useWebSocket.ts
        useTimer.ts
        useRoom.ts
        useAuth.ts
      services/
        api.ts
        ws.ts
      types/
        index.ts
      context/
        AuthContext.tsx
```

---

## Phase 1: Project Scaffolding and Docker Setup

### Task 1.1: Initialize project structure and Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Modify: `.gitignore`

- [ ] **Step 1: Create `.env.example`**

```env
# MongoDB
MONGO_URI=mongodb://mongodb:27017/code_arena
MONGO_DB=code_arena

# JWT
JWT_SECRET=change-me-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRY_MINUTES=1440

# Piston
PISTON_URL=http://piston:2000

# LeetCode API
LEETCODE_API_URL=http://leetcode-api:3000

# Backend
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0

# Frontend
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

- [ ] **Step 2: Create `docker-compose.yml`**

```yaml
services:
  mongodb:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  piston:
    image: ghcr.io/engineer-man/piston
    ports:
      - "2000:2000"
    privileged: true
    tmpfs:
      - /piston/jobs:exec,uid=1000,gid=1000

  leetcode-api:
    image: ghcr.io/alfaarghya/alfa-leetcode-api:latest
    ports:
      - "3000:3000"

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env
    depends_on:
      - mongodb
      - piston
      - leetcode-api
    volumes:
      - ./backend:/app

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    env_file: .env
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  mongo_data:
```

- [ ] **Step 3: Update `.gitignore`**

Append to existing `.gitignore`:
```
# Environment
.env

# Python
__pycache__/
*.pyc
.venv/
*.egg-info/

# Node
node_modules/
dist/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml .env.example .gitignore
git commit -m "chore: add docker-compose and project config"
```

---

### Task 1.2: Backend Dockerfile and dependencies

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/requirements.txt`
- Create: `backend/main.py`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`

- [ ] **Step 1: Create `backend/requirements.txt`**

```
fastapi==0.115.*
uvicorn[standard]==0.34.*
motor==3.7.*
pydantic[email]==2.11.*
pydantic-settings==2.9.*
python-jose[cryptography]==3.4.*
passlib[bcrypt]==1.7.*
httpx==0.28.*
pytest==8.3.*
pytest-asyncio==0.25.*
```

- [ ] **Step 2: Create `backend/Dockerfile`**

```dockerfile
FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

- [ ] **Step 3: Create `backend/app/config.py`**

```python
from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongo_uri: str = "mongodb://localhost:27017/code_arena"
    mongo_db: str = "code_arena"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expiry_minutes: int = 1440
    piston_url: str = "http://localhost:2000"
    leetcode_api_url: str = "http://localhost:3000"

    model_config = {"env_file": ".env"}


settings = Settings()
```

- [ ] **Step 4: Create `backend/app/__init__.py`**

```python
```

- [ ] **Step 5: Create `backend/main.py`**

```python
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Code Arena", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

- [ ] **Step 6: Commit**

```bash
git add backend/
git commit -m "chore: scaffold backend with FastAPI, Dockerfile, and config"
```

---

## Phase 2: Database Connection and Pydantic Models

### Task 2.1: MongoDB connection with Motor

**Files:**
- Create: `backend/app/db.py`

- [ ] **Step 1: Create `backend/app/db.py`**

```python
from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    global client, db
    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.mongo_db]
    await db.users.create_index("username", unique=True)
    await db.users.create_index("email", unique=True)
    await db.rooms.create_index("code", unique=True)
    await db.problems.create_index("leetcode_id", unique=True)


async def close_db() -> None:
    global client
    if client:
        client.close()


def get_db() -> AsyncIOMotorDatabase:
    assert db is not None, "Database not connected"
    return db
```

- [ ] **Step 2: Wire DB lifecycle into `backend/main.py`**

Add to `main.py` after the CORS middleware:
```python
from contextlib import asynccontextmanager
from app.db import connect_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

# Update the FastAPI constructor:
app = FastAPI(title="Code Arena", version="0.1.0", lifespan=lifespan)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/db.py backend/main.py
git commit -m "feat: add MongoDB connection with Motor and index setup"
```

---

### Task 2.2: Pydantic models - User

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/user.py`

- [ ] **Step 1: Create `backend/app/models/user.py`**

```python
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserStats(BaseModel):
    matches_played: int = 0
    wins: int = 0
    total_score: float = 0.0
    problems_solved: int = 0


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=20, pattern=r"^[a-zA-Z0-9_]+$")
    email: EmailStr
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    username: str
    password: str


class UserInDB(BaseModel):
    id: str = Field(alias="_id")
    username: str
    email: str
    password_hash: str
    avatar: str = ""
    stats: UserStats = UserStats()
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class UserPublic(BaseModel):
    id: str
    username: str
    avatar: str = ""
    stats: UserStats = UserStats()
```

- [ ] **Step 2: Create `backend/app/models/__init__.py`**

```python
from app.models.user import UserCreate, UserLogin, UserInDB, UserPublic, UserStats
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/models/
git commit -m "feat: add User pydantic models"
```

---

### Task 2.3: Pydantic models - Room

**Files:**
- Create: `backend/app/models/room.py`

- [ ] **Step 1: Create `backend/app/models/room.py`**

```python
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class RoomSettings(BaseModel):
    mode: Literal["blind", "live_status"] = "blind"
    time_limit: int = Field(default=1800, ge=300, le=7200)  # seconds, 5-120 min
    time_mode: Literal["custom", "difficulty_based"] = "difficulty_based"
    difficulty_filter: Literal["Easy", "Medium", "Hard"] | None = None
    tag_filters: list[str] = []


class RoomCreate(BaseModel):
    settings: RoomSettings = RoomSettings()


class RoomInDB(BaseModel):
    id: str = Field(alias="_id")
    code: str
    host_id: str
    players: list[str] = []
    status: Literal["waiting", "in_progress", "finished"] = "waiting"
    settings: RoomSettings = RoomSettings()
    problem_id: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class RoomPublic(BaseModel):
    code: str
    host_id: str
    players: list[str]
    status: str
    settings: RoomSettings
    problem_id: str | None = None


DIFFICULTY_TIME_LIMITS = {
    "Easy": 900,     # 15 min
    "Medium": 1800,  # 30 min
    "Hard": 3600,    # 60 min
}
```

- [ ] **Step 2: Update `backend/app/models/__init__.py`**

```python
from app.models.user import UserCreate, UserLogin, UserInDB, UserPublic, UserStats
from app.models.room import RoomCreate, RoomInDB, RoomPublic, RoomSettings, DIFFICULTY_TIME_LIMITS
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/models/
git commit -m "feat: add Room pydantic models"
```

---

### Task 2.4: Pydantic models - Problem, Submission, MatchResult

**Files:**
- Create: `backend/app/models/problem.py`
- Create: `backend/app/models/submission.py`
- Create: `backend/app/models/match_result.py`

- [ ] **Step 1: Create `backend/app/models/problem.py`**

```python
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class TestCase(BaseModel):
    input: str
    expected_output: str
    is_sample: bool = True


class ProblemInDB(BaseModel):
    id: str = Field(alias="_id")
    leetcode_id: int
    title: str
    slug: str
    difficulty: str
    description: str
    tags: list[str] = []
    test_cases: list[TestCase] = []
    time_limit_ms: int = 3000
    memory_limit_mb: int = 256
    fetched_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class ProblemPublic(BaseModel):
    id: str
    leetcode_id: int
    title: str
    slug: str
    difficulty: str
    description: str
    tags: list[str]
    sample_cases: list[TestCase] = []  # only is_sample=True cases sent to client
```

- [ ] **Step 2: Create `backend/app/models/submission.py`**

```python
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class SubmissionCreate(BaseModel):
    code: str
    language: Literal["cpp", "python"]


class SubmissionInDB(BaseModel):
    id: str = Field(alias="_id")
    room_id: str
    user_id: str
    problem_id: str
    language: Literal["cpp", "python"]
    code: str
    result: Literal[
        "accepted", "wrong_answer", "time_limit", "runtime_error", "compile_error"
    ]
    test_cases_passed: int = 0
    total_test_cases: int = 0
    execution_time_ms: int = 0
    memory_used_mb: float = 0.0
    submitted_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}
```

- [ ] **Step 3: Create `backend/app/models/match_result.py`**

```python
from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class PlayerRanking(BaseModel):
    user_id: str
    score: float
    solve_time_ms: int = 0
    attempts: int = 0
    test_cases_passed: int = 0


class MatchResultInDB(BaseModel):
    id: str = Field(alias="_id")
    room_id: str
    problem_id: str
    rankings: list[PlayerRanking] = []
    scoring_mode: Literal["full_solve", "partial"] = "full_solve"
    finished_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}
```

- [ ] **Step 4: Update `backend/app/models/__init__.py`**

```python
from app.models.user import UserCreate, UserLogin, UserInDB, UserPublic, UserStats
from app.models.room import RoomCreate, RoomInDB, RoomPublic, RoomSettings, DIFFICULTY_TIME_LIMITS
from app.models.problem import ProblemInDB, ProblemPublic, TestCase
from app.models.submission import SubmissionCreate, SubmissionInDB
from app.models.match_result import MatchResultInDB, PlayerRanking
```

- [ ] **Step 5: Commit**

```bash
git add backend/app/models/
git commit -m "feat: add Problem, Submission, and MatchResult models"
```

---

## Phase 3: Authentication (JWT)

### Task 3.1: Auth service and utility functions

**Files:**
- Create: `backend/app/services/__init__.py`
- Create: `backend/app/services/auth.py`

- [ ] **Step 1: Create `backend/app/services/auth.py`**

```python
from __future__ import annotations

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expiry_minutes)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return payload.get("sub")
    except JWTError:
        return None
```

- [ ] **Step 2: Create `backend/app/services/__init__.py`**

```python
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/services/
git commit -m "feat: add JWT auth service with password hashing"
```

---

### Task 3.2: Auth dependency (get current user)

**Files:**
- Create: `backend/app/deps.py`

- [ ] **Step 1: Create `backend/app/deps.py`**

```python
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.db import get_db
from app.services.auth import decode_access_token

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    user_id = decode_access_token(credentials.credentials)
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    db = get_db()
    user = await db.users.find_one({"_id": user_id})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/deps.py
git commit -m "feat: add auth dependency for protected routes"
```

---

### Task 3.3: Auth routes (register + login)

**Files:**
- Create: `backend/app/routes/__init__.py`
- Create: `backend/app/routes/auth.py`

- [ ] **Step 1: Create `backend/app/routes/auth.py`**

```python
from __future__ import annotations

import uuid

from fastapi import APIRouter, HTTPException, status

from app.db import get_db
from app.models.user import UserCreate, UserLogin
from app.services.auth import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: UserCreate):
    db = get_db()
    if await db.users.find_one({"username": body.username}):
        raise HTTPException(status_code=409, detail="Username taken")
    if await db.users.find_one({"email": body.email}):
        raise HTTPException(status_code=409, detail="Email taken")

    user_id = str(uuid.uuid4())
    user_doc = {
        "_id": user_id,
        "username": body.username,
        "email": body.email,
        "password_hash": hash_password(body.password),
        "avatar": "",
        "stats": {"matches_played": 0, "wins": 0, "total_score": 0.0, "problems_solved": 0},
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_id)
    return {"token": token, "user_id": user_id, "username": body.username}


@router.post("/login")
async def login(body: UserLogin):
    db = get_db()
    user = await db.users.find_one({"username": body.username})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(user["_id"])
    return {"token": token, "user_id": user["_id"], "username": user["username"]}
```

- [ ] **Step 2: Create `backend/app/routes/__init__.py`**

```python
```

- [ ] **Step 3: Wire auth router into `backend/main.py`**

Add to `main.py`:
```python
from app.routes.auth import router as auth_router

app.include_router(auth_router)
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/routes/ backend/main.py
git commit -m "feat: add register and login endpoints"
```

---

### Task 3.4: User profile route

**Files:**
- Create: `backend/app/routes/users.py`

- [ ] **Step 1: Create `backend/app/routes/users.py`**

```python
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.models.user import UserPublic, UserStats

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/me", response_model=UserPublic)
async def get_me(user: dict = Depends(get_current_user)):
    return UserPublic(
        id=user["_id"],
        username=user["username"],
        avatar=user.get("avatar", ""),
        stats=UserStats(**user.get("stats", {})),
    )
```

- [ ] **Step 2: Wire into `backend/main.py`**

```python
from app.routes.users import router as users_router

app.include_router(users_router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/routes/users.py backend/main.py
git commit -m "feat: add /api/users/me profile endpoint"
```

---

### Task 3.5: Auth tests

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_auth.py`

- [ ] **Step 1: Create `backend/tests/conftest.py`**

```python
from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.auth import create_access_token, hash_password


@pytest.fixture
def mock_db():
    db = MagicMock()
    db.users = AsyncMock()
    db.rooms = AsyncMock()
    db.problems = AsyncMock()
    db.submissions = AsyncMock()
    db.match_results = AsyncMock()
    return db


@pytest.fixture
def sample_user():
    return {
        "_id": "user-123",
        "username": "testuser",
        "email": "test@example.com",
        "password_hash": hash_password("password123"),
        "avatar": "",
        "stats": {"matches_played": 0, "wins": 0, "total_score": 0.0, "problems_solved": 0},
    }


@pytest.fixture
def auth_token():
    return create_access_token("user-123")
```

- [ ] **Step 2: Create `backend/tests/test_auth.py`**

```python
from __future__ import annotations

from app.services.auth import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_hash_and_verify_password():
    hashed = hash_password("mypassword")
    assert verify_password("mypassword", hashed)
    assert not verify_password("wrongpassword", hashed)


def test_create_and_decode_token():
    token = create_access_token("user-abc")
    user_id = decode_access_token(token)
    assert user_id == "user-abc"


def test_decode_invalid_token():
    result = decode_access_token("not.a.valid.token")
    assert result is None
```

- [ ] **Step 3: Create `backend/tests/__init__.py`**

```python
```

- [ ] **Step 4: Run tests**

Run: `cd backend && python -m pytest tests/test_auth.py -v`
Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/tests/
git commit -m "test: add auth service unit tests"
```

---

## Phase 4: Room Management

### Task 4.1: Room service

**Files:**
- Create: `backend/app/services/room.py`

- [ ] **Step 1: Create `backend/app/services/room.py`**

```python
from __future__ import annotations

import random
import string

from app.db import get_db


def generate_room_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


async def create_room(host_id: str, settings: dict) -> dict:
    db = get_db()
    code = generate_room_code()
    while await db.rooms.find_one({"code": code}):
        code = generate_room_code()

    room_doc = {
        "_id": code,
        "code": code,
        "host_id": host_id,
        "players": [host_id],
        "status": "waiting",
        "settings": settings,
        "problem_id": None,
    }
    await db.rooms.insert_one(room_doc)
    return room_doc


async def join_room(code: str, user_id: str) -> dict:
    db = get_db()
    room = await db.rooms.find_one({"code": code})
    if not room:
        raise ValueError("Room not found")
    if room["status"] != "waiting":
        raise ValueError("Match already in progress")
    if user_id in room["players"]:
        return room
    if len(room["players"]) >= 5:
        raise ValueError("Room is full")

    await db.rooms.update_one({"code": code}, {"$push": {"players": user_id}})
    return await db.rooms.find_one({"code": code})


async def leave_room(code: str, user_id: str) -> dict | None:
    db = get_db()
    await db.rooms.update_one({"code": code}, {"$pull": {"players": user_id}})
    room = await db.rooms.find_one({"code": code})
    if room and len(room["players"]) == 0:
        await db.rooms.delete_one({"code": code})
        return None
    return room


async def get_room(code: str) -> dict | None:
    db = get_db()
    return await db.rooms.find_one({"code": code})
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/services/room.py
git commit -m "feat: add room service with create, join, leave"
```

---

### Task 4.2: Room routes

**Files:**
- Create: `backend/app/routes/rooms.py`

- [ ] **Step 1: Create `backend/app/routes/rooms.py`**

```python
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.deps import get_current_user
from app.models.room import RoomCreate, RoomPublic
from app.services.room import create_room, get_room, join_room

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create(body: RoomCreate, user: dict = Depends(get_current_user)):
    room = await create_room(user["_id"], body.settings.model_dump())
    return {"code": room["code"]}


@router.get("/{code}", response_model=RoomPublic)
async def get(code: str, user: dict = Depends(get_current_user)):
    room = await get_room(code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return RoomPublic(
        code=room["code"],
        host_id=room["host_id"],
        players=room["players"],
        status=room["status"],
        settings=room["settings"],
        problem_id=room.get("problem_id"),
    )


@router.post("/{code}/join")
async def join(code: str, user: dict = Depends(get_current_user)):
    try:
        room = await join_room(code, user["_id"])
        return {"code": room["code"], "players": room["players"]}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

- [ ] **Step 2: Wire into `backend/main.py`**

```python
from app.routes.rooms import router as rooms_router

app.include_router(rooms_router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/routes/rooms.py backend/main.py
git commit -m "feat: add room REST endpoints (create, get, join)"
```

---

### Task 4.3: Room tests

**Files:**
- Create: `backend/tests/test_rooms.py`

- [ ] **Step 1: Create `backend/tests/test_rooms.py`**

```python
from __future__ import annotations

from app.services.room import generate_room_code


def test_room_code_format():
    code = generate_room_code()
    assert len(code) == 6
    assert code.isalnum()
    assert code.isupper() or any(c.isdigit() for c in code)


def test_room_code_uniqueness():
    codes = {generate_room_code() for _ in range(100)}
    assert len(codes) > 90  # statistically should be unique
```

- [ ] **Step 2: Run tests**

Run: `cd backend && python -m pytest tests/test_rooms.py -v`
Expected: 2 tests PASS

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_rooms.py
git commit -m "test: add room service unit tests"
```

---

## Phase 5: Problem Fetching (alfa-leetcode-api Integration)

### Task 5.1: Problem service

**Files:**
- Create: `backend/app/services/problem.py`

- [ ] **Step 1: Create `backend/app/services/problem.py`**

```python
from __future__ import annotations

import random
import re
from datetime import datetime, timezone

import httpx

from app.config import settings
from app.db import get_db


async def fetch_problems_list(
    difficulty: str | None = None,
    tags: list[str] | None = None,
    limit: int = 50,
) -> list[dict]:
    """Fetch problem list from alfa-leetcode-api."""
    async with httpx.AsyncClient(base_url=settings.leetcode_api_url) as client:
        if tags and len(tags) > 0:
            resp = await client.get(f"/problems", params={"limit": limit})
        else:
            resp = await client.get(f"/problems", params={"limit": limit})
        resp.raise_for_status()
        data = resp.json()

    problems = data.get("problemsetQuestionList", [])
    if difficulty:
        problems = [p for p in problems if p.get("difficulty") == difficulty]
    if tags:
        tag_set = {t.lower() for t in tags}
        problems = [
            p for p in problems
            if tag_set & {t["slug"].lower() for t in p.get("topicTags", [])}
        ]
    return problems


async def fetch_problem_detail(slug: str) -> dict:
    """Fetch full problem detail including description and sample cases."""
    async with httpx.AsyncClient(base_url=settings.leetcode_api_url) as client:
        resp = await client.get(f"/select", params={"titleSlug": slug})
        resp.raise_for_status()
        return resp.json()


def parse_sample_cases(description: str) -> list[dict]:
    """Extract sample test cases from problem description HTML."""
    cases = []
    input_pattern = re.compile(r"<strong>Input:</strong>\s*(.*?)\s*<", re.DOTALL)
    output_pattern = re.compile(r"<strong>Output:</strong>\s*(.*?)\s*<", re.DOTALL)

    inputs = input_pattern.findall(description)
    outputs = output_pattern.findall(description)

    for inp, out in zip(inputs, outputs):
        cases.append({
            "input": inp.strip(),
            "expected_output": out.strip(),
            "is_sample": True,
        })
    return cases


async def get_random_problem(
    difficulty: str | None = None,
    tags: list[str] | None = None,
) -> dict:
    """Fetch a random problem, cache it in DB, and return it."""
    db = get_db()

    problems = await fetch_problems_list(difficulty=difficulty, tags=tags)
    if not problems:
        raise ValueError("No problems found matching filters")

    chosen = random.choice(problems)
    slug = chosen["titleSlug"]

    cached = await db.problems.find_one({"slug": slug})
    if cached:
        return cached

    detail = await fetch_problem_detail(slug)
    test_cases = parse_sample_cases(detail.get("question", ""))

    problem_doc = {
        "_id": slug,
        "leetcode_id": chosen.get("frontendQuestionId", 0),
        "title": chosen.get("title", slug),
        "slug": slug,
        "difficulty": chosen.get("difficulty", "Medium"),
        "description": detail.get("question", ""),
        "tags": [t["slug"] for t in chosen.get("topicTags", [])],
        "test_cases": test_cases,
        "time_limit_ms": {"Easy": 2000, "Medium": 3000, "Hard": 5000}.get(
            chosen.get("difficulty", "Medium"), 3000
        ),
        "memory_limit_mb": 256,
        "fetched_at": datetime.now(timezone.utc),
    }

    await db.problems.replace_one({"_id": slug}, problem_doc, upsert=True)
    return problem_doc
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/services/problem.py
git commit -m "feat: add problem service with LeetCode API integration"
```

---

### Task 5.2: Problem routes

**Files:**
- Create: `backend/app/routes/problems.py`

- [ ] **Step 1: Create `backend/app/routes/problems.py`**

```python
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.deps import get_current_user
from app.services.problem import get_random_problem

router = APIRouter(prefix="/api/problems", tags=["problems"])


@router.get("/random")
async def random_problem(
    difficulty: str | None = Query(None),
    tags: str | None = Query(None),
    user: dict = Depends(get_current_user),
):
    tag_list = [t.strip() for t in tags.split(",")] if tags else []
    try:
        problem = await get_random_problem(difficulty=difficulty, tags=tag_list)
        sample_cases = [tc for tc in problem.get("test_cases", []) if tc.get("is_sample")]
        return {
            "id": problem["_id"],
            "leetcode_id": problem.get("leetcode_id"),
            "title": problem["title"],
            "slug": problem["slug"],
            "difficulty": problem["difficulty"],
            "description": problem["description"],
            "tags": problem.get("tags", []),
            "sample_cases": sample_cases,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/{problem_id}")
async def get_problem(problem_id: str, user: dict = Depends(get_current_user)):
    from app.db import get_db

    db = get_db()
    problem = await db.problems.find_one({"_id": problem_id})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    sample_cases = [tc for tc in problem.get("test_cases", []) if tc.get("is_sample")]
    return {
        "id": problem["_id"],
        "leetcode_id": problem.get("leetcode_id"),
        "title": problem["title"],
        "slug": problem["slug"],
        "difficulty": problem["difficulty"],
        "description": problem["description"],
        "tags": problem.get("tags", []),
        "sample_cases": sample_cases,
    }
```

- [ ] **Step 2: Wire into `backend/main.py`**

```python
from app.routes.problems import router as problems_router

app.include_router(problems_router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/routes/problems.py backend/main.py
git commit -m "feat: add problem REST endpoints (random, get by id)"
```

---

### Task 5.3: Problem parsing tests

**Files:**
- Create: `backend/tests/test_problems.py`

- [ ] **Step 1: Create `backend/tests/test_problems.py`**

```python
from __future__ import annotations

from app.services.problem import parse_sample_cases


SAMPLE_HTML = """
<p>Given an array of integers <code>nums</code>&nbsp;and an integer <code>target</code>.</p>
<p><strong>Example 1:</strong></p>
<pre>
<strong>Input:</strong> nums = [2,7,11,15], target = 9
<strong>Output:</strong> [0,1]
</pre>
<p><strong>Example 2:</strong></p>
<pre>
<strong>Input:</strong> nums = [3,2,4], target = 6
<strong>Output:</strong> [1,2]
</pre>
"""


def test_parse_sample_cases():
    cases = parse_sample_cases(SAMPLE_HTML)
    assert len(cases) == 2
    assert cases[0]["input"] == "nums = [2,7,11,15], target = 9"
    assert cases[0]["expected_output"] == "[0,1]"
    assert cases[0]["is_sample"] is True
    assert cases[1]["input"] == "nums = [3,2,4], target = 6"
    assert cases[1]["expected_output"] == "[1,2]"


def test_parse_empty_description():
    cases = parse_sample_cases("")
    assert cases == []


def test_parse_no_examples():
    cases = parse_sample_cases("<p>Some problem with no examples</p>")
    assert cases == []
```

- [ ] **Step 2: Run tests**

Run: `cd backend && python -m pytest tests/test_problems.py -v`
Expected: 3 tests PASS

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_problems.py
git commit -m "test: add problem parsing unit tests"
```

---

## Phase 6: Code Execution (Piston Integration)

### Task 6.1: Judge service

**Files:**
- Create: `backend/app/services/judge.py`

- [ ] **Step 1: Create `backend/app/services/judge.py`**

```python
from __future__ import annotations

from dataclasses import dataclass

import httpx

from app.config import settings

LANGUAGE_MAP = {
    "cpp": {"language": "c++", "version": "10.2.0"},
    "python": {"language": "python", "version": "3.10.0"},
}


@dataclass
class ExecutionResult:
    stdout: str
    stderr: str
    exit_code: int
    time_ms: int
    memory_mb: float
    compile_error: str = ""


async def execute_code(
    code: str,
    language: str,
    stdin: str = "",
    time_limit_ms: int = 5000,
    memory_limit_mb: int = 256,
) -> ExecutionResult:
    """Execute code via Piston API and return results."""
    lang_config = LANGUAGE_MAP.get(language)
    if not lang_config:
        raise ValueError(f"Unsupported language: {language}")

    payload = {
        "language": lang_config["language"],
        "version": lang_config["version"],
        "files": [{"name": f"solution.{'cpp' if language == 'cpp' else 'py'}", "content": code}],
        "stdin": stdin,
        "run_timeout": time_limit_ms,
        "compile_timeout": 10000,
        "run_memory_limit": memory_limit_mb * 1024 * 1024,
    }

    async with httpx.AsyncClient(base_url=settings.piston_url, timeout=30.0) as client:
        resp = await client.post("/api/v2/execute", json=payload)
        resp.raise_for_status()
        data = resp.json()

    compile_output = data.get("compile", {})
    run_output = data.get("run", {})

    if compile_output.get("stderr"):
        return ExecutionResult(
            stdout="",
            stderr=compile_output["stderr"],
            exit_code=1,
            time_ms=0,
            memory_mb=0.0,
            compile_error=compile_output["stderr"],
        )

    return ExecutionResult(
        stdout=run_output.get("stdout", "").strip(),
        stderr=run_output.get("stderr", "").strip(),
        exit_code=run_output.get("code", 0),
        time_ms=int(float(run_output.get("wall_time", 0)) * 1000) if run_output.get("wall_time") else 0,
        memory_mb=round(run_output.get("memory", 0) / (1024 * 1024), 2) if run_output.get("memory") else 0.0,
    )


async def judge_submission(
    code: str,
    language: str,
    test_cases: list[dict],
    time_limit_ms: int = 5000,
    memory_limit_mb: int = 256,
) -> dict:
    """Run code against all test cases and return judge result."""
    passed = 0
    total = len(test_cases)
    last_result = None

    for tc in test_cases:
        result = await execute_code(
            code=code,
            language=language,
            stdin=tc["input"],
            time_limit_ms=time_limit_ms,
            memory_limit_mb=memory_limit_mb,
        )
        last_result = result

        if result.compile_error:
            return {
                "result": "compile_error",
                "test_cases_passed": 0,
                "total_test_cases": total,
                "execution_time_ms": 0,
                "memory_used_mb": 0.0,
                "error": result.compile_error,
            }

        if result.exit_code != 0:
            return {
                "result": "runtime_error",
                "test_cases_passed": passed,
                "total_test_cases": total,
                "execution_time_ms": result.time_ms,
                "memory_used_mb": result.memory_mb,
                "error": result.stderr,
            }

        if result.time_ms > time_limit_ms:
            return {
                "result": "time_limit",
                "test_cases_passed": passed,
                "total_test_cases": total,
                "execution_time_ms": result.time_ms,
                "memory_used_mb": result.memory_mb,
            }

        if result.stdout.strip() == tc["expected_output"].strip():
            passed += 1
        else:
            return {
                "result": "wrong_answer",
                "test_cases_passed": passed,
                "total_test_cases": total,
                "execution_time_ms": result.time_ms,
                "memory_used_mb": result.memory_mb,
                "expected": tc["expected_output"],
                "got": result.stdout,
            }

    return {
        "result": "accepted",
        "test_cases_passed": passed,
        "total_test_cases": total,
        "execution_time_ms": last_result.time_ms if last_result else 0,
        "memory_used_mb": last_result.memory_mb if last_result else 0.0,
    }
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/services/judge.py
git commit -m "feat: add judge service with Piston code execution"
```

---

### Task 6.2: Judge tests (mocked Piston)

**Files:**
- Create: `backend/tests/test_judge.py`

- [ ] **Step 1: Create `backend/tests/test_judge.py`**

```python
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from app.services.judge import ExecutionResult, execute_code, judge_submission


@pytest.fixture
def mock_piston_success():
    return {
        "compile": {"stdout": "", "stderr": ""},
        "run": {"stdout": "hello\n", "stderr": "", "code": 0, "wall_time": "0.015", "memory": 5242880},
    }


@pytest.fixture
def mock_piston_compile_error():
    return {
        "compile": {"stdout": "", "stderr": "error: expected ';' before '}' token"},
        "run": {},
    }


@pytest.mark.asyncio
async def test_execute_code_success(mock_piston_success):
    mock_response = AsyncMock()
    mock_response.json.return_value = mock_piston_success
    mock_response.raise_for_status = lambda: None

    with patch("app.services.judge.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.post.return_value = mock_response
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        result = await execute_code('print("hello")', "python")
        assert result.stdout == "hello"
        assert result.exit_code == 0


@pytest.mark.asyncio
async def test_execute_code_compile_error(mock_piston_compile_error):
    mock_response = AsyncMock()
    mock_response.json.return_value = mock_piston_compile_error
    mock_response.raise_for_status = lambda: None

    with patch("app.services.judge.httpx.AsyncClient") as mock_client:
        instance = AsyncMock()
        instance.post.return_value = mock_response
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        mock_client.return_value = instance

        result = await execute_code("bad code {", "cpp")
        assert result.compile_error != ""
        assert result.exit_code == 1


def test_unsupported_language():
    with pytest.raises(ValueError, match="Unsupported language"):
        import asyncio
        asyncio.run(execute_code("code", "java"))
```

- [ ] **Step 2: Run tests**

Run: `cd backend && python -m pytest tests/test_judge.py -v`
Expected: 3 tests PASS

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_judge.py
git commit -m "test: add judge service tests with mocked Piston"
```

---

## Phase 7: Scoring Engine

### Task 7.1: Scoring service

**Files:**
- Create: `backend/app/services/scoring.py`

- [ ] **Step 1: Create `backend/app/services/scoring.py`**

```python
from __future__ import annotations

from app.db import get_db
from app.models.match_result import PlayerRanking


MAX_SCORE = 1000.0
TIME_PENALTY_PER_SEC = 1.0
ATTEMPT_PENALTY = 50.0
MIN_SCORE = 100.0


def calculate_full_solve_score(solve_time_seconds: float, failed_attempts: int) -> float:
    """Mode B: Points-based scoring when player gets AC."""
    score = MAX_SCORE - (TIME_PENALTY_PER_SEC * solve_time_seconds) - (ATTEMPT_PENALTY * failed_attempts)
    return max(score, MIN_SCORE)


def calculate_partial_score(
    test_cases_passed: int,
    total_test_cases: int,
    time_of_last_submission_seconds: float,
) -> float:
    """Mode C: Partial scoring when no one fully solves it."""
    if total_test_cases == 0:
        return 0.0
    ratio = test_cases_passed / total_test_cases
    score = ratio * MAX_SCORE - (TIME_PENALTY_PER_SEC * time_of_last_submission_seconds * 0.1)
    return max(score, 0.0)


async def compute_match_results(room_id: str, problem_id: str, match_duration_seconds: float) -> dict:
    """Compute final rankings for a finished match."""
    db = get_db()

    submissions = await db.submissions.find({"room_id": room_id, "problem_id": problem_id}).to_list(None)
    room = await db.rooms.find_one({"_id": room_id})
    if not room:
        raise ValueError("Room not found")

    player_ids = room["players"]
    player_data: dict[str, dict] = {}

    for pid in player_ids:
        player_subs = [s for s in submissions if s["user_id"] == pid]
        accepted = [s for s in player_subs if s["result"] == "accepted"]
        failed = [s for s in player_subs if s["result"] != "accepted"]

        best_passed = max((s["test_cases_passed"] for s in player_subs), default=0)
        total_cases = max((s["total_test_cases"] for s in player_subs), default=0)

        player_data[pid] = {
            "accepted": len(accepted) > 0,
            "first_ac_time": accepted[0]["submitted_at"] if accepted else None,
            "attempts": len(failed),
            "best_passed": best_passed,
            "total_cases": total_cases,
            "last_submission_time": player_subs[-1]["submitted_at"] if player_subs else None,
        }

    any_solved = any(pd["accepted"] for pd in player_data.values())
    scoring_mode = "full_solve" if any_solved else "partial"

    rankings = []
    for pid, pd in player_data.items():
        if scoring_mode == "full_solve":
            if pd["accepted"] and pd["first_ac_time"]:
                solve_seconds = pd["first_ac_time"].timestamp() - (
                    match_duration_seconds  # this will be replaced with match start time delta
                )
                score = calculate_full_solve_score(abs(solve_seconds), pd["attempts"])
            else:
                score = 0.0
        else:
            last_sub_seconds = match_duration_seconds if pd["last_submission_time"] else 0
            score = calculate_partial_score(pd["best_passed"], pd["total_cases"], last_sub_seconds)

        rankings.append(PlayerRanking(
            user_id=pid,
            score=round(score, 1),
            solve_time_ms=int(abs(solve_seconds * 1000)) if scoring_mode == "full_solve" and pd["accepted"] else 0,
            attempts=pd["attempts"],
            test_cases_passed=pd["best_passed"],
        ))

    rankings.sort(key=lambda r: (-r.score, r.solve_time_ms))

    result_doc = {
        "room_id": room_id,
        "problem_id": problem_id,
        "rankings": [r.model_dump() for r in rankings],
        "scoring_mode": scoring_mode,
    }
    await db.match_results.insert_one(result_doc)

    return result_doc
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/services/scoring.py
git commit -m "feat: add scoring engine with full-solve and partial modes"
```

---

### Task 7.2: Scoring tests

**Files:**
- Create: `backend/tests/test_scoring.py`

- [ ] **Step 1: Create `backend/tests/test_scoring.py`**

```python
from __future__ import annotations

from app.services.scoring import (
    calculate_full_solve_score,
    calculate_partial_score,
    MAX_SCORE,
    MIN_SCORE,
)


def test_full_solve_fast_no_failures():
    score = calculate_full_solve_score(solve_time_seconds=60, failed_attempts=0)
    assert score == MAX_SCORE - 60  # 940


def test_full_solve_with_failures():
    score = calculate_full_solve_score(solve_time_seconds=120, failed_attempts=3)
    # 1000 - 120 - 150 = 730
    assert score == 730.0


def test_full_solve_floor():
    score = calculate_full_solve_score(solve_time_seconds=900, failed_attempts=10)
    # 1000 - 900 - 500 = -400, floored to 100
    assert score == MIN_SCORE


def test_partial_all_passed():
    score = calculate_partial_score(
        test_cases_passed=10, total_test_cases=10, time_of_last_submission_seconds=300
    )
    # (10/10) * 1000 - (1 * 300 * 0.1) = 1000 - 30 = 970
    assert score == 970.0


def test_partial_half_passed():
    score = calculate_partial_score(
        test_cases_passed=5, total_test_cases=10, time_of_last_submission_seconds=600
    )
    # (5/10) * 1000 - (1 * 600 * 0.1) = 500 - 60 = 440
    assert score == 440.0


def test_partial_zero_cases():
    score = calculate_partial_score(
        test_cases_passed=0, total_test_cases=0, time_of_last_submission_seconds=0
    )
    assert score == 0.0


def test_partial_floor():
    score = calculate_partial_score(
        test_cases_passed=1, total_test_cases=100, time_of_last_submission_seconds=3600
    )
    # (1/100) * 1000 - (1 * 3600 * 0.1) = 10 - 360 = -350, floored to 0
    assert score == 0.0
```

- [ ] **Step 2: Run tests**

Run: `cd backend && python -m pytest tests/test_scoring.py -v`
Expected: 7 tests PASS

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_scoring.py
git commit -m "test: add scoring engine unit tests"
```

---

## Phase 8: WebSocket Real-Time System

### Task 8.1: WebSocket connection manager

**Files:**
- Create: `backend/app/ws/__init__.py`
- Create: `backend/app/ws/manager.py`

- [ ] **Step 1: Create `backend/app/ws/manager.py`**

```python
from __future__ import annotations

import json
from dataclasses import dataclass, field

from fastapi import WebSocket


@dataclass
class RoomConnection:
    user_id: str
    username: str
    websocket: WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.rooms: dict[str, list[RoomConnection]] = {}

    async def connect(self, room_code: str, user_id: str, username: str, ws: WebSocket) -> None:
        await ws.accept()
        conn = RoomConnection(user_id=user_id, username=username, websocket=ws)
        if room_code not in self.rooms:
            self.rooms[room_code] = []
        # Remove existing connection for same user (reconnect)
        self.rooms[room_code] = [c for c in self.rooms[room_code] if c.user_id != user_id]
        self.rooms[room_code].append(conn)

    def disconnect(self, room_code: str, user_id: str) -> None:
        if room_code in self.rooms:
            self.rooms[room_code] = [c for c in self.rooms[room_code] if c.user_id != user_id]
            if not self.rooms[room_code]:
                del self.rooms[room_code]

    async def send_to_user(self, room_code: str, user_id: str, event: str, data: dict) -> None:
        if room_code not in self.rooms:
            return
        for conn in self.rooms[room_code]:
            if conn.user_id == user_id:
                await conn.websocket.send_text(json.dumps({"event": event, **data}))
                break

    async def broadcast(self, room_code: str, event: str, data: dict) -> None:
        if room_code not in self.rooms:
            return
        message = json.dumps({"event": event, **data})
        for conn in self.rooms[room_code]:
            try:
                await conn.websocket.send_text(message)
            except Exception:
                pass  # connection already closed

    async def broadcast_except(self, room_code: str, exclude_user: str, event: str, data: dict) -> None:
        if room_code not in self.rooms:
            return
        message = json.dumps({"event": event, **data})
        for conn in self.rooms[room_code]:
            if conn.user_id != exclude_user:
                try:
                    await conn.websocket.send_text(message)
                except Exception:
                    pass

    def get_player_count(self, room_code: str) -> int:
        return len(self.rooms.get(room_code, []))


manager = ConnectionManager()
```

- [ ] **Step 2: Create `backend/app/ws/__init__.py`**

```python
from app.ws.manager import manager
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/ws/
git commit -m "feat: add WebSocket connection manager"
```

---

### Task 8.2: WebSocket match handlers

**Files:**
- Create: `backend/app/ws/handlers.py`

- [ ] **Step 1: Create `backend/app/ws/handlers.py`**

```python
from __future__ import annotations

import asyncio
import time
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.db import get_db
from app.models.room import DIFFICULTY_TIME_LIMITS
from app.services.auth import decode_access_token
from app.services.judge import judge_submission
from app.services.problem import get_random_problem
from app.services.scoring import compute_match_results
from app.ws.manager import manager

router = APIRouter()

# Track active match timers: room_code -> asyncio.Task
active_timers: dict[str, asyncio.Task] = {}
# Track match start times: room_code -> timestamp
match_start_times: dict[str, float] = {}
# Track submission rate limits: (room_code, user_id) -> last_submit_time
last_submission: dict[tuple[str, str], float] = {}


async def timer_task(room_code: str, duration_seconds: int) -> None:
    """Server-side authoritative timer that ticks every second."""
    remaining = duration_seconds
    while remaining > 0:
        await manager.broadcast(room_code, "match:timer_tick", {"remaining_seconds": remaining})
        await asyncio.sleep(1)
        remaining -= 1

    await manager.broadcast(room_code, "match:timer_tick", {"remaining_seconds": 0})
    await finish_match(room_code)


async def finish_match(room_code: str) -> None:
    """End the match, compute scores, broadcast results."""
    db = get_db()
    room = await db.rooms.find_one({"code": room_code})
    if not room or room["status"] != "in_progress":
        return

    start_time = match_start_times.pop(room_code, time.time())
    duration = time.time() - start_time

    result = await compute_match_results(room_code, room["problem_id"], duration)
    await db.rooms.update_one({"code": room_code}, {"$set": {"status": "finished"}})

    # Update player stats
    if result["rankings"]:
        winner_id = result["rankings"][0]["user_id"]
        for ranking in result["rankings"]:
            update = {
                "$inc": {
                    "stats.matches_played": 1,
                    "stats.total_score": ranking["score"],
                }
            }
            if ranking["test_cases_passed"] == ranking.get("total_test_cases", 0) and ranking["test_cases_passed"] > 0:
                update["$inc"]["stats.problems_solved"] = 1
            if ranking["user_id"] == winner_id:
                update["$inc"]["stats.wins"] = 1
            await db.users.update_one({"_id": ranking["user_id"]}, update)

    await manager.broadcast(room_code, "match:finished", {
        "rankings": result["rankings"],
        "scoring_mode": result["scoring_mode"],
    })

    if room_code in active_timers:
        active_timers[room_code].cancel()
        del active_timers[room_code]


@router.websocket("/ws/{room_code}")
async def websocket_endpoint(
    ws: WebSocket,
    room_code: str,
    token: str = Query(...),
):
    user_id = decode_access_token(token)
    if not user_id:
        await ws.close(code=4001, reason="Invalid token")
        return

    db = get_db()
    user = await db.users.find_one({"_id": user_id})
    if not user:
        await ws.close(code=4001, reason="User not found")
        return

    room = await db.rooms.find_one({"code": room_code})
    if not room or user_id not in room["players"]:
        await ws.close(code=4003, reason="Not a member of this room")
        return

    username = user["username"]
    await manager.connect(room_code, user_id, username, ws)
    await manager.broadcast(room_code, "room:player_joined", {
        "user": {"id": user_id, "username": username},
        "player_count": manager.get_player_count(room_code),
    })

    try:
        while True:
            data = await ws.receive_json()
            event = data.get("event")

            if event == "match:start":
                await handle_match_start(room_code, user_id, db)

            elif event == "match:submit":
                await handle_submission(room_code, user_id, data, db)

    except WebSocketDisconnect:
        manager.disconnect(room_code, user_id)
        await manager.broadcast(room_code, "room:player_left", {"user_id": user_id})


async def handle_match_start(room_code: str, user_id: str, db) -> None:
    """Host starts the match: fetch problem, set timer, broadcast."""
    room = await db.rooms.find_one({"code": room_code})
    if not room or room["host_id"] != user_id:
        await manager.send_to_user(room_code, user_id, "error", {"message": "Only host can start"})
        return
    if room["status"] != "waiting":
        await manager.send_to_user(room_code, user_id, "error", {"message": "Match already started"})
        return

    settings = room["settings"]
    difficulty = settings.get("difficulty_filter")
    tags = settings.get("tag_filters", [])

    try:
        problem = await get_random_problem(difficulty=difficulty, tags=tags)
    except ValueError as e:
        await manager.send_to_user(room_code, user_id, "error", {"message": str(e)})
        return

    if settings.get("time_mode") == "difficulty_based":
        time_limit = DIFFICULTY_TIME_LIMITS.get(problem["difficulty"], 1800)
    else:
        time_limit = settings.get("time_limit", 1800)

    await db.rooms.update_one(
        {"code": room_code},
        {"$set": {"status": "in_progress", "problem_id": problem["_id"]}},
    )

    sample_cases = [tc for tc in problem.get("test_cases", []) if tc.get("is_sample")]
    await manager.broadcast(room_code, "match:problem", {
        "problem": {
            "id": problem["_id"],
            "title": problem["title"],
            "difficulty": problem["difficulty"],
            "description": problem["description"],
            "tags": problem.get("tags", []),
            "sample_cases": sample_cases,
        },
        "time_limit": time_limit,
    })

    match_start_times[room_code] = time.time()
    timer = asyncio.create_task(timer_task(room_code, time_limit))
    active_timers[room_code] = timer


async def handle_submission(room_code: str, user_id: str, data: dict, db) -> None:
    """Player submits code: rate limit, judge, store, broadcast."""
    # Rate limit: 1 submission per 10 seconds
    key = (room_code, user_id)
    now = time.time()
    if key in last_submission and now - last_submission[key] < 10:
        wait = int(10 - (now - last_submission[key]))
        await manager.send_to_user(room_code, user_id, "error", {
            "message": f"Rate limited. Wait {wait}s",
        })
        return
    last_submission[key] = now

    room = await db.rooms.find_one({"code": room_code})
    if not room or room["status"] != "in_progress":
        return

    code = data.get("code", "")
    language = data.get("language", "python")
    if language not in ("cpp", "python"):
        await manager.send_to_user(room_code, user_id, "error", {"message": "Unsupported language"})
        return

    problem = await db.problems.find_one({"_id": room["problem_id"]})
    if not problem:
        return

    result = await judge_submission(
        code=code,
        language=language,
        test_cases=problem["test_cases"],
        time_limit_ms=problem.get("time_limit_ms", 3000),
        memory_limit_mb=problem.get("memory_limit_mb", 256),
    )

    submission_doc = {
        "room_id": room_code,
        "user_id": user_id,
        "problem_id": room["problem_id"],
        "language": language,
        "code": code,
        "result": result["result"],
        "test_cases_passed": result["test_cases_passed"],
        "total_test_cases": result["total_test_cases"],
        "execution_time_ms": result.get("execution_time_ms", 0),
        "memory_used_mb": result.get("memory_used_mb", 0.0),
        "submitted_at": datetime.now(timezone.utc),
    }
    await db.submissions.insert_one(submission_doc)

    # Send result to submitter
    await manager.send_to_user(room_code, user_id, "match:result", {
        "result": result["result"],
        "test_cases_passed": result["test_cases_passed"],
        "total_test_cases": result["total_test_cases"],
        "execution_time_ms": result.get("execution_time_ms", 0),
        "memory_used_mb": result.get("memory_used_mb", 0.0),
    })

    # Broadcast status update in live mode
    settings = room.get("settings", {})
    if settings.get("mode") == "live_status":
        attempts = await db.submissions.count_documents({"room_id": room_code, "user_id": user_id})
        await manager.broadcast(room_code, "match:status_update", {
            "user_id": user_id,
            "status": result["result"],
            "attempts": attempts,
            "test_cases_passed": result["test_cases_passed"],
        })

    # Check if accepted - if all players solved, end match early
    if result["result"] == "accepted":
        all_players = room["players"]
        solved_players = set()
        for pid in all_players:
            if await db.submissions.find_one({"room_id": room_code, "user_id": pid, "result": "accepted"}):
                solved_players.add(pid)
        if solved_players == set(all_players):
            await finish_match(room_code)
```

- [ ] **Step 2: Wire WebSocket router into `backend/main.py`**

```python
from app.ws.handlers import router as ws_router

app.include_router(ws_router)
```

- [ ] **Step 3: Commit**

```bash
git add backend/app/ws/handlers.py backend/main.py
git commit -m "feat: add WebSocket handlers for match lifecycle"
```

---

### Task 8.3: WebSocket tests

**Files:**
- Create: `backend/tests/test_ws.py`

- [ ] **Step 1: Create `backend/tests/test_ws.py`**

```python
from __future__ import annotations

from app.ws.manager import ConnectionManager


def test_manager_init():
    mgr = ConnectionManager()
    assert mgr.rooms == {}
    assert mgr.get_player_count("ROOM01") == 0


def test_disconnect_nonexistent_room():
    mgr = ConnectionManager()
    mgr.disconnect("NOROOM", "user1")  # should not raise
    assert mgr.rooms == {}


def test_get_player_count_empty():
    mgr = ConnectionManager()
    assert mgr.get_player_count("XYZ") == 0
```

- [ ] **Step 2: Run tests**

Run: `cd backend && python -m pytest tests/test_ws.py -v`
Expected: 3 tests PASS

- [ ] **Step 3: Commit**

```bash
git add backend/tests/test_ws.py
git commit -m "test: add WebSocket manager unit tests"
```

---

## Phase 9: Frontend Foundation

### Task 9.1: Scaffold React app with Vite + TypeScript + Tailwind

**Files:**
- Create: `frontend/package.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/tailwind.config.js`, `frontend/index.html`, `frontend/Dockerfile`

- [ ] **Step 1: Initialize Vite + React + TypeScript project**

```bash
cd code-arena/frontend
pnpm create vite . --template react-ts
pnpm install
pnpm add tailwindcss @tailwindcss/vite
pnpm add react-router-dom @monaco-editor/react
pnpm add -D @types/react-router-dom
```

- [ ] **Step 2: Configure Tailwind in `frontend/vite.config.ts`**

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": "http://localhost:8000",
      "/ws": { target: "ws://localhost:8000", ws: true },
    },
  },
});
```

- [ ] **Step 3: Add Tailwind import to `frontend/src/index.css`**

```css
@import "tailwindcss";
```

- [ ] **Step 4: Create `frontend/Dockerfile`**

```dockerfile
FROM node:22-slim

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

CMD ["pnpm", "dev"]
```

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "chore: scaffold frontend with Vite, React 19, TypeScript, Tailwind"
```

---

### Task 9.2: TypeScript types

**Files:**
- Create: `frontend/src/types/index.ts`

- [ ] **Step 1: Create `frontend/src/types/index.ts`**

```typescript
export interface UserStats {
  matches_played: number;
  wins: number;
  total_score: number;
  problems_solved: number;
}

export interface User {
  id: string;
  username: string;
  avatar: string;
  stats: UserStats;
}

export interface RoomSettings {
  mode: "blind" | "live_status";
  time_limit: number;
  time_mode: "custom" | "difficulty_based";
  difficulty_filter: "Easy" | "Medium" | "Hard" | null;
  tag_filters: string[];
}

export interface Room {
  code: string;
  host_id: string;
  players: string[];
  status: "waiting" | "in_progress" | "finished";
  settings: RoomSettings;
  problem_id: string | null;
}

export interface TestCase {
  input: string;
  expected_output: string;
  is_sample: boolean;
}

export interface Problem {
  id: string;
  leetcode_id: number;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  tags: string[];
  sample_cases: TestCase[];
}

export interface SubmissionResult {
  result: "accepted" | "wrong_answer" | "time_limit" | "runtime_error" | "compile_error";
  test_cases_passed: number;
  total_test_cases: number;
  execution_time_ms: number;
  memory_used_mb: number;
  expected?: string;
  got?: string;
  error?: string;
}

export interface PlayerRanking {
  user_id: string;
  score: number;
  solve_time_ms: number;
  attempts: number;
  test_cases_passed: number;
}

export interface MatchResult {
  rankings: PlayerRanking[];
  scoring_mode: "full_solve" | "partial";
}

export type Language = "cpp" | "python";
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/types/
git commit -m "feat: add TypeScript type definitions"
```

---

### Task 9.3: API service layer

**Files:**
- Create: `frontend/src/services/api.ts`

- [ ] **Step 1: Create `frontend/src/services/api.ts`**

```typescript
const API_URL = import.meta.env.VITE_API_URL || "";

function getToken(): string | null {
  return localStorage.getItem("token");
}

function headers(): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: headers(),
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

export const api = {
  register: (username: string, email: string, password: string) =>
    request<{ token: string; user_id: string; username: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    }),

  login: (username: string, password: string) =>
    request<{ token: string; user_id: string; username: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  getMe: () => request<{ id: string; username: string; avatar: string; stats: any }>("/api/users/me"),

  createRoom: (settings: any) =>
    request<{ code: string }>("/api/rooms", {
      method: "POST",
      body: JSON.stringify({ settings }),
    }),

  getRoom: (code: string) => request<any>(`/api/rooms/${code}`),

  joinRoom: (code: string) =>
    request<{ code: string; players: string[] }>(`/api/rooms/${code}/join`, { method: "POST" }),
};
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/api.ts
git commit -m "feat: add API service layer"
```

---

### Task 9.4: WebSocket service

**Files:**
- Create: `frontend/src/services/ws.ts`

- [ ] **Step 1: Create `frontend/src/services/ws.ts`**

```typescript
type EventHandler = (data: any) => void;

export class ArenaSocket {
  private ws: WebSocket | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();

  connect(roomCode: string, token: string): void {
    const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.host}`;
    this.ws = new WebSocket(`${wsUrl}/ws/${roomCode}?token=${token}`);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const eventName = data.event;
      const eventHandlers = this.handlers.get(eventName) || [];
      eventHandlers.forEach((handler) => handler(data));
    };

    this.ws.onclose = () => {
      const closeHandlers = this.handlers.get("close") || [];
      closeHandlers.forEach((handler) => handler({}));
    };
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
    return () => {
      const handlers = this.handlers.get(event) || [];
      this.handlers.set(event, handlers.filter((h) => h !== handler));
    };
  }

  send(event: string, data: Record<string, any> = {}): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, ...data }));
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.handlers.clear();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/ws.ts
git commit -m "feat: add WebSocket client service"
```

---

### Task 9.5: Auth context and hooks

**Files:**
- Create: `frontend/src/context/AuthContext.tsx`
- Create: `frontend/src/hooks/useAuth.ts`

- [ ] **Step 1: Create `frontend/src/context/AuthContext.tsx`**

```tsx
import { createContext, useState, useEffect, ReactNode } from "react";
import { api } from "../services/api";

interface AuthState {
  token: string | null;
  userId: string | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem("userId"));
  const [username, setUsername] = useState<string | null>(localStorage.getItem("username"));

  const setAuth = (t: string, uid: string, uname: string) => {
    localStorage.setItem("token", t);
    localStorage.setItem("userId", uid);
    localStorage.setItem("username", uname);
    setToken(t);
    setUserId(uid);
    setUsername(uname);
  };

  const login = async (uname: string, password: string) => {
    const res = await api.login(uname, password);
    setAuth(res.token, res.user_id, res.username);
  };

  const register = async (uname: string, email: string, password: string) => {
    const res = await api.register(uname, email, password);
    setAuth(res.token, res.user_id, res.username);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setToken(null);
    setUserId(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, userId, username, isAuthenticated: !!token, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
```

- [ ] **Step 2: Create `frontend/src/hooks/useAuth.ts`**

```typescript
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/context/ frontend/src/hooks/useAuth.ts
git commit -m "feat: add auth context and useAuth hook"
```

---

### Task 9.6: App routing and protected routes

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/main.tsx`
- Create: `frontend/src/components/ProtectedRoute.tsx`
- Create: `frontend/src/components/Navbar.tsx`

- [ ] **Step 1: Create `frontend/src/components/ProtectedRoute.tsx`**

```tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

- [ ] **Step 2: Create `frontend/src/components/Navbar.tsx`**

```tsx
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Navbar() {
  const { isAuthenticated, username, logout } = useAuth();

  return (
    <nav className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-xl font-bold">
        Code Arena
      </Link>
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="hover:text-gray-300">
              Dashboard
            </Link>
            <span className="text-gray-400">{username}</span>
            <button onClick={logout} className="text-red-400 hover:text-red-300">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:text-gray-300">Login</Link>
            <Link to="/register" className="bg-blue-600 px-3 py-1 rounded hover:bg-blue-500">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Update `frontend/src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Navbar } from "./components/Navbar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Lobby } from "./pages/Lobby";
import { Arena } from "./pages/Arena";
import { Results } from "./pages/Results";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/room/:code" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
          <Route path="/room/:code/arena" element={<ProtectedRoute><Arena /></ProtectedRoute>} />
          <Route path="/room/:code/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
```

- [ ] **Step 4: Update `frontend/src/main.tsx`**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/
git commit -m "feat: add routing, protected routes, and navbar"
```

---

## Phase 10: Frontend Pages

### Task 10.1: Landing, Login, Register pages

**Files:**
- Create: `frontend/src/pages/Landing.tsx`
- Create: `frontend/src/pages/Login.tsx`
- Create: `frontend/src/pages/Register.tsx`

- [ ] **Step 1: Create `frontend/src/pages/Landing.tsx`**

```tsx
import { Link } from "react-router-dom";

export function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold mb-4">Code Arena</h1>
      <p className="text-xl text-gray-400 mb-8 max-w-md text-center">
        Race your friends to solve coding problems. Real-time competition with built-in C++ and Python execution.
      </p>
      <div className="flex gap-4">
        <Link to="/register" className="bg-blue-600 px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-500">
          Get Started
        </Link>
        <Link to="/login" className="border border-gray-600 px-6 py-3 rounded-lg text-lg hover:bg-gray-800">
          Login
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/pages/Login.tsx`**

```tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6">Login</h2>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <input
          type="text" placeholder="Username" value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 p-3 bg-gray-800 rounded border border-gray-700 focus:border-blue-500 outline-none"
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 p-3 bg-gray-800 rounded border border-gray-700 focus:border-blue-500 outline-none"
        />
        <button type="submit" className="w-full bg-blue-600 py-3 rounded font-semibold hover:bg-blue-500">
          Login
        </button>
        <p className="mt-4 text-gray-400 text-center">
          No account? <Link to="/register" className="text-blue-400 hover:underline">Register</Link>
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/pages/Register.tsx`**

```tsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register(username, email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-gray-900 p-8 rounded-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6">Register</h2>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <input
          type="text" placeholder="Username" value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full mb-4 p-3 bg-gray-800 rounded border border-gray-700 focus:border-blue-500 outline-none"
        />
        <input
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 p-3 bg-gray-800 rounded border border-gray-700 focus:border-blue-500 outline-none"
        />
        <input
          type="password" placeholder="Password (min 6 chars)" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 p-3 bg-gray-800 rounded border border-gray-700 focus:border-blue-500 outline-none"
        />
        <button type="submit" className="w-full bg-blue-600 py-3 rounded font-semibold hover:bg-blue-500">
          Register
        </button>
        <p className="mt-4 text-gray-400 text-center">
          Have an account? <Link to="/login" className="text-blue-400 hover:underline">Login</Link>
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Landing.tsx frontend/src/pages/Login.tsx frontend/src/pages/Register.tsx
git commit -m "feat: add Landing, Login, and Register pages"
```

---

### Task 10.2: Dashboard page

**Files:**
- Create: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: Create `frontend/src/pages/Dashboard.tsx`**

```tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import type { RoomSettings } from "../types";

export function Dashboard() {
  const { username } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [settings, setSettings] = useState<RoomSettings>({
    mode: "blind",
    time_limit: 1800,
    time_mode: "difficulty_based",
    difficulty_filter: null,
    tag_filters: [],
  });

  useEffect(() => {
    api.getMe().then((u) => setStats(u.stats)).catch(() => {});
  }, []);

  const handleCreate = async () => {
    setError("");
    try {
      const res = await api.createRoom(settings);
      navigate(`/room/${res.code}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleJoin = async () => {
    setError("");
    if (!joinCode.trim()) return;
    try {
      await api.joinRoom(joinCode.toUpperCase());
      navigate(`/room/${joinCode.toUpperCase()}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Welcome, {username}</h1>
      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats && (
          <>
            <div className="bg-gray-900 p-6 rounded-lg">
              <p className="text-gray-400 text-sm">Matches Played</p>
              <p className="text-3xl font-bold">{stats.matches_played}</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <p className="text-gray-400 text-sm">Wins</p>
              <p className="text-3xl font-bold text-green-400">{stats.wins}</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <p className="text-gray-400 text-sm">Problems Solved</p>
              <p className="text-3xl font-bold text-blue-400">{stats.problems_solved}</p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Create Room</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mode</label>
              <select
                value={settings.mode}
                onChange={(e) => setSettings({ ...settings, mode: e.target.value as any })}
                className="w-full p-2 bg-gray-800 rounded border border-gray-700"
              >
                <option value="blind">Blind Race</option>
                <option value="live_status">Live Status Board</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
              <select
                value={settings.difficulty_filter || ""}
                onChange={(e) => setSettings({ ...settings, difficulty_filter: e.target.value || null } as any)}
                className="w-full p-2 bg-gray-800 rounded border border-gray-700"
              >
                <option value="">Any</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Timer</label>
              <select
                value={settings.time_mode}
                onChange={(e) => setSettings({ ...settings, time_mode: e.target.value as any })}
                className="w-full p-2 bg-gray-800 rounded border border-gray-700"
              >
                <option value="difficulty_based">Auto (by difficulty)</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {settings.time_mode === "custom" && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Time Limit: {Math.floor(settings.time_limit / 60)} min
                </label>
                <input
                  type="range" min={300} max={7200} step={300}
                  value={settings.time_limit}
                  onChange={(e) => setSettings({ ...settings, time_limit: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}
            <button onClick={handleCreate} className="w-full bg-blue-600 py-3 rounded font-semibold hover:bg-blue-500">
              Create Room
            </button>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Join Room</h2>
          <input
            type="text" placeholder="Enter room code (e.g. ABC123)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-full mb-4 p-3 bg-gray-800 rounded border border-gray-700 focus:border-blue-500 outline-none text-center text-2xl tracking-widest"
          />
          <button onClick={handleJoin} className="w-full bg-green-600 py-3 rounded font-semibold hover:bg-green-500">
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx
git commit -m "feat: add Dashboard page with create/join room and stats"
```

---

### Task 10.3: Lobby page

**Files:**
- Create: `frontend/src/pages/Lobby.tsx`
- Create: `frontend/src/hooks/useWebSocket.ts`
- Create: `frontend/src/components/PlayerList.tsx`

- [ ] **Step 1: Create `frontend/src/hooks/useWebSocket.ts`**

```typescript
import { useEffect, useRef } from "react";
import { ArenaSocket } from "../services/ws";

export function useWebSocket(roomCode: string | undefined, token: string | null) {
  const socketRef = useRef<ArenaSocket | null>(null);

  useEffect(() => {
    if (!roomCode || !token) return;
    const socket = new ArenaSocket();
    socket.connect(roomCode, token);
    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomCode, token]);

  return socketRef;
}
```

- [ ] **Step 2: Create `frontend/src/components/PlayerList.tsx`**

```tsx
interface Player {
  id: string;
  username: string;
}

interface Props {
  players: Player[];
  hostId: string;
}

export function PlayerList({ players, hostId }: Props) {
  return (
    <div className="space-y-2">
      {players.map((p) => (
        <div key={p.id} className="flex items-center gap-2 bg-gray-800 p-3 rounded">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
            {p.username[0].toUpperCase()}
          </div>
          <span>{p.username}</span>
          {p.id === hostId && (
            <span className="text-xs bg-yellow-600 px-2 py-0.5 rounded ml-auto">HOST</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/pages/Lobby.tsx`**

```tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWebSocket } from "../hooks/useWebSocket";
import { api } from "../services/api";
import { PlayerList } from "../components/PlayerList";

export function Lobby() {
  const { code } = useParams<{ code: string }>();
  const { token, userId } = useAuth();
  const navigate = useNavigate();
  const socketRef = useWebSocket(code, token);
  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    if (!code) return;
    api.getRoom(code).then((r) => {
      setRoom(r);
    });
  }, [code]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const unsub1 = socket.on("room:player_joined", (data) => {
      setPlayers((prev) => {
        if (prev.find((p) => p.id === data.user.id)) return prev;
        return [...prev, data.user];
      });
    });

    const unsub2 = socket.on("room:player_left", (data) => {
      setPlayers((prev) => prev.filter((p) => p.id !== data.user_id));
    });

    const unsub3 = socket.on("match:problem", () => {
      navigate(`/room/${code}/arena`);
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [socketRef.current, code, navigate]);

  const isHost = room?.host_id === userId;

  const handleStart = () => {
    socketRef.current?.send("match:start");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-2">Room Lobby</h1>
      <p className="text-5xl font-mono tracking-widest text-blue-400 mb-8">{code}</p>
      <p className="text-gray-400 mb-6">Share this code with friends to join</p>

      <div className="w-full max-w-md mb-8">
        <PlayerList players={players} hostId={room?.host_id || ""} />
      </div>

      {room && (
        <div className="text-sm text-gray-400 mb-6">
          Mode: {room.settings.mode === "blind" ? "Blind Race" : "Live Status"} |
          Difficulty: {room.settings.difficulty_filter || "Any"} |
          Timer: {room.settings.time_mode === "difficulty_based" ? "Auto" : `${Math.floor(room.settings.time_limit / 60)}min`}
        </div>
      )}

      {isHost && (
        <button
          onClick={handleStart}
          disabled={players.length < 2}
          className="bg-green-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Match {players.length < 2 && "(need 2+ players)"}
        </button>
      )}
      {!isHost && <p className="text-gray-400">Waiting for host to start...</p>}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Lobby.tsx frontend/src/hooks/useWebSocket.ts frontend/src/components/PlayerList.tsx
git commit -m "feat: add Lobby page with player list and WebSocket"
```

---

### Task 10.4: Arena page - Editor, Timer, Problem Panel

**Files:**
- Create: `frontend/src/components/Editor.tsx`
- Create: `frontend/src/components/Timer.tsx`
- Create: `frontend/src/components/ProblemPanel.tsx`
- Create: `frontend/src/components/TestResults.tsx`
- Create: `frontend/src/components/StatusBar.tsx`
- Create: `frontend/src/hooks/useTimer.ts`
- Create: `frontend/src/pages/Arena.tsx`

- [ ] **Step 1: Create `frontend/src/hooks/useTimer.ts`**

```typescript
import { useState, useEffect, useRef } from "react";

export function useTimer() {
  const [remaining, setRemaining] = useState<number>(0);
  const callbackRef = useRef<(() => void) | null>(null);

  const setFromServer = (seconds: number) => setRemaining(seconds);

  const onExpire = (cb: () => void) => {
    callbackRef.current = cb;
  };

  useEffect(() => {
    if (remaining === 0 && callbackRef.current) {
      callbackRef.current();
    }
  }, [remaining]);

  const formatted = `${Math.floor(remaining / 60).toString().padStart(2, "0")}:${(remaining % 60).toString().padStart(2, "0")}`;

  return { remaining, formatted, setFromServer, onExpire };
}
```

- [ ] **Step 2: Create `frontend/src/components/Timer.tsx`**

```tsx
interface Props {
  formatted: string;
  remaining: number;
}

export function Timer({ formatted, remaining }: Props) {
  const isUrgent = remaining > 0 && remaining <= 60;
  return (
    <div className={`text-3xl font-mono font-bold ${isUrgent ? "text-red-400 animate-pulse" : "text-white"}`}>
      {formatted}
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend/src/components/ProblemPanel.tsx`**

```tsx
import type { Problem } from "../types";

interface Props {
  problem: Problem | null;
}

export function ProblemPanel({ problem }: Props) {
  if (!problem) {
    return <div className="p-6 text-gray-400">Waiting for problem...</div>;
  }

  const diffColor = { Easy: "text-green-400", Medium: "text-yellow-400", Hard: "text-red-400" }[problem.difficulty];

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-bold">{problem.title}</h2>
        <span className={`text-sm font-semibold ${diffColor}`}>{problem.difficulty}</span>
      </div>
      <div className="flex gap-2 mb-4">
        {problem.tags.map((tag) => (
          <span key={tag} className="text-xs bg-gray-700 px-2 py-1 rounded">{tag}</span>
        ))}
      </div>
      <div
        className="prose prose-invert max-w-none text-sm"
        dangerouslySetInnerHTML={{ __html: problem.description }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Create `frontend/src/components/Editor.tsx`**

```tsx
import MonacoEditor from "@monaco-editor/react";
import type { Language } from "../types";

interface Props {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  code: string;
  onCodeChange: (code: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  isRunning: boolean;
}

const STARTER_CODE: Record<Language, string> = {
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Read input from stdin
    // Write output to stdout
    return 0;
}`,
  python: `# Read input from stdin
# Write output to stdout
`,
};

export function Editor({ language, onLanguageChange, code, onCodeChange, onRun, onSubmit, isRunning }: Props) {
  const handleLangSwitch = (lang: Language) => {
    onLanguageChange(lang);
    if (!code || code === STARTER_CODE[language]) {
      onCodeChange(STARTER_CODE[lang]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
        <button
          onClick={() => handleLangSwitch("cpp")}
          className={`px-3 py-1 rounded text-sm ${language === "cpp" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
        >
          C++
        </button>
        <button
          onClick={() => handleLangSwitch("python")}
          className={`px-3 py-1 rounded text-sm ${language === "python" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
        >
          Python
        </button>
        <div className="ml-auto flex gap-2">
          <button
            onClick={onRun} disabled={isRunning}
            className="px-4 py-1 bg-gray-600 rounded text-sm hover:bg-gray-500 disabled:opacity-50"
          >
            Run
          </button>
          <button
            onClick={onSubmit} disabled={isRunning}
            className="px-4 py-1 bg-green-600 rounded text-sm hover:bg-green-500 disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      </div>
      <div className="flex-1">
        <MonacoEditor
          height="100%"
          language={language === "cpp" ? "cpp" : "python"}
          theme="vs-dark"
          value={code}
          onChange={(val) => onCodeChange(val || "")}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
          }}
        />
      </div>
    </div>
  );
}

export { STARTER_CODE };
```

- [ ] **Step 5: Create `frontend/src/components/TestResults.tsx`**

```tsx
import type { SubmissionResult } from "../types";

interface Props {
  result: SubmissionResult | null;
  isRunning: boolean;
}

export function TestResults({ result, isRunning }: Props) {
  if (isRunning) {
    return <div className="p-4 text-yellow-400">Running...</div>;
  }
  if (!result) {
    return <div className="p-4 text-gray-500">Submit your code to see results</div>;
  }

  const statusColor: Record<string, string> = {
    accepted: "text-green-400",
    wrong_answer: "text-red-400",
    time_limit: "text-yellow-400",
    runtime_error: "text-orange-400",
    compile_error: "text-red-400",
  };

  const statusLabel: Record<string, string> = {
    accepted: "Accepted",
    wrong_answer: "Wrong Answer",
    time_limit: "Time Limit Exceeded",
    runtime_error: "Runtime Error",
    compile_error: "Compile Error",
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-4 mb-2">
        <span className={`font-bold ${statusColor[result.result]}`}>
          {statusLabel[result.result]}
        </span>
        <span className="text-gray-400 text-sm">
          {result.test_cases_passed}/{result.total_test_cases} test cases passed
        </span>
        <span className="text-gray-400 text-sm">{result.execution_time_ms}ms</span>
        <span className="text-gray-400 text-sm">{result.memory_used_mb}MB</span>
      </div>
      {result.error && <pre className="text-red-400 text-sm bg-gray-800 p-2 rounded mt-2">{result.error}</pre>}
      {result.expected && result.got && (
        <div className="text-sm mt-2 space-y-1">
          <p><span className="text-gray-400">Expected:</span> {result.expected}</p>
          <p><span className="text-gray-400">Got:</span> {result.got}</p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create `frontend/src/components/StatusBar.tsx`**

```tsx
interface StatusEntry {
  user_id: string;
  username?: string;
  status: string;
  attempts: number;
  test_cases_passed: number;
}

interface Props {
  entries: StatusEntry[];
  mode: "blind" | "live_status";
}

export function StatusBar({ entries, mode }: Props) {
  if (mode === "blind") return null;

  const statusColor: Record<string, string> = {
    accepted: "text-green-400",
    wrong_answer: "text-red-400",
    time_limit: "text-yellow-400",
    runtime_error: "text-orange-400",
    compile_error: "text-red-400",
  };

  return (
    <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex gap-6">
      {entries.map((e) => (
        <div key={e.user_id} className="flex items-center gap-2 text-sm">
          <span className="font-semibold">@{e.username || e.user_id.slice(0, 8)}</span>
          <span className={statusColor[e.status] || "text-gray-400"}>
            {e.status === "accepted" ? "AC" : `${e.test_cases_passed} passed`}
          </span>
          <span className="text-gray-500">{e.attempts} attempts</span>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 7: Create `frontend/src/pages/Arena.tsx`**

```tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWebSocket } from "../hooks/useWebSocket";
import { useTimer } from "../hooks/useTimer";
import { Editor, STARTER_CODE } from "../components/Editor";
import { Timer } from "../components/Timer";
import { ProblemPanel } from "../components/ProblemPanel";
import { TestResults } from "../components/TestResults";
import { StatusBar } from "../components/StatusBar";
import type { Problem, SubmissionResult, Language } from "../types";

export function Arena() {
  const { code: roomCode } = useParams<{ code: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const socketRef = useWebSocket(roomCode, token);
  const timer = useTimer();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [language, setLanguage] = useState<Language>("python");
  const [codeText, setCodeText] = useState(STARTER_CODE.python);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [statusEntries, setStatusEntries] = useState<any[]>([]);
  const [roomMode, setRoomMode] = useState<"blind" | "live_status">("blind");

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const unsub1 = socket.on("match:problem", (data) => {
      setProblem(data.problem);
      setRoomMode(data.mode || "blind");
    });

    const unsub2 = socket.on("match:timer_tick", (data) => {
      timer.setFromServer(data.remaining_seconds);
    });

    const unsub3 = socket.on("match:result", (data) => {
      setResult(data);
      setIsRunning(false);
    });

    const unsub4 = socket.on("match:status_update", (data) => {
      setStatusEntries((prev) => {
        const existing = prev.findIndex((e) => e.user_id === data.user_id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [...prev, data];
      });
    });

    const unsub5 = socket.on("match:finished", () => {
      navigate(`/room/${roomCode}/results`);
    });

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); };
  }, [socketRef.current, roomCode, navigate]);

  const handleSubmit = () => {
    setIsRunning(true);
    setResult(null);
    socketRef.current?.send("match:submit", { code: codeText, language });
  };

  const handleRun = () => {
    // Run uses same submit flow but only sample cases (handled server-side in future)
    handleSubmit();
  };

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col">
      {/* Header bar */}
      <div className="bg-gray-900 px-6 py-3 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-4">
          <Timer formatted={timer.formatted} remaining={timer.remaining} />
          {problem && (
            <span className="text-gray-400">
              {problem.title} ({problem.difficulty})
            </span>
          )}
        </div>
        <span className="text-gray-500 font-mono">{roomCode}</span>
      </div>

      {/* Main split pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem */}
        <div className="w-1/2 border-r border-gray-700 overflow-y-auto">
          <ProblemPanel problem={problem} />
        </div>
        {/* Right: Editor */}
        <div className="w-1/2 flex flex-col">
          <div className="flex-1">
            <Editor
              language={language}
              onLanguageChange={setLanguage}
              code={codeText}
              onCodeChange={setCodeText}
              onRun={handleRun}
              onSubmit={handleSubmit}
              isRunning={isRunning}
            />
          </div>
          {/* Test Results */}
          <div className="h-36 border-t border-gray-700 overflow-y-auto bg-gray-900">
            <TestResults result={result} isRunning={isRunning} />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <StatusBar entries={statusEntries} mode={roomMode} />
    </div>
  );
}
```

- [ ] **Step 8: Commit**

```bash
git add frontend/src/components/ frontend/src/hooks/useTimer.ts frontend/src/pages/Arena.tsx
git commit -m "feat: add Arena page with Monaco editor, timer, and live status"
```

---

### Task 10.5: Results page

**Files:**
- Create: `frontend/src/pages/Results.tsx`
- Create: `frontend/src/components/Scoreboard.tsx`

- [ ] **Step 1: Create `frontend/src/components/Scoreboard.tsx`**

```tsx
import type { PlayerRanking } from "../types";

interface Props {
  rankings: PlayerRanking[];
  scoringMode: "full_solve" | "partial";
}

export function Scoreboard({ rankings, scoringMode }: Props) {
  const medals = ["bg-yellow-500", "bg-gray-400", "bg-amber-700"];

  return (
    <div className="w-full max-w-2xl">
      <div className="text-sm text-gray-400 mb-4">
        Scoring: {scoringMode === "full_solve" ? "Full Solve (time + attempts)" : "Partial (test cases passed)"}
      </div>
      <div className="space-y-3">
        {rankings.map((r, i) => (
          <div
            key={r.user_id}
            className={`flex items-center gap-4 bg-gray-900 p-4 rounded-lg ${i === 0 ? "ring-2 ring-yellow-500" : ""}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${medals[i] || "bg-gray-700"}`}>
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{r.user_id.slice(0, 8)}</p>
              <p className="text-sm text-gray-400">
                {r.test_cases_passed} cases passed | {r.attempts} attempts
                {r.solve_time_ms > 0 && ` | ${(r.solve_time_ms / 1000).toFixed(1)}s`}
              </p>
            </div>
            <div className="text-2xl font-bold text-blue-400">{r.score.toFixed(0)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend/src/pages/Results.tsx`**

```tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWebSocket } from "../hooks/useWebSocket";
import { Scoreboard } from "../components/Scoreboard";
import type { MatchResult } from "../types";

export function Results() {
  const { code: roomCode } = useParams<{ code: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const socketRef = useWebSocket(roomCode, token);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const unsub = socket.on("match:finished", (data) => {
      setMatchResult({ rankings: data.rankings, scoring_mode: data.scoring_mode });
    });

    return unsub;
  }, [socketRef.current]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-2">Match Results</h1>
      <p className="text-gray-400 mb-8">Room: {roomCode}</p>

      {matchResult ? (
        <Scoreboard rankings={matchResult.rankings} scoringMode={matchResult.scoring_mode} />
      ) : (
        <p className="text-gray-400">Loading results...</p>
      )}

      <div className="flex gap-4 mt-8">
        <button
          onClick={() => navigate(`/room/${roomCode}`)}
          className="bg-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-500"
        >
          Play Again
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="border border-gray-600 px-6 py-3 rounded-lg hover:bg-gray-800"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Results.tsx frontend/src/components/Scoreboard.tsx
git commit -m "feat: add Results page with scoreboard"
```

---

## Phase 11: Integration and Polish

### Task 11.1: Install Piston language runtimes

**Files:** None (Docker runtime setup)

- [ ] **Step 1: Start Piston and install C++ and Python runtimes**

After `docker compose up -d piston`, install runtimes:

```bash
# Install Python 3.10
curl -X POST http://localhost:2000/api/v2/packages -H "Content-Type: application/json" \
  -d '{"language": "python", "version": "3.10.0"}'

# Install C++ (gcc 10.2)
curl -X POST http://localhost:2000/api/v2/packages -H "Content-Type: application/json" \
  -d '{"language": "c++", "version": "10.2.0"}'
```

- [ ] **Step 2: Verify runtimes installed**

```bash
curl http://localhost:2000/api/v2/runtimes | python -m json.tool
```
Expected: Output includes entries for `python 3.10.0` and `c++ 10.2.0`

- [ ] **Step 3: Document in README (later in Task 11.3)**

---

### Task 11.2: End-to-end smoke test

- [ ] **Step 1: Start all services**

```bash
cd code-arena
docker compose up -d
```

- [ ] **Step 2: Verify backend health**

```bash
curl http://localhost:8000/api/health
```
Expected: `{"status":"ok"}`

- [ ] **Step 3: Verify frontend**

Open `http://localhost:5173` in browser - should see Landing page.

- [ ] **Step 4: Manual flow test**

1. Register two users in separate browser tabs
2. User 1 creates a room with "Easy" difficulty, "Blind" mode
3. User 2 joins using the room code
4. User 1 starts the match
5. Both get redirected to Arena with a problem loaded
6. Submit a solution - verify execution result comes back
7. Timer should tick down
8. When one gets AC or timer expires, Results page shows scoreboard

---

### Task 11.3: README and final cleanup

**Files:**
- Create: `README.md` (overwrite GitHub default)

- [ ] **Step 1: Write `README.md`**

```markdown
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

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Monaco Editor
- **Backend:** FastAPI, Python 3.13, WebSocket
- **Database:** MongoDB 7
- **Code Execution:** Piston (self-hosted, MIT)
- **Problem Source:** alfa-leetcode-api (MIT)

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

# Open
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000/docs
```

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
  docker-compose.yml     # All 5 services
  backend/               # FastAPI + WebSocket
    app/
      routes/            # REST API endpoints
      ws/                # WebSocket handlers
      services/          # Business logic (judge, scoring, room, problem)
      models/            # Pydantic models
  frontend/              # React 19 + Vite
    src/
      pages/             # Landing, Auth, Dashboard, Lobby, Arena, Results
      components/        # Editor, Timer, StatusBar, Scoreboard, etc.
      hooks/             # useWebSocket, useTimer, useAuth
      services/          # API and WebSocket clients
```
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions"
```

- [ ] **Step 3: Push all work to remote**

```bash
git push origin main
```
