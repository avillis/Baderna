"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  CHAMPION_AVATAR_FILES,
  getChampionTileSrc,
} from "@/features/panel/champion-avatar";

const MAX = 3;

function champName(file: string): string {
  return file
    .replace(/_\d+\.(jpg|jpeg|png|webp)$/i, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function FeaturedChampionsModal({
  initial,
  onClose,
  onSave,
}: {
  initial: string[];
  onClose: () => void;
  onSave: (champions: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(initial.slice(0, MAX));
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const filtered = query
    ? CHAMPION_AVATAR_FILES.filter((f) =>
        champName(f).toLowerCase().includes(query.toLowerCase()),
      )
    : CHAMPION_AVATAR_FILES;

  function toggle(file: string) {
    setSelected((prev) => {
      if (prev.includes(file)) return prev.filter((f) => f !== file);
      if (prev.length >= MAX) return prev;
      return [...prev, file];
    });
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[86vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]"
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

        <div className="px-[24px] pt-[24px]">
          <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Escolha seus mains
          </h2>
          <p className="mt-[2px] text-[13px] font-medium text-[#989898]">
            Até {MAX} campeões pra fixar no seu perfil · {selected.length}/{MAX}
          </p>
          <div className="relative mt-[16px]">
            <Search
              className="pointer-events-none absolute left-[16px] top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-[#b0a8a4]"
              strokeWidth={2}
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar campeão…"
              className="w-full rounded-full border-none bg-[#f2f2f2] py-[10px] pl-[42px] pr-[16px] text-[13px] font-medium text-[#0f0f0f] outline-none placeholder:text-[#b0a8a4] focus:ring-2 focus:ring-[#ff4100]/20"
            />
          </div>
        </div>

        <div className="mt-[16px] grid auto-rows-min grid-cols-5 items-start gap-[12px] overflow-y-auto px-[24px] pb-[12px] sm:grid-cols-6">
          {filtered.map((file) => {
            const idx = selected.indexOf(file);
            const isSel = idx !== -1;
            return (
              <button
                key={file}
                type="button"
                onClick={() => toggle(file)}
                aria-label={champName(file)}
                className={`relative aspect-square overflow-hidden rounded-[12px] ring-2 transition-transform hover:scale-[1.05] ${
                  isSel ? "ring-[#ff4100]" : "ring-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getChampionTileSrc(file)}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {isSel && (
                  <span className="absolute right-[4px] top-[4px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#ff4100] text-[11px] font-bold text-white">
                    {idx + 1}
                  </span>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full py-[24px] text-center text-[13px] text-[#989898]">
              Nenhum campeão encontrado.
            </p>
          )}
        </div>

        <div className="border-t border-[#f0eded] p-[20px]">
          <button
            type="button"
            onClick={() => onSave(selected)}
            className="flex h-[50px] w-full items-center justify-center rounded-[18px] bg-[#ff4100] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
