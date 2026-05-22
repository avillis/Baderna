"use client";

import Image from "next/image";
import Link from "next/link";
import { PanelShell } from "@/features/panel/components/panel-shell";
import { StyledName } from "@/features/panel/components/styled-name";
import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { getMemberSlug } from "@/features/panel/members-data";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";

type RankEffect = { gradient: string; glow: string };

const RANK_EFFECTS: Record<number, RankEffect> = {
  1: {
    gradient: "linear-gradient(135deg, #c8e8ff, #6ab8f0)",
    glow: "0 0 14px 3px rgba(100, 185, 255, 0.30)",
  },
  2: {
    gradient: "linear-gradient(135deg, #ffe066, #ffb300)",
    glow: "0 0 14px 3px rgba(255, 185, 0, 0.28)",
  },
  3: {
    gradient: "linear-gradient(135deg, #f2f2f2, #b0b0b0)",
    glow: "0 0 14px 3px rgba(140, 140, 140, 0.22)",
  },
};

function getRankEffect(rank: number): RankEffect | null {
  return RANK_EFFECTS[rank] ?? null;
}

export default function MembrosPage() {
  const visibleMembers = useBadernaMembers();

  return (
    <PanelShell showBanner={false}>
      <div className="grid gap-6 grid-cols-2 pt-[6vh] md:grid-cols-3 xl:grid-cols-5 xl:pr-[45px]">
        {visibleMembers.map((member, index) => {
          const badernaRank = index + 1;
          const rankEffect = getRankEffect(badernaRank);

          return (
            <Link
              key={member.id}
              href={`/membro/${member.id}`}
              className="flex flex-col items-center rounded-[25px] bg-white px-6 py-10 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] transition-transform duration-200 hover:scale-[1.02]"
            >
              {/* Avatar */}
              <div
                className="rounded-full p-[3px]"
                style={
                  rankEffect
                    ? { background: rankEffect.gradient, boxShadow: rankEffect.glow }
                    : undefined
                }
              >
                <div className="h-[124px] w-[124px] overflow-hidden rounded-full">
                  <Image
                    src={member.avatarSrc || getChampionAvatarSrc(member.id)}
                    alt={member.nickname}
                    width={124}
                    height={124}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {/* Name + rank */}
              <div className="mt-4 text-center">
                <h2 className="text-[17px] font-bold leading-none tracking-[-0.03em] text-[#0f0f0f]">
                  <StyledName styleId={member.activeNameId}>
                    {member.nickname}
                  </StyledName>
                  <span className="ml-[5px] text-[12px] font-semibold tracking-normal text-[#aaaaaa]">
                    #{badernaRank}
                  </span>
                </h2>
                <p className="mt-[6px] text-[13px] font-medium tracking-[-0.01em] text-[#989898]">
                  {member.name}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </PanelShell>
  );
}
