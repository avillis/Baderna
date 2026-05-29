"use client";

import { useEffect, useMemo, useState } from "react";

import { ACCOUNT_UPDATED_EVENT, useAccount } from "@/features/panel/use-account";
import { authToken, useAuth } from "@/features/panel/use-auth";
import { useMemberRanks } from "@/features/panel/use-member-ranks";
import { useRiotProfile } from "@/features/panel/use-riot-profile";
import type { RankType } from "@/features/panel/rank-utils";
import {
  badernaMembers,
  getMemberSlug,
  type BadernaMember,
} from "@/features/panel/members-data";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

const CACHE_KEY = "baderna:members-cache";
const UPDATE_EVENT = "baderna:members-updated";

const TIER_TO_RANK_TYPE: Record<string, RankType> = {
  IRON: "iron",
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  PLATINUM: "platinum",
  EMERALD: "emerald",
  DIAMOND: "diamond",
  MASTER: "master",
  GRANDMASTER: "grandmaster",
  CHALLENGER: "challenger",
};

const LANE_TO_ROLE: Record<string, string> = {
  TOP: "Top",
  JG: "Jungle",
  MID: "Mid",
  ADC: "ADC",
  SUP: "Support",
};

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

function formatRankLabel(tier: string | undefined, division: string | null | undefined): string {
  if (!tier || tier === "Unranked") return "Sem rank";
  const t = TIER_LABELS_PT[tier.toUpperCase()] ?? tier;
  return division ? `${t} ${division}` : t;
}

type ApiMember = {
  id: string;
  userId: number;
  badernaPoints?: number;
  name: string;
  nickname: string | null;
  summonerName: string | null;
  tagLine: string | null;
  avatarSrc: string | null;
  bannerFileName: string | null;
  bannerFocusY: number | null;
  isAdmin?: boolean;
  isOwner?: boolean;
  bio: string | null;
  teamName: string | null;
  primaryLane: "TOP" | "JG" | "MID" | "ADC" | "SUP" | null;
  secondaryLane: "TOP" | "JG" | "MID" | "ADC" | "SUP" | null;
  activeNameId: string | null;
  cachedRankTier: string | null;
  cachedRankDivision: string | null;
  cachedRankLp: number | null;
  activeFrameId: string | null;
};

function readCache(): ApiMember[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as ApiMember[]) : [];
  } catch {
    return [];
  }
}

