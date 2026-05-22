"use client";

import { useCallback } from "react";

import { useMemberUnlocks } from "@/features/panel/use-member-unlocks";

/**
 * Títulos desbloqueados do usuário logado. `memberId` mantido pra
 * compatibilidade; agora sempre vem do usuário autenticado.
 */
export function useMemberUnlockedTitles(
  _memberId: string,
  fallback: string[] = [],
): {
  unlocked: string[];
  setUnlocked: (titles: string[]) => void;
} {
  const { unlocks, unlock: rawUnlock } = useMemberUnlocks();

  // União do fallback (defaults garantidos como "aprendiz") com o que vem da API.
  const unlocked = Array.from(new Set([...fallback, ...unlocks.title]));

  const setUnlocked = useCallback(
    (titles: string[]) => {
      // O endpoint é additive — só adiciona o que ainda não existe.
      // (Revogar requer endpoint admin; UI normal não chama isso.)
      const current = new Set(unlocks.title);
      titles.forEach((t) => {
        if (!current.has(t)) void rawUnlock("title", t);
      });
    },
    [rawUnlock, unlocks.title],
  );

  return { unlocked, setUnlocked };
}
