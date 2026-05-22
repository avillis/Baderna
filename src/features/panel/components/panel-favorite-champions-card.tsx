"use client";

import Image from "next/image";
import { useGameMode } from "@/features/panel/game-mode-context";
import { panelFavoriteChampionsByMode } from "@/features/panel/panel-data";

function getWinRateColor(winRate: number) {
  if (winRate > 51) {
    return "text-[#2fb481]";
  }

  if (winRate >= 40) {
    return "text-[#d0a63a]";
  }

  return "text-[#d55c5c]";
}

export function PanelFavoriteChampionsCard() {
  const { mode } = useGameMode();
  const champions = panelFavoriteChampionsByMode[mode];

  return (
    <section className="flex h-full min-h-[471px] flex-col rounded-[var(--panel-radius-card)] bg-white px-[28px] py-[34px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <h2 className="text-[16px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
        {"Campe\u00f5es Favoritos"}
      </h2>
      <p className="mt-[4px] text-[15px] font-medium tracking-[-0.03em] text-[#cccccc]">
        {"Mais jogados da temporada."}
      </p>

      <div className="mt-[28px] flex-1 border-t border-[#efebe8] pt-[10px]">
        {champions.map((champion) => (
          <article
            key={champion.name}
            className="flex items-center gap-[16px] py-[14px]"
          >
            <div className="relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-full bg-[#f5f3f1]">
              <Image
                src={champion.imageSrc}
                alt={champion.name}
                fill
                className="object-cover"
                sizes="64px"
                quality={100}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                {champion.name}
              </h3>
              <p className="mt-[4px] text-[14px] font-semibold tracking-[-0.03em] text-[#7d7d7d]">
                {champion.matches} {"Partidas"} {"\u2022"} {champion.role}
              </p>
            </div>

            <div
              className={`shrink-0 text-[14px] font-bold tracking-[-0.02em] ${getWinRateColor(champion.winRate)}`}
            >
              {champion.winRate}wr
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
