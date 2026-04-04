interface StatusEntry {
  user_id: string;
  username?: string;
  status: string;
  attempts: number;
  test_cases_passed: number;
}

interface Props {
  entries: StatusEntry[];
  mode: "blind" | "live_status";
}

export function StatusBar({ entries, mode }: Props) {
  if (mode === "blind") return null;

  const statusColor: Record<string, string> = {
    accepted: "text-green-400",
    wrong_answer: "text-red-400",
    time_limit: "text-yellow-400",
    runtime_error: "text-orange-400",
    compile_error: "text-red-400",
  };

  return (
    <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex gap-6">
      {entries.map((e) => (
        <div key={e.user_id} className="flex items-center gap-2 text-sm">
          <span className="font-semibold">@{e.username || e.user_id.slice(0, 8)}</span>
          <span className={statusColor[e.status] || "text-gray-400"}>
            {e.status === "accepted" ? "AC" : `${e.test_cases_passed} passed`}
          </span>
          <span className="text-gray-500">{e.attempts} attempts</span>
        </div>
      ))}
    </div>
  );
}
