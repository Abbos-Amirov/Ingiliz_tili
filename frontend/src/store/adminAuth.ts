import { create } from "zustand";
import { apiFetch } from "@/lib/api";
import { getAdminUser, setAdminSession, clearAdminSession } from "@/lib/auth";
import type { AuthUser } from "@/lib/types";

interface AuthResponse {
  token: string;
  user: AuthUser;
}

interface AdminAuthState {
  user: AuthUser | null;
  ready: boolean;
  hydrate: () => void;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>((set) => ({
  user: null,
  ready: false,
  hydrate: () => set({ user: getAdminUser(), ready: true }),
  login: async (email, password) => {
    const res = await apiFetch<AuthResponse>("/auth/admin-login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    setAdminSession(res.token, res.user);
    set({ user: res.user });
    return res.user;
  },
  logout: () => {
    clearAdminSession();
    set({ user: null });
  },
}));
