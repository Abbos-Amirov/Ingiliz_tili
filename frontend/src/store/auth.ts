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
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  ready: false,
  hydrate: () => set({ user: getUser(), ready: true }),
  login: async (email, password) => {
    const res = await apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    setSession(res.token, res.user);
    set({ user: res.user });
    return res.user;
  },
  register: async (email, password, displayName) => {
    const res = await apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, displayName }),
      skipAuth: true,
    });
    setSession(res.token, res.user);
    set({ user: res.user });
    return res.user;
  },
  logout: () => {
    clearSession();
    set({ user: null });
  },
}));
