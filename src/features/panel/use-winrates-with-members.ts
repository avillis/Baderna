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

function authHeaders(): Record<string, string> {
  const token = authToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Winrate do user logado COM cada outro membro da Baderna (Flex, season atual).
 * O backend cacheia 1h — primeira chamada pode demorar 30s-2min porque puxa
 * detalhes de cada partida da Riot.
 */
export function useWinratesWithMembers() {
  const [rows, setRows] = useState<WinrateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRows = useCallback(async (force: boolean): Promise<WinrateRow[]> => {
    const url = force
      ? `${API_BASE}/account/winrates-with-members/refresh`
      : `${API_BASE}/account/winrates-with-members`;
    const res = await fetch(url, {
      method: force ? "POST" : "GET",
      headers: { Accept: "application/json", ...authHeaders() },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { rows: WinrateRow[] };
    return data.rows ?? [];
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchRows(false)
      .then((fresh) => {
        if (!cancelled) setRows(fresh);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchRows]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const fresh = await fetchRows(true);
      setRows(fresh);
    } finally {
      setRefreshing(false);
    }
  }, [fetchRows]);

  return { rows, loading, refreshing, refresh };
}
