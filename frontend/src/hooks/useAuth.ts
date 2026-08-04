"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/auth";

export function useAuth() {
  const { user, ready, hydrate, login, register, logout } = useAuthStore();

  useEffect(() => {
    if (!ready) hydrate();
  }, [ready, hydrate]);

  return { user, ready, isAuthenticated: Boolean(user), login, register, logout };
}
