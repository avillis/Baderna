"use client";

import { PanelStatCard } from "@/features/panel/components/panel-stat-card";
import { useRiotProfile, type RiotProfile } from "@/features/panel/use-riot-profile";
import { useAccount } from "@/features/panel/use-account";
import type { RankType } from "@/features/panel/rank-utils";

const TIER_TO_RANK_TYPE: Record<string, RankType> = {
  IRON: "iron",
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  PLATINUM: "platinum",
  EMERALD: "platinum",
  DIAMOND: "diamond",
  MASTER: "master",
  GRANDMASTER: "grandmaster",
  CHALLENGER: "challenger",
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

const DIVISION_LABELS_PT: Record<string, string> = {
  I: "I",
  II: "II",
  III: "III",
  IV: "IV",
};

function tierLabel(tier: string) {
  if (!tier || tier === "Unranked") return "Sem classificação";
  return TIER_LABELS_PT[tier.toUpperCase()] ?? tier;
}

function formatRank({ rank }: RiotProfile) {
  const tier = tierLabel(rank.tier);
  if (!rank.tier || rank.tier === "Unranked") {
    return {
      eyebrow: tier,
      value: "00 pdl",
      frame: "/images/ranks/unranked.webp",
    };
  }
  const div = rank.division ? ` ${DIVISION_LABELS_PT[rank.division] ?? rank.division}` : "";
  const rankType =
    TIER_TO_RANK_TYPE[rank.tier.toUpperCase()] ?? ("gold" as RankType);
  return {
    eyebrow: `${tier}${div}`,
    value: `${rank.league_points} pdl`,
    frame: `/images/ranks/${rankType}.png`,
  };
}

/**
 * Rank stat card backed by the Riot API. Renders the static fallback while
 * the request is in-flight, swaps to live data once it arrives.
 */
export function LiveRankCard({
  fallbackEyebrow,
  fallbackValue,
  fallbackFrameSrc,
  riotId,
}: {
  fallbackEyebrow: string;
  fallbackValue: string;
  fallbackFrameSrc?: string;
  riotId?: string;
}) {
  const { account } = useAccount();
  const effectiveRiotId = riotId || account.gameNick;
  const state = useRiotProfile(effectiveRiotId);

  if (state.status === "ready") {
    const { eyebrow, value, frame } = formatRank(state.profile);
    return (
      <PanelStatCard
        eyebrow={eyebrow}
        value={value}
        tone="rank"
        rankFrameSrc={frame ?? fallbackFrameSrc}
        placeholder={false}
      />
    );
  }

  return (
    <PanelStatCard
      eyebrow={fallbackEyebrow}
      value={fallbackValue}
      tone="rank"
      rankFrameSrc={fallbackFrameSrc}
      placeholder={state.status === "loading"}
    />
  );
}
