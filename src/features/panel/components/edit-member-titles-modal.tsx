"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { RaritySmokeOverlay } from "@/features/panel/components/rarity-smoke-overlay";
import {
  RARITY_META,
  RARITY_ORDER,
  type Title,
} from "@/features/panel/titles-data";
import { useTitles } from "@/features/panel/use-titles";
import { useAdminMemberUnlocks } from "@/features/panel/use-admin-member-unlocks";

type EditMemberTitlesModalProps = {
  open: boolean;
  onClose: () => void;
  memberId: string;
  /** user_id numérico — necessário pra usar os endpoints admin. */
  targetUserId: number | null;
  memberNickname: string;
  defaultUnlocked?: string[];
};

export function EditMemberTitlesModal({
  open,
  onClose,
  targetUserId,
  memberNickname,
  defaultUnlocked = [],
}: EditMemberTitlesModalProps) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const { titles } = useTitles();
  const { unlocks, grant, revoke } = useAdminMemberUnlocks(targetUserId);

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

  // Union do que veio da API + defaults (ex: "aprendiz" sempre desbloqueado).
  const unlocked = Array.from(new Set([...defaultUnlocked, ...unlocks.title]));

  function toggle(id: string) {
    // Default unlock "aprendiz" não pode ser revogado.
    if (defaultUnlocked.includes(id) && !unlocks.title.includes(id)) return;
    if (unlocks.title.includes(id)) {
      void revoke("title", id);
    } else {
      void grant("title", id);
    }
  }

  const grouped: Record<string, Title[]> = {};
  for (const t of titles) (grouped[t.rarity] ??= []).push(t);

  return createPortal(
    <div
      className={`${closing ? "modal-backdrop-out" : "modal-backdrop-in"} fixed inset-0 z-[9999] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]`}
      onClick={handleClose}
    >
      <div
        className={`${closing ? "modal-panel-out" : "modal-panel-in"} relative flex max-h-[86vh] w-full max-w-[640px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]`}
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
            Editar títulos
          </h2>
          <p className="mt-[4px] text-[13px] tracking-[-0.01em] text-[#7c7c7c]">
            Selecione quais títulos <strong>{memberNickname}</strong> tem
            desbloqueados. Alterações são salvas automaticamente.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-[28px] py-[24px]">
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
                    const isUnlocked = unlocked.includes(title.id);
                    return (
                      <button
                        key={title.id}
                        type="button"
                        onClick={() => toggle(title.id)}
                        className="relative inline-flex items-center gap-[6px] overflow-hidden rounded-full px-[14px] py-[8px] text-[12px] font-semibold tracking-[-0.02em] transition-transform hover:scale-105"
                        style={{
                          background: isUnlocked
                            ? RARITY_META[title.rarity].pillGradient
                            : "#ededed",
                          color: isUnlocked
                            ? RARITY_META[title.rarity].pillText
                            : "#6f6f6f",
                          outline: isUnlocked ? "2px solid #0f0f0f" : "none",
                          outlineOffset: "2px",
                        }}
                      >
                        {isUnlocked && <RaritySmokeOverlay rarity={title.rarity} />}
                        <span className="relative z-10">{title.label}</span>
                        {isUnlocked && (
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
