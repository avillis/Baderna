"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

import { StyledName } from "@/features/panel/components/styled-name";

export type DuoCandidate = {
  userId: number;
  nickname: string;
  name: string;
  avatarSrc: string | null;
  activeNameId: string | null;
};

type Props = {
  currentDuoUserId: number | null;
  candidates: DuoCandidate[];
  onSave: (userId: number | null) => Promise<void>;
  onClose: () => void;
};

export function DuoPickerModal({
  currentDuoUserId,
  candidates,
  onSave,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number | null>(currentDuoUserId);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    setClosing(true);
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return candidates;
    const q = query.toLowerCase();
    return candidates.filter(
      (c) =>
        c.nickname.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q),
    );
  }, [candidates, query]);

  const selectedCandidate = candidates.find((c) => c.userId === selected);

  return (
    <div
      className={`${closing ? "modal-backdrop-out" : "modal-backdrop-in"} fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[3px]`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className={`${closing ? "modal-panel-out" : "modal-panel-in"} relative mx-4 flex w-full max-w-[520px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_32px_80px_rgba(0,0,0,0.22)]`}
        style={{ maxHeight: "82vh" }}
        onAnimationEnd={() => {
          if (closing) onClose();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[24px] pt-[24px] pb-[16px]">
          <div>
            <p className="text-[17px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
              Duo favorito
            </p>
            <p className="mt-[2px] text-[12px] font-medium tracking-[-0.02em] text-[#8d8d8d]">
              Escolha um membro da Baderna
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#ff4100] transition-colors hover:bg-[#e03a00]"
          >
            <svg
              viewBox="0 0 10 10"
              fill="none"
              className="h-[12px] w-[12px]"
              stroke="white"
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-[16px] pb-[10px]">
          <div className="relative w-full">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="pointer-events-none absolute left-[18px] top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-[#b0a8a4]"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar membro…"
              className="w-full rounded-full border-none bg-white py-3.5 pl-[46px] pr-[40px] text-[13px] font-medium text-[#0f0f0f] shadow-[0_2px_16px_rgba(0,0,0,0.10)] outline-none placeholder:text-[#b0a8a4] focus:ring-2 focus:ring-[#ff4100]/30"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#0f0f0f] transition-colors hover:text-[#ff4100]"
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
            )}
          </div>
        </div>

        {/* List */}
        <div
          className="min-h-0 flex-1 overflow-y-auto px-[16px] pb-[4px] [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {/* "Sem duo" option — só quando não há busca ativa */}
          {!query.trim() && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className={`mb-[4px] flex w-full items-center gap-[14px] rounded-[14px] px-[14px] py-[10px] transition-colors ${
                selected === null
                  ? "bg-[#ff4100]/[0.08]"
                  : "hover:bg-[#f5f5f5]"
              }`}
            >
              <div
                className={`h-[42px] w-[42px] shrink-0 rounded-full ring-2 transition-all ${
                  selected === null
                    ? "bg-[#f0f0f0] ring-[#ff4100]"
                    : "bg-[#f0f0f0] ring-transparent"
                }`}
              />
              <span className="text-[13px] font-semibold tracking-[-0.02em] text-[#8d8d8d]">
                Sem duo
              </span>
              {selected === null && (
                <div className="ml-auto shrink-0 flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#ff4100]">
                  <svg
                    viewBox="0 0 10 8"
                    fill="none"
                    className="h-[10px] w-[10px]"
                    stroke="white"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 4l2.5 2.5L9 1" />
                  </svg>
                </div>
              )}
            </button>
          )}

          {filtered.length === 0 ? (
            <p className="py-[24px] text-center text-[12px] font-medium text-[#8d8d8d]">
              Nenhum membro encontrado.
            </p>
          ) : (
            <div className="flex flex-col gap-[4px]">
              {filtered.map((candidate) => {
                const isSelected = selected === candidate.userId;
                return (
                  <button
                    key={candidate.userId}
                    type="button"
                    onClick={() => setSelected(candidate.userId)}
                    className={`flex w-full items-center gap-[14px] rounded-[14px] px-[14px] py-[10px] transition-colors ${
                      isSelected
                        ? "bg-[#ff4100]/[0.08]"
                        : "hover:bg-[#f5f5f5]"
                    }`}
                  >
                    <div
                      className={`relative h-[42px] w-[42px] shrink-0 overflow-hidden rounded-full ring-2 transition-all ${
                        isSelected ? "ring-[#ff4100]" : "ring-transparent"
                      }`}
                    >
                      {candidate.avatarSrc ? (
                        <Image
                          src={candidate.avatarSrc}
                          alt={candidate.nickname}
                          fill
                          className="object-cover"
                          sizes="42px"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full bg-[#f0f0f0]" />
                      )}
                    </div>
                    <div className="min-w-0 text-left">
                      <StyledName
                        styleId={candidate.activeNameId ?? undefined}
                        className="block truncate text-[13px] font-bold tracking-[-0.02em]"
                      >
                        {candidate.nickname}
                      </StyledName>
                      {candidate.name !== candidate.nickname && (
                        <p className="truncate text-[11px] font-medium tracking-[-0.02em] text-[#8d8d8d]">
                          {candidate.name}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="ml-auto shrink-0 flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#ff4100]">
                        <svg
                          viewBox="0 0 10 8"
                          fill="none"
                          className="h-[10px] w-[10px]"
                          stroke="white"
                          strokeWidth={1.8}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M1 4l2.5 2.5L9 1" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#f0f0f0] px-[24px] py-[14px]">
          <p className="text-[12px] font-medium text-[#8d8d8d]">
            {selected !== null
              ? (selectedCandidate?.nickname ?? "1 selecionado")
              : "Nenhum selecionado"}
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(selected);
              } finally {
                setSaving(false);
              }
              handleClose();
            }}
            className="inline-flex h-[40px] items-center justify-center gap-[8px] rounded-[12px] bg-[#0f0f0f] px-[20px] text-[13px] font-bold tracking-[-0.02em] text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <svg
                  className="capas-spinner h-[16px] w-[16px] [&_circle]:stroke-white"
                  viewBox="25 25 50 50"
                >
                  <circle r="20" cy="50" cx="50" />
                </svg>
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
