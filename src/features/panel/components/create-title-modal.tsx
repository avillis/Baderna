"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { RARITY_META, RARITY_ORDER, type TitleRarity } from "@/features/panel/titles-data";
import { RaritySmokeOverlay } from "@/features/panel/components/rarity-smoke-overlay";
import { useTitles } from "@/features/panel/use-titles";
import { useToast } from "@/components/toast";

export function CreateTitleModal() {
  const { addTitle, removeTitle, titles, isRemovable } = useTitles();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [name, setName] = useState("");
  const [rarity, setRarity] = useState<TitleRarity>("comum");
  const toast = useToast();

  useEffect(() => setMounted(true), []);

  function handleClose() {
    setClosing(true);
  }

  function handleCloseImmediate() {
    setIsOpen(false);
    setClosing(false);
  }

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addTitle(name.trim(), rarity);
      setName("");
      setRarity("comum");
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Falha ao criar título.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex h-[50px] w-full items-center justify-center rounded-[18px] bg-[#0f0f0f] text-[13px] font-bold tracking-[-0.02em] text-white transition-colors hover:bg-[#1f1f1f]"
      >
        Gerenciar títulos
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            className={`${closing ? "modal-backdrop-out" : "modal-backdrop-in"} fixed inset-0 z-[9999] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]`}
            onClick={handleClose}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`${closing ? "modal-panel-out" : "modal-panel-in"} relative flex max-h-[86vh] w-full max-w-[520px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]`}
              onAnimationEnd={() => { if (closing) handleCloseImmediate(); }}
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
                  Gerenciar títulos
                </h2>
                <p className="mt-[4px] text-[13px] tracking-[-0.01em] text-[#7c7c7c]">
                  Crie novos títulos e remova os customizados.
                </p>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                {/* Create form */}
                <form
                  onSubmit={handleSubmit}
                  className="space-y-[20px] border-b border-[#f3ebe8] px-[28px] py-[24px]"
                >
                  <div>
                    <label className="block text-[12px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                      Nome do título
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Pentakill master"
                      className="mt-[8px] h-[44px] w-full rounded-full border-none bg-[#ededed] px-4 text-[14px] outline-none placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                      Raridade
                    </label>
                    <div className="mt-[8px] flex flex-wrap gap-[8px]">
                      {RARITY_ORDER.map((r) => {
                        const meta = RARITY_META[r];
                        const isActive = rarity === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setRarity(r)}
                            className="relative overflow-hidden rounded-full px-[14px] py-[8px] text-[12px] font-semibold tracking-[-0.02em] transition-all"
                            style={{
                              background: isActive ? meta.pillGradient : "#f0eded",
                              color: isActive ? meta.pillText : "#6f6f6f",
                            }}
                          >
                            {isActive && <RaritySmokeOverlay rarity={r} />}
                            <span className="relative z-10">{meta.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {name.trim() && (
                    <div>
                      <p className="text-[12px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                        Prévia
                      </p>
                      <div className="mt-[8px]">
                        <span
                          className="relative inline-flex items-center overflow-hidden rounded-full px-[10px] py-[4px] text-[10px] font-semibold tracking-[-0.01em]"
                          style={{
                            background: RARITY_META[rarity].pillGradient,
                            color: RARITY_META[rarity].pillText,
                          }}
                        >
                          <RaritySmokeOverlay rarity={rarity} />
                          <span className="relative z-10">{name.trim()}</span>
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!name.trim()}
                    className="flex h-[50px] w-full items-center justify-center rounded-[18px] bg-[#ff4100] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Criar título
                  </button>
                </form>

                {/* All titles list */}
                <div className="px-[28px] py-[24px]">
                  <h3 className="text-[14px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                    Títulos existentes
                  </h3>
                  <p className="mt-[2px] text-[12px] tracking-[-0.01em] text-[#7c7c7c]">
                    O título "Aprendiz" é fixo e não pode ser removido.
                  </p>

                  <ul className="mt-[14px] space-y-[8px]">
                    {[...titles]
                      .sort((a, b) => {
                        if (a.id === "aprendiz") return -1;
                        if (b.id === "aprendiz") return 1;
                        return 0;
                      })
                      .map((title) => (
                      <li
                        key={title.id}
                        className="flex items-center gap-[10px] rounded-[14px] bg-[#fafafa] px-[14px] py-[10px]"
                      >
                        <span
                          className="relative inline-flex shrink-0 items-center overflow-hidden rounded-full px-[12px] py-[5px] text-[11px] font-semibold tracking-[-0.01em]"
                          style={{
                            background: RARITY_META[title.rarity].pillGradient,
                            color: RARITY_META[title.rarity].pillText,
                          }}
                        >
                          <RaritySmokeOverlay rarity={title.rarity} />
                          <span className="relative z-10">{title.label}</span>
                        </span>
                        {isRemovable(title.id) && (
                          <button
                            type="button"
                            onClick={() => {
                              void removeTitle(title.id);
                            }}
                            aria-label={`Remover ${title.label}`}
                            className="ml-auto flex h-[30px] w-[30px] items-center justify-center rounded-full text-[#c53030] opacity-50 transition-opacity hover:bg-[#fff0f0] hover:opacity-100"
                          >
                            <svg
                              viewBox="0 0 10 10"
                              fill="none"
                              className="h-[9px] w-[9px]"
                              stroke="currentColor"
                              strokeWidth={1.4}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" />
                            </svg>
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
