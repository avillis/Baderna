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
  unlock: (id: string) => void;
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

  // Chamada SEM guard — usada pela loja, onde precisamos que o backend
  // SEMPRE responda (mesmo em duplicada) pra devolver o saldo otimista
  // debitado durante o spin. Bypass do guard de setUnlocked.
  const unlock = useCallback(
    (id: string) => {
      void rawUnlock("title", id);
    },
    [rawUnlock],
  );

  return { unlocked, setUnlocked, unlock };
}
