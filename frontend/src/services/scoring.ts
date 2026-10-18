import type { MatchResult, PlayerRanking } from "../types";

// Constants from the design spec (docs/superpowers/specs/2026-04-03-code-arena-design.md).
export const MAX_SCORE = 1000;
export const TIME_PENALTY_PER_SECOND = 1;
export const ATTEMPT_PENALTY = 50;
export const FULL_SOLVE_FLOOR = 100;

/** Mode B: someone passed every case. Faster and cleaner solves score higher. */
export function fullSolveScore(solveSeconds: number, failedAttempts: number): number {
  const raw = MAX_SCORE - TIME_PENALTY_PER_SECOND * solveSeconds - ATTEMPT_PENALTY * failedAttempts;
  return Math.max(FULL_SOLVE_FLOOR, raw);
}

/** Mode C: nobody solved it before the timer ran out, so rank by cases passed. */
export function partialScore(passed: number, total: number, lastSubmitSeconds: number): number {
  if (total <= 0) return 0;
  return Math.max(0, (passed / total) * MAX_SCORE - TIME_PENALTY_PER_SECOND * lastSubmitSeconds);
}

export interface PlayerOutcome {
  user_id: string;
  username?: string;
  attempts: number;
  failed_attempts: number;
  /** Best number of cases passed across all submissions. */
  test_cases_passed: number;
  /** Seconds from match start to the accepted submission, or null if unsolved. */
  solve_seconds: number | null;
  /** Seconds from match start to the player's last submission, or null if none. */
  last_submit_seconds: number | null;
}

/**
 * Score every player and order the board. Full-solve mode applies as soon as one
 * player is accepted; players who did not solve then score 0 and rank by cases passed.
 */
export function rankPlayers(outcomes: PlayerOutcome[], totalCases: number): MatchResult {
  const anySolved = outcomes.some((o) => o.solve_seconds !== null);

  const rankings: PlayerRanking[] = outcomes.map((o) => {
    let score: number;
    if (!anySolved) score = partialScore(o.test_cases_passed, totalCases, o.last_submit_seconds ?? 0);
    else if (o.solve_seconds === null) score = 0;
    else score = fullSolveScore(o.solve_seconds, o.failed_attempts);
    return {
      user_id: o.user_id,
      username: o.username,
      score: Math.round(score),
      solve_time_ms: o.solve_seconds === null ? 0 : o.solve_seconds * 1000,
      attempts: o.attempts,
      test_cases_passed: o.test_cases_passed,
    };
  });

  rankings.sort(
    (a, b) =>
      b.score - a.score ||
      b.test_cases_passed - a.test_cases_passed ||
      a.attempts - b.attempts
  );

  return { rankings, scoring_mode: anySolved ? "full_solve" : "partial" };
}
