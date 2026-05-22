"use client";

import { PanelStatCard } from "@/features/panel/components/panel-stat-card";
import { getSplashImageSrc } from "@/features/panel/banner-selection";
import { useAccount } from "@/features/panel/use-account";
import {
  useRiotProfile,
  type RiotMatch,
} from "@/features/panel/use-riot-profile";

type Aggregated = {
  champion: string;
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
};

function aggregate(matches: RiotMatch[]): Aggregated[] {
  const map = new Map<string, Aggregated>();
  for (const m of matches) {
    if (!m.champion) continue;
    const e = map.get(m.champion) ?? {
      champion: m.champion,
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
    };
    e.games += 1;
    if (m.win) e.wins += 1;
    e.kills += m.kills;
    e.deaths += m.deaths;
    e.assists += m.assists;
    map.set(m.champion, e);
  }
  return [...map.values()];
}

function kda(a: Aggregated): number {
  return (a.kills + a.assists) / Math.max(a.deaths, 1);
}

function pickFavorite(matches: RiotMatch[]): Aggregated | null {
  const all = aggregate(matches);
  if (all.length === 0) return null;
  all.sort((a, b) => {
    if (a.games !== b.games) return b.games - a.games;
    if (a.wins !== b.wins) return b.wins - a.wins;
    return kda(b) - kda(a);
  });
  return all[0];
}

export function LiveFeaturedChampionCard({
  fallbackEyebrow,
  fallbackValue,
  fallbackSrc,
  riotId,
}: {
  fallbackEyebrow: string;
  fallbackValue: string;
  fallbackSrc?: string;
  riotId?: string;
}) {
  const { account } = useAccount();
  const state = useRiotProfile(riotId || account.gameNick);

  if (state.status === "ready") {
    const fav = pickFavorite(state.profile.matches);
    if (fav) {
      return (
        <PanelStatCard
          eyebrow="Campeão mais jogado"
          value={fav.champion}
          tone="featured"
          featuredSrc={getSplashImageSrc(`${fav.champion}_0.jpg`)}
          placeholder={false}
        />
      );
    }
  }

  return (
    <PanelStatCard
      eyebrow={fallbackEyebrow}
      value={fallbackValue}
      tone="featured"
      featuredSrc={fallbackSrc}
      placeholder={state.status === "loading"}
    />
  );
}
