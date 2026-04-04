from __future__ import annotations

from app.services.scoring import (
    calculate_full_solve_score,
    calculate_partial_score,
    MAX_SCORE,
    MIN_SCORE,
)


def test_full_solve_fast_no_failures():
    score = calculate_full_solve_score(solve_time_seconds=60, failed_attempts=0)
    assert score == MAX_SCORE - 60


def test_full_solve_with_failures():
    score = calculate_full_solve_score(solve_time_seconds=120, failed_attempts=3)
    assert score == 730.0


def test_full_solve_floor():
    score = calculate_full_solve_score(solve_time_seconds=900, failed_attempts=10)
    assert score == MIN_SCORE


def test_partial_all_passed():
    score = calculate_partial_score(
        test_cases_passed=10, total_test_cases=10, time_of_last_submission_seconds=300
    )
    assert score == 970.0


def test_partial_half_passed():
    score = calculate_partial_score(
        test_cases_passed=5, total_test_cases=10, time_of_last_submission_seconds=600
    )
    assert score == 440.0


def test_partial_zero_cases():
    score = calculate_partial_score(
        test_cases_passed=0, total_test_cases=0, time_of_last_submission_seconds=0
    )
    assert score == 0.0


def test_partial_floor():
    score = calculate_partial_score(
        test_cases_passed=1, total_test_cases=100, time_of_last_submission_seconds=3600
    )
    assert score == 0.0
