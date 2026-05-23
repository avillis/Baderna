"use client";

import { useAccount } from "@/features/panel/use-account";
import { useRiotProfile, type RiotMatch } from "@/features/panel/use-riot-profile";

// Riot queue IDs → label amigável
const QUEUE_LABELS: Record<number, string> = {
  420: "Solo/Duo",
  440: "Flex",
  450: "ARAM",
  400: "Normal",
  490: "Normal",
  700: "Clash",
  1700: "Arena",
};

function formatRelative(ts: number | null): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Agora";
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Há ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Ontem";
  if (d < 7) return `${d}d`;
  return new Date(ts).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function MatchRow({ match }: { match: RiotMatch }) {
  const champTile = match.champion
    ? `https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/${match.champion}_0.jpg`
    : null;
  const mode = match.queueId ? QUEUE_LABELS[match.queueId] ?? "Outro" : "—";
  return (
    <div className="flex items-center gap-[12px]">
      <div className="relative h-[40px] w-[40px] flex-shrink-0 overflow-hidden rounded-full bg-[#ededed] ring-2 ring-[#ece7e4]">
        {champTile ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={champTile}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-[6px]">
          <span
            className={`text-[13px] font-bold ${
              match.win ? "text-[#2f855a]" : "text-[#c53030]"
            }`}
          >
            {match.win ? "Vitória" : "Derrota"}
          </span>
          <span className="text-[12px] font-semibold text-[#8d8d8d]">
            • {mode}
          </span>
        </div>
        <p className="text-[12px] font-semibold text-[#0f0f0f]">
          {match.kills} / {match.deaths} / {match.assists}
        </p>
      </div>
      <span className="flex-shrink-0 text-[11px] font-medium text-[#b0a09a]">
        {formatRelative(match.gameStart)}
      </span>
    </div>
  );
}

export function FeedHistoryWidget() {
  const { account } = useAccount();
  const riotId = account.gameNick && account.gameNick.includes("#")
    ? account.gameNick
    : null;
  const state = useRiotProfile(riotId);

  const matches =
    state.status === "ready" ? state.profile.matches.slice(0, 4) : [];

  return (
    <section className="rounded-[20px] bg-white p-[20px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <h3 className="text-[15px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
        Histórico de partidas
      </h3>

      {state.status === "loading" && (
        <div className="flex items-center justify-center py-[24px]">
          <svg
            className="capas-spinner h-[22px] w-[22px] [&_circle]:stroke-[#ff4100]"
            viewBox="25 25 50 50"
          >
            <circle r="20" cy="50" cx="50" />
          </svg>
        </div>
      )}

      {state.status === "ready" && matches.length === 0 && (
        <p className="py-[24px] text-center text-[12px] text-[#8d8d8d]">
          Nenhuma partida recente.
        </p>
      )}

      {state.status === "error" && (
        <p className="py-[24px] text-center text-[12px] text-[#8d8d8d]">
          Não foi possível carregar.
        </p>
      )}

      {matches.length > 0 && (
        <div className="mt-[14px] space-y-[10px]">
          {matches.map((m) => (
            <MatchRow key={m.matchId} match={m} />
          ))}
        </div>
      )}
    </section>
  );
}
