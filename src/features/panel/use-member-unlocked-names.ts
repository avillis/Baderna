"use client";

import { useCallback } from "react";

import { useMemberUnlocks } from "@/features/panel/use-member-unlocks";

export const DEFAULT_UNLOCKED_NAMES = ["preto"];

/**
 * Estilos de nome desbloqueados do usuário logado.
 * `memberId` mantido pra compatibilidade.
 */
export function useMemberUnlockedNames(_memberId: string): {
  unlocked: string[];
  unlock: (id: string) => Promise<unknown> | undefined;
  isUnlocked: (id: string) => boolean;
} {
  const { unlocks, unlock: rawUnlock, isUnlocked: rawIs } = useMemberUnlocks();

  const unlocked = Array.from(new Set([...DEFAULT_UNLOCKED_NAMES, ...unlocks.name]));

  const unlock = useCallback(
    (id: string): Promise<unknown> | undefined => {
      return rawUnlock("name", id);
    },
    [rawUnlock],
  );

  const isUnlocked = useCallback(
    (id: string) =>
      DEFAULT_UNLOCKED_NAMES.includes(id) || rawIs("name", id),
    [rawIs],
  );

  return { unlocked, unlock, isUnlocked };
}
