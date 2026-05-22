"use client";

import { useCallback, useEffect, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

const TOKEN_KEY = "baderna:auth-token";
const USER_KEY = "baderna:auth-user";
export const AUTH_UPDATED_EVENT = "baderna:auth-updated";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  summoner_name: string | null;
  tagLine: string | null;
  riot_puuid: string | null;
  is_admin?: boolean;
};

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function readUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeSession(token: string | null, user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
  if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  else window.localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event(AUTH_UPDATED_EVENT));
}

export function authToken(): string | null {
  return readToken();
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setToken(readToken());
    setUser(readUser());
    setHydrated(true);
    function onUpdate() {
      setToken(readToken());
      setUser(readUser());
    }
    window.addEventListener(AUTH_UPDATED_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener(AUTH_UPDATED_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      token?: string;
      user?: AuthUser;
      message?: string;
      errors?: Record<string, string[]>;
    };
    if (!res.ok) {
      const msg =
        body.errors?.email?.[0] ??
        body.message ??
        `Erro ${res.status} ao entrar.`;
      throw new Error(msg);
    }
    if (!body.token || !body.user) throw new Error("Resposta inválida da API.");
    writeSession(body.token, body.user);
    return body.user;
  }, []);

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      summoner_name: string;
      tag_line: string;
    }) => {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(input),
      });
      const body = (await res.json().catch(() => ({}))) as {
        token?: string;
        user?: AuthUser;
        message?: string;
        errors?: Record<string, string[]>;
      };
      if (!res.ok) {
        // Pega a primeira mensagem de erro útil que a API mandou.
        const firstErr = body.errors
          ? Object.values(body.errors)[0]?.[0]
          : null;
        throw new Error(firstErr ?? body.message ?? `Erro ${res.status} ao criar conta.`);
      }
      if (!body.token || !body.user) throw new Error("Resposta inválida da API.");
      writeSession(body.token, body.user);
      return body.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    const t = readToken();
    if (t) {
      try {
        await fetch(`${API_BASE}/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${t}`, Accept: "application/json" },
        });
      } catch {
        /* ignore — limpa local mesmo se a API estiver offline */
      }
    }
    writeSession(null, null);
  }, []);

  return { token, user, login, register, logout, hydrated };
}
