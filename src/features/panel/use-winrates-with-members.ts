"use client";

import { useCallback, useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export type WinrateRow = {
  memberId: number;
  name: string;
  summonerName: string | null;
  avatarSrc: string | null;
  wins: number;
  losses: number;
};

export type WinrateDebug = {
  reason?: string;
  season?: string;
  matches_found?: number;
  matches_fetched?: number;
  matches_failed?: number;
  members_with_puuid?: number;
  errors?: string[];
};

function authHeaders(): Record<string, string> {
  const token = authToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Winrate de um user (logado por padrão, ou outro via `targetUserId`) COM
 * cada outro membro da Baderna (Flex, season atual). O backend cacheia 1h
 * — primeira chamada pode demorar 30s-2min porque puxa detalhes de cada
 * partida da Riot.
 *
 * Passar `targetUserId` faz a request bater na rota /members/{id}/...
 * (usada quando o card aparece em perfis de terceiros).
 */
export function useWinratesWithMembers(targetUserId?: number | null) {
  const [rows, setRows] = useState<WinrateRow[]>([]);
  const [debug, setDebug] = useState<WinrateDebug | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(
    async (force: boolean): Promise<{ rows: WinrateRow[]; debug: WinrateDebug | null }> => {
      const base = targetUserId
        ? `${API_BASE}/members/${targetUserId}/winrates-with-members`
        : `${API_BASE}/account/winrates-with-members`;
      const url = force ? `${base}/refresh` : base;
      const res = await fetch(url, {
        method: force ? "POST" : "GET",
        headers: { Accept: "application/json", ...authHeaders() },
      });
      if (!res.ok) return { rows: [], debug: null };
      const data = (await res.json()) as { rows?: WinrateRow[]; debug?: WinrateDebug };
      return { rows: data.rows ?? [], debug: data.debug ?? null };
    },
    [targetUserId],
  );

  useEffect(() => {
    let cancelled = false;
    fetchData(false)
      .then((fresh) => {
        if (cancelled) return;
        setRows(fresh.rows);
        setDebug(fresh.debug);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchData]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const fresh = await fetchData(true);
      setRows(fresh.rows);
      setDebug(fresh.debug);
    } finally {
      setRefreshing(false);
    }
  }, [fetchData]);

  return { rows, debug, loading, refreshing, refresh };
}
