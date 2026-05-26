"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { RaritySmokeOverlay } from "@/features/panel/components/rarity-smoke-overlay";
import { RARITY_META, type TitleRarity } from "@/features/panel/titles-data";
import type { PurchaseEntry } from "@/features/panel/use-member-purchase-history";

type Props = {
  open: boolean;
  onClose: () => void;
  entries: PurchaseEntry[];
};

function formatTimestamp(ts: number) {
  const d = new Date(ts);
  const date = d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  const time = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date} • ${time}`;
}

export function PurchaseHistoryModal({ open, onClose, entries }: Props) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  function handleClose() {
    setClosing(true);
  }

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setClosing(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={`${closing ? "modal-backdrop-out" : "modal-backdrop-in"} fixed inset-0 z-[9999] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]`}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${closing ? "modal-panel-out" : "modal-panel-in"} relative flex max-h-[86vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]`}
        onAnimationEnd={() => { if (closing) onClose(); }}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar"
          className="absolute right-[20px] top-[20px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85"
        >
          <svg
            viewBox="0 0 10 10"
            fill="none"
            className="h-[12px] w-[12px]"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" />
          </svg>
        </button>

        <div className="border-b border-[#f3ebe8] px-[28px] pt-[28px] pb-[20px]">
          <h2 className="text-[24px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Histórico
          </h2>
          <p className="mt-[4px] text-[13px] tracking-[-0.01em] text-[#7c7c7c]">
            Tudo que você abriu na loja, com o saldo de cada momento.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-[20px] py-[16px]">
          {entries.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center text-[13px] text-[#7c7c7c]">
              Nenhum prêmio ainda. Gire uma roleta pra começar!
            </div>
          ) : (
            <ul className="space-y-[6px]">
              {entries.map((entry) => {
                const rarityKey = entry.rarity as TitleRarity;
                const meta = RARITY_META[rarityKey] ?? RARITY_META.comum;
                return (
                  <li
                    key={entry.id}
                    className="flex items-center gap-[12px] rounded-[14px] bg-[#fafafa] px-[14px] py-[10px]"
                  >
                    {/* Item pill */}
                    <span
                      className="relative inline-flex max-w-[200px] shrink-0 items-center overflow-hidden rounded-full px-[12px] py-[5px] text-[11px] font-semibold tracking-[-0.01em]"
                      style={{
                        background: meta.pillGradient,
                        color: meta.pillText,
                      }}
                    >
                      <RaritySmokeOverlay rarity={rarityKey} />
                      <span className="relative z-10 truncate">
                        {entry.itemLabel}
                      </span>
                    </span>

                    {/* Kind label + timestamp */}
                    <div className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="text-[12px] font-semibold tracking-[-0.02em] text-[#0f0f0f]">
                        {entry.kind === "capa"
                          ? "Capa"
                          : entry.kind === "titulo"
                            ? "Título"
                            : "Nome"}
                        {entry.free && (
                          <span className="ml-[6px] inline-block rounded-full bg-[#fff4f4] px-[6px] py-[1px] text-[10px] font-bold text-[#ff4100]">
                            Grátis
                          </span>
                        )}
                        {entry.refunded && (
                          <span className="ml-[6px] inline-block rounded-full bg-[#e6f4ea] px-[6px] py-[1px] text-[10px] font-bold text-[#1e7c3a]">
                            Duplicado
                          </span>
                        )}
                      </span>
                      <span className="text-[11px] text-[#9c9c9c]">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>

                    {/* Cost + balance after */}
                    <div className="flex shrink-0 flex-col items-end leading-tight">
                      <span
                        className={`flex items-center gap-[4px] text-[12px] font-bold tracking-[-0.02em] tabular-nums ${
                          entry.free
                            ? "text-[#7c7c7c]"
                            : entry.refunded
                              ? "text-[#1e7c3a]"
                              : "text-[#c53030]"
                        }`}
                      >
                        {entry.free
                          ? "grátis"
                          : `${entry.refunded ? "+" : "−"}${entry.cost}`}
                        {!entry.free && (
                          <Image
                            src="/images/coin/Coin_icon2.png"
                            alt=""
                            width={12}
                            height={12}
                            className="inline-block"
                          />
                        )}
                      </span>
                      <span className="text-[10px] text-[#9c9c9c] tabular-nums">
                        saldo {entry.balanceAfter.toLocaleString("pt-BR")}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
