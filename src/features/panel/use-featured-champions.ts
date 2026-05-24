"use client";

import { useCallback, useEffect, useState } from "react";

import { authToken, useAuth } from "@/features/panel/use-auth";

/**
 * Mains em destaque do perfil (vitrine) — até 3 campeões escolhidos.
 *
 * Persistência: localStorage (otimista, por membro) + API best-effort.
 * CONTRATO DE BACKEND a implementar no Laravel:
 *   - GET  /members/{slug}/featured-champions  -> { champions: string[] }
 *       (string = nome do arquivo do tile, ex: "Zed_0.jpg")
 *       idealmente já vir embutido no payload de /members pra evitar 1 request.
 *   - PUT  /me/featured-champions   body { champions: string[] }  (auth)
 * Enquanto o backend não existir, funciona só no localStorage (dono/this device).
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";
const LS_PREFIX = "baderna:featured-champs:";
const MAX = 3;

function readLS(memberId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LS_PREFIX + memberId);
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? (arr as string[]).slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function writeLS(memberId: string, champs: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_PREFIX + memberId, JSON.stringify(champs));
  } catch {
    /* ignora quota */
  }
}

export function useFeaturedChampions(
  memberId: string | undefined,
  targetUserId?: number | null,
) {
  const { user } = useAuth();
  const isOwn =
    user != null && targetUserId != null && user.id === targetUserId;
  const [champions, setChamps] = useState<string[]>(() =>
    memberId ? readLS(memberId) : [],
  );

  useEffect(() => {
    if (!memberId) return;
    const ctrl = new AbortController();
    fetch(
      `${API_BASE}/members/${encodeURIComponent(memberId)}/featured-champions`,
      { signal: ctrl.signal, headers: { Accept: "application/json" } },
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { champions?: unknown } | null) => {
        if (data && Array.isArray(data.champions)) {
          const arr = (data.champions as string[]).slice(0, MAX);
          setChamps(arr);
          writeLS(memberId, arr);
        }
      })
      .catch(() => {
        /* backend ainda não tem o endpoint — segue com localStorage */
      });
    return () => ctrl.abort();
  }, [memberId]);

  const setChampions = useCallback(
    (next: string[]) => {
      if (!isOwn || !memberId) return;
      const arr = next.slice(0, MAX);
      setChamps(arr);
      writeLS(memberId, arr);
      const token = authToken();
      if (token) {
        void fetch(`${API_BASE}/me/featured-champions`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ champions: arr }),
        }).catch(() => {
          /* best-effort */
        });
      }
    },
    [isOwn, memberId],
  );

  return { champions, setChampions, isOwn };
}
