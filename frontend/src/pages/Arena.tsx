import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWebSocket } from "../hooks/useWebSocket";
import { useTimer } from "../hooks/useTimer";
import { Editor, FALLBACK_CODE } from "../components/Editor";
import { Timer } from "../components/Timer";
import { ProblemPanel } from "../components/ProblemPanel";
import { TestResults } from "../components/TestResults";
import { StatusBar } from "../components/StatusBar";
import type { Problem, SubmissionResult, Language } from "../types";

function getStarterCode(problem: Problem | null, lang: Language): string {
  if (problem?.code_snippets?.[lang]) return problem.code_snippets[lang];
  return FALLBACK_CODE[lang];
}

export function Arena() {
  const { code: roomCode } = useParams<{ code: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useWebSocket(roomCode, token);
  const timer = useTimer();

  const navState = location.state as { problem?: Problem; timeLimit?: number; mode?: string } | null;
  const [problem, setProblem] = useState<Problem | null>(navState?.problem || null);
  const [language, setLanguage] = useState<Language>("python");
  const [codeText, setCodeText] = useState(() => getStarterCode(navState?.problem || null, "python"));
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [statusEntries, setStatusEntries] = useState<Record<string, unknown>[]>([]);
  const [roomMode, setRoomMode] = useState<"blind" | "live_status">((navState?.mode as "blind" | "live_status") || "blind");
  const codePerLang = useRef<Record<Language, string>>({
    python: getStarterCode(navState?.problem || null, "python"),
    cpp: getStarterCode(navState?.problem || null, "cpp"),
  });

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const unsub1 = socket.on("match:problem", (data) => {
      const p = data.problem as Problem;
      setProblem(p);
      setRoomMode(data.mode || "blind");
      const pyCode = getStarterCode(p, "python");
      const cppCode = getStarterCode(p, "cpp");
      codePerLang.current = { python: pyCode, cpp: cppCode };
      setCodeText(language === "python" ? pyCode : cppCode);
    });

    const unsub2 = socket.on("match:timer_tick", (data) => {
      timer.setFromServer(data.remaining_seconds);
    });

    const unsub3 = socket.on("match:result", (data) => {
      setResult(data);
      setIsRunning(false);
    });

    const unsub4 = socket.on("match:status_update", (data) => {
      setStatusEntries((prev) => {
        const existing = prev.findIndex((e) => e.user_id === data.user_id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = data;
          return updated;
        }
        return [...prev, data];
      });
    });

    const unsub5 = socket.on("match:finished", () => {
      navigate(`/room/${roomCode}/results`);
    });

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); };
  }, [socketRef.current, roomCode, navigate]);

  const handleLanguageChange = (lang: Language) => {
    codePerLang.current[language] = codeText;
    setLanguage(lang);
    setCodeText(codePerLang.current[lang]);
  };

  const handleSubmit = () => {
    setIsRunning(true);
    setResult(null);
    socketRef.current?.send("match:submit", { code: codeText, language });
  };

  const isUrgent = timer.remaining > 0 && timer.remaining <= 60;

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="h-11 bg-gray-900 px-4 flex items-center justify-between border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-300">Code Arena</span>
          <div className="w-px h-5 bg-gray-700" />
          <Timer formatted={timer.formatted} remaining={timer.remaining} />
          {problem && (
            <>
              <div className="w-px h-5 bg-gray-700" />
              <span className="text-sm text-gray-400">
                {problem.leetcode_id ? `${problem.leetcode_id}. ` : ""}{problem.title}
              </span>
              <DifficultyBadge difficulty={problem.difficulty} />
            </>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isUrgent && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full animate-pulse">
              Time running out!
            </span>
          )}
          <span className="text-xs font-mono text-gray-500 bg-gray-800 px-2 py-1 rounded">{roomCode}</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem */}
        <div className="w-[45%] border-r border-gray-800 overflow-hidden flex flex-col">
          <ProblemPanel problem={problem} />
        </div>

        {/* Right: Editor + Results */}
        <div className="w-[55%] flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0">
            <Editor
              language={language}
              onLanguageChange={handleLanguageChange}
              code={codeText}
              onCodeChange={setCodeText}
              onRun={handleSubmit}
              onSubmit={handleSubmit}
              isRunning={isRunning}
            />
          </div>
          <div className="h-44 border-t border-gray-800 shrink-0">
            <TestResults result={result} isRunning={isRunning} sampleCases={problem?.sample_cases || []} />
          </div>
        </div>
      </div>

      <StatusBar entries={statusEntries} mode={roomMode} />
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config: Record<string, string> = {
    Easy: "bg-green-500/15 text-green-400",
    Medium: "bg-yellow-500/15 text-yellow-400",
    Hard: "bg-red-500/15 text-red-400",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${config[difficulty] || "text-gray-400"}`}>
      {difficulty}
    </span>
  );
}
