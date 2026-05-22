"use client";

import Image from "next/image";

// Mock leve até a integração Riot puxar o histórico real.
const recentMatches = [
  {
    id: 1,
    champion: "Yasuo",
    champImage: "/images/baderna/favorite-yasuo-tile.jpg",
    isWin: true,
    kda: "12 / 4 / 8",
    mode: "Flex",
    date: "Há 2h",
  },
  {
    id: 2,
    champion: "Thresh",
    champImage: "/images/baderna/favorite-thresh-tile.jpg",
    isWin: false,
    kda: "1 / 6 / 12",
    mode: "Inhouse",
    date: "Há 5h",
  },
  {
    id: 3,
    champion: "Yasuo",
    champImage: "/images/baderna/favorite-yasuo-tile.jpg",
    isWin: true,
    kda: "9 / 2 / 10",
    mode: "Flex",
    date: "Ontem",
  },
  {
    id: 4,
    champion: "Lee Sin",
    champImage: "/images/baderna/favorite-leesin-tile.jpg",
    isWin: false,
    kda: "2 / 7 / 4",
    mode: "Inhouse",
    date: "Ontem",
  },
];

export function FeedHistoryWidget() {
  return (
    <section className="rounded-[20px] border border-[#ededed] bg-white p-[20px]">
      <h3 className="text-[15px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
        Histórico de partidas
      </h3>
      <div className="mt-[14px] space-y-[10px]">
        {recentMatches.map((m) => (
          <div key={m.id} className="flex items-center gap-[12px]">
            <div className="relative h-[40px] w-[40px] flex-shrink-0 overflow-hidden rounded-full ring-2 ring-[#ece7e4]">
              <Image
                src={m.champImage}
                alt={m.champion}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-[6px]">
                <span
                  className={`text-[13px] font-bold ${
                    m.isWin ? "text-[#2f855a]" : "text-[#c53030]"
                  }`}
                >
                  {m.isWin ? "Vitória" : "Derrota"}
                </span>
                <span className="text-[12px] font-semibold text-[#8d8d8d]">
                  • {m.mode}
                </span>
              </div>
              <p className="text-[12px] font-semibold text-[#0f0f0f]">
                {m.kda}
              </p>
            </div>
            <span className="flex-shrink-0 text-[11px] font-medium text-[#b0a09a]">
              {m.date}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
