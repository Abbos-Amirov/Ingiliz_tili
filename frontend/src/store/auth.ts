import { create } from "zustand";
import { apiFetch } from "@/lib/api";
import { getUser, setSession, clearSession } from "@/lib/auth";
import type { AuthUser } from "@/lib/types";

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface AuthState {
  user: AuthUser | null;
  ready: boolean;
  hydrate: () => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (email: string, password: string, displayName: string) => Promise<AuthUser>;
  loginWithGoogle: (credential: string) => Promise<AuthUser>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  async function completeAuth(path: string, body: Record<string, string>): Promise<AuthUser> {
    const res = await apiFetch<AuthResponse>(path, {
      method: "POST",
      body: JSON.stringify(body),
      skipAuth: true,
    });
    setSession(res.token, res.user);
    set({ user: res.user });
    return res.user;
  }

  return {
    user: null,
    ready: false,
    hydrate: () => set({ user: getUser(), ready: true }),
    login: (email, password) => completeAuth("/auth/login", { email, password }),
    register: (email, password, displayName) =>
      completeAuth("/auth/register", { email, password, displayName }),
    loginWithGoogle: (credential) => completeAuth("/auth/google", { credential }),
    logout: () => {
      clearSession();
      set({ user: null });
    },
  };
});
