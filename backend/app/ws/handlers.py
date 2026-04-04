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

active_timers: dict[str, asyncio.Task] = {}
match_start_times: dict[str, float] = {}
last_submission: dict[tuple[str, str], float] = {}


async def timer_task(room_code: str, duration_seconds: int) -> None:
    remaining = duration_seconds
    while remaining > 0:
        await manager.broadcast(room_code, "match:timer_tick", {"remaining_seconds": remaining})
        await asyncio.sleep(1)
        remaining -= 1

    await manager.broadcast(room_code, "match:timer_tick", {"remaining_seconds": 0})
    await finish_match(room_code)


async def finish_match(room_code: str) -> None:
    db = get_db()
    room = await db.rooms.find_one({"code": room_code})
    if not room or room["status"] != "in_progress":
        return

    start_time = match_start_times.pop(room_code, time.time())
    duration = time.time() - start_time

    result = await compute_match_results(room_code, room["problem_id"], duration)
    await db.rooms.update_one({"code": room_code}, {"$set": {"status": "finished"}})

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
            "leetcode_id": problem.get("leetcode_id", 0),
            "title": problem["title"],
            "difficulty": problem["difficulty"],
            "description": problem["description"],
            "tags": problem.get("tags", []),
            "sample_cases": sample_cases,
            "code_snippets": problem.get("code_snippets", {}),
        },
        "time_limit": time_limit,
    })

    match_start_times[room_code] = time.time()
    timer = asyncio.create_task(timer_task(room_code, time_limit))
    active_timers[room_code] = timer


async def handle_submission(room_code: str, user_id: str, data: dict, db) -> None:
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

    await manager.send_to_user(room_code, user_id, "match:result", {
        "result": result["result"],
        "test_cases_passed": result["test_cases_passed"],
        "total_test_cases": result["total_test_cases"],
        "execution_time_ms": result.get("execution_time_ms", 0),
        "memory_used_mb": result.get("memory_used_mb", 0.0),
    })

    settings = room.get("settings", {})
    if settings.get("mode") == "live_status":
        attempts = await db.submissions.count_documents({"room_id": room_code, "user_id": user_id})
        await manager.broadcast(room_code, "match:status_update", {
            "user_id": user_id,
            "status": result["result"],
            "attempts": attempts,
            "test_cases_passed": result["test_cases_passed"],
        })

    if result["result"] == "accepted":
        all_players = room["players"]
        solved_players = set()
        for pid in all_players:
            if await db.submissions.find_one({"room_id": room_code, "user_id": pid, "result": "accepted"}):
                solved_players.add(pid)
        if solved_players == set(all_players):
            await finish_match(room_code)
