"use client";

import { useCallback, useEffect, useState } from "react";

import { authToken, useAuth } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const CACHE_KEY = "baderna:unlocks-cache";
const UPDATE_EVENT = "baderna:unlocks-updated";

// Mesmas chaves que use-member-coins usa — pra escrever o novo saldo
// devolvido pela API direto no cache que o hook de moedas lê.
const COINS_CACHE_PREFIX = "baderna:member-coins-cache:";
const COINS_UPDATE_EVENT = "baderna:member-coins-updated";

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

type UnlockResponse = {
  kind: UnlockKind;
  slug: string;
  balance: number;
  duplicate: boolean;
};

async function postUnlockToApi(
  kind: UnlockKind,
  slug: string,
): Promise<UnlockResponse | null> {
  const token = authToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE}/account/unlocks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ kind, slug }),
  });
  if (!res.ok) return null;
  return (await res.json()) as UnlockResponse;
}

/**
 * Source of truth pros unlocks do usuário logado. Carrega da API, cacheia
 * em localStorage pra hidratação rápida.
 */
export function useMemberUnlocks() {
  const { user } = useAuth();
  const userId = user ? String(user.id) : null;
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
      const wasAlreadyOwned = list.includes(slug);
      if (!wasAlreadyOwned) {
        const next: UnlocksMap = {
          ...unlocks,
          [kind]: [...list, slug],
        };
        setUnlocks(next);
        writeCache(next);
      }
      const result = await postUnlockToApi(kind, slug);
      if (!result) {
        // rollback otimista
        setUnlocks(unlocks);
        writeCache(unlocks);
        return null;
      }
      // Backend acabou de debitar — escreve o novo saldo no cache que o
      // hook de moedas lê + dispara o evento pra ele atualizar a UI.
      if (userId && typeof window !== "undefined") {
        window.localStorage.setItem(
          COINS_CACHE_PREFIX + userId,
          JSON.stringify(result.balance),
        );
        queueMicrotask(() =>
          window.dispatchEvent(new Event(COINS_UPDATE_EVENT)),
        );
      }
      return result;
    },
    [unlocks, userId],
  );

  const isUnlocked = useCallback(
    (kind: UnlockKind, slug: string) => unlocks[kind].includes(slug),
    [unlocks],
  );

  return { unlocks, unlock, isUnlocked };
}
