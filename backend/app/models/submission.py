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
