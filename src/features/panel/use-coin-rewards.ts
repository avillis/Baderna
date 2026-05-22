"use client";

import { useCallback, useEffect, useState } from "react";

import { DEFAULT_COIN_REWARDS, type CoinRewards } from "@/features/panel/coin-rewards";
import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const CACHE_KEY = "baderna:coin-rewards-cache";
const UPDATE_EVENT = "baderna:coin-rewards-updated";

function normalize(input: Partial<CoinRewards> | null): CoinRewards {
  return {
    flex: {
      win: input?.flex?.win ?? DEFAULT_COIN_REWARDS.flex.win,
      loss: input?.flex?.loss ?? DEFAULT_COIN_REWARDS.flex.loss,
    },
    inhouse: {
      win: input?.inhouse?.win ?? DEFAULT_COIN_REWARDS.inhouse.win,
      loss: input?.inhouse?.loss ?? DEFAULT_COIN_REWARDS.inhouse.loss,
    },
  };
}

function readCache(): CoinRewards {
  if (typeof window === "undefined") return { ...DEFAULT_COIN_REWARDS };
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return { ...DEFAULT_COIN_REWARDS };
    return normalize(JSON.parse(raw) as Partial<CoinRewards>);
  } catch {
    return { ...DEFAULT_COIN_REWARDS };
  }
}

function writeCache(rewards: CoinRewards) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(rewards));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}

async function fetchFromApi(): Promise<CoinRewards> {
  const res = await fetch(`${API_BASE}/coin-rewards`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`API respondeu ${res.status}`);
  return normalize((await res.json()) as Partial<CoinRewards>);
}

async function putToApi(rewards: CoinRewards): Promise<CoinRewards> {
  const token = authToken();
  const res = await fetch(`${API_BASE}/admin/coin-rewards`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(rewards),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `API respondeu ${res.status}`);
  }
  return normalize((await res.json()) as Partial<CoinRewards>);
}

export function useCoinRewards() {
  const [rewards, setRewards] = useState<CoinRewards>(readCache);

  useEffect(() => {
    let cancelled = false;
    fetchFromApi()
      .then((fresh) => {
        if (cancelled) return;
        setRewards(fresh);
        writeCache(fresh);
      })
      .catch(() => {
        /* mantém o cache */
      });

    function onUpdate() {
      setRewards(readCache());
    }
    window.addEventListener(UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener(UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const update = useCallback(
    async (mode: keyof CoinRewards, outcome: "win" | "loss", value: number) => {
      const sanitized = Math.max(0, Math.round(value));
      // Atualização otimista
      const next: CoinRewards = {
        flex: { ...rewards.flex },
        inhouse: { ...rewards.inhouse },
      };
      next[mode][outcome] = sanitized;
      setRewards(next);
      writeCache(next);
      try {
        const saved = await putToApi(next);
        setRewards(saved);
        writeCache(saved);
      } catch {
        /* mantém o otimista; usuário pode reeditar pra forçar nova tentativa */
      }
    },
    [rewards],
  );

  const reset = useCallback(async () => {
    setRewards({ ...DEFAULT_COIN_REWARDS });
    writeCache({ ...DEFAULT_COIN_REWARDS });
    try {
      const saved = await putToApi({ ...DEFAULT_COIN_REWARDS });
      setRewards(saved);
      writeCache(saved);
    } catch {
      /* ignore */
    }
  }, []);

  return { rewards, update, reset };
}
