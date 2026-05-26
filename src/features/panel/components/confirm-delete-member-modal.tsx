"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ConfirmDeleteMemberModalProps = {
  open: boolean;
  memberNickname: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteMemberModal({
  open,
  memberNickname,
  onClose,
  onConfirm,
}: ConfirmDeleteMemberModalProps) {
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
        className={`${closing ? "modal-panel-out" : "modal-panel-in"} relative w-full max-w-[440px] overflow-hidden rounded-[24px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]`}
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

        <div className="px-[28px] pt-[28px] pb-[20px]">
          <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Apagar conta
          </h2>
          <p className="mt-[10px] text-[13px] leading-[1.6] tracking-[-0.01em] text-[#5f5f5f]">
            Tem certeza que deseja apagar a conta de{" "}
            <strong className="text-[#0f0f0f]">{memberNickname}</strong>? Essa ação
            remove o membro da lista, do Inhouse, da Flex e de todas as outras
            partes do site.
          </p>
        </div>

        <div className="flex justify-end border-t border-[#f3ebe8] px-[28px] py-[16px]">
          <button
            type="button"
            onClick={() => {
              onConfirm();
              handleClose();
            }}
            className="rounded-full px-5 py-2.5 text-[13px] font-bold tracking-[-0.02em] text-[#6f6f6f] transition-colors hover:bg-[#f5f3f2]"
          >
            Apagar
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
