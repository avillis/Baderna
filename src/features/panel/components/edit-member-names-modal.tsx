"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { StyledName } from "@/features/panel/components/styled-name";
import { NAME_STYLES, type NameStyle } from "@/features/panel/names-data";
import {
  RARITY_META,
  RARITY_ORDER,
  type TitleRarity,
} from "@/features/panel/titles-data";
import { useAdminMemberUnlocks } from "@/features/panel/use-admin-member-unlocks";

type EditMemberNamesModalProps = {
  open: boolean;
  onClose: () => void;
  /** user_id numérico — necessário pra usar os endpoints admin. */
  targetUserId: number | null;
  memberNickname: string;
  /** Nomes que vêm liberados por padrão (ex: "preto"). */
  defaultUnlocked?: string[];
};

export function EditMemberNamesModal({
  open,
  onClose,
  targetUserId,
  memberNickname,
  defaultUnlocked = ["preto"],
}: EditMemberNamesModalProps) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
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

  const grouped = useMemo(() => {
    const map: Record<string, NameStyle[]> = {};
    for (const n of NAME_STYLES) (map[n.rarity] ??= []).push(n);
    return map;
  }, []);

  if (!open || !mounted) return null;

  // Union do que veio da API + defaults (ex: "preto" sempre desbloqueado).
  const unlocked = Array.from(new Set([...defaultUnlocked, ...unlocks.name]));

  function toggle(id: string) {
    // Default unlock não pode ser revogado (não tem como tirar o "Clássico").
    if (defaultUnlocked.includes(id) && !unlocks.name.includes(id)) return;
    if (unlocks.name.includes(id)) {
      void revoke("name", id);
    } else {
      void grant("name", id);
    }
  }

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
            Editar nomes
          </h2>
          <p className="mt-[4px] text-[13px] tracking-[-0.01em] text-[#7c7c7c]">
            Selecione quais estilos de nome <strong>{memberNickname}</strong>{" "}
            tem desbloqueados. Alterações são salvas automaticamente.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-[28px] py-[24px]">
          {RARITY_ORDER.map((rarity: TitleRarity) => {
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
                <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 md:grid-cols-4">
                  {list.map((style) => {
                    const isUnlocked = unlocked.includes(style.id);
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => toggle(style.id)}
                        className="group relative flex items-center justify-center overflow-hidden rounded-[14px] bg-[#ededed] px-[10px] py-[14px] text-center transition-transform hover:scale-[1.04]"
                        style={{
                          opacity: isUnlocked ? 1 : 0.45,
                          outline: isUnlocked ? "2px solid #0f0f0f" : "none",
                          outlineOffset: "2px",
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
