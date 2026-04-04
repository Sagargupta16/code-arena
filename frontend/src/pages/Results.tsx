import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWebSocket } from "../hooks/useWebSocket";
import { Scoreboard } from "../components/Scoreboard";
import type { MatchResult } from "../types";

export function Results() {
  const { code: roomCode } = useParams<{ code: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const socketRef = useWebSocket(roomCode, token);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const unsub = socket.on("match:finished", (data) => {
      setMatchResult({ rankings: data.rankings, scoring_mode: data.scoring_mode });
    });

    return unsub;
  }, [socketRef.current]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-2">Match Results</h1>
      <p className="text-gray-400 mb-8">Room: {roomCode}</p>

      {matchResult ? (
        <Scoreboard rankings={matchResult.rankings} scoringMode={matchResult.scoring_mode} />
      ) : (
        <p className="text-gray-400">Loading results...</p>
      )}

      <div className="flex gap-4 mt-8">
        <button
          onClick={() => navigate(`/room/${roomCode}`)}
          className="bg-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-500"
        >
          Play Again
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="border border-gray-600 px-6 py-3 rounded-lg hover:bg-gray-800"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
