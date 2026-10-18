import { useCallback, useMemo, useState, type ReactNode } from "react";
import { api } from "../services/api";
import { AuthContext } from "./auth-state";
import { DEMO_TOKEN, DEMO_USER, disableDemo, enableDemo, isDemo } from "../demo/mode";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem("userId"));
  const [username, setUsername] = useState<string | null>(localStorage.getItem("username"));
  const [demoMode, setDemoMode] = useState(isDemo);

  const setAuth = useCallback((t: string, uid: string, uname: string) => {
    localStorage.setItem("token", t);
    localStorage.setItem("userId", uid);
    localStorage.setItem("username", uname);
    setToken(t);
    setUserId(uid);
    setUsername(uname);
  }, []);

  const loginWithGitHub = useCallback(async () => {
    const res = await api.getGitHubLoginUrl();
    // Validate redirect URL to prevent open-redirect attacks
    const url = new URL(res.url, window.location.origin);
    if (url.hostname === 'github.com') {
      window.location.href = res.url;
    }
  }, []);

  const handleGitHubCallback = useCallback(async (code: string) => {
    const res = await api.githubCallback(code);
    disableDemo();
    setDemoMode(false);
    setAuth(res.token, res.user_id, res.username);
  }, [setAuth]);

  // No backend needed: the demo server answers in the browser.
  const startDemo = useCallback(() => {
    enableDemo();
    setDemoMode(true);
    setAuth(DEMO_TOKEN, DEMO_USER.id, DEMO_USER.username);
  }, [setAuth]);

  const logout = useCallback(() => {
    disableDemo();
    setDemoMode(false);
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setToken(null);
    setUserId(null);
    setUsername(null);
  }, []);

  const value = useMemo(
    () => ({ token, userId, username, isAuthenticated: !!token, isDemo: demoMode, loginWithGitHub, handleGitHubCallback, startDemo, logout }),
    [token, userId, username, demoMode, loginWithGitHub, handleGitHubCallback, startDemo, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
