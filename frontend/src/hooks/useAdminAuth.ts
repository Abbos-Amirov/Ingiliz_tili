"use client";

import { useEffect } from "react";
import { useAdminAuthStore } from "@/store/adminAuth";

export function useAdminAuth() {
  const { user, ready, hydrate, login, logout } = useAdminAuthStore();

  useEffect(() => {
    if (!ready) hydrate();
  }, [ready, hydrate]);

  return { user, ready, isAuthenticated: Boolean(user), login, logout };
}
