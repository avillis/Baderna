"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

type Champion = { id: string; name: string };

async function fetchChampions(): Promise<Champion[]> {
  const res = await fetch("/api/champion-list");
  if (!res.ok) return [];
  const data = (await res.json()) as { champions?: Champion[] };
  return data.champions ?? [];
}

type Props = {
  current: string[];
  onSave: (slugs: string[]) => void;
  onClose: () => void;
};

export function ChampionPickerModal({ current, onSave, onClose }: Props) {
  const [champions, setChampions] = useState<Champion[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(current.slice(0, 3));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    setClosing(true);
  }

  useEffect(() => {
    fetchChampions().then((champs) => {
      setChampions(champs);
      setLoading(false);
      inputRef.current?.focus();
    });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return champions;
    const q = query.toLowerCase();
    return champions.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q),
    );
  }, [champions, query]);

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

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
        onAnimationEnd={() => { if (closing) onClose(); }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[24px] pt-[24px] pb-[16px]">
          <div>
            <p className="text-[17px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
              Mains
            </p>
            <p className="mt-[2px] text-[12px] font-medium tracking-[-0.02em] text-[#8d8d8d]">
              Escolha até 3 campeões favoritos
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
              placeholder="Buscar campeão…"
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

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-[6px] px-[20px] py-[12px]">
            {selected.map((id) => {
              const champ = champions.find((c) => c.id === id);
              return (
                <div
                  key={id}
                  className="flex items-center gap-[6px] rounded-[8px] bg-[#ededed] px-[8px] py-[5px]"
                >
                  <div className="relative h-[20px] w-[20px] overflow-hidden rounded-full">
                    <Image
                      src={`/api/champion-tile/${id}_0.jpg`}
                      alt={id}
                      fill
                      className="object-cover"
                      sizes="20px"
                      unoptimized
                    />
                  </div>
                  <span className="text-[11px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                    {champ?.name ?? id}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    className="text-[#0f0f0f] transition-colors hover:text-[#ff4100]"
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
                </div>
              );
            })}
          </div>
        )}

        {/* Grid */}
        <div className="min-h-0 flex-1 overflow-y-auto px-[16px] pb-[4px] [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none" }}>
          {loading ? (
            <div className="flex items-center justify-center py-[40px]">
              <svg
                className="capas-spinner h-[32px] w-[32px] [&_circle]:stroke-[#ff4100]"
                viewBox="25 25 50 50"
              >
                <circle r="20" cy="50" cx="50" />
              </svg>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-[24px] text-center text-[12px] font-medium text-[#8d8d8d]">
              Nenhum campeão encontrado.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-x-[6px] gap-y-[10px]">
              {filtered.map((champ) => {
                const isSelected = selected.includes(champ.id);
                return (
                  <button
                    key={champ.id}
                    type="button"
                    onClick={() => toggle(champ.id)}
                    className="group flex flex-col items-center gap-[4px] rounded-[10px] p-[6px] transition-colors hover:bg-[#f5f5f5]"
                  >
                    <div
                      className={`relative h-[72px] w-[72px] overflow-hidden rounded-full ring-2 transition-all ${
                        isSelected
                          ? "ring-[#ff4100]"
                          : "ring-transparent group-hover:ring-[#e0e0e0]"
                      }`}
                    >
                      <Image
                        src={`/api/champion-tile/${champ.id}_0.jpg`}
                        alt={champ.name}
                        fill
                        className="object-cover"
                        sizes="72px"
                        unoptimized
                      />
                    </div>
                    <p className="w-full truncate text-center text-[11px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                      {champ.name}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#f0f0f0] px-[24px] py-[14px]">
          <p className="text-[12px] font-medium text-[#8d8d8d]">
            {selected.length}/3 selecionados
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
                <svg className="capas-spinner h-[16px] w-[16px] [&_circle]:stroke-white" viewBox="25 25 50 50">
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
