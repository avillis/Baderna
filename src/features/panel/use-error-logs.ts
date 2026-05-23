"use client";

import { useCallback, useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export type ErrorLog = {
  id: number;
  source: "error" | "frontend" | "http";
  level: "error" | "warning" | "info";
  message: string;
  url: string | null;
  method: string | null;
  statusCode: number | null;
  ip: string | null;
  userAgent: string | null;
  file: string | null;
  line: number | null;
  stackTrace: string | null;
  context: Record<string, unknown> | null;
  occurredAt: string;
  user: {
    id: number;
    name: string | null;
    summonerName: string | null;
  } | null;
};

function authHeaders(): Record<string, string> {
  const token = authToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fetchLogs(before?: number): Promise<ErrorLog[]> {
  const url = before
    ? `${API_BASE}/admin/error-logs?before=${before}`
    : `${API_BASE}/admin/error-logs`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", ...authHeaders() },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { logs: ErrorLog[] };
  return data.logs ?? [];
}

export function useErrorLogs() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const fresh = await fetchLogs();
    setLogs(fresh);
    setHasMore(fresh.length >= 30);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const lastId = logs[logs.length - 1]?.id;
    if (!lastId) {
      setLoadingMore(false);
      return;
    }
    const more = await fetchLogs(lastId);
    setLogs((curr) => [...curr, ...more]);
    if (more.length < 30) setHasMore(false);
    setLoadingMore(false);
  }, [logs, loadingMore, hasMore]);

  const deleteLog = useCallback(async (id: number) => {
    const res = await fetch(`${API_BASE}/admin/error-logs/${id}`, {
      method: "DELETE",
      headers: { Accept: "application/json", ...authHeaders() },
    });
    if (res.ok) setLogs((curr) => curr.filter((l) => l.id !== id));
  }, []);

  const clearAll = useCallback(async () => {
    const res = await fetch(`${API_BASE}/admin/error-logs/all`, {
      method: "DELETE",
      headers: { Accept: "application/json", ...authHeaders() },
    });
    if (res.ok) {
      setLogs([]);
      setHasMore(false);
    }
  }, []);

  return { logs, loading, loadingMore, hasMore, refresh, loadMore, deleteLog, clearAll };
}

/**
 * Reporta um erro do front pro backend (chamado pelo error reporter global).
 */
export async function reportFrontendError(payload: {
  message: string;
  url?: string;
  stackTrace?: string;
  context?: Record<string, unknown>;
}): Promise<void> {
  const token = authToken();
  if (!token) return; // sem auth não loga (evita spam de visitors)
  try {
    await fetch(`${API_BASE}/error-logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message: payload.message.slice(0, 1000),
        url: payload.url,
        stack_trace: payload.stackTrace?.slice(0, 20000),
        context: payload.context,
      }),
    });
  } catch {
    /* não vamos logar erro de logger pra não criar loop */
  }
}
