import { getToken, getAdminToken, clearSession, clearAdminSession } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

interface ApiOptions extends RequestInit {
  admin?: boolean;
  skipAuth?: boolean;
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { admin, skipAuth, headers, ...rest } = options;
  const token = admin ? getAdminToken() : getToken();

  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  const isFormData = rest.body instanceof FormData;
  if (!isFormData) {
    finalHeaders["Content-Type"] = "application/json";
  }
  if (!skipAuth && token) {
    finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await res.json() : null;

  if (!res.ok) {
    if (res.status === 401) {
      if (admin) clearAdminSession();
      else clearSession();
    }
    const message = (body as { error?: string } | null)?.error ?? res.statusText;
    throw new ApiError(res.status, message, body);
  }

  return body as T;
}
