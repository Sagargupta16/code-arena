const API_URL = import.meta.env.VITE_API_URL || "";

function getToken(): string | null {
  return localStorage.getItem("token");
}

function headers(): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: headers(),
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || res.statusText);
  }
  return res.json();
}

export const api = {
  getGitHubLoginUrl: () =>
    request<{ url: string }>("/api/auth/github/login"),

  githubCallback: (code: string) =>
    request<{ token: string; user_id: string; username: string }>("/api/auth/github/callback", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  getMe: () => request<{ id: string; username: string; avatar: string; stats: any }>("/api/users/me"),

  createRoom: (settings: any) =>
    request<{ code: string }>("/api/rooms", {
      method: "POST",
      body: JSON.stringify({ settings }),
    }),

  getRoom: (code: string) => request<any>(`/api/rooms/${code}`),

  joinRoom: (code: string) =>
    request<{ code: string; players: string[] }>(`/api/rooms/${code}/join`, { method: "POST" }),
};
