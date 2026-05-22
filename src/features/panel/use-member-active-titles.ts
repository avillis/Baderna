"use client";

import { useCallback } from "react";

import { useAccount } from "@/features/panel/use-account";
import { useAuth } from "@/features/panel/use-auth";

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

  const selfNick = account.gameNick.split("#")[0]?.toLowerCase() ?? "";
  const selfUserId = user ? String(user.id) : "";
  const isSelf =
    memberId === selfUserId ||
    memberId === selfNick ||
    memberId.toLowerCase() === selfNick;

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
