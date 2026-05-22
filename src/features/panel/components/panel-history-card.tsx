"use client";

import Image from "next/image";
import { useGameMode } from "@/features/panel/game-mode-context";

const mockMatches = [
  {
    id: 1,
    champion: "Yasuo",
    champImage: "/images/baderna/favorite-yasuo-tile.jpg",
    result: "Vitória",
    isWin: true,
    mode: "Flex",
    kda: "12 / 4 / 8",
    cs: "214 CS",
    duration: "28:15",
    date: "Há 2h",
  },
  {
    id: 2,
    champion: "Thresh",
    champImage: "/images/baderna/favorite-thresh-tile.jpg",
    result: "Derrota",
    isWin: false,
    mode: "Inhouse",
    kda: "1 / 6 / 12",
    cs: "32 CS",
    duration: "32:40",
    date: "Há 5h",
  },
  {
    id: 3,
    champion: "Yasuo",
    champImage: "/images/baderna/favorite-yasuo-tile.jpg",
    result: "Vitória",
    isWin: true,
    mode: "Flex",
    kda: "9 / 2 / 10",
    cs: "248 CS",
    duration: "25:10",
    date: "Ontem",
  },
  {
    id: 4,
    champion: "Lee Sin",
    champImage: "/images/baderna/favorite-leesin-tile.jpg",
    result: "Derrota",
    isWin: false,
    mode: "Inhouse",
    kda: "2 / 7 / 4",
    cs: "122 CS",
    duration: "18:20",
    date: "Ontem",
  },
  {
    id: 5,
    champion: "Thresh",
    champImage: "/images/baderna/favorite-thresh-tile.jpg",
    result: "Vitória",
    isWin: true,
    mode: "Inhouse",
    kda: "1 / 3 / 22",
    cs: "34 CS",
    duration: "36:45",
    date: "Há 2 dias",
  },
  {
    id: 6,
    champion: "Garen",
    champImage: "/images/baderna/favorite-garen-tile.jpg",
    result: "Vitória",
    isWin: true,
    mode: "Flex",
    kda: "8 / 1 / 5",
    cs: "190 CS",
    duration: "22:15",
    date: "Há 3 dias",
  },
  {
    id: 7,
    champion: "Ezreal",
    champImage: "/images/baderna/favorite-ezreal-tile.jpg",
    result: "Vitória",
    isWin: true,
    mode: "Flex",
    kda: "6 / 2 / 14",
    cs: "140 CS",
    duration: "26:30",
    date: "Há 4 dias",
  },
  {
    id: 8,
    champion: "Yasuo",
    champImage: "/images/baderna/favorite-yasuo-tile.jpg",
    result: "Derrota",
    isWin: false,
    mode: "Inhouse",
    kda: "3 / 5 / 8",
    cs: "210 CS",
    duration: "31:00",
    date: "Há 5 dias",
  },
  {
    id: 9,
    champion: "Garen",
    champImage: "/images/baderna/favorite-garen-tile.jpg",
    result: "Vitória",
    isWin: true,
    mode: "Flex",
    kda: "10 / 2 / 4",
    cs: "185 CS",
    duration: "24:45",
    date: "Há 6 dias",
  },
  {
    id: 10,
    champion: "Lee Sin",
    champImage: "/images/baderna/favorite-leesin-tile.jpg",
    result: "Derrota",
    isWin: false,
    mode: "Flex",
    kda: "0 / 6 / 15",
    cs: "128 CS",
    duration: "33:20",
    date: "Há 7 dias",
  },
  {
    id: 11,
    champion: "Ezreal",
    champImage: "/images/baderna/favorite-ezreal-tile.jpg",
    result: "Vitória",
    isWin: true,
    mode: "Inhouse",
    kda: "15 / 5 / 10",
    cs: "260 CS",
    duration: "41:10",
    date: "Há 1 semana",
  },
];

export function PanelHistoryCard() {
  const { mode } = useGameMode();
  const filtered = mode === "Todos" ? mockMatches : mockMatches.filter((m) => m.mode === mode);

  return (
    <section className="flex h-full min-h-[471px] flex-col rounded-[var(--panel-radius-card)] bg-white px-[28px] py-[34px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <h2 className="text-[16px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
        {"Histórico de Partidas"}
      </h2>
      <p className="mt-[4px] text-[15px] font-medium tracking-[-0.03em] text-[#cccccc]">
        {"Status das últimas partidas vinculadas ao Riot ID."}
      </p>

      <div className="mt-[28px] flex flex-1 flex-col border-t border-[#efebe8] pt-[12px]">
        <div className="space-y-[14px]">
          {filtered.map((match, index) => (
            <div
              key={match.id}
              className={`flex items-center gap-4 rounded-[var(--panel-radius-block)] px-[18px] py-[16px] ${
                index % 2 === 1 ? "bg-[#ededed]" : "bg-transparent"
              }`}
            >
              {/* Champion Image */}
              <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-full ring-2 ring-[#ece7e4]">
                <Image
                  src={match.champImage}
                  alt={match.champion}
                  fill
                  className="object-cover"
                  sizes="52px"
                />
              </div>

              {/* Match Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-[6px]">
                  <span className={`text-[14px] font-bold ${match.isWin ? "text-[#2f855a]" : "text-[#c53030]"}`}>
                    {match.result}
                  </span>
                  <span className="text-[13px] font-semibold text-[#8d8d8d]">
                    • {match.mode}
                  </span>
                </div>
                <div className="mt-[4px]">
                  <span className="text-[14px] font-bold tracking-tight text-[#0f0f0f]">
                    {match.kda}
                  </span>
                </div>
              </div>

              {/* Right Side: Duration / CS / Date */}
              <div className="flex shrink-0 flex-col items-end gap-[2px]">
                <span className="text-[13px] font-bold text-[#0f0f0f]">
                  {match.duration}
                </span>
                <span className="text-[12px] font-semibold text-[#8d8d8d]">
                  {match.cs}
                </span>
                <span className="text-[11px] font-medium text-[#b0a09a]">
                  {match.date}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-auto pt-[18px] text-center text-[13px] font-medium tracking-[-0.03em] text-[#d2cbc7]">
          {
            "O histórico será preenchido automaticamente quando a integração com a Riot API estiver pronta."
          }
        </p>
      </div>
    </section>
  );
}
