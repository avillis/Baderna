"use client";

import { useCallback, useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

type UnlocksMap = { title: string[]; capa: string[]; name: string[] };

const EMPTY: UnlocksMap = { title: [], capa: [], name: [] };

/**
 * Hook admin pra ler/modificar unlocks de OUTRO membro.
 * Usa endpoints `/admin/member-unlocks/{user}` que precisam de admin.
 */
export function useAdminMemberUnlocks(targetUserId: number | null | undefined) {
  const [unlocks, setUnlocks] = useState<UnlocksMap>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!targetUserId) {
      setUnlocks(EMPTY);
      setLoaded(false);
      return;
    }
    let cancelled = false;
    const token = authToken();
    if (!token) return;
    fetch(`${API_BASE}/admin/member-unlocks/${targetUserId}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : EMPTY))
      .then((data: UnlocksMap) => {
        if (cancelled) return;
        setUnlocks({
          title: data.title ?? [],
          capa: data.capa ?? [],
          name: data.name ?? [],
        });
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [targetUserId]);

  const grant = useCallback(
    async (kind: "title" | "capa" | "name", slug: string) => {
      if (!targetUserId) return;
      const token = authToken();
      if (!token) return;
      const res = await fetch(
        `${API_BASE}/admin/member-unlocks/${targetUserId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ kind, slug }),
        },
      );
      if (!res.ok) return;
      setUnlocks((prev) =>
        prev[kind].includes(slug)
          ? prev
          : { ...prev, [kind]: [...prev[kind], slug] },
      );
    },
    [targetUserId],
  );

  const revoke = useCallback(
    async (kind: "title" | "capa" | "name", slug: string) => {
      if (!targetUserId) return;
      const token = authToken();
      if (!token) return;
      const res = await fetch(
        `${API_BASE}/admin/member-unlocks/${targetUserId}/${kind}/${encodeURIComponent(slug)}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!res.ok && res.status !== 204) return;
      setUnlocks((prev) => ({
        ...prev,
        [kind]: prev[kind].filter((s) => s !== slug),
      }));
    },
    [targetUserId],
  );

  return { unlocks, loaded, grant, revoke };
}
