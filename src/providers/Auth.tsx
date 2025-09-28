"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { backendApi, LoginRequest, RegisterRequest } from "@/lib/backend-client";

type User = { username: string } | null;

type AuthContextType = {
  user: User;
  token: string | null;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    try {
      const t = localStorage.getItem("backend_access_token");
      const u = localStorage.getItem("backend_user");
      if (t) setToken(t);
      if (u) setUser(JSON.parse(u));
    } catch (e) {
      console.debug("Auth init failed", e);
    }
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const res = await backendApi.login(payload);
    const t = res.access_token;
    localStorage.setItem("backend_access_token", t);
    localStorage.setItem("backend_user", JSON.stringify({ username: payload.username }));
    setToken(t);
    setUser({ username: payload.username });
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    await backendApi.register(payload);
    await login({ username: payload.username, password: payload.password });
  }, [login]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("backend_access_token");
      localStorage.removeItem("backend_user");
    } catch (e) {
      console.debug("Auth logout cleanup failed", e);
    }
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, token, login, register, logout }), [user, token, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


