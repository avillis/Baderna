"use client";

import { useEffect, useState } from "react";

import { authToken } from "@/features/panel/use-auth";

export type RiotMatch = {
  matchId: string;
  gameStart: number | null;
  gameDuration: number | null;
  queueId: number | null;
  win: boolean;
  champion: string | null;
  championId: number | null;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  position: string | null;
};

export type RiotMastery = {
  championId: number;
  championName: string | null;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number | null;
};

export type RiotProfile = {
  account: {
    puuid: string | null;
    gameName: string;
    tagLine: string;
  };
  rank: {
    tier: string;
    division: string | null;
    league_points: number;
    wins: number;
    losses: number;
    queue_type: string | null;
  };
  summoner: {
    summonerLevel: number | null;
    profileIconId: number | null;
    revisionDate: number | null;
  };
  matches: RiotMatch[];
  masteries: RiotMastery[];
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

// Bumped when the profile schema changes — older entries are silently ignored.
const CACHE_VERSION = 3;
const CACHE_PREFIX = `baderna:riot-profile:v${CACHE_VERSION}:`;
// TTL antes de considerar o cache stale e refetchar em background.
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

type CachedProfile = { profile: RiotProfile; savedAt: number };

function parseRiotId(input: string): { gameName: string; tagLine: string } | null {
  const idx = input.indexOf("#");
  if (idx === -1) return null;
  const gameName = input.slice(0, idx).trim();
  const tagLine = input.slice(idx + 1).trim();
  if (!gameName || !tagLine) return null;
  return { gameName, tagLine };
}

function readCache(riotId: string): CachedProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + riotId.toLowerCase());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CachedProfile>;
    if (!parsed?.profile || !parsed.profile.rank) return null;
    return { profile: parsed.profile, savedAt: parsed.savedAt ?? 0 };
  } catch {
    return null;
  }
}

function writeCache(riotId: string, profile: RiotProfile) {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedProfile = { profile, savedAt: Date.now() };
    window.localStorage.setItem(
      CACHE_PREFIX + riotId.toLowerCase(),
      JSON.stringify(payload),
    );
  } catch {
    /* ignore quota errors */
  }
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profile: RiotProfile };

/**
 * Fetches the live Riot data for a "GameName#TAG" identifier.
 * Implements stale-while-revalidate: shows cached profile immediately
 * (no loading flash), refetches in the background, swaps in fresh data.
 */
export function useRiotProfile(riotId: string | null | undefined) {
  const [state, setState] = useState<State>({ status: "idle" });

  useEffect(() => {
    if (!riotId) {
      setState({ status: "idle" });
      return;
    }
    const parsed = parseRiotId(riotId);
    if (!parsed) {
      setState({ status: "error", message: "Riot ID inválido (esperado nome#tag)" });
      return;
    }

    // 1) Hydrate from cache immediately se tiver.
    const cached = readCache(riotId);
    if (cached) {
      setState({ status: "ready", profile: cached.profile });
    } else {
      setState({ status: "loading" });
    }

    // 2) Só refetcha se cache estiver stale (passou do TTL) ou não existir.
    const isFresh = cached && Date.now() - cached.savedAt < CACHE_TTL_MS;
    if (isFresh) return;

    const ctrl = new AbortController();
    const token = authToken();
    if (!token) {
      setState({ status: "error", message: "Sem autenticação." });
      return () => ctrl.abort();
    }
    const url = `${API_BASE}/riot-profile/${encodeURIComponent(parsed.gameName)}/${encodeURIComponent(parsed.tagLine)}`;
    fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `API respondeu ${res.status}`);
        }
        return (await res.json()) as RiotProfile;
      })
      .then((profile) => {
        writeCache(riotId, profile);
        setState({ status: "ready", profile });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (cached) return;
        const msg = err instanceof Error ? err.message : "Erro ao consultar a API.";
        setState({ status: "error", message: msg });
      });

    return () => ctrl.abort();
  }, [riotId]);

  return state;
}
