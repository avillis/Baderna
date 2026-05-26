"use client";

import Link from "next/link";
import { RotateCw } from "lucide-react";

import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { StyledName } from "@/features/panel/components/styled-name";
import { getMemberSlug } from "@/features/panel/members-data";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import { useWinratesWithMembers } from "@/features/panel/use-winrates-with-members";

function getWinRateColor(winRate: number) {
  if (winRate > 51) return "text-[#2fb481]";
  if (winRate >= 40) return "text-[#d0a63a]";
  return "text-[#d55c5c]";
}

function MemberAvatar({
  avatarSrc,
  id,
  nickname,
}: {
  avatarSrc?: string | null;
  id: string;
  nickname: string;
}) {
  const src = avatarSrc || getChampionAvatarSrc(id);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={nickname}
      className="h-[44px] w-[44px] shrink-0 rounded-full object-cover ring-1 ring-[#ece1db]"
    />
  );
}

export function PanelMemberWinratesCard({
  /** Quando passado, mostra winrates DESSE user (perfil de terceiros).
   *  Omitido = usa o user logado. */
  targetUserId,
}: {
  targetUserId?: number | null;
} = {}) {
  const { rows, debug, loading, refreshing, refresh } = useWinratesWithMembers(targetUserId);
  const members = useBadernaMembers();

  // Resolve activeNameId/slug via lista global de membros (pra StyledName +
  // link pro perfil de cada membro listado no card).
  const styleByMemberId = new Map<number, string | undefined>();
  const memberById = new Map<number, (typeof members)[number]>();
  for (const m of members) {
    if (m.userId) {
      styleByMemberId.set(m.userId, m.activeNameId);
      memberById.set(m.userId, m);
    }
  }

  // Se o card é de um terceiro, filtra ele mesmo da lista — não faz
  // sentido aparecer "X jogou com X mesmo" no próprio perfil dele.
  const visibleRows = targetUserId
    ? rows.filter((r) => r.memberId !== targetUserId)
    : rows;

  return (
    <section className="flex h-full flex-col rounded-[var(--panel-radius-card)] bg-white px-[28px] py-[34px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <div className="flex items-start justify-between gap-[12px]">
        <div>
          <h2 className="text-[16px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Winrate com Membros
          </h2>
          <p className="mt-[4px] text-[15px] font-medium tracking-[-0.03em] text-[#cccccc]">
            Flex queue · season atual.
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing || loading}
          aria-label="Atualizar"
          title="Atualizar"
          className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-[#ededed] text-[#0f0f0f] transition-colors hover:bg-[#e3e3e3] disabled:opacity-50"
        >
          <RotateCw
            className={`h-[14px] w-[14px] ${refreshing ? "animate-spin" : ""}`}
            strokeWidth={2.2}
          />
        </button>
      </div>

      <div className="mt-[28px] flex min-h-[330px] flex-1 flex-col border-t border-[#efebe8] pt-[10px]">
        {loading && (
          <div className="my-auto flex flex-col items-center gap-[10px]">
            <svg
              className="capas-spinner h-[28px] w-[28px] [&_circle]:stroke-[#ff4100]"
              viewBox="25 25 50 50"
            >
              <circle r="20" cy="50" cx="50" />
            </svg>
            <p className="text-center text-[12px] text-[#b0a09a]">
              Calculando winrates da season...
              <br />
              <span className="text-[11px]">Pode demorar uns segundos.</span>
            </p>
          </div>
        )}

        {!loading && visibleRows.length === 0 && (
          <div className="my-auto flex flex-col items-center gap-[12px] px-[20px] text-center">
            <p className="text-[13px] font-medium tracking-[-0.03em] text-[#b0a09a]">
              {targetUserId
                ? "Sem partidas Flex em comum com outros membros nessa season."
                : "Você não jogou Flex com nenhum membro da Baderna nessa season."}
            </p>
            {debug && (
              <details className="w-full max-w-[420px] rounded-[10px] bg-[#fafafa] p-[10px] text-left text-[11px] text-[#6b7280]">
                <summary className="cursor-pointer font-semibold text-[#0f0f0f]">
                  Debug
                </summary>
                <ul className="mt-[6px] space-y-[2px]">
                  {debug.reason && <li>Motivo: <code>{debug.reason}</code></li>}
                  {debug.season && <li>Season: {debug.season}</li>}
                  {typeof debug.members_with_puuid === "number" && (
                    <li>Membros com PUUID: {debug.members_with_puuid}</li>
                  )}
                  {typeof debug.matches_found === "number" && (
                    <li>Partidas encontradas: {debug.matches_found}</li>
                  )}
                  {typeof debug.matches_fetched === "number" && (
                    <li>Partidas baixadas: {debug.matches_fetched}</li>
                  )}
                  {typeof debug.matches_failed === "number" && debug.matches_failed > 0 && (
                    <li>Partidas que falharam: {debug.matches_failed}</li>
                  )}
                  {debug.errors && debug.errors.length > 0 && (
                    <li className="break-all">
                      Erros:
                      <ul className="ml-[12px] list-disc">
                        {debug.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </li>
                  )}
                </ul>
              </details>
            )}
          </div>
        )}

        {!loading &&
          visibleRows.map((row) => {
            const games = row.wins + row.losses;
            const winRate = games > 0 ? Math.round((row.wins / games) * 100) : 0;
            const styleId = styleByMemberId.get(row.memberId);
            const member = memberById.get(row.memberId);
            const slug = member ? getMemberSlug(member) : null;
            // Prefere o nickname LIVE da lista de membros (resolvido por
            // userId, que é estável) ao invés do snapshot que veio com
            // o cache de winrate — assim, se o user trocar de nick, o
            // card atualiza sem esperar o cache expirar.
            const displayName = member?.nickname ?? row.summonerName ?? row.name;
            const content = (
              <>
                <MemberAvatar
                  avatarSrc={member?.avatarSrc ?? row.avatarSrc}
                  id={String(row.memberId)}
                  nickname={displayName}
                />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate-glow text-[15px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                    <StyledName styleId={styleId}>
                      {displayName}
                    </StyledName>
                  </h3>
                  <p className="mt-[2px] text-[13px] font-semibold tracking-[-0.02em] text-[#b0a09a]">
                    {row.wins}v {row.losses}d
                    <span className="mx-[5px] opacity-40">·</span>
                    {games} {games === 1 ? "jogo" : "jogos"}
                  </p>
                </div>
                <div
                  className={`shrink-0 text-[14px] font-bold tracking-[-0.02em] ${getWinRateColor(winRate)}`}
                >
                  {winRate}%
                </div>
              </>
            );
            return slug ? (
              <Link
                key={row.memberId}
                href={`/membro/${slug}`}
                className="flex items-center gap-[14px] py-[11px] transition-opacity hover:opacity-70"
              >
                {content}
              </Link>
            ) : (
              <article
                key={row.memberId}
                className="flex items-center gap-[14px] py-[11px]"
              >
                {content}
              </article>
            );
          })}
      </div>
    </section>
  );
}
