"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { PanelShell } from "@/features/panel/components/panel-shell";
import { AniversariosClient } from "@/features/panel/components/aniversarios-client";
import { MemberFlexCard } from "@/features/panel/components/lista-flex-client";
import { StyledName } from "@/features/panel/components/styled-name";
import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import {
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

// Moldura (gradiente + glow) por posição — idêntica ao card da página Membros.
type RankEffect = { gradient: string; glow: string };
function getRankEffect(rank: number): RankEffect {
  if (rank === 1) return {
    gradient: "linear-gradient(135deg, #f0f8ff 0%, #88b8ff 14%, #c090ff 28%, #f8a8f8 42%, #90e8ff 56%, #d8eeff 70%, #a8c8ff 85%, #f0f8ff 100%)",
    glow: "0 0 16px 5px rgba(65,150,255,0.70), 0 0 30px 3px rgba(150,90,255,0.28)",
  };
  if (rank === 2) return {
    gradient: "linear-gradient(135deg, #ffe8e0 0%, #cc2020 14%, #ff4040 28%, #ff5820 42%, #ff1840 56%, #cc0020 70%, #ff8060 84%, #ffe0e0 100%)",
    glow: "0 0 16px 4px rgba(255,55,55,0.60), 0 0 30px 2px rgba(220,30,30,0.25)",
  };
  if (rank === 3) return {
    gradient: "linear-gradient(135deg, #f0e8ff 0%, #5010a0 14%, #9040ff 28%, #4030c0 42%, #c030e0 56%, #400090 70%, #a050ff 84%, #ead0ff 100%)",
    glow: "0 0 16px 4px rgba(155,75,255,0.55), 0 0 30px 2px rgba(120,45,210,0.25)",
  };
  if (rank <= 8) return {
    gradient: "linear-gradient(135deg, #ffe066, #ffb300)",
    glow: "0 0 14px 3px rgba(255, 185, 0, 0.28)",
  };
  if (rank <= 13) return {
    gradient: "linear-gradient(135deg, #f2f2f2, #b0b0b0)",
    glow: "0 0 14px 3px rgba(140, 140, 140, 0.22)",
  };
  return {
    gradient: "linear-gradient(135deg, #e8b07a, #cd7f32)",
    glow: "0 0 14px 3px rgba(205, 127, 50, 0.22)",
  };
}

// Avatar 124px com skeleton — igual ao da página Membros.
function MemberAvatar({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative h-[124px] w-[124px] overflow-hidden rounded-full">
      {!loaded && (
        <div className="absolute inset-0 animate-pulse rounded-full bg-[#ededed]" />
      )}
      <Image
        src={src}
        alt={alt}
        width={124}
        height={124}
        className={`h-full w-full object-cover transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

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
  const [mode, setMode] = useState<"baderna" | "flex" | "aniversarios">("baderna");

  // Baderna: ordem natural da API (ranking oficial da Baderna)
  const badernaList = useMemo(() => {
    return members.map((member) => {
      const rank = member.userId != null ? ranks[member.userId] : undefined;
      return { member, rank, score: eloScore(rank) };
    });
  }, [members, ranks]);

  // Flex: ordenado por elo. Filtra quem não tem Riot ID conectada —
  // ranking por elo só faz sentido pra conta linkada com a Riot.
  const sorted = useMemo(() => {
    return [...badernaList]
      .filter(({ member }) => !!member.summonerName && !!member.tagLine)
      .sort((a, b) => b.score - a.score);
  }, [badernaList]);

  const TABS = [
    { key: "baderna",      label: "Ranking da Baderna" },
    { key: "flex",         label: "Ranking da Flex"    },
    { key: "aniversarios", label: "Aniversários"       },
  ] as const;

  const tabIndex = TABS.findIndex((t) => t.key === mode);

  return (
    <PanelShell showBanner={false}>
      <div className="pt-[1.5vh] sm:pt-[6vh]">
        <div className="mb-6">
          <h1 className="text-[24px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Ranking da Baderna
          </h1>
        </div>

        {/* Toggle — largura que comporta os rótulos, alinhado à esquerda no
            desktop; full width no mobile pra caber o toque. */}
        <div className="relative mb-5 flex h-[40px] w-full items-center rounded-[25px] bg-[#ededed] p-[4px] md:w-[560px]">
          {/* Sliding pill */}
          <div
            aria-hidden
            className="pointer-events-none absolute top-[4px] bottom-[4px] w-[calc((100%-8px)/3)] rounded-[25px] bg-white"
            style={{
              transform: `translateX(${tabIndex * 100}%)`,
              transition: "transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
            }}
          />
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={`relative z-[1] flex h-full flex-1 items-center justify-center rounded-[25px] text-[13px] font-semibold transition-colors duration-300 ${
                mode === key
                  ? "text-[#0f0f0f]"
                  : "text-black/40 hover:text-black/70"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "aniversarios" ? (
          // Aniversários: copia exata da página de aniversários.
          <AniversariosClient />
        ) : mode === "baderna" ? (
          // Baderna: layout idêntico à página Membros (grid de 5 com molduras).
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {badernaList.map(({ member }, index) => {
              const badernaRank = index + 1;
              const rankEffect = getRankEffect(badernaRank);
              const avatar = member.avatarSrc || getChampionAvatarSrc(member.id);
              return (
                <Link
                  key={member.id}
                  href={`/membro/${member.id}`}
                  className="relative flex flex-col items-center rounded-[25px] bg-white px-6 py-10 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] transition-transform duration-200 hover:scale-[1.02]"
                >
                  {/* Avatar com moldura */}
                  <div
                    className="rounded-full p-[3px]"
                    style={{ background: rankEffect.gradient, boxShadow: rankEffect.glow }}
                  >
                    <MemberAvatar
                      src={avatar}
                      alt={member.nickname}
                    />
                  </div>

                  {/* Nome + posição */}
                  <div className="mt-4 text-center">
                    <h2 className="text-[17px] font-bold leading-none tracking-[-0.03em] text-[#0f0f0f]">
                      <StyledName styleId={member.activeNameId}>
                        {member.nickname}
                      </StyledName>
                      <span className="ml-[5px] text-[12px] font-semibold tracking-normal text-[#aaaaaa]">
                        #{String(badernaRank).padStart(2, "0")}
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
        ) : (
          // Flex: mesmo layout da página Flex (cards com winrate/KDA por lane),
          // porém ordenado por elo (sorted).
          <div className="flex flex-col gap-4">
            {sorted.map(({ member }, index) => (
              <MemberFlexCard
                key={member.id}
                index={index}
                displayName={member.name}
                nickname={member.nickname}
                styleId={member.activeNameId}
                riotId={`${member.summonerName}#${member.tagLine}`}
              />
            ))}
            {sorted.length === 0 && (
              <div className="rounded-[25px] bg-white px-6 py-16 text-center text-[14px] font-medium text-[#8d8d8d] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
                Sem membros com Flex pra rankear ainda.
              </div>
            )}
          </div>
        )}
      </div>
    </PanelShell>
  );
}
