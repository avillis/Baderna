"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { StyledName } from "@/features/panel/components/styled-name";
import {
  NAME_STYLES,
  type NameStyle,
} from "@/features/panel/names-data";
import {
  RARITY_META,
  RARITY_ORDER,
  type TitleRarity,
} from "@/features/panel/titles-data";

type NameStyleModalProps = {
  open: boolean;
  onClose: () => void;
  activeNameId: string;
  onSelect?: (id: string) => void;
  readonly?: boolean;
  unlockedIds?: string[];
};

export function NameStyleModal({
  open,
  onClose,
  activeNameId,
  onSelect,
  readonly = false,
  unlockedIds = [],
}: NameStyleModalProps) {
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
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !mounted) return null;

  const grouped: Record<string, NameStyle[]> = {};
  for (const s of NAME_STYLES) (grouped[s.rarity] ??= []).push(s);

  return createPortal(
    <div
      className={`${closing ? "modal-backdrop-out" : "modal-backdrop-in"} fixed inset-0 z-[9999] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]`}
      onClick={handleClose}
    >
      <div
        className={`${closing ? "modal-panel-out" : "modal-panel-in"} relative max-h-[86vh] w-full max-w-[640px] overflow-hidden rounded-[24px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]`}
        onClick={(e) => e.stopPropagation()}
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
            Estilo do nome
          </h2>
          <p className="mt-[4px] text-[13px] tracking-[-0.01em] text-[#7c7c7c]">
            Escolha como seu nome aparece pela Baderna.
          </p>
        </div>

        <div className="max-h-[calc(86vh-140px)] overflow-y-auto px-[28px] py-[24px]">
          {RARITY_ORDER.map((rarity) => {
            const list = grouped[rarity];
            if (!list?.length) return null;
            const meta = RARITY_META[rarity as TitleRarity];

            return (
              <section key={rarity} className="mb-[24px] last:mb-0">
                <h3
                  className="mb-[12px] text-[14px] font-bold tracking-[-0.02em]"
                  style={{ color: meta.headerColor }}
                >
                  {meta.label}
                </h3>
                <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 md:grid-cols-4">
                  {list.map((style) => {
                    const isActive = style.id === activeNameId;
                    const isLocked = !unlockedIds.includes(style.id);
                    const isInteractive = !readonly && !isLocked;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => {
                          if (readonly || isLocked) return;
                          onSelect?.(style.id);
                        }}
                        className="group relative flex items-center justify-center overflow-hidden rounded-[14px] bg-[#ededed] px-[10px] py-[14px] text-center transition-transform"
                        style={{
                          opacity: isLocked ? 0.4 : 1,
                          cursor: isInteractive ? "pointer" : "default",
                          outline: isActive ? "2px solid #0f0f0f" : "none",
                          outlineOffset: "2px",
                          transform: "scale(1)",
                        }}
                        onMouseEnter={(e) => {
                          if (isInteractive)
                            e.currentTarget.style.transform = "scale(1.04)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        <StyledName
                          styleId={style.id}
                          className="text-[15px] font-bold leading-[1.15] tracking-[-0.02em]"
                        >
                          {style.label}
                        </StyledName>
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
