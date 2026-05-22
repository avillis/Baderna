"use client";

import { useEffect, useState } from "react";

import { useRiotProfile } from "@/features/panel/use-riot-profile";

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

function hasCachedProfile(riotId: string): boolean {
  if (typeof window === "undefined" || !riotId) return false;
  try {
    return (
      window.localStorage.getItem(
        "baderna:riot-profile:v3:" + riotId.toLowerCase(),
      ) !== null
    );
  } catch {
    return false;
  }
}

/**
 * Pequena label que mostra o elo do membro (ex.: "Ouro IV"). Faz fetch
 * staggered da Riot por membro pra não saturar a API quando a lista é grande.
 */
export function MemberRankLabel({
  riotId,
  index,
  staggerMs = 200,
  fallback = "—",
}: {
  riotId: string;
  index: number;
  staggerMs?: number;
  fallback?: string;
}) {
  const cachedAtStart = hasCachedProfile(riotId);
  const [activated, setActivated] = useState(cachedAtStart || index === 0);
  useEffect(() => {
    if (cachedAtStart || index === 0) return;
    const t = setTimeout(() => setActivated(true), index * staggerMs);
    return () => clearTimeout(t);
  }, [index, cachedAtStart, staggerMs]);

  const state = useRiotProfile(activated && riotId ? riotId : null);

  if (state.status !== "ready" || !state.profile?.rank) {
    return <>{fallback}</>;
  }
  const tier = state.profile.rank.tier;
  if (!tier || tier === "Unranked") return <>Sem classificação</>;
  const tierPt = TIER_LABELS_PT[tier.toUpperCase()] ?? tier;
  const div = state.profile.rank.division ? ` ${state.profile.rank.division}` : "";
  return (
    <>
      {tierPt}
      {div}
    </>
  );
}