function writeCache(list: ApiMember[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  queueMicrotask(() => window.dispatchEvent(new Event(UPDATE_EVENT)));
}

// Dedup: se já tem uma fetch em voo, devolve a mesma promise pra todos.
let inflightFetch: Promise<ApiMember[] | null> | null = null;
let lastFetchAt = 0;
const MIN_REFETCH_MS = 5000; // dedup janela: 5s

async function fetchFromApi(): Promise<ApiMember[] | null> {
  // Se acabou de fetchar, usa o cache local sem rede.
  if (Date.now() - lastFetchAt < MIN_REFETCH_MS) {
    if (inflightFetch) return inflightFetch;
    return readCache();
  }
  if (inflightFetch) return inflightFetch;

  inflightFetch = (async () => {
    try {
      const token = authToken();
      if (!token) return null;
      const res = await fetch(`${API_BASE}/members`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return null;
      return (await res.json()) as ApiMember[];
    } finally {
      lastFetchAt = Date.now();
      inflightFetch = null;
    }
  })();

  return inflightFetch;
}

export function useBadernaMembers(): BadernaMember[] {
  const { user } = useAuth();
  const { account } = useAccount();
  const [apiMembers, setApiMembers] = useState<ApiMember[]>(() => readCache());
  const riot = useRiotProfile(user ? account.gameNick : null);
  // Dispara o refresh do /members/ranks (popula cached_rank no DB pros
  // próximos requests + serve ranks frescos em tempo real pra qualquer
  // página que use esse hook, não só /membros).
  const liveRanks = useMemberRanks();

  // Patch otimista: quando o usuário logado muda dados próprios (ex: lane),
  // sobrescreve a row dele em memory na hora, sem esperar refetch.
  const apiMembersPatched = useMemo(() => {
    if (!user) return apiMembers;
    return apiMembers.map((m) =>
      m.userId === user.id
        ? {
            ...m,
            primaryLane:
              (account.primaryLane as ApiMember["primaryLane"]) ?? m.primaryLane,
            secondaryLane:
              (account.secondaryLane as ApiMember["secondaryLane"]) ?? m.secondaryLane,
            avatarSrc: account.avatarSrc || m.avatarSrc,
            bio: account.bio || m.bio,
            teamName: account.teamName || m.teamName,
            activeNameId: account.activeNameId ?? m.activeNameId,
            activeFrameId: account.activeFrameId !== undefined ? account.activeFrameId : m.activeFrameId,
          }
        : m,
    );
  }, [apiMembers, user, account.primaryLane, account.secondaryLane, account.avatarSrc, account.bio, account.teamName, account.activeNameId, account.activeFrameId]);

  useEffect(() => {
    let cancelled = false;

    async function loadFresh(force = false) {
      // fetchFromApi devolve cache se for chamado dentro da janela de dedup
      // (5s). Pra evitar loop infinito de cache→event→fetch→cache, comparamos
      // o resultado com o que já temos antes de re-escrever / disparar.
      const list = await fetchFromApi();
      if (cancelled || !list) return;
      setApiMembers((prev) => {
        const sameLength = prev.length === list.length;
        const sameContent =
          sameLength &&
          prev.every(
            (m, i) =>
              m.userId === list[i]?.userId && m.bannerFileName === list[i]?.bannerFileName,
          );
        if (sameContent && !force) return prev;
        return list;
      });
      // Só escreve cache se o conteúdo for diferente do que tá lá.
      const cached = readCache();
      const cacheMatches =
        cached.length === list.length &&
        cached.every((m, i) => m.userId === list[i]?.userId);
      if (!cacheMatches) writeCache(list);
    }

    loadFresh();

    function onUpdate() {
      const cached = readCache();
      if (cached.length > 0) {
        setApiMembers((prev) =>
          prev.length === cached.length &&
          prev.every((m, i) => m.userId === cached[i]?.userId)
            ? prev
            : cached,
        );
      }
      // Sem refetch automático no evento — dedup + 5s já evita N+1, e refetch
      // aqui ressuscita o loop.
    }

    // Quando o usuário logado altera o próprio perfil (ex: lane), o cache de
    // membros fica desatualizado pro próprio user. Bypassa dedup e refetcha.
    function onAccountUpdate() {
      lastFetchAt = 0;
      void loadFresh(true);
    }

    window.addEventListener(UPDATE_EVENT, onUpdate);
    window.addEventListener("storage", onUpdate);
    window.addEventListener(ACCOUNT_UPDATED_EVENT, onAccountUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener(UPDATE_EVENT, onUpdate);
      window.removeEventListener("storage", onUpdate);
      window.removeEventListener(ACCOUNT_UPDATED_EVENT, onAccountUpdate);
    };
  }, []);

  return useMemo(() => {
    const selfRank =
      riot.status === "ready" && riot.profile ? riot.profile.rank : null;
    const selfRankName = selfRank
      ? formatRankLabel(selfRank.tier, selfRank.division)
      : "—";
    const selfRankType: RankType = selfRank
      ? TIER_TO_RANK_TYPE[selfRank.tier?.toUpperCase() ?? ""] ?? "gold"
      : "gold";

    const fromApi: BadernaMember[] = apiMembersPatched.map((m) => {
      const isMe = user && m.userId === user.id;
      const slug = m.id || getMemberSlug({ nickname: m.nickname ?? m.name });
      // Rank: pro próprio user usa o live (mais fresco), pra outros usa o
      // rank cacheado que veio do /api/members.
      let rankName: string;
      let rankType: RankType;
      // Prioridade: self (live) > /members/ranks (live, recém-refrescado) >
      // cached_rank do /api/members (pode tá stale) > "Sem rank".
      const liveRank = m.userId != null ? liveRanks[m.userId] : null;
      if (isMe) {
        rankName = selfRankName;
        rankType = selfRankType;
      } else if (liveRank?.tier && liveRank.tier !== "Unranked") {
        rankName = formatRankLabel(liveRank.tier, liveRank.division);
        rankType =
          TIER_TO_RANK_TYPE[liveRank.tier.toUpperCase()] ?? "gold";
      } else if (m.cachedRankTier && m.cachedRankTier !== "Unranked") {
        rankName = formatRankLabel(m.cachedRankTier, m.cachedRankDivision);
        rankType =
          TIER_TO_RANK_TYPE[m.cachedRankTier.toUpperCase()] ?? "gold";
      } else {
        rankName = "Sem rank";
        rankType = "gold";
      }
      return {
        id: slug,
        userId: m.userId,
        name: m.name,
        nickname: m.nickname ?? m.name,
        rankName,
        rankType,
        preferredRoles: [
          m.primaryLane ? LANE_TO_ROLE[m.primaryLane] : "Mid",
          m.secondaryLane ? LANE_TO_ROLE[m.secondaryLane] : "ADC",
        ],
        laneFocus: "—",
        status: "online",
        isAdmin: m.isAdmin ?? false,
        isOwner: m.isOwner ?? false,
        avatarSrc: m.avatarSrc ?? undefined,
        summonerName: m.summonerName ?? undefined,
        tagLine: m.tagLine ?? undefined,
        teamName: m.teamName ?? null,
        activeNameId: m.activeNameId ?? undefined,
        activeFrameId: m.activeFrameId ?? null,
        badernaPoints: m.badernaPoints ?? 0,
      };
    });

    // Combina com a lista estática (que hoje está vazia mas existe pra
    // compat). API vem primeiro.
    return [...fromApi, ...badernaMembers];
  }, [apiMembersPatched, user, riot, liveRanks]);
}
