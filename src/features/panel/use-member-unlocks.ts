"use client";

import { useCallback, useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const CACHE_KEY = "baderna:unlocks-cache";
const UPDATE_EVENT = "baderna:unlocks-updated";

export type UnlockKind = "title" | "capa" | "name";

type UnlocksMap = Record<UnlockKind, string[]>;

const EMPTY: UnlocksMap = { title: [], capa: [], name: [] };

function readCache(): UnlocksMap {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as Partial<UnlocksMap>;
    return {
      title: parsed.title ?? [],
      capa: parsed.capa ?? [],
      name: parsed.name ?? [],
    };
  } catch {
    return { ...EMPTY };
  }
}

function writeCache(map: UnlocksMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(map));
  queueMicrotask(() => window.dispatchEvent(new Event(UPDATE_EVENT)));
}

async function fetchFromApi(): Promise<UnlocksMap | null> {
  const token = authToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/account/unlocks`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const body = (await res.json()) as Partial<UnlocksMap>;
  return {
    title: body.title ?? [],
    capa: body.capa ?? [],
    name: body.name ?? [],
  };
}

async function postUnlockToApi(kind: UnlockKind, slug: string): Promise<boolean> {
  const token = authToken();
  if (!token) return false;
  const res = await fetch(`${API_BASE}/account/unlocks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ kind, slug }),
  });
  return res.ok;
}

/**
 * Source of truth pros unlocks do usuário logado. Carrega da API, cacheia
 * em localStorage pra hidratação rápida.
 */
export function useMemberUnlocks() {
  const [unlocks, setUnlocks] = useState<UnlocksMap>(() => readCache());

  useEffect(() => {
    setUnlocks(readCache());
    let cancelled = false;
    fetchFromApi()
      .then((fresh) => {
        if (cancelled || !fresh) return;
        setUnlocks(fresh);
        writeCache(fresh);
      })
      .catch(() => {});

    function refresh() {
      setUnlocks(readCache());
    }
    window.addEventListener(UPDATE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener(UPDATE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const unlock = useCallback(
    async (kind: UnlockKind, slug: string) => {
      const list = unlocks[kind];
      if (list.includes(slug)) return;
      const next: UnlocksMap = {
        ...unlocks,
        [kind]: [...list, slug],
      };
      setUnlocks(next);
      writeCache(next);
      const ok = await postUnlockToApi(kind, slug);
      if (!ok) {
        // rollback otimista
        setUnlocks(unlocks);
        writeCache(unlocks);
      }
    },
    [unlocks],
  );

  const isUnlocked = useCallback(
    (kind: UnlockKind, slug: string) => unlocks[kind].includes(slug),
    [unlocks],
  );

  return { unlocks, unlock, isUnlocked };
}
