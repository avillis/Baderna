"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useMyLastFm } from "@/features/panel/use-lastfm";
import type { SpotifyTrack } from "@/features/panel/use-spotify";

type Props = {
  currentSongId: string | null;
  onSave: (track: SpotifyTrack | null) => void;
  onClose: () => void;
};

function SpotifyLogo({ className = "h-[16px] w-[16px]" }: { className?: string }) {
  return (
    <svg className={className} fill="#1DB954" viewBox="0 0 24 24">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

export function SpotifyTrackPickerModal({ currentSongId, onSave, onClose }: Props) {
  const { data, loading } = useMyLastFm();
  const [closing, setClosing] = useState(false);

  function handleClose() {
    setClosing(true);
  }

  function pick(track: SpotifyTrack) {
    onSave(track);
    handleClose();
  }

  function clear() {
    onSave(null);
    handleClose();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Deduplica por track id: top tracks + recently played sem repetição
  const allTracks = (() => {
    if (!data) return [];
    const seen = new Set<string>();
    const result: SpotifyTrack[] = [];
    for (const t of [...data.topTracks, ...data.recentlyPlayed]) {
      if (!seen.has(t.id)) {
        seen.add(t.id);
        result.push(t);
      }
    }
    return result;
  })();

  return (
    <div
      className={`${closing ? "modal-backdrop-out" : "modal-backdrop-in"} fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[3px]`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className={`${closing ? "modal-panel-out" : "modal-panel-in"} relative mx-4 flex w-full max-w-[440px] flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_32px_80px_rgba(0,0,0,0.22)]`}
        onAnimationEnd={() => { if (closing) onClose(); }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[24px] pt-[24px] pb-[16px]">
          <div className="flex items-center gap-[10px]">
            <SpotifyLogo className="h-[20px] w-[20px]" />
            <div>
              <p className="text-[17px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                Música favorita
              </p>
              <p className="mt-[2px] text-[12px] font-medium tracking-[-0.02em] text-[#8d8d8d]">
                Escolha uma das suas músicas recentes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-[#ff4100] transition-colors hover:bg-[#e03a00]"
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

        {/* Body */}
        <div className="no-scrollbar max-h-[460px] min-h-0 overflow-y-auto px-[16px] pt-[4px] pb-[20px]">
          {loading && (
            <div className="flex items-center justify-center py-[40px]">
              <svg
                className="capas-spinner h-[28px] w-[28px] [&_circle]:stroke-[#1DB954]"
                viewBox="25 25 50 50"
              >
                <circle r="20" cy="50" cx="50" />
              </svg>
            </div>
          )}

          {!loading && !data?.connected && (
            <div className="flex flex-col items-center py-[32px] text-center">
              <SpotifyLogo className="mb-[12px] h-[36px] w-[36px] opacity-30" />
              <p className="text-[14px] font-bold tracking-[-0.02em] text-[#8d8d8d]">
                Last.fm não conectado
              </p>
              <p className="mt-[6px] text-[12px] font-medium text-[#b0b0b0]">
                Conecte sua conta em{" "}
                <span className="font-semibold text-[#8d8d8d]">Minha Conta</span>{" "}
                para escolher uma música.
              </p>
            </div>
          )}

          {!loading && data?.connected && allTracks.length === 0 && (
            <div className="flex flex-col items-center py-[32px] text-center">
              <p className="text-[13px] font-medium text-[#9d9d9d]">
                Nenhuma música encontrada. Ouça mais no Spotify!
              </p>
            </div>
          )}

          {!loading && data?.connected && allTracks.length > 0 && (
            <div className="space-y-[4px]">
              {allTracks.map((track) => {
                const isCurrent = track.id === currentSongId;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => pick(track)}
                    className={`group flex w-full items-center gap-[12px] rounded-[12px] px-[10px] py-[8px] text-left transition-colors ${
                      isCurrent
                        ? "bg-[#1DB954]/10 ring-1 ring-[#1DB954]/30"
                        : "hover:bg-[#f5f5f5]"
                    }`}
                  >
                    {/* Album art */}
                    <div className="relative h-[44px] w-[44px] shrink-0 overflow-hidden rounded-[8px] bg-[#ededed]">
                      {track.image && (
                        <Image
                          src={track.image}
                          alt={track.album ?? track.name}
                          fill
                          className="object-cover"
                          unoptimized
                          sizes="44px"
                        />
                      )}
                    </div>

                    {/* Track info */}
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[13px] font-bold tracking-[-0.02em] ${isCurrent ? "text-[#1DB954]" : "text-[#0f0f0f] group-hover:text-[#1DB954]"}`}>
                        {track.name}
                      </p>
                      <p className="truncate text-[12px] font-medium text-[#8d8d8d]">
                        {track.artist}
                      </p>
                    </div>

                    {/* Selected check */}
                    {isCurrent && (
                      <div className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-[#1DB954]">
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
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
