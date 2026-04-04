from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class RoomSettings(BaseModel):
    mode: Literal["blind", "live_status"] = "blind"
    time_limit: int = Field(default=1800, ge=300, le=7200)
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
    "Easy": 900,
    "Medium": 1800,
    "Hard": 3600,
}
