import type { PlayerRanking } from "../types";

interface Props {
  rankings: PlayerRanking[];
  scoringMode: "full_solve" | "partial";
}

export function Scoreboard({ rankings, scoringMode }: Props) {
  const medals = ["bg-yellow-500", "bg-gray-400", "bg-amber-700"];

  return (
    <div className="w-full max-w-2xl">
      <div className="text-sm text-gray-400 mb-4">
        Scoring: {scoringMode === "full_solve" ? "Full Solve (time + attempts)" : "Partial (test cases passed)"}
      </div>
      <div className="space-y-3">
        {rankings.map((r, i) => (
          <div
            key={r.user_id}
            className={`flex items-center gap-4 bg-gray-900 p-4 rounded-lg ${i === 0 ? "ring-2 ring-yellow-500" : ""}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${medals[i] || "bg-gray-700"}`}>
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{r.user_id.slice(0, 8)}</p>
              <p className="text-sm text-gray-400">
                {r.test_cases_passed} cases passed | {r.attempts} attempts
                {r.solve_time_ms > 0 && ` | ${(r.solve_time_ms / 1000).toFixed(1)}s`}
              </p>
            </div>
            <div className="text-2xl font-bold text-blue-400">{r.score.toFixed(0)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
