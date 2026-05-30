"use client";

import { useCallback } from "react";

import { useMemberUnlocks } from "@/features/panel/use-member-unlocks";

export const DEFAULT_UNLOCKED_BANNERS = ["Garen_Original.webp"];

function isValidFileName(name: string): boolean {
  return /^[A-Za-z0-9._-]+\.webp$/.test(name);
}

/**
 * Banners desbloqueados do usuário logado. O parâmetro `memberId` é mantido
 * pra compatibilidade com chamadas antigas mas não é mais usado — agora
 * sempre vem do usuário autenticado via API.
 */
export function useUnlockedBanners(_memberId: string) {
  const { unlocks, unlock: rawUnlock, isUnlocked: rawIs } = useMemberUnlocks();

  const stored = unlocks.capa.filter(isValidFileName);
  const hasDefault = stored.some((b) => DEFAULT_UNLOCKED_BANNERS.includes(b));
  const unlocked = hasDefault
    ? stored
    : [...DEFAULT_UNLOCKED_BANNERS, ...stored];

  const unlock = useCallback(
    (fileName: string, free?: boolean, jester?: boolean): Promise<unknown> | undefined => {
      if (!isValidFileName(fileName)) return;
      return rawUnlock("capa", fileName, free, jester);
    },
    [rawUnlock],
  );

  const isUnlocked = useCallback(
    (fileName: string) =>
      DEFAULT_UNLOCKED_BANNERS.includes(fileName) || rawIs("capa", fileName),
    [rawIs],
  );

  return { unlocked, unlock, isUnlocked };
}
