from __future__ import annotations

from app.db import get_db
from app.models.match_result import PlayerRanking


MAX_SCORE = 1000.0
TIME_PENALTY_PER_SEC = 1.0
ATTEMPT_PENALTY = 50.0
MIN_SCORE = 100.0


def calculate_full_solve_score(solve_time_seconds: float, failed_attempts: int) -> float:
    score = MAX_SCORE - (TIME_PENALTY_PER_SEC * solve_time_seconds) - (ATTEMPT_PENALTY * failed_attempts)
    return max(score, MIN_SCORE)


def calculate_partial_score(
    test_cases_passed: int,
    total_test_cases: int,
    time_of_last_submission_seconds: float,
) -> float:
    if total_test_cases == 0:
        return 0.0
    ratio = test_cases_passed / total_test_cases
    score = ratio * MAX_SCORE - (TIME_PENALTY_PER_SEC * time_of_last_submission_seconds * 0.1)
    return max(score, 0.0)


async def compute_match_results(room_id: str, problem_id: str, match_duration_seconds: float) -> dict:
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
                    match_duration_seconds
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
