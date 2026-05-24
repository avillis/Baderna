"use client";

import { useCallback, useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const MEMBERS_CACHE = "baderna:members-cache";
const MEMBERS_UPDATE_EVENT = "baderna:members-updated";

export type PendingMember = {
  userId: number;
  name: string;
  nickname: string;
  summonerName: string | null;
  tagLine: string | null;
  email: string;
  avatarSrc: string | null;
  approvalStatus: "pending" | "rejected";
  createdAt: string | null;
};

async function fetchPending(): Promise<PendingMember[] | null> {
  const token = authToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/admin/members/pending`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as PendingMember[];
}

/**
 * Contas aguardando decisão do admin (pendentes) + as já rejeitadas (pra
 * reverter). Aprovar/rejeitar batem nos endpoints /admin/members/{id}/...
 * e invalidam o cache de membros pra refletir na lista da comunidade.
 */
export function usePendingMembers() {
  const [members, setMembers] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await fetchPending();
    if (list) setMembers(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchPending();
      if (cancelled) return;
      if (list) setMembers(list);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const act = useCallback(
    async (userId: number, action: "approve" | "reject") => {
      const token = authToken();
      if (!token) return false;
      const res = await fetch(`${API_BASE}/admin/members/${userId}/${action}`, {
        method: "POST",
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        // A lista da comunidade muda (aprovado entra / some) — invalida cache.
        try {
          window.localStorage.removeItem(MEMBERS_CACHE);
        } catch {
          /* ignore */
        }
        window.dispatchEvent(new Event(MEMBERS_UPDATE_EVENT));
        await refresh();
      }
      return res.ok;
    },
    [refresh],
  );

  const approve = useCallback((userId: number) => act(userId, "approve"), [act]);
  const reject = useCallback((userId: number) => act(userId, "reject"), [act]);

  return { members, loading, refresh, approve, reject };
}
