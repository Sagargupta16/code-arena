import { describe, expect, it } from "vitest";
import { fullSolveScore, partialScore, rankPlayers, type PlayerOutcome } from "./scoring";

const outcome = (over: Partial<PlayerOutcome> & { user_id: string }): PlayerOutcome => ({
  attempts: 1,
  failed_attempts: 0,
  test_cases_passed: 0,
  solve_seconds: null,
  last_submit_seconds: null,
  ...over,
});

describe("fullSolveScore", () => {
  it("takes a point per second and 50 per failed attempt", () => {
    expect(fullSolveScore(41, 1)).toBe(909);
    expect(fullSolveScore(0, 0)).toBe(1000);
  });

  it("never drops below the 100 floor", () => {
    expect(fullSolveScore(1500, 20)).toBe(100);
  });
});

describe("partialScore", () => {
  it("scales by cases passed and subtracts the last submission time", () => {
    expect(partialScore(9, 12, 60)).toBe(690);
  });

  it("floors at 0 and survives an empty suite", () => {
    expect(partialScore(1, 12, 500)).toBe(0);
    expect(partialScore(0, 0, 10)).toBe(0);
  });
});

describe("rankPlayers", () => {
  it("uses full-solve scoring once anyone is accepted, and unsolved players score 0", () => {
    const result = rankPlayers(
      [
        outcome({ user_id: "slow", attempts: 3, failed_attempts: 2, test_cases_passed: 12, solve_seconds: 70 }),
        outcome({ user_id: "never", attempts: 2, failed_attempts: 2, test_cases_passed: 11 }),
        outcome({ user_id: "fast", attempts: 2, failed_attempts: 1, test_cases_passed: 12, solve_seconds: 41 }),
      ],
      12
    );
    expect(result.scoring_mode).toBe("full_solve");
    expect(result.rankings.map((r) => [r.user_id, r.score])).toEqual([
      ["fast", 909],
      ["slow", 830],
      ["never", 0],
    ]);
    expect(result.rankings[0].solve_time_ms).toBe(41_000);
    expect(result.rankings[2].solve_time_ms).toBe(0);
  });

  it("falls back to partial scoring when nobody solves", () => {
    const result = rankPlayers(
      [
        outcome({ user_id: "a", test_cases_passed: 6, last_submit_seconds: 100 }),
        outcome({ user_id: "b", test_cases_passed: 9, last_submit_seconds: 150 }),
        outcome({ user_id: "idle", attempts: 0 }),
      ],
      12
    );
    expect(result.scoring_mode).toBe("partial");
    expect(result.rankings.map((r) => [r.user_id, r.score])).toEqual([
      ["b", 600],
      ["a", 400],
      ["idle", 0],
    ]);
  });

  it("breaks score ties on cases passed, then fewer attempts", () => {
    const result = rankPlayers(
      [
        outcome({ user_id: "more-tries", attempts: 4, test_cases_passed: 3, last_submit_seconds: 900 }),
        outcome({ user_id: "fewer-tries", attempts: 1, test_cases_passed: 3, last_submit_seconds: 900 }),
        outcome({ user_id: "more-cases", attempts: 4, test_cases_passed: 5, last_submit_seconds: 900 }),
      ],
      12
    );
    expect(result.rankings.map((r) => r.user_id)).toEqual(["more-cases", "fewer-tries", "more-tries"]);
  });
});
