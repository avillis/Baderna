"use client";

import { useCallback } from "react";

import { useAccount } from "@/features/panel/use-account";
import { useAuth } from "@/features/panel/use-auth";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";

/**
 * Estilo de nome ativo do membro alvo.
 * - Pra o usuário logado: lê/grava em `account.activeNameId` (Laravel).
 * - Pra outros membros: lê o `activeNameId` retornado pelo /api/members.
 */
export function useMemberActiveName(
  memberId: string,
  fallback = "preto",
): { active: string; setActive: (id: string) => void } {
  const { user } = useAuth();
  const { account, updateField } = useAccount();
  const members = useBadernaMembers();

  // Nick "fresco": preferimos gameNick do account (já normalizado), mas se
  // ainda não carregou caímos no summoner_name do JWT/useAuth. Sem essa
  // fallback, clicks rápidos depois do login viravam no-op (isSelf=false).
  const accountNick = account.gameNick.split("#")[0]?.toLowerCase() ?? "";
  const authNick = user?.summoner_name?.toLowerCase() ?? "";
  const selfNick = accountNick || authNick;
  const selfUserId = user ? String(user.id) : "";
  const isSelf =
    memberId === selfUserId ||
    (selfNick.length > 0 && memberId.toLowerCase() === selfNick);

  // Pra outros membros, busca a row na lista global.
  const member = isSelf
    ? null
    : members.find(
        (m) =>
          m.id === memberId ||
          m.id.toLowerCase() === memberId.toLowerCase() ||
          (m.userId != null && String(m.userId) === memberId),
      );

  const active = isSelf
    ? account.activeNameId ?? fallback
    : member?.activeNameId ?? fallback;

  const setActive = useCallback(
    (id: string) => {
      if (!isSelf) return;
      updateField("activeNameId", id);
    },
    [isSelf, updateField],
  );

  return { active, setActive };
}
