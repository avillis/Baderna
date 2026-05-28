"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type GameResult = {
  id: number;
  name: string;
  cover: string | null;
  year: string | null;
};

async function searchGames(q: string): Promise<GameResult[]> {
  const res = await fetch(
    `/api/rawg-search?q=${encodeURIComponent(q)}`,
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: GameResult[] };
  return data.results ?? [];
}

type Props = {
  currentTitle: string | null;
  onSelect: (game: { title: string; coverUrl: string | null }) => void;
  onClose: () => void;
};

export function GamePickerModal({ currentTitle, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClose() {
    setClosing(true);
  }

  // Foca o input ao abrir
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Fecha com Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Busca com debounce de 350ms
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await searchGames(trimmed);
        setResults(res);
        if (res.length === 0) setError("Nenhum jogo encontrado.");
      } catch {
        setError("Erro ao buscar. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  function pick(game: GameResult) {
    onSelect({ title: game.name, coverUrl: game.cover });
    handleClose();
  }

  return (
    <div
      className={`${closing ? "modal-backdrop-out" : "modal-backdrop-in"} fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[3px]`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className={`${closing ? "modal-panel-out" : "modal-panel-in"} relative mx-4 flex w-full max-w-[480px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_32px_80px_rgba(0,0,0,0.22)]`}
        onAnimationEnd={() => { if (closing) onClose(); }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[24px] pt-[24px] pb-[16px]">
          <div>
            <p className="text-[17px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
              Jogo favorito
            </p>
            <p className="mt-[2px] text-[12px] font-medium tracking-[-0.02em] text-[#8d8d8d]">
              Busque e escolha o seu jogo atual
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

        {/* Search input */}
        <div className="px-[16px] pb-[12px]">
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
              placeholder="Ex: Dark Souls, Valorant, FIFA…"
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
          </div>
        </div>

        {/* Results */}
        <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar px-[16px] pb-[16px]">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-[32px]">
              <svg
                className="capas-spinner h-[28px] w-[28px] [&_circle]:stroke-[#ff4100]"
                viewBox="25 25 50 50"
              >
                <circle r="20" cy="50" cx="50" />
              </svg>
            </div>
          )}

          {/* Estado vazio / dica */}
          {!query && !loading && (
            <div className="flex flex-col items-center py-[32px] text-center">
              <div className="mb-[10px] flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#f5f5f5]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-[20px] w-[20px] text-[#c0c0c0]"
                  stroke="currentColor"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7.5 4.5C7.5 3.11929 8.61929 2 10 2C11.3807 2 12.5 3.11929 12.5 4.5V6H13.5C14.8978 6 15.5967 6 16.1481 6.22836C16.8831 6.53284 17.4672 7.11687 17.7716 7.85195C18 8.40326 18 9.10218 18 10.5H19.5C20.8807 10.5 22 11.6193 22 13C22 14.3807 20.8807 15.5 19.5 15.5H18V17.2C18 18.8802 18 19.7202 17.673 20.362C17.3854 20.9265 16.9265 21.3854 16.362 21.673C15.7202 22 14.8802 22 13.2 22H12.5V20.25C12.5 19.0074 11.4926 18 10.25 18C9.00736 18 8 19.0074 8 20.25V22H6.8C5.11984 22 4.27976 22 3.63803 21.673C3.07354 21.3854 2.6146 20.9265 2.32698 20.362C2 19.7202 2 18.8802 2 17.2V15.5H3.5C4.88071 15.5 6 14.3807 6 13C6 11.6193 4.88071 10.5 3.5 10.5H2C2 9.10218 2 8.40326 2.22836 7.85195C2.53284 7.11687 3.11687 6.53284 3.85195 6.22836C4.40326 6 5.10218 6 6.5 6H7.5V4.5Z" />
                </svg>
              </div>
              <p className="text-[12px] font-semibold tracking-[-0.02em] text-[#8d8d8d]">
                Digite o nome do jogo
              </p>
              {currentTitle && (
                <p className="mt-[4px] text-[11px] text-[#b0b0b0]">
                  Atual: <strong className="text-[#8d8d8d]">{currentTitle}</strong>
                </p>
              )}
            </div>
          )}

          {/* Erro / sem resultado */}
          {error && !loading && (
            <p className="py-[24px] text-center text-[12px] font-medium text-[#8d8d8d]">
              {error}
            </p>
          )}

          {/* Grid de resultados */}
          {results.length > 0 && (
            <div className="grid grid-cols-2 gap-[8px]">
              {results.map((game) => (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => pick(game)}
                  className={`group relative h-[100px] overflow-hidden rounded-[14px] bg-[#1a1a1a] text-left transition-transform active:scale-[0.97] ${
                    game.name === currentTitle
                      ? "ring-2 ring-[#ff4100]"
                      : "hover:ring-2 hover:ring-white/40"
                  }`}
                >
                  {/* Cover */}
                  {game.cover ? (
                    <Image
                      src={game.cover}
                      alt={game.name}
                      fill
                      className="object-cover transition-transform group-hover:scale-[1.04]"
                      sizes="(min-width: 480px) 216px, 45vw"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#2a2a2a]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-[24px] w-[24px] text-[#555]"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                      >
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M8 21h8M12 17v4" />
                      </svg>
                    </div>
                  )}

                  {/* Gradient + label */}
                  <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.10)_55%)]" />
                  <div className="absolute bottom-0 left-0 right-0 p-[10px]">
                    <p className="line-clamp-2 text-[11px] font-bold leading-[1.2] tracking-[-0.02em] text-white">
                      {game.name}
                    </p>
                    {game.year && (
                      <p className="mt-[2px] text-[10px] font-medium text-white/60">
                        {game.year}
                      </p>
                    )}
                  </div>

                  {/* Selecionado */}
                  {game.name === currentTitle && (
                    <div className="absolute right-[8px] top-[8px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#ff4100]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className="h-[11px] w-[11px]"
                        stroke="white"
                        strokeWidth={2.8}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
