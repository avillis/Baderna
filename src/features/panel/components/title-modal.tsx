"use client";

import { X, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  RARITY_META,
  RARITY_ORDER,
  type Title,
} from "@/features/panel/titles-data";
import { RaritySmokeOverlay } from "@/features/panel/components/rarity-smoke-overlay";
import { useTitles } from "@/features/panel/use-titles";

type TitleModalProps = {
  open: boolean;
  onClose: () => void;
  activeTitleIds: string[];
  onToggle?: (titleId: string) => void;
  readonly?: boolean;
  unlockedTitleIds?: string[];
  maxActive?: number;
};

export function TitleModal({
  open,
  onClose,
  activeTitleIds,
  onToggle,
  readonly = false,
  unlockedTitleIds = [],
  maxActive = 2,
}: TitleModalProps) {
  const [mounted, setMounted] = useState(false);
  const { titles } = useTitles();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const grouped: Record<string, Title[]> = {};
  for (const t of titles) {
    (grouped[t.rarity] ??= []).push(t);
  }

  const activeSet = new Set(activeTitleIds);
  const limitReached = activeSet.size >= maxActive;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative max-h-[86vh] w-full max-w-[640px] overflow-hidden rounded-[24px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-[20px] top-[20px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85"
        >
          <X className="h-[16px] w-[16px]" strokeWidth={2.4} />
        </button>

        <div className="border-b border-[#f3ebe8] px-[28px] pt-[28px] pb-[20px]">
          <h2 className="text-[24px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Títulos
          </h2>
          <p className="mt-[4px] text-[13px] tracking-[-0.01em] text-[#7c7c7c]">
            Escolha até {maxActive} títulos que aparecem ao lado do seu nome.
            {!readonly && (
              <span className="ml-[4px] font-semibold text-[#0f0f0f]">
                {activeSet.size}/{maxActive} selecionados.
              </span>
            )}
          </p>
        </div>

        <div className="max-h-[calc(86vh-150px)] overflow-y-auto px-[28px] py-[24px]">
          {RARITY_ORDER.map((rarity) => {
            const list = grouped[rarity];
            if (!list?.length) return null;
            const meta = RARITY_META[rarity];

            return (
              <section key={rarity} className="mb-[24px] last:mb-0">
                <h3
                  className="mb-[12px] text-[14px] font-bold tracking-[-0.02em]"
                  style={{ color: meta.headerColor }}
                >
                  {meta.label}
                </h3>
                <div className="flex flex-wrap gap-[10px]">
                  {list.map((title) => {
                    const isActive = activeSet.has(title.id);
                    const isLocked = !unlockedTitleIds.includes(title.id);
                    const isInteractive = !readonly && !isLocked;
                    return (
                      <button
                        key={title.id}
                        type="button"
                        onClick={() => {
                          if (readonly || isLocked) return;
                          onToggle?.(title.id);
                        }}
                        className="group relative inline-flex items-center gap-[6px] overflow-hidden rounded-full px-[14px] py-[8px] text-[12px] font-semibold tracking-[-0.02em] transition-transform"
                        style={{
                          background: RARITY_META[title.rarity].pillGradient,
                          color: RARITY_META[title.rarity].pillText,
                          opacity: isLocked ? 0.4 : 1,
                          cursor: isInteractive ? "pointer" : "default",
                          outline: isActive ? "2px solid #0f0f0f" : "none",
                          outlineOffset: "2px",
                          transform: "scale(1)",
                        }}
                        onMouseEnter={(e) => {
                          if (isInteractive)
                            e.currentTarget.style.transform = "scale(1.05)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <RaritySmokeOverlay rarity={title.rarity} />
                        <span className="relative z-10">{title.label}</span>
                        {isActive && !isLocked && (
                          <Check className="relative z-10 h-[12px] w-[12px]" strokeWidth={3} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>,
    document.body,
  );
}
