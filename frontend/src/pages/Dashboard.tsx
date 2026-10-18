import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { api } from "../services/api";
import type { RoomSettings, UserStats } from "../types";

export function Dashboard() {
  const { username, isDemo } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [stats, setStats] = useState<UserStats | null>(null);
  const [settings, setSettings] = useState<RoomSettings>({
    // The live board shows the bots' progress, which is the point of the demo.
    mode: isDemo ? "live_status" : "blind",
    time_limit: 1800,
    time_mode: "difficulty_based",
    difficulty_filter: null,
    tag_filters: [],
  });

  useEffect(() => {
    api.getMe().then((u) => setStats(u.stats)).catch(() => {});
  }, []);

  const handleCreate = async () => {
    setError("");
    try {
      const res = await api.createRoom(settings);
      navigate(`/room/${res.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleJoin = async () => {
    setError("");
    if (!joinCode.trim()) return;
    try {
      await api.joinRoom(joinCode.toUpperCase());
      navigate(`/room/${joinCode.toUpperCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 sm:p-8">
      <h1 className="text-3xl font-bold mb-8">Welcome, {username}</h1>
      {isDemo && (
        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold text-emerald-300 mb-1">Demo mode</p>
          <p>
            Rooms run on a small server inside this tab. Two bots join your lobby and race you for 3 minutes.
            The judge is simulated (your code is not executed): a submission that returns nothing fails, your first
            one that returns a value is a near miss, and the next is accepted. Join any 6-character code to have a bot host you.
          </p>
        </div>
      )}
      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats && (
          <>
            <div className="bg-gray-900 p-6 rounded-lg">
              <p className="text-gray-400 text-sm">Matches Played</p>
              <p className="text-3xl font-bold">{stats.matches_played}</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <p className="text-gray-400 text-sm">Wins</p>
              <p className="text-3xl font-bold text-green-400">{stats.wins}</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-lg">
              <p className="text-gray-400 text-sm">Problems Solved</p>
              <p className="text-3xl font-bold text-blue-400">{stats.problems_solved}</p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Create Room</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Mode</label>
              <select
                value={settings.mode}
                onChange={(e) => setSettings({ ...settings, mode: e.target.value as RoomSettings["mode"] })}
                className="w-full p-2 bg-gray-800 rounded border border-gray-700"
              >
                <option value="blind">Blind Race</option>
                <option value="live_status">Live Status Board</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Difficulty</label>
              <select
                value={settings.difficulty_filter || ""}
                onChange={(e) => setSettings({ ...settings, difficulty_filter: (e.target.value || null) as RoomSettings["difficulty_filter"] })}
                className="w-full p-2 bg-gray-800 rounded border border-gray-700"
              >
                <option value="">Any</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Timer</label>
              <select
                value={settings.time_mode}
                onChange={(e) => setSettings({ ...settings, time_mode: e.target.value as RoomSettings["time_mode"] })}
                className="w-full p-2 bg-gray-800 rounded border border-gray-700"
              >
                <option value="difficulty_based">Auto (by difficulty)</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {settings.time_mode === "custom" && (
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Time Limit: {Math.floor(settings.time_limit / 60)} min
                </label>
                <input
                  type="range" min={300} max={7200} step={300}
                  value={settings.time_limit}
                  onChange={(e) => setSettings({ ...settings, time_limit: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
            )}
            <button onClick={handleCreate} className="w-full bg-blue-600 py-3 rounded font-semibold hover:bg-blue-500">
              Create Room
            </button>
          </div>
        </div>

        <div className="bg-gray-900 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Join Room</h2>
          <input
            type="text" placeholder="Enter room code (e.g. ABC123)"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="w-full mb-4 p-3 bg-gray-800 rounded border border-gray-700 focus:border-blue-500 outline-none text-center text-2xl tracking-widest"
          />
          <button onClick={handleJoin} className="w-full bg-green-600 py-3 rounded font-semibold hover:bg-green-500">
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
