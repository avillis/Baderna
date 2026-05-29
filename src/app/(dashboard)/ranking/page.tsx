"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Swords } from "lucide-react";

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
  const [mode, setMode] = useState<"baderna" | "flex" | "inhouse">("baderna");

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
    { key: "baderna", label: "Baderna" },
    { key: "flex",    label: "Flex"    },
    { key: "inhouse", label: "Inhouse" },
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

        {/* Toggle Baderna / Flex / Inhouse — ~1/3 da largura, alinhado à
            esquerda no desktop; full width no mobile pra caber o toque. */}
        <div className="relative mb-5 flex h-[40px] w-full items-center rounded-[25px] bg-[#ededed] p-[4px] md:w-1/3">
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

        {mode === "inhouse" ? (
          <div className="rounded-[25px] bg-white px-6 py-16 text-center shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
            <div className="mx-auto mb-3 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#fff1ea] text-[#ff4100]">
              <Swords className="h-[26px] w-[26px]" strokeWidth={2} />
            </div>
            <p className="text-[16px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
              Ranking de Inhouse em breve
            </p>
            <p className="mx-auto mt-1 max-w-[320px] text-[13px] font-medium text-[#989898]">
              Vai ligar quando os resultados das partidas internas começarem a
              ser registrados.
            </p>
          </div>
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
        <div className="overflow-hidden rounded-[25px] bg-white shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
          {sorted.map(({ member, rank, score }, index) => {
            const position = index + 1;
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
                  className="w-[28px] shrink-0 text-center text-[15px] font-bold tracking-[-0.02em] text-[#b0a8a4]"
                >
                  {position}
                </span>

                <div className="relative h-[44px] w-[44px] shrink-0 overflow-hidden rounded-full bg-[#ededed]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatar} alt={member.nickname} className="h-full w-full object-cover" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate-glow text-[16px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
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
        )}
      </div>
    </PanelShell>
  );
}
