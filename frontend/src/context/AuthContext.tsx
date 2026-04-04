import { createContext, useState, ReactNode } from "react";
import { api } from "../services/api";

interface AuthState {
  token: string | null;
  userId: string | null;
  username: string | null;
  isAuthenticated: boolean;
  loginWithGitHub: () => Promise<void>;
  handleGitHubCallback: (code: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem("userId"));
  const [username, setUsername] = useState<string | null>(localStorage.getItem("username"));

  const setAuth = (t: string, uid: string, uname: string) => {
    localStorage.setItem("token", t);
    localStorage.setItem("userId", uid);
    localStorage.setItem("username", uname);
    setToken(t);
    setUserId(uid);
    setUsername(uname);
  };

  const loginWithGitHub = async () => {
    const res = await api.getGitHubLoginUrl();
    window.location.href = res.url;
  };

  const handleGitHubCallback = async (code: string) => {
    const res = await api.githubCallback(code);
    setAuth(res.token, res.user_id, res.username);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    setToken(null);
    setUserId(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider
      value={{ token, userId, username, isAuthenticated: !!token, loginWithGitHub, handleGitHubCallback, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
