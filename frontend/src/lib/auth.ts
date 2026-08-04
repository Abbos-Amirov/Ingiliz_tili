import type { AuthUser } from "./types";

const TOKEN_KEY = "ingiliztili_token";
const USER_KEY = "ingiliztili_user";
const ADMIN_TOKEN_KEY = "ingiliztili_admin_token";
const ADMIN_USER_KEY = "ingiliztili_admin_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminSession(token: string, user: AuthUser): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
}

export function getAdminUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ADMIN_USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function clearAdminSession(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
}
