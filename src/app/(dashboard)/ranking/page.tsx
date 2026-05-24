"use client";

import Link from "next/link";
import { useMemo } from "react";

import { PanelShell } from "@/features/panel/components/panel-shell";
import { StyledName } from "@/features/panel/components/styled-name";
import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import {
  formatRankLabel,
  useMemberRanks,
  type MemberRank,
} from "@/features/panel/use-member-ranks";

const TIER_ORDER = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
];

const DIVISION_VALUE: Record<string, number> = { IV: 0, III: 1, II: 2, I: 3 };

const TIER_COLOR: Record<string, string> = {
  IRON: "#7a7166",
  BRONZE: "#a9744f",
  SILVER: "#9fb2c4",
  GOLD: "#e3b34a",
  PLATINUM: "#4ea3a0",
  EMERALD: "#2faf6b",
  DIAMOND: "#5b8def",
  MASTER: "#b25cdb",
  GRANDMASTER: "#d6453d",
  CHALLENGER: "#f0c674",
};

// Pódio (1º, 2º, 3º) com o mesmo visual usado na lista de membros.
const PODIUM: Record<number, { ring: string; glow: string }> = {
  1: { ring: "linear-gradient(135deg, #ffe066, #ffb300)", glow: "0 0 12px 2px rgba(255,185,0,0.30)" },
  2: { ring: "linear-gradient(135deg, #f2f2f2, #b0b0b0)", glow: "0 0 12px 2px rgba(140,140,140,0.22)" },
  3: { ring: "linear-gradient(135deg, #f0c08a, #c98a4f)", glow: "0 0 12px 2px rgba(180,120,60,0.22)" },
};

function eloScore(rank: MemberRank | undefined): number {
  const tier = rank?.tier?.toUpperCase();
  if (!tier || tier === "UNRANKED") return -1;
  const tierIdx = TIER_ORDER.indexOf(tier);
  if (tierIdx < 0) return -1;
  const div = rank?.division ? DIVISION_VALUE[rank.division.toUpperCase()] ?? 0 : 0;
  const lp = rank?.lp ?? 0;
  return tierIdx * 100000 + div * 1000 + lp;
}

export default function RankingPage() {
  const members = useBadernaMembers();
  const ranks = useMemberRanks();

  const sorted = useMemo(() => {
    return members
      .map((member) => {
        const rank = member.userId != null ? ranks[member.userId] : undefined;
        return { member, rank, score: eloScore(rank) };
      })
      .sort((a, b) => b.score - a.score);
  }, [members, ranks]);

  return (
    <PanelShell showBanner={false}>
      <div className="pt-[1.5vh] sm:pt-[6vh]">
        <div className="mb-6">
          <h1 className="text-[24px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Ranking da Baderna
          </h1>
          <p className="text-[14px] font-medium text-[#8d8d8d]">
            Classificação dos membros por elo da ranqueada.
          </p>
        </div>

        <div className="overflow-hidden rounded-[25px] bg-white shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
          {sorted.map(({ member, rank, score }, index) => {
            const position = index + 1;
            const podium = score >= 0 ? PODIUM[position] : undefined;
            const tier = rank?.tier?.toUpperCase();
            const tierColor = (tier && TIER_COLOR[tier]) || "#b0a8a4";
            const hasRank = score >= 0;
            const avatar = member.avatarSrc || getChampionAvatarSrc(member.id);

            return (
              <Link
                key={member.id}
                href={`/membro/${member.id}`}
                className="flex items-center gap-4 border-b border-[#f3ebe8] px-5 py-4 transition-colors last:border-0 hover:bg-[#fdfcfa]"
              >
                <span
                  className={`w-[28px] shrink-0 text-center text-[15px] font-bold tracking-[-0.02em] ${
                    podium ? "text-[#0f0f0f]" : "text-[#b0a8a4]"
                  }`}
                >
                  {position}
                </span>

                <div
                  className="shrink-0 rounded-full p-[2px]"
                  style={
                    podium
                      ? { background: podium.ring, boxShadow: podium.glow }
                      : undefined
                  }
                >
                  <div className="relative h-[44px] w-[44px] overflow-hidden rounded-full bg-[#ededed]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatar} alt={member.nickname} className="h-full w-full object-cover" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                    <StyledName styleId={member.activeNameId}>
                      {member.nickname}
                    </StyledName>
                  </div>
                  <div className="mt-0.5 truncate text-[12px] font-medium text-[#989898]">
                    {member.name}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  {hasRank ? (
                    <>
                      <div
                        className="flex items-center justify-end gap-1.5 text-[13px] font-bold tracking-[-0.01em]"
                        style={{ color: tierColor }}
                      >
                        <span className="h-[8px] w-[8px] rounded-full" style={{ backgroundColor: tierColor }} />
                        {formatRankLabel(rank)}
                      </div>
                      {rank?.lp != null && (
                        <div className="mt-0.5 text-[11px] font-semibold text-[#b0a8a4]">
                          {rank.lp} PDL
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-[12px] font-semibold text-[#cdc6c1]">
                      Sem rank
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          {sorted.length === 0 && (
            <p className="px-5 py-16 text-center text-[14px] font-medium text-[#8d8d8d]">
              Sem membros pra rankear ainda.
            </p>
          )}
        </div>
      </div>
    </PanelShell>
  );
}
