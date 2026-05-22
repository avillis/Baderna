"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import { useRiotProfile, type RiotMatch, type RiotProfile } from "@/features/panel/use-riot-profile";
import type { RankType } from "@/features/panel/rank-utils";

// Delay entre ativações sucessivas pra não sobrecarregar a Riot API.
const STAGGER_MS = 1200;

type Role = "TOP" | "JG" | "MID" | "ADC" | "SUP";

const ROLES: Role[] = ["TOP", "JG", "MID", "ADC", "SUP"];

const laneIcon: Record<Role, string> = {
  TOP: "/images/lanes/Top_icon.png",
  JG: "/images/lanes/Jungle_icon.png",
  MID: "/images/lanes/Middle_icon.png",
  ADC: "/images/lanes/Bottom_icon.png",
  SUP: "/images/lanes/Support_icon.png",
};

const laneLabel: Record<Role, string> = {
  TOP: "topo",
  JG: "selva",
  MID: "meio",
  ADC: "atirador",
  SUP: "suporte",
};

const POSITION_TO_ROLE: Record<string, Role> = {
  TOP: "TOP",
  JUNGLE: "JG",
  MIDDLE: "MID",
  BOTTOM: "ADC",
  UTILITY: "SUP",
};

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

type RoleStats = { wins: number; losses: number; rate: number; kda: number; played: boolean };

function emptyStats(): RoleStats {
  return { wins: 0, losses: 0, rate: 0, kda: 0, played: false };
}

function computeStats(matches: RiotMatch[]): Record<Role, RoleStats> {
  const acc: Record<Role, { wins: number; losses: number; k: number; d: number; a: number }> = {
    TOP: { wins: 0, losses: 0, k: 0, d: 0, a: 0 },
    JG: { wins: 0, losses: 0, k: 0, d: 0, a: 0 },
    MID: { wins: 0, losses: 0, k: 0, d: 0, a: 0 },
    ADC: { wins: 0, losses: 0, k: 0, d: 0, a: 0 },
    SUP: { wins: 0, losses: 0, k: 0, d: 0, a: 0 },
  };

  for (const m of matches) {
    if (m.queueId !== 440) continue;
    const role = m.position ? POSITION_TO_ROLE[m.position] : undefined;
    if (!role) continue;
    const slot = acc[role];
    if (m.win) slot.wins += 1;
    else slot.losses += 1;
    slot.k += m.kills;
    slot.d += m.deaths;
    slot.a += m.assists;
  }

  const out = {} as Record<Role, RoleStats>;
  for (const role of ROLES) {
    const { wins, losses, k, d, a } = acc[role];
    const games = wins + losses;
    if (games === 0) {
      out[role] = emptyStats();
      continue;
    }
    const rate = Math.round((wins / games) * 100);
    const kda = d === 0 ? k + a : (k + a) / d;
    out[role] = { wins, losses, rate, kda, played: true };
  }
  return out;
}

function wrClass(rate: number) {
  if (rate >= 55) return "text-[#2f855a]";
  if (rate >= 45) return "text-[#6b7280]";
  return "text-[#c53030]";
}

