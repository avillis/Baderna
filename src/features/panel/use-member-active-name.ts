"use client";

import { useCallback } from "react";

import { useAccount } from "@/features/panel/use-account";
import { useAuth } from "@/features/panel/use-auth";

/**
 * Estilo de nome ativo do usuário logado.
 * Persiste via `account.activeNameId` no Laravel.
 */
export function useMemberActiveName(
  memberId: string,
  fallback = "preto",
): { active: string; setActive: (id: string) => void } {
  const { user } = useAuth();
  const { account, updateField } = useAccount();

  const selfNick = account.gameNick.split("#")[0]?.toLowerCase() ?? "";
  const selfUserId = user ? String(user.id) : "";
  const isSelf =
    memberId === selfUserId ||
    memberId === selfNick ||
    memberId.toLowerCase() === selfNick;

  const active = isSelf ? account.activeNameId ?? fallback : fallback;

  const setActive = useCallback(
    (id: string) => {
      if (!isSelf) return;
      updateField("activeNameId", id);
    },
    [isSelf, updateField],
  );

  return { active, setActive };
}
