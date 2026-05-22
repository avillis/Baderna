"use client";

import { useGameMode } from "@/features/panel/game-mode-context";
import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { panelMemberWinrates } from "@/features/panel/panel-data";

function getWinRateColor(winRate: number) {
  if (winRate > 51) return "text-[#2fb481]";
  if (winRate >= 40) return "text-[#d0a63a]";
  return "text-[#d55c5c]";
}

function MemberAvatar({ avatarSrc, id, nickname }: { avatarSrc?: string; id: string; nickname: string }) {
  const src = avatarSrc || getChampionAvatarSrc(id);
  return (
    <img
      src={src}
      alt={nickname}
      className="h-[44px] w-[44px] shrink-0 rounded-full object-cover ring-1 ring-[#ece1db]"
    />
  );
}

export function PanelMemberWinratesCard() {
  const { mode } = useGameMode();

  return (
    <section className="flex h-full flex-col rounded-[var(--panel-radius-card)] bg-white px-[28px] py-[34px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <h2 className="text-[16px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
        Winrate com Membros
      </h2>
      <p className="mt-[4px] text-[15px] font-medium tracking-[-0.03em] text-[#cccccc]">
        Jogos em equipe na temporada.
      </p>

      <div className="mt-[28px] flex min-h-[330px] flex-1 flex-col border-t border-[#efebe8] pt-[10px]">
        {panelMemberWinrates.length === 0 && (
          <p className="my-auto text-center text-[13px] font-medium tracking-[-0.03em] text-[#b0a09a]">
            Nenhum dado encontrado...
          </p>
        )}
        {panelMemberWinrates.map((member) => {
          const stats = mode === "Flex" ? member.flex : mode === "Inhouse" ? member.inhouse : { wins: member.flex.wins + member.inhouse.wins, losses: member.flex.losses + member.inhouse.losses };
          const games = stats.wins + stats.losses;
          const winRate = Math.round((stats.wins / games) * 100);

          return (
            <article
              key={member.id}
              className="flex items-center gap-[14px] py-[11px]"
            >
              <MemberAvatar avatarSrc={member.avatarSrc} id={member.id} nickname={member.nickname} />

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[15px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                  {member.nickname}
                </h3>
                <p className="mt-[2px] text-[13px] font-semibold tracking-[-0.02em] text-[#b0a09a]">
                  {stats.wins}v {stats.losses}d
                  <span className="mx-[5px] opacity-40">·</span>
                  {games} {games === 1 ? "jogo" : "jogos"}
                </p>
              </div>

              {/* Winrate */}
              <div className={`shrink-0 text-[14px] font-bold tracking-[-0.02em] ${getWinRateColor(winRate)}`}>
                {winRate}%
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