function RoleCard({ role, stats }: { role: Role; stats: RoleStats }) {
  if (!stats.played) {
    return (
      <div className="relative flex flex-col items-center justify-center rounded-[var(--panel-radius-card-sm)] bg-[#ededed] p-[14px] min-h-[130px] gap-2">
        <div className="h-[36px] w-[36px] rounded-full bg-white flex items-center justify-center">
          <Image
            src={laneIcon[role]}
            alt={role}
            width={22}
            height={22}
            className="object-contain"
          />
        </div>
        <span className="text-[11px] font-semibold text-[#8d8d8d] text-center">
          Sem histórico para {laneLabel[role]}
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col justify-between rounded-[var(--panel-radius-card-sm)] bg-[#ededed] p-[14px] min-h-[130px]">
      <div className="absolute right-[12px] top-[12px] h-[32px] w-[32px] rounded-full bg-white flex items-center justify-center">
        <Image
          src={laneIcon[role]}
          alt={role}
          width={18}
          height={18}
          className="object-contain"
        />
      </div>

      <div className="flex items-center gap-3 pr-[44px]">
        <span className="text-[11px] font-semibold text-[#0f0f0f]">
          {stats.wins}v {stats.losses}d
        </span>
        <span className={`text-[11px] font-extrabold ${wrClass(stats.rate)}`}>
          {stats.rate}wr
        </span>
      </div>

      <div className="mt-auto pt-3 flex items-baseline gap-[4px]">
        <span className="text-[20px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
          {stats.kda.toFixed(2)}
        </span>
        <span className="text-[10px] font-semibold text-[#c0c0c0] tracking-wide">kda</span>
      </div>
    </div>
  );
}

function RankMedal({
  rankType,
  unranked,
}: {
  rankType: RankType;
  unranked?: boolean;
}) {
  const src = unranked
    ? "/images/rank-badges/unranked.webp"
    : `/images/rank-badges/${rankType}.png`;
  return (
    <div className="relative h-[60px] w-[60px] shrink-0">
      <Image
        src={src}
        alt={unranked ? "unranked" : rankType}
        fill
        className="object-contain"
        sizes="60px"
        unoptimized
      />
    </div>
  );
}

function formatRankName(rank: RiotProfile["rank"]): { label: string; type: RankType } {
  const tier = (rank.tier ?? "").toUpperCase();
  if (!tier || tier === "UNRANKED") return { label: "Sem classificação", type: "iron" };
  const tierPt = TIER_LABELS_PT[tier] ?? rank.tier;
  const div = rank.division ? ` ${rank.division}` : "";
  return {
    label: `${tierPt}${div}`,
    type: TIER_TO_RANK_TYPE[tier] ?? "gold",
  };
}

// Verifica se já tem cache pro riotId — se sim, ignora o stagger.
function hasCachedProfile(riotId: string): boolean {
  if (typeof window === "undefined" || !riotId) return false;
  try {
    const key = "baderna:riot-profile:v3:" + riotId.toLowerCase();
    return window.localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

function MemberFlexCard({
  displayName,
  nickname,
  riotId,
  index,
}: {
  displayName: string;
  nickname: string;
  riotId: string;
  index: number;
}) {
  // Se já tem cache local, ativa imediatamente (sem esperar stagger).
  // Senão, escalona pra não saturar a Riot.
  const cachedAtStart = hasCachedProfile(riotId);
  const [activated, setActivated] = useState(
    cachedAtStart || index === 0,
  );
  useEffect(() => {
    if (cachedAtStart || index === 0) return;
    const t = setTimeout(() => setActivated(true), index * STAGGER_MS);
    return () => clearTimeout(t);
  }, [index, cachedAtStart]);

  const state = useRiotProfile(activated ? riotId || null : null);
  const profile = state.status === "ready" ? state.profile : null;

  const stats = profile
    ? computeStats(profile.matches)
    : ({
        TOP: emptyStats(),
        JG: emptyStats(),
        MID: emptyStats(),
        ADC: emptyStats(),
        SUP: emptyStats(),
      } as Record<Role, RoleStats>);

  const rank = profile
    ? formatRankName(profile.rank)
    : {
        label:
          !riotId
            ? "Riot ID pendente"
            : state.status === "error"
              ? "Erro ao carregar"
              : "Carregando…",
        type: "iron" as RankType,
      };

  return (
    <article className="flex flex-col gap-4 rounded-[var(--panel-radius-card)] bg-white px-6 py-5 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] lg:flex-row lg:items-center">
      <div className="flex w-full shrink-0 items-center gap-4 lg:w-[220px]">
        <RankMedal
          rankType={rank.type}
          unranked={!profile || rank.label === "Sem classificação"}
        />
        <div className="min-w-0 flex-1">
          <h2 className="max-w-[140px] truncate text-[17px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            {displayName}
          </h2>
          <p className="mt-0.5 max-w-[140px] truncate text-[12px] font-semibold text-[#8d8d8d]">
            {nickname}
          </p>
          <p className="mt-1 max-w-[140px] truncate text-[11px] font-bold text-[#313131]">
            {rank.label}
          </p>
        </div>
      </div>

      <div className="grid flex-1 gap-3 sm:grid-cols-5">
        {ROLES.map((role) => (
          <RoleCard key={role} role={role} stats={stats[role]} />
        ))}
      </div>
    </article>
  );
}

export function ListaFlexClient() {
  const members = useBadernaMembers();

  if (members.length === 0) {
    return (
      <div className="flex flex-col gap-4 pt-[6vh] xl:pr-[45px]">
        <div className="rounded-[var(--panel-radius-card)] bg-white px-6 py-10 text-center text-[13px] font-medium text-[#8d8d8d] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
          Nenhum membro cadastrado ainda.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-[6vh] xl:pr-[45px]">
      {members.map((m, index) => {
        // m.id é o slug do nick. Pra montar o riotId precisamos do nick+tag.
        // useBadernaMembers já incorpora o nick em m.nickname; pra tag,
        // confio no formato vindo do API (mas useBadernaMembers não expõe a
        // tag separadamente). Uso o nickname como proxy de riotId só se
        // estiver formato "Nick#TAG". Caso contrário deixo vazio e o card
        // mostra "Riot ID pendente".
        const riotId = m.nickname.includes("#")
          ? m.nickname
          : (() => {
              // Tenta achar a tag no cache de membros admin (lista API)
              if (typeof window === "undefined") return "";
              try {
                const raw = window.localStorage.getItem("baderna:members-cache");
                if (!raw) return "";
                const list = JSON.parse(raw) as Array<{
                  id: string;
                  summonerName: string | null;
                  tagLine: string | null;
                }>;
                const found = list.find((x) => x.id === m.id);
                if (found?.summonerName && found?.tagLine) {
                  return `${found.summonerName}#${found.tagLine}`;
                }
                return "";
              } catch {
                return "";
              }
            })();
        return (
          <MemberFlexCard
            key={m.id}
            index={index}
            displayName={m.name}
            nickname={m.nickname}
            riotId={riotId}
          />
        );
      })}
    </div>
  );
}
