import type { Problem } from "../types";

interface Props {
  problem: Problem | null;
}

export function ProblemPanel({ problem }: Props) {
  if (!problem) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500 text-center">
          <div className="text-4xl mb-3">...</div>
          <p>Loading problem...</p>
        </div>
      </div>
    );
  }

  const diffColor = {
    Easy: "bg-green-500/15 text-green-400 border-green-500/30",
    Medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    Hard: "bg-red-500/15 text-red-400 border-red-500/30",
  }[problem.difficulty];

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-gray-700 bg-gray-900/50 px-1">
        <span className="px-3 py-2.5 text-sm font-medium border-b-2 border-blue-500 text-white">
          Description
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-lg font-semibold">
            {problem.leetcode_id ? `${problem.leetcode_id}. ` : ""}{problem.title}
          </h2>
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${diffColor}`}>
            {problem.difficulty}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {problem.tags.map((tag) => (
            <span key={tag} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>

        <div
          className="problem-description text-sm text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: problem.description }}
        />
      </div>
    </div>
  );
}
