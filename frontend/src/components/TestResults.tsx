import { useState } from "react";
import type { SubmissionResult, TestCase } from "../types";

interface Props {
  result: SubmissionResult | null;
  isRunning: boolean;
  sampleCases: TestCase[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  accepted: { label: "Accepted", color: "text-green-400", bg: "bg-green-500/10" },
  wrong_answer: { label: "Wrong Answer", color: "text-red-400", bg: "bg-red-500/10" },
  time_limit: { label: "Time Limit Exceeded", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  runtime_error: { label: "Runtime Error", color: "text-orange-400", bg: "bg-orange-500/10" },
  compile_error: { label: "Compile Error", color: "text-red-400", bg: "bg-red-500/10" },
};

export function TestResults({ result, isRunning, sampleCases }: Props) {
  const [activeTab, setActiveTab] = useState<"testcase" | "result">("testcase");
  const [activeCase, setActiveCase] = useState(0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center border-b border-gray-700 bg-gray-900/50 px-2">
        <button
          onClick={() => setActiveTab("testcase")}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "testcase"
              ? "border-blue-500 text-white"
              : "border-transparent text-gray-400 hover:text-gray-300"
          }`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Testcase
        </button>
        <button
          onClick={() => setActiveTab("result")}
          className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === "result"
              ? "border-blue-500 text-white"
              : "border-transparent text-gray-400 hover:text-gray-300"
          }`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Test Result
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === "testcase" ? (
          <TestCaseView cases={sampleCases} activeCase={activeCase} setActiveCase={setActiveCase} />
        ) : isRunning ? (
          <div className="flex items-center gap-2 text-yellow-400 text-sm">
            <span className="inline-block w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
            Judging...
          </div>
        ) : !result ? (
          <div className="text-gray-500 text-sm">You must run your code first</div>
        ) : (
          <ResultView result={result} />
        )}
      </div>
    </div>
  );
}

function TestCaseView({ cases, activeCase, setActiveCase }: {
  cases: TestCase[];
  activeCase: number;
  setActiveCase: (i: number) => void;
}) {
  if (cases.length === 0) {
    return <div className="text-gray-500 text-sm">No sample test cases available.</div>;
  }

  const current = cases[activeCase];

  return (
    <div>
      <div className="flex gap-1.5 mb-3">
        {cases.map((_, i) => (
          <button
            key={`case-${i}`}
            onClick={() => setActiveCase(i)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              activeCase === i
                ? "bg-gray-700 text-white"
                : "bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
            }`}
          >
            Case {i + 1}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        <div>
          <div className="text-xs text-gray-500 font-medium mb-1">Input =</div>
          <pre className="p-2.5 bg-gray-800/70 rounded-lg text-xs text-gray-200 font-mono whitespace-pre-wrap">
            {current.input}
          </pre>
        </div>
        <div>
          <div className="text-xs text-gray-500 font-medium mb-1">Expected Output =</div>
          <pre className="p-2.5 bg-gray-800/70 rounded-lg text-xs text-gray-200 font-mono whitespace-pre-wrap">
            {current.expected_output}
          </pre>
        </div>
      </div>
    </div>
  );
}

function ResultView({ result }: { result: SubmissionResult }) {
  const config = STATUS_CONFIG[result.result] || STATUS_CONFIG.wrong_answer;

  return (
    <div className="space-y-3">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${config.bg}`}>
        <span className={`font-bold text-sm ${config.color}`}>{config.label}</span>
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>
          Tests: <span className="text-gray-200 font-medium">{result.test_cases_passed}/{result.total_test_cases}</span>
        </span>
        <span>
          Runtime: <span className="text-gray-200 font-medium">{result.execution_time_ms}ms</span>
        </span>
        <span>
          Memory: <span className="text-gray-200 font-medium">{result.memory_used_mb}MB</span>
        </span>
      </div>

      {result.expected && result.got && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-gray-500 font-medium mb-1">Expected</div>
            <pre className="p-2 bg-gray-800/70 rounded text-green-300 font-mono">{result.expected}</pre>
          </div>
          <div>
            <div className="text-gray-500 font-medium mb-1">Your Output</div>
            <pre className="p-2 bg-gray-800/70 rounded text-red-300 font-mono">{result.got}</pre>
          </div>
        </div>
      )}

      {result.error && <pre className="text-red-400 text-xs font-mono whitespace-pre-wrap bg-gray-800/70 p-2.5 rounded">{result.error}</pre>}
    </div>
  );
}
