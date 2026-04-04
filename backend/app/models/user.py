from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class UserStats(BaseModel):
    matches_played: int = 0
    wins: int = 0
    total_score: float = 0.0
    problems_solved: int = 0


class UserInDB(BaseModel):
    id: str = Field(alias="_id")
    github_id: int
    username: str
    email: str = ""
    avatar: str = ""
    stats: UserStats = UserStats()
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True}


class UserPublic(BaseModel):
    id: str
    username: str
    avatar: str = ""
    stats: UserStats = UserStats()
