import { createContext } from "react";

export interface AuthState {
  token: string | null;
  userId: string | null;
  username: string | null;
  isAuthenticated: boolean;
  loginWithGitHub: () => Promise<void>;
  handleGitHubCallback: (code: string) => Promise<void>;
  logout: () => void;
}

// Kept apart from the provider component so Vite fast refresh keeps working.
export const AuthContext = createContext<AuthState | null>(null);
