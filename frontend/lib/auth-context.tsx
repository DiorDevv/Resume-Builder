"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { auth, ApiError } from "./api";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initRef = useRef(false);
  const mountedRef = useRef(true);
  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const clearSessionTimeout = useCallback(() => {
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
      sessionTimerRef.current = null;
    }
  }, []);

  const startSessionTimeout = useCallback(() => {
    clearSessionTimeout();
    sessionTimerRef.current = setTimeout(() => {
      if (mountedRef.current) {
        auth.logout().then(() => {
          setUser(null);
          const locale = window.location.pathname.split("/")[1] || "uz";
          window.location.href = `/${locale}/login`;
        });
      }
    }, SESSION_TIMEOUT_MS);
  }, [clearSessionTimeout]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const checkSession = async () => {
      try {
        const userData = await auth.me();
        if (mountedRef.current) {
          setUser(userData);
          startSessionTimeout();
        }
      } catch {
        // Not authenticated — that's OK
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    checkSession();
  }, [startSessionTimeout]);

  const resetSession = useCallback(() => {
    startSessionTimeout();
  }, [startSessionTimeout]);

  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    setError(null);
    try {
      await auth.login(email, password, rememberMe);
      const me = await auth.me();
      if (mountedRef.current) {
        setUser(me);
        startSessionTimeout();
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Kirishda xatolik yuz berdi";
      if (mountedRef.current) setError(message);
      throw err;
    }
  }, [startSessionTimeout]);

  const register = useCallback(async (email: string, password: string, fullName?: string) => {
    setError(null);
    try {
      await auth.register(email, password, fullName);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Ro'yxatdan o'tishda xatolik";
      if (mountedRef.current) setError(message);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    clearSessionTimeout();
    await auth.logout();
    if (mountedRef.current) {
      setUser(null);
      setError(null);
    }
  }, [clearSessionTimeout]);

  const clearError = useCallback(() => {
    if (mountedRef.current) setError(null);
  }, []);

  useEffect(() => {
    const handleActivity = () => {
      if (user) resetSession();
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);

    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      clearSessionTimeout();
    };
  }, [user, resetSession, clearSessionTimeout]);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
