"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";

// 3D coin é carregado só client-side (depende de WebGL).
// Loading placeholder mantém o layout estável durante o import (~200kb).
const CoinFlip3D = dynamic(
  () =>
    import("@/features/panel/components/coin-flip-3d").then(
      (m) => m.CoinFlip3D,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-square w-full rounded-[18px] bg-[#ededed]" />
    ),
  },
);

type Captain = {
  id: string;
  nickname: string;
  avatarSrc?: string;
};

type LeaderDiceModalProps = {
  open: boolean;
  leaders: [Captain, Captain] | null;
  onCancel: () => void;
  /** Chamado com { winnerId, side } onde side é "blue" (FirstPick) ou "red" (Counter). */
  onConfirm: (winnerId: string, side: "blue" | "red") => void;
};

type FlipState =
  | { phase: "idle" }
  | { phase: "flipping"; coinFace: "cara" | "coroa" }
  | { phase: "revealed"; coinFace: "cara" | "coroa" }
  | { phase: "done"; winnerIdx: 0 | 1; coinFace: "cara" | "coroa" };

export function LeaderDiceModal({
  open,
  leaders,
  onCancel,
  onConfirm,
}: LeaderDiceModalProps) {
  const [flip, setFlip] = useState<FlipState>({ phase: "idle" });
  const [pickingSide, setPickingSide] = useState(false);
  const [trigger, setTrigger] = useState(0);
  const timersRef = useRef<number[]>([]);

  // Limpa timers se modal fechar ou unmount.
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!open) {
      // Reset ao fechar
      setFlip({ phase: "idle" });
      setPickingSide(false);
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    }
  }, [open]);

  if (!open || !leaders) return null;
  const winner =
    flip.phase === "done" ? leaders[flip.winnerIdx] : null;

  function startFlip() {
    if (flip.phase === "flipping") return;
    const coinFace: "cara" | "coroa" = Math.random() < 0.5 ? "cara" : "coroa";

    setFlip({ phase: "flipping", coinFace });
    setTrigger((t) => t + 1);

    // Espera a animação assentar (~2s) antes de liberar a escolha do vencedor.
    const id = window.setTimeout(() => {
      setFlip({ phase: "revealed", coinFace });
    }, 2000);
    timersRef.current.push(id);
  }

  function manualPick(idx: 0 | 1) {
    if (flip.phase !== "revealed" && flip.phase !== "done") return;
    setFlip({ phase: "done", winnerIdx: idx, coinFace: flip.coinFace });
  }

  function reset() {
    setFlip({ phase: "idle" });
    setPickingSide(false);
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }

  const isPicking = pickingSide && winner;

  function highlightFor(idx: 0 | 1): "winner" | "none" {
    if (flip.phase === "done" && flip.winnerIdx === idx) return "winner";
    return "none";
  }

  const canPickWinner = flip.phase === "revealed" || flip.phase === "done";

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-[2px]"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="relative flex w-full max-w-[520px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancelar"
          className="absolute right-[20px] top-[20px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85"
        >
          <X className="h-[16px] w-[16px]" strokeWidth={2.4} />
        </button>

        <div className="border-b border-[#f3ebe8] px-[28px] pt-[28px] pb-[20px]">
          <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            {isPicking
              ? "Qual lado o líder escolhe?"
              : flip.phase === "done"
                ? `${winner!.nickname} venceu!`
                : "Cara ou Coroa"}
          </h2>
          <p className="mt-[4px] text-[13px] tracking-[-0.01em] text-[#7c7c7c]">
            {isPicking
              ? `${winner!.nickname} ganhou. Escolha o lado.`
              : flip.phase === "flipping"
                ? "Girando..."
                : flip.phase === "revealed"
                  ? `Saiu ${flip.coinFace === "cara" ? "Cara" : "Coroa"}. Quem ganhou?`
                  : flip.phase === "done"
                    ? "Bora escolher o lado."
                    : "Joga a moeda pra sortear quem escolhe."}
          </p>
        </div>

        {/* PASSO 1: moeda + dois cards + flip */}
        {!isPicking && (
          <div className="flex flex-col gap-[18px] px-[28px] pt-[28px] pb-[24px]">
            {/* Moeda 3D (Three.js + Cannon física) */}
            <CoinFlip3D
              face={
                flip.phase === "idle"
                  ? null
                  : flip.coinFace
              }
              trigger={trigger}
            />

            <div className="mt-[14px] grid grid-cols-2 gap-[14px]">
              {leaders.map((cap, i) => {
                const idx = i as 0 | 1;
                const state = highlightFor(idx);
                return (
                  <button
                    key={cap.id}
                    type="button"
                    onClick={() => manualPick(idx)}
                    disabled={!canPickWinner}
                    className={`group flex flex-col items-center gap-[12px] rounded-[18px] px-[16px] py-[20px] transition-all
                      ${
                        state === "winner"
                          ? "bg-[#fff4ec] ring-2 ring-[#ff4100] scale-[1.02]"
                          : canPickWinner
                            ? "bg-[#fafafa] hover:bg-[#f0f0f0] hover:scale-[1.01]"
                            : "bg-[#fafafa] opacity-60"
                      }
                      disabled:cursor-default`}
                  >
                    <div
                      className={`relative h-[64px] w-[64px] overflow-hidden rounded-full transition-all
                        ${state === "winner" ? "ring-2 ring-[#ff4100]" : ""}`}
                    >
                      <img
                        src={cap.avatarSrc || getChampionAvatarSrc(cap.id)}
                        alt={cap.nickname}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <span className="text-[14px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                      {cap.nickname}
                    </span>
                    <span
                      className={`text-[12px] font-bold tracking-[-0.02em] transition-colors
                        ${state === "winner" ? "text-[#ff4100]" : "text-[#8d8d8d]"}`}
                    >
                      {state === "winner" ? "Venceu" : "Ganhou"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Botão jogar moeda / continuar */}
            {flip.phase === "idle" && (
              <button
                type="button"
                onClick={startFlip}
                className="flex h-[50px] w-full items-center justify-center rounded-[18px] bg-[#ff4100] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90"
              >
                Jogar moeda
              </button>
            )}
            {flip.phase === "flipping" && (
              <button
                type="button"
                disabled
                className="flex h-[50px] w-full items-center justify-center rounded-[18px] bg-[#ededed] text-[13px] font-bold tracking-[-0.02em] text-[#8d8d8d]"
              >
                Girando...
              </button>
            )}
            {flip.phase === "done" && (
              <div className="flex w-full gap-[8px]">
                <button
                  type="button"
                  onClick={reset}
                  className="h-[50px] flex-1 basis-0 rounded-[18px] bg-[#ededed] text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-colors hover:bg-[#e0e0e0]"
                >
                  Jogar de novo
                </button>
                <button
                  type="button"
                  onClick={() => setPickingSide(true)}
                  className="h-[50px] flex-1 basis-0 rounded-[18px] bg-[#ff4100] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90"
                >
                  Continuar
                </button>
              </div>
            )}
          </div>
        )}

        {/* PASSO 2: escolher lado */}
        {isPicking && (
          <div className="flex flex-col gap-[12px] px-[28px] py-[28px]">
            <button
              type="button"
              onClick={() => onConfirm(winner!.id, "blue")}
              className="group flex items-center justify-between rounded-[18px] bg-gradient-to-r from-[#0a4a8c] to-[#1a72d8] px-[20px] py-[18px] text-white transition-transform hover:scale-[1.01]"
            >
              <div className="flex flex-col items-start">
                <span className="text-[15px] font-bold tracking-[-0.02em]">
                  Lado Azul
                </span>
                <span className="text-[11px] font-semibold opacity-80">
                  First Pick — escolhe primeiro
                </span>
              </div>
              <span className="rounded-full bg-white/20 px-[12px] py-[5px] text-[12px] font-bold tracking-[-0.02em]">
                Pick
              </span>
            </button>

            <button
              type="button"
              onClick={() => onConfirm(winner!.id, "red")}
              className="group flex items-center justify-between rounded-[18px] bg-gradient-to-r from-[#8b1a1a] to-[#d83333] px-[20px] py-[18px] text-white transition-transform hover:scale-[1.01]"
            >
              <div className="flex flex-col items-start">
                <span className="text-[15px] font-bold tracking-[-0.02em]">
                  Lado Vermelho
                </span>
                <span className="text-[11px] font-semibold opacity-80">
                  Counter Pick — escolhe depois
                </span>
              </div>
              <span className="rounded-full bg-white/20 px-[12px] py-[5px] text-[12px] font-bold tracking-[-0.02em]">
                Counter
              </span>
            </button>

            <div className="mt-[6px] flex justify-end">
              <button
                type="button"
                onClick={() => setPickingSide(false)}
                className="h-[50px] rounded-[18px] bg-[#ededed] px-6 text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-colors hover:bg-[#e0e0e0]"
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

