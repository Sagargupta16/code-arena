from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db import connect_db, close_db
from app.routes.auth import router as auth_router
from app.routes.users import router as users_router
from app.routes.rooms import router as rooms_router
from app.routes.problems import router as problems_router
from app.ws.handlers import router as ws_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(title="Code Arena", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(rooms_router)
app.include_router(problems_router)
app.include_router(ws_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
