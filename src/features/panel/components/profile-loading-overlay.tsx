"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useAccount } from "@/features/panel/use-account";
import { useAuth } from "@/features/panel/use-auth";
import { useProfileLoadingToggle } from "@/features/panel/use-profile-loading-toggle";
import { useRiotProfile } from "@/features/panel/use-riot-profile";

const MIN_VISIBLE_MS = 2000;

/**
 * Overlay fullscreen com o Braum gif que fica por cima do perfil enquanto os
 * dados do client (account, Riot profile) ainda não chegaram. Some quando:
 * - O auth/account hidratou
 * - O Riot profile resolveu (ou erro/idle)
 * - Já passaram pelo menos MIN_VISIBLE_MS (evita flash)
 */
export function ProfileLoadingOverlay() {
  const { hydrated } = useAuth();
  const { account } = useAccount();
  const riot = useRiotProfile(account.gameNick || null);
  const { disabled: overlayDisabled } = useProfileLoadingToggle();
  const [mountedAt] = useState(() => Date.now());
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const dataReady =
      hydrated &&
      (riot.status === "ready" ||
        riot.status === "error" ||
        riot.status === "idle");
    if (!dataReady) return;

    const elapsed = Date.now() - mountedAt;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

    const t1 = setTimeout(() => {
      setFading(true);
      const t2 = setTimeout(() => setVisible(false), 280);
      return () => clearTimeout(t2);
    }, remaining);
    return () => clearTimeout(t1);
  }, [hydrated, riot.status, mountedAt]);

  // Toggle global do admin: silencia o overlay em todas as telas.
  if (overlayDisabled) return null;
  if (!visible) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-hidden
      className={`pointer-events-auto fixed inset-0 z-[20] bg-[#f7f7f7] transition-opacity duration-300 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Conteúdo centralizado só na área do main (sidebar fica visível por cima
          graças ao z-30 dela). O fundo cobre o viewport inteiro. */}
      <div className="flex h-full w-full flex-col items-center justify-center xl:pl-[423px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/gifs/braum.gif"
          alt=""
          className="mb-[18px] h-[360px] w-[360px] object-contain"
        />
        <p className="text-[16px] font-semibold tracking-[-0.02em] text-[#0f0f0f]">
          Carregando perfil…
        </p>
      </div>
    </div>,
    document.body,
  );
}
