import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../hooks/useAuth";

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const { handleGitHubCallback } = useAuth();
  const navigate = useNavigate();
  const [requestError, setRequestError] = useState("");
  // A GitHub OAuth code is single-use: exchange it once, even under StrictMode
  // double effects or a provider re-render handing us a new callback identity.
  const exchanged = useRef(false);
  const code = searchParams.get("code");
  const error = code ? requestError : "No authorization code received from GitHub";

  useEffect(() => {
    if (!code || exchanged.current) return;
    exchanged.current = true;
    handleGitHubCallback(code)
      .then(() => navigate("/dashboard", { replace: true }))
      .catch((err: unknown) => setRequestError(err instanceof Error ? err.message : String(err)));
  }, [code, handleGitHubCallback, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Link to="/login" className="text-blue-400 hover:underline">Try again</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <p className="text-gray-400">Signing in with GitHub...</p>
    </div>
  );
}
