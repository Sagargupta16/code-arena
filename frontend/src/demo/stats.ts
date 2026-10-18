import type { MatchResult, UserStats } from "../types";

const STATS_KEY = "demoStats";
const EMPTY: UserStats = { matches_played: 0, wins: 0, total_score: 0, problems_solved: 0 };

/** Dashboard stats for the demo player, counted from demo matches in this browser. */
export function loadDemoStats(): UserStats {
  try {
    return { ...EMPTY, ...JSON.parse(localStorage.getItem(STATS_KEY) ?? "{}") };
  } catch {
    return { ...EMPTY };
  }
}

export function recordDemoMatch(result: MatchResult, userId: string): void {
  const mine = result.rankings.find((r) => r.user_id === userId);
  if (!mine) return;
  const stats = loadDemoStats();
  const next: UserStats = {
    matches_played: stats.matches_played + 1,
    wins: stats.wins + (result.rankings[0]?.user_id === userId ? 1 : 0),
    total_score: stats.total_score + mine.score,
    problems_solved: stats.problems_solved + (mine.solve_time_ms > 0 ? 1 : 0),
  };
  localStorage.setItem(STATS_KEY, JSON.stringify(next));
}
