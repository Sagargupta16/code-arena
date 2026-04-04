import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWebSocket } from "../hooks/useWebSocket";
import { api } from "../services/api";
import { PlayerList } from "../components/PlayerList";

export function Lobby() {
  const { code } = useParams<{ code: string }>();
  const { token, userId } = useAuth();
  const navigate = useNavigate();
  const socketRef = useWebSocket(code, token);
  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    if (!code) return;
    api.getRoom(code).then((r) => {
      setRoom(r);
    });
  }, [code]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const unsub1 = socket.on("room:player_joined", (data) => {
      setPlayers((prev) => {
        if (prev.find((p) => p.id === data.user.id)) return prev;
        return [...prev, data.user];
      });
    });

    const unsub2 = socket.on("room:player_left", (data) => {
      setPlayers((prev) => prev.filter((p) => p.id !== data.user_id));
    });

    const unsub3 = socket.on("match:problem", (data) => {
      navigate(`/room/${code}/arena`, { state: { problem: data.problem, timeLimit: data.time_limit, mode: data.mode } });
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [socketRef.current, code, navigate]);

  const isHost = room?.host_id === userId;

  const handleStart = () => {
    socketRef.current?.send("match:start");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-2">Room Lobby</h1>
      <p className="text-5xl font-mono tracking-widest text-blue-400 mb-8">{code}</p>
      <p className="text-gray-400 mb-6">Share this code with friends to join</p>

      <div className="w-full max-w-md mb-8">
        <PlayerList players={players} hostId={room?.host_id || ""} />
      </div>

      {room && (
        <div className="text-sm text-gray-400 mb-6">
          Mode: {room.settings.mode === "blind" ? "Blind Race" : "Live Status"} |
          Difficulty: {room.settings.difficulty_filter || "Any"} |
          Timer: {room.settings.time_mode === "difficulty_based" ? "Auto" : `${Math.floor(room.settings.time_limit / 60)}min`}
        </div>
      )}

      {isHost && (
        <button
          onClick={handleStart}
          disabled={players.length < 2}
          className="bg-green-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Start Match {players.length < 2 && "(need 2+ players)"}
        </button>
      )}
      {!isHost && <p className="text-gray-400">Waiting for host to start...</p>}
    </div>
  );
}
