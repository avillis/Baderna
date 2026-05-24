"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { StyledName } from "@/features/panel/components/styled-name";
import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { formatRankLabel, type MemberRank } from "@/features/panel/use-member-ranks";
import type { BadernaMember } from "@/features/panel/members-data";

export type CompareSide = {
  member: BadernaMember;
  badernaRank: number;
  rank: MemberRank | undefined;
};

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

const ROLE_PT: Record<string, string> = {
  Top: "Top",
  Jungle: "Jungle",
  Mid: "Meio",
  ADC: "Atirador",
  Support: "Suporte",
};

function eloScore(rank: MemberRank | undefined): number {
  const tier = rank?.tier?.toUpperCase();
  if (!tier || tier === "UNRANKED") return -1;
  const tierIdx = TIER_ORDER.indexOf(tier);
  if (tierIdx < 0) return -1;
  const div = rank?.division ? DIVISION_VALUE[rank.division.toUpperCase()] ?? 0 : 0;
  return tierIdx * 100000 + div * 1000 + (rank?.lp ?? 0);
}

function laneLabel(side: CompareSide): string {
  const role = side.member.preferredRoles[0];
  return role ? ROLE_PT[role] ?? role : "—";
}

function CompareRow({
  label,
  left,
  right,
  leftWins,
  rightWins,
}: {
  label: string;
  left: string;
  right: string;
  leftWins?: boolean;
  rightWins?: boolean;
}) {
  return (
    <div className="border-t border-[#f3ebe8] py-3">
      <div className="mb-1 text-center text-[11px] font-bold uppercase tracking-[0.04em] text-[#b0a8a4]">
        {label}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <span
          className={`text-center text-[15px] tracking-[-0.02em] ${
            leftWins ? "font-bold text-[#ff4100]" : "font-semibold text-[#0f0f0f]"
          }`}
        >
          {left}
        </span>
        <span
          className={`text-center text-[15px] tracking-[-0.02em] ${
            rightWins ? "font-bold text-[#ff4100]" : "font-semibold text-[#0f0f0f]"
          }`}
        >
          {right}
        </span>
      </div>
    </div>
  );
}

function SideHead({ side }: { side: CompareSide }) {
  const avatar = side.member.avatarSrc || getChampionAvatarSrc(side.member.id);
  return (
    <div className="flex flex-col items-center text-center">
      <div className="h-[68px] w-[68px] overflow-hidden rounded-full bg-[#ededed] ring-1 ring-[#ece1db]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt={side.member.nickname} className="h-full w-full object-cover" />
      </div>
      <div className="mt-2 w-full truncate-glow text-[15px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
        <StyledName styleId={side.member.activeNameId}>{side.member.nickname}</StyledName>
      </div>
      <div className="text-[12px] font-medium text-[#989898]">#{side.badernaRank}</div>
    </div>
  );
}

export function MemberCompareModal({
  left,
  right,
  onClose,
}: {
  left: CompareSide;
  right: CompareSide;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const leftElo = eloScore(left.rank);
  const rightElo = eloScore(right.rank);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[420px] rounded-[25px] bg-white p-6 shadow-[0px_30px_90px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-[20px] top-[20px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85"
        >
          <X className="h-[16px] w-[16px]" strokeWidth={2.4} />
        </button>

        <h2 className="mb-5 text-center text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
          Comparação
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <SideHead side={left} />
          <SideHead side={right} />
        </div>

        <div className="mt-5">
          <CompareRow
            label="Elo"
            left={formatRankLabel(left.rank)}
            right={formatRankLabel(right.rank)}
            leftWins={leftElo >= 0 && leftElo > rightElo}
            rightWins={rightElo >= 0 && rightElo > leftElo}
          />
          <CompareRow
            label="Posição na Baderna"
            left={`#${left.badernaRank}`}
            right={`#${right.badernaRank}`}
            leftWins={left.badernaRank < right.badernaRank}
            rightWins={right.badernaRank < left.badernaRank}
          />
          <CompareRow
            label="Lane principal"
            left={laneLabel(left)}
            right={laneLabel(right)}
          />
        </div>
      </div>
    </div>
  );
}
