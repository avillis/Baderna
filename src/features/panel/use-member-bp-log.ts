"use client";

import { useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";
import type { BpLogRow, BpLogConfig } from "@/features/panel/use-baderna-points-log";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

type ForUserResponse = {
  config: BpLogConfig;
  row: BpLogRow;
};

/**
 * Log de BP (Rank da Baderna) de UM membro — usado no modal do perfil ao
 * clicar na pill de pontos. Só busca quando `userId` e `enabled` estão setados.
 */
export function useMemberBpLog(userId: number | null, enabled: boolean) {
  const [row, setRow] = useState<BpLogRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled || userId == null) return;
    const token = authToken();
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(`${API_BASE}/members/${userId}/bp-log`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ForUserResponse | null) => {
        if (cancelled) return;
        if (!data) {
          setError(true);
          setLoading(false);
          return;
        }
        setRow(data.row ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId, enabled]);

  return { row, loading, error };
}
