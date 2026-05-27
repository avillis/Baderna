"use client";

import { useCallback } from "react";

import { useAccount } from "@/features/panel/use-account";
import { useAuth } from "@/features/panel/use-auth";
import { getMemberSlug } from "@/features/panel/members-data";

/**
 * Títulos equipados pelo usuário logado.
 *
 * - Para o PRÓPRIO usuário (memberId === slug do gameNick OU userId numérico):
 *   lê/escreve via `account.activeTitleSlugs` que persiste no Laravel.
 * - Para outros membros: retorna o fallback (read-only).
 */
export function useMemberActiveTitles(
  memberId: string,
  fallback: string[] = [],
): { active: string[]; setActive: (titles: string[]) => void } {
  const { user } = useAuth();
  const { account, updateField } = useAccount();

  // Mesma lógica do useMemberActiveName: usa gameNick do account, com
  // fallback no summoner_name do JWT quando o account ainda não carregou.
  const accountNick = account.gameNick.split("#")[0] ?? "";
  const authNick = user?.summoner_name ?? "";
  const selfNick = accountNick || authNick;
  // Slug canônica é `account.slug`; cai pro derivado-de-nick só enquanto
  // o account ainda não hidratou (primeiro render pós-login).
  const selfSlug =
    account.slug || (selfNick ? getMemberSlug({ nickname: selfNick }) : "");
  const selfUserId = user ? String(user.id) : "";
  const isSelf =
    memberId === selfUserId ||
    (selfSlug.length > 0 && memberId.toLowerCase() === selfSlug);

  const active = isSelf
    ? account.activeTitleSlugs ?? fallback
    : fallback;

  const setActive = useCallback(
    (titles: string[]) => {
      if (!isSelf) return;
      updateField("activeTitleSlugs", titles);
    },
    [isSelf, updateField],
  );

  return { active, setActive };
}
