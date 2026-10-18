import type { Player, SubmissionResult } from "../types";
import type { PlayerOutcome } from "../services/scoring";

/** One player's running record during a demo match. */
export interface Standing {
  attempts: number;
  failed: number;
  /** Submissions that returned a value, which drives the simulated judge. */
  returned: number;
  passed: number;
  solvedAt: number | null;
  lastAt: number | null;
}

export function newStanding(): Standing {
  return { attempts: 0, failed: 0, returned: 0, passed: 0, solvedAt: null, lastAt: null };
}

/** Fold a verdict into the standing; `elapsed` is seconds since the match began. */
export function applyVerdict(s: Standing, result: SubmissionResult["result"], passed: number, elapsed: number): void {
  s.attempts += 1;
  s.passed = Math.max(s.passed, passed);
  s.lastAt = elapsed;
  if (result === "accepted") s.solvedAt = elapsed;
  else s.failed += 1;
}

export function toOutcome(player: Player, s: Standing | undefined): PlayerOutcome {
  return {
    user_id: player.id,
    username: player.username,
    attempts: s?.attempts ?? 0,
    failed_attempts: s?.failed ?? 0,
    test_cases_passed: s?.passed ?? 0,
    solve_seconds: s?.solvedAt ?? null,
    last_submit_seconds: s?.lastAt ?? null,
  };
}
