"use client";

import Image from "next/image";

import { useAccount } from "@/features/panel/use-account";
import { useGameMode } from "@/features/panel/game-mode-context";
import { useRiotProfile, type RiotMatch } from "@/features/panel/use-riot-profile";

// Riot queue ids → display label. Only the ones we care about.
const QUEUE_LABELS: Record<number, string> = {
  420: "Solo/Duo",
  430: "Blind",
  440: "Flex",
  450: "ARAM",
  490: "Normal",
  700: "Clash",
  900: "URF",
};

function queueLabel(id: number | null): string {
  if (!id) return "Partida";
  return QUEUE_LABELS[id] ?? "Outro";
}

function formatRelative(ts: number | null): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "agora";
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d}d`;
  const w = Math.floor(d / 7);
  return `há ${w}sem`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function MatchRow({ match, dimmed }: { match: RiotMatch; dimmed: boolean }) {
  const tile = match.champion
    ? `/api/champion-tile/${match.champion}_0.jpg`
    : null;
  return (
    <div
      className={`flex items-center gap-4 rounded-[var(--panel-radius-block)] px-[18px] py-[16px] ${
        dimmed ? "bg-[#ededed]" : "bg-transparent"
      }`}
    >
      <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-full ring-2 ring-[#ece7e4] bg-[#d9d9d9]">
        {tile && (
          <Image
            src={tile}
            alt={match.champion ?? "Champion"}
            fill
            className="object-cover"
            sizes="52px"
            unoptimized
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-[6px]">
          <span
            className={`text-[14px] font-bold ${match.win ? "text-[#2f855a]" : "text-[#c53030]"}`}
          >
            {match.win ? "Vitória" : "Derrota"}
          </span>
          <span className="text-[13px] font-semibold text-[#8d8d8d]">
            • {queueLabel(match.queueId)}
          </span>
        </div>
        <div className="mt-[4px]">
          <span className="text-[14px] font-bold tracking-tight text-[#0f0f0f]">
            {match.kills} / {match.deaths} / {match.assists}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-[2px]">
        <span className="text-[13px] font-bold text-[#0f0f0f]">
          {formatDuration(match.gameDuration)}
        </span>
        <span className="text-[12px] font-semibold text-[#8d8d8d]">
          {match.cs} CS
        </span>
        <span className="text-[11px] font-medium text-[#b0a09a]">
          {formatRelative(match.gameStart)}
        </span>
      </div>
    </div>
  );
}

/**
 * Replaces PanelHistoryCard for the logged-in user — pulls last 10 matches
 * from the Riot API via the Laravel proxy.
 */
export function LiveHistoryCard({ riotId }: { riotId?: string } = {}) {
  const { account } = useAccount();
  const { mode } = useGameMode();
  // Se riotId foi fornecido explicitamente (mesmo vazio), respeita — não sobrescreve
  // com a conta do usuário logado. Fallback pro account só no uso standalone (undefined).
  const effectiveRiotId = riotId !== undefined ? riotId : account.gameNick;
  const hasRiotId = Boolean(effectiveRiotId);
  const state = useRiotProfile(effectiveRiotId);

  return (
    <section className="flex h-full min-h-[471px] flex-col rounded-[var(--panel-radius-card)] bg-white px-[28px] py-[34px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <h2 className="text-[16px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
        Histórico de Partidas
      </h2>
      <p className="mt-[4px] text-[15px] font-medium tracking-[-0.03em] text-[#cccccc]">
        Status das últimas partidas vinculadas ao Riot ID.
      </p>

      <div className="mt-[28px] flex flex-1 flex-col border-t border-[#efebe8] pt-[12px]">
        {!hasRiotId ? (
          <div className="my-auto" />
        ) : state.status === "loading" || state.status === "idle" ? (
          <div className="my-auto flex items-center justify-center">
            <svg className="capas-spinner h-[40px] w-[40px]" viewBox="25 25 50 50">
              <circle r="20" cy="50" cx="50" />
            </svg>
          </div>
        ) : state.status === "error" ? (
          <div className="my-auto text-center">
            <p className="text-[13px] font-semibold text-[#c53030]">
              Não foi possível carregar o histórico.
            </p>
            <p className="mt-[6px] text-[12px] font-medium text-[#b0a09a]">
              {state.message}
            </p>
          </div>
        ) : mode === "Inhouse" ? (
          <p className="my-auto text-center text-[13px] font-medium tracking-[-0.03em] text-[#b0a09a]">
            Histórico de Inhouses em breve.
          </p>
        ) : (
          (() => {
            const filtered = mode === "Flex"
              ? state.profile.matches.filter((m) => m.queueId === 440)
              : state.profile.matches;
            return filtered.length === 0 ? (
              <p className="my-auto text-center text-[13px] font-medium tracking-[-0.03em] text-[#b0a09a]">
                Nenhuma partida {mode === "Flex" ? "Flex" : "recente"} encontrada.
              </p>
            ) : (
              <div className="space-y-[14px]">
                {filtered.slice(0, 10).map((match, index) => (
                  <MatchRow
                    key={match.matchId}
                    match={match}
                    dimmed={index % 2 === 1}
                  />
                ))}
              </div>
            );
          })()
        )}
      </div>
    </section>
  );
}
