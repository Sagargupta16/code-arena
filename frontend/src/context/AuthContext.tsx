import { useState, type ReactNode } from "react";
import { api } from "../services/api";
import { AuthContext } from "./auth-state";
import { DEMO_TOKEN, DEMO_USER, isDemo, setDemo } from "../demo/mode";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem("userId"));
  const [username, setUsername] = useState<string | null>(localStorage.getItem("username"));
  const [demo, setDemoState] = useState(isDemo);

  const setAuth = (t: string, uid: string, uname: string, asDemo = false) => {
    setDemo(asDemo);
    setDemoState(asDemo);
    localStorage.setItem("token", t);
    localStorage.setItem("userId", uid);
    localStorage.setItem("username", uname);
    setToken(t);
    setUserId(uid);
    setUsername(uname);
  };

  const loginWithGitHub = async () => {
    const res = await api.getGitHubLoginUrl();
    // Validate redirect URL to prevent open-redirect attacks
    const url = new URL(res.url, window.location.origin);
    if (url.hostname === 'github.com') {
      window.location.href = res.url;
    }
  };

  const handleGitHubCallback = async (code: string) => {
    const res = await api.githubCallback(code);
    setAuth(res.token, res.user_id, res.username);
  };

  // No backend needed: the demo server answers in the browser.
  const startDemo = () => setAuth(DEMO_TOKEN, DEMO_USER.id, DEMO_USER.username, true);

  const logout = () => {
    setDemo(false);
    setDemoState(false);
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setToken(null);
    setUserId(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, userId, username, isAuthenticated: !!token, isDemo: demo, loginWithGitHub, handleGitHubCallback, startDemo, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
