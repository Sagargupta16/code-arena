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
