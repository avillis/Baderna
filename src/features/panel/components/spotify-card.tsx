"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useMySpotify, useMemberSpotify, type SpotifyTrack } from "@/features/panel/use-spotify";

// ── Shared track row ─────────────────────────────────────────────────────────
function TrackRow({ track, index }: { track: SpotifyTrack; index: number }) {
  return (
    <a
      href={track.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-[12px] rounded-[10px] px-[10px] py-[8px] transition-colors hover:bg-[#f5f5f5]"
    >
      <span className="w-[18px] shrink-0 text-center text-[12px] font-bold text-[#bdbdbd]">
        {index + 1}
      </span>
      <div className="relative h-[40px] w-[40px] shrink-0 overflow-hidden rounded-[6px] bg-[#ededed]">
        {track.image && (
          <Image src={track.image} alt={track.album ?? track.name} fill className="object-cover" unoptimized sizes="40px" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f] group-hover:text-[#1DB954]">
          {track.name}
        </p>
        <p className="truncate text-[12px] font-medium text-[#8d8d8d]">
          {track.artist}
        </p>
      </div>
      {/* Spotify icon */}
      <svg className="h-[16px] w-[16px] shrink-0 text-[#bdbdbd] group-hover:text-[#1DB954]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
      </svg>
    </a>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-[8px] px-[10px] text-[11px] font-bold uppercase tracking-[0.08em] text-[#8d8d8d]">
      {children}
    </p>
  );
}

// ── Spotify logo SVG ─────────────────────────────────────────────────────────
function SpotifyLogo({ className = "h-[20px] w-[20px]" }: { className?: string }) {
  return (
    <svg className={className} fill="#1DB954" viewBox="0 0 24 24">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

// ── Connect card (Minha Conta) ────────────────────────────────────────────────
export function SpotifyConnectCard() {
  const { data, loading, connect, disconnect } = useMySpotify();

  // Handle ?spotify=connected / ?spotify=error after OAuth redirect
  const [toast, setToast] = useState<"connected" | "error" | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const s = params.get("spotify");
    if (s === "connected" || s === "error") {
      setToast(s);
      // Clean up URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("spotify");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const connected = !!data?.connected;

  return (
    <div className="rounded-[var(--panel-radius-card)] bg-white p-[28px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[10px]">
          <SpotifyLogo className="h-[22px] w-[22px]" />
          <h2 className="text-[16px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Spotify
          </h2>
        </div>
        {!loading && (
          connected ? (
            <button
              onClick={disconnect}
              className="h-[36px] rounded-[12px] bg-[#ededed] px-[14px] text-[12px] font-bold tracking-[-0.02em] text-[#6f6f6f] transition-colors hover:bg-[#e0e0e0]"
            >
              Desconectar
            </button>
          ) : (
            <button
              onClick={connect}
              className="flex h-[36px] items-center gap-[8px] rounded-[12px] bg-[#1DB954] px-[14px] text-[12px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90"
            >
              <SpotifyLogo className="h-[14px] w-[14px]" />
              Conectar
            </button>
          )
        )}
      </div>

      {toast === "connected" && (
        <p className="mt-[12px] text-[13px] font-semibold text-[#1DB954]">
          Spotify conectado com sucesso! 🎵
        </p>
      )}
      {toast === "error" && (
        <p className="mt-[12px] text-[13px] font-semibold text-[#e05a00]">
          Erro ao conectar o Spotify. Tente novamente.
        </p>
      )}

      {loading && (
        <div className="mt-[20px] flex justify-center">
          <svg className="capas-spinner h-[24px] w-[24px] [&_circle]:stroke-[#1DB954]" viewBox="25 25 50 50">
            <circle r="20" cy="50" cx="50" />
          </svg>
        </div>
      )}

      {!loading && connected && data && (
        <div className="mt-[20px] space-y-[16px]">
          {data.topTracks.length > 0 && (
            <div>
              <SectionHeading>Mais ouvidas (último mês)</SectionHeading>
              {data.topTracks.map((t, i) => <TrackRow key={t.id} track={t} index={i} />)}
            </div>
          )}
          {data.recentlyPlayed.length > 0 && (
            <div>
              <SectionHeading>Ouvidas recentemente</SectionHeading>
              {data.recentlyPlayed.map((t, i) => <TrackRow key={`${t.id}-${i}`} track={t} index={i} />)}
            </div>
          )}
          {data.topTracks.length === 0 && data.recentlyPlayed.length === 0 && (
            <p className="px-[10px] text-[13px] font-medium text-[#9d9d9d]">
              Nenhuma música encontrada ainda. Ouça mais no Spotify! 🎧
            </p>
          )}
        </div>
      )}

      {!loading && !connected && (
        <p className="mt-[12px] text-[13px] font-medium text-[#9d9d9d]">
          Conecte sua conta para exibir suas músicas favoritas no perfil.
        </p>
      )}
    </div>
  );
}

// ── Public profile module ─────────────────────────────────────────────────────
export function SpotifyProfileModule({ slug }: { slug: string }) {
  const { data, loading } = useMemberSpotify(slug);

  if (loading || !data?.connected) return null;
  if (data.topTracks.length === 0 && data.recentlyPlayed.length === 0) return null;

  return (
    <div className="rounded-[var(--panel-radius-card)] bg-white p-[24px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <div className="mb-[16px] flex items-center gap-[8px]">
        <SpotifyLogo className="h-[18px] w-[18px]" />
        <h3 className="text-[14px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
          Spotify
        </h3>
      </div>
      {data.topTracks.length > 0 && (
        <div className="mb-[12px]">
          <SectionHeading>Mais ouvidas</SectionHeading>
          {data.topTracks.map((t, i) => <TrackRow key={t.id} track={t} index={i} />)}
        </div>
      )}
      {data.recentlyPlayed.length > 0 && (
        <div>
          <SectionHeading>Ouvidas recentemente</SectionHeading>
          {data.recentlyPlayed.map((t, i) => <TrackRow key={`${t.id}-${i}`} track={t} index={i} />)}
        </div>
      )}
    </div>
  );
}
