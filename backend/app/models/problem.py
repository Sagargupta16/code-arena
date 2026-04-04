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
    sample_cases: list[TestCase] = []
