from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.auth import create_access_token


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
        "_id": "12345",
        "github_id": 12345,
        "username": "testuser",
        "email": "test@example.com",
        "avatar": "https://github.com/images/test.png",
        "stats": {"matches_played": 0, "wins": 0, "total_score": 0.0, "problems_solved": 0},
    }


@pytest.fixture
def auth_token():
    return create_access_token("12345")
