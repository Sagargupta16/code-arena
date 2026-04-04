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
