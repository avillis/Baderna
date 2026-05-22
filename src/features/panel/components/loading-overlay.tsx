"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const DEFAULT_PHRASES = [
  "Pingando o jungler...",
  "Tomando dragão...",
  "Stealando o Baron...",
  "Wardando o river...",
  "Tilt-resistente ativado...",
  "Comprando elixir...",
  "Pulando flash entre lanes...",
  "Distribuindo wards de visão...",
  "Calculando primeira torre...",
  "Spawnando arautos...",
  "Voltando pra base...",
  "Negociando troca de pick...",
  "Smitando o smite...",
  "Pedindo recall do mid...",
  "Roubando o smite roubado...",
  "Reclamando do suporte...",
  "Estourando barril de Gangplank...",
  "Pingando o ADC pra recall...",
  "Procurando o jungler sumido...",
  "Construindo Mythic do meta...",
];

const PHRASE_INTERVAL_MS = 1400;

export function LoadingOverlay({
  visible,
  phrases = DEFAULT_PHRASES,
}: {
  visible: boolean;
  phrases?: string[];
}) {
  const [phraseIdx, setPhraseIdx] = useState(() =>
    Math.floor(Math.random() * phrases.length),
  );

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => {
      setPhraseIdx((prev) => {
        // Pula pra um índice diferente do atual.
        let next = Math.floor(Math.random() * phrases.length);
        if (next === prev && phrases.length > 1) {
          next = (next + 1) % phrases.length;
        }
        return next;
      });
    }, PHRASE_INTERVAL_MS);
    return () => clearInterval(t);
  }, [visible, phrases]);

  if (!visible) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-hidden
      // z-[20] fica abaixo da sidebar (sticky z-30), então a sidebar continua
      // visível por cima. O fundo cobre o viewport inteiro; o conteúdo
      // centraliza só na área do main (offset pela largura da sidebar em xl).
      className="fixed inset-0 z-[20] bg-[#f7f7f7]"
    >
      <div className="flex h-full w-full flex-col items-center justify-center xl:pl-[423px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/gifs/braum.gif"
          alt=""
          className="mb-[18px] h-[360px] w-[360px] object-contain"
        />
        <p className="min-h-[24px] text-[16px] font-semibold tracking-[-0.02em] text-[#0f0f0f] transition-opacity duration-300">
          {phrases[phraseIdx]}
        </p>
      </div>
    </div>,
    document.body,
  );
}
