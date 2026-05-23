"use client";

import { useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

// v2: bumpa pra invalidar caches antigos com cap=5
const CACHE_KEY = "baderna:member-ranks-cache:v2";
const TTL_MS = 5 * 60 * 1000; // 5 min — backend tem TTL próprio de 6h

export type MemberRank = {
  userId: number;
  tier: string | null;
  division: string | null;
  lp: number | null;
  updatedAt: number | null;
};

type Cached = { rows: MemberRank[]; savedAt: number };

function readCache(): Cached | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Cached;
  } catch {
    return null;
  }
}

function writeCache(rows: MemberRank[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ rows, savedAt: Date.now() }),
    );
  } catch {
    /* ignore */
  }
}

// Dedup: 1 fetch em voo no máximo entre todos os hooks + janela de tempo
// (TTL_MS) pra evitar refetch a cada navegação. Backend tem TTL próprio de
// 6h, então re-bater a cada 5min é mais que suficiente.
let inflight: Promise<MemberRank[] | null> | null = null;
let lastFetchAt = 0;

async function fetchRanks(force = false): Promise<MemberRank[] | null> {
  if (inflight) return inflight;
  if (!force && Date.now() - lastFetchAt < TTL_MS) {
    const cached = readCache();
    return cached?.rows ?? null;
  }
  inflight = (async () => {
    try {
      const token = authToken();
      if (!token) return null;
      const res = await fetch(`${API_BASE}/members/ranks`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as MemberRank[];
      writeCache(data);
      return data;
    } finally {
      lastFetchAt = Date.now();
      inflight = null;
    }
  })();
  return inflight;
}

/**
 * Retorna mapa { userId -> rank } pra todos os membros, em cache local.
 * Atualiza em background se passou do TTL.
 */
export function useMemberRanks() {
  const [ranks, setRanks] = useState<Record<number, MemberRank>>(() => {
    const cached = readCache();
    if (!cached) return {};
    const map: Record<number, MemberRank> = {};
    for (const r of cached.rows) map[r.userId] = r;
    return map;
  });

  useEffect(() => {
    // Sempre dispara um fetch em background: dedup global evita N+1, e
    // o backend só refresca quem tá stale. Isso garante que membros novos
    // (sem rank no cache antigo) sejam puxados na primeira visita.
    let cancelled = false;
    fetchRanks().then((fresh) => {
      if (cancelled || !fresh) return;
      const map: Record<number, MemberRank> = {};
      for (const r of fresh) map[r.userId] = r;
      setRanks(map);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return ranks;
}

const TIER_LABELS_PT: Record<string, string> = {
  IRON: "Ferro",
  BRONZE: "Bronze",
  SILVER: "Prata",
  GOLD: "Ouro",
  PLATINUM: "Platina",
  EMERALD: "Esmeralda",
  DIAMOND: "Diamante",
  MASTER: "Mestre",
  GRANDMASTER: "Grão-mestre",
  CHALLENGER: "Desafiante",
};

export function formatRankLabel(rank: MemberRank | undefined): string {
  if (!rank?.tier) return "—";
  const tier = rank.tier;
  if (!tier || tier === "Unranked") return "Sem classificação";
  const pt = TIER_LABELS_PT[tier.toUpperCase()] ?? tier;
  return rank.division ? `${pt} ${rank.division}` : pt;
}
