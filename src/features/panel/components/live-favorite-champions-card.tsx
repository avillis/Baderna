"use client";

import Image from "next/image";

import { useAccount } from "@/features/panel/use-account";
import {
  useRiotProfile,
  type RiotMastery,
} from "@/features/panel/use-riot-profile";

function formatPoints(points: number): string {
  if (points >= 1_000_000) return `${(points / 1_000_000).toFixed(1)}M`;
  if (points >= 1_000) return `${Math.round(points / 1_000)}k`;
  return points.toLocaleString("pt-BR");
}

function masteryLevelTone(level: number): string {
  if (level >= 7) return "text-[#2fb481]";
  if (level >= 5) return "text-[#d0a63a]";
  return "text-[#7d7d7d]";
}

function MasteryRow({ mastery }: { mastery: RiotMastery }) {
  const tile = mastery.championName
    ? `/api/champion-tile/${mastery.championName}_0.jpg`
    : null;
  return (
    <article className="flex items-center gap-[16px] py-[14px]">
      <div className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-full bg-[#f5f3f1]">
        {tile && (
          <Image
            src={tile}
            alt={mastery.championName ?? "Champion"}
            fill
            className="object-cover"
            sizes="64px"
            quality={100}
            unoptimized
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
          {mastery.championName ?? "—"}
        </h3>
        <p className="mt-[4px] text-[14px] font-semibold tracking-[-0.03em] text-[#7d7d7d]">
          {formatPoints(mastery.championPoints)} pontos
        </p>
      </div>

      <div
        className={`shrink-0 text-[14px] font-bold tracking-[-0.02em] ${masteryLevelTone(mastery.championLevel)}`}
      >
        M{mastery.championLevel}
      </div>
    </article>
  );
}

export function LiveFavoriteChampionsCard({
  riotId,
}: { riotId?: string } = {}) {
  const { account } = useAccount();
  const state = useRiotProfile(riotId || account.gameNick);

  return (
    <section className="flex min-h-[471px] flex-col rounded-[var(--panel-radius-card)] bg-white px-[28px] py-[34px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] max-2xl:overflow-hidden">
      <h2 className="text-[16px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
        Campeões Favoritos
      </h2>
      <p className="mt-[4px] text-[15px] font-medium tracking-[-0.03em] text-[#cccccc]">
        Top maestrias da conta.
      </p>

      <div className="mt-[28px] flex flex-1 flex-col border-t border-[#efebe8] pt-[10px]">
        {state.status === "loading" || state.status === "idle" ? (
          <div className="my-auto flex items-center justify-center">
            <svg className="capas-spinner h-[40px] w-[40px]" viewBox="25 25 50 50">
              <circle r="20" cy="50" cx="50" />
            </svg>
          </div>
        ) : state.status === "error" ? (
          <div className="my-auto text-center">
            <p className="text-[13px] font-semibold text-[#c53030]">
              Não foi possível carregar.
            </p>
            <p className="mt-[6px] text-[12px] font-medium text-[#b0a09a]">
              {state.message}
            </p>
          </div>
        ) : !state.profile.masteries || state.profile.masteries.length === 0 ? (
          <p className="my-auto text-center text-[13px] font-medium tracking-[-0.03em] text-[#b0a09a]">
            Nenhuma maestria encontrada.
          </p>
        ) : (
          <div>
            {state.profile.masteries.map((m) => (
              <MasteryRow key={m.championId} mastery={m} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
