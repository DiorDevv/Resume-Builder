"use client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

let refreshPromise: Promise<boolean> | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function tryRefresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  const url = endpoint.startsWith("http") ? endpoint : `${API_URL}${endpoint}`;
  let res = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && !skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await fetch(url, { ...fetchOptions, headers, credentials: "include" });
    }
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch {}
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const auth = {
  async register(email: string, password: string, fullName?: string) {
    return apiFetch<{
      id: string; email: string; full_name: string | null; is_active: boolean;
    }>("/api/v1/auth/register", {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
  },

  async login(email: string, password: string, rememberMe = false) {
    const res = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: JSON.stringify({ email, password, remember_me: rememberMe }),
      credentials: "include",
    });

    if (!res.ok) {
      let detail = "Kirishda xatolik";
      try { const err = await res.json(); detail = err.detail || detail; } catch {}
      throw new ApiError(detail, res.status);
    }

    return true;
  },

  async logout() {
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    }
  },

  async me() {
    return apiFetch<{
      id: string; email: string; full_name: string | null; is_active: boolean;
    }>("/api/v1/auth/me");
  },

  isAuthenticated: () => {
    return document.cookie.split(";").some((c) => c.trim().startsWith("access_token="));
  },
};
