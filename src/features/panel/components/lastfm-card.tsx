"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useMyLastFm, useMemberLastFm, type LastFmTrack } from "@/features/panel/use-lastfm";

// ── Last.fm logo ──────────────────────────────────────────────────────────────
function LastFmLogo({ className = "h-[20px] w-[20px]" }: { className?: string }) {
  return (
    <img
      src="/last_fm.png"
      alt="Last.fm"
      className={`${className} rounded-full object-cover`}
    />
  );
}

// ── Track row ─────────────────────────────────────────────────────────────────
function TrackRow({ track, index }: { track: LastFmTrack; index: number }) {
  return (
    <a
      href={track.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center gap-[12px] rounded-[10px] px-[10px] py-[8px] transition-colors ${track.nowPlaying ? "bg-[#D51007]/10 hover:bg-[#D51007]/15" : "hover:bg-[#f5f5f5]"}`}
    >
      {track.nowPlaying ? (
        <span className="flex w-[18px] shrink-0 items-center justify-center">
          <span className="inline-block h-[10px] w-[10px] rounded-full bg-[#D51007] animate-pulse" />
        </span>
      ) : (
        <span className="w-[18px] shrink-0 text-center text-[12px] font-bold text-[#bdbdbd]">
          {index + 1}
        </span>
      )}
      <div className="relative h-[40px] w-[40px] shrink-0 overflow-hidden rounded-[6px] bg-[#ededed]">
        {track.image && (
          <Image
            src={track.image}
            alt={track.album ?? track.name}
            fill
            className="object-cover"
            unoptimized
            sizes="40px"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f] group-hover:text-[#D51007]">
          {track.name}
        </p>
        <p className="truncate text-[12px] font-medium text-[#8d8d8d]">
          {track.artist}
        </p>
      </div>
    </a>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-[8px] px-[10px] text-[12px] font-bold tracking-[-0.02em] text-[#8d8d8d]">
      {children}
    </p>
  );
}

// ── Connect card (Minha Conta) ────────────────────────────────────────────────
export function LastFmConnectCard() {
  const { data, loading, saving, saveUsername } = useMyLastFm();
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const connected = !!data?.connected;

  function startEdit() {
    setInput(data?.username ?? "");
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function handleSave() {
    if (!input.trim()) return;
    await saveUsername(input.trim());
    setEditing(false);
  }

  async function handleDisconnect() {
    await saveUsername(null);
    setEditing(false);
  }

  return (
    <div className="rounded-[var(--panel-radius-card)] bg-white p-[28px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex w-fit items-center gap-[10px]">
        <LastFmLogo className="h-[22px] w-[22px] shrink-0" />
        <h2 className="shrink-0 text-[16px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
          Last.fm
        </h2>
        {!loading && (
          connected ? (
            <button
              onClick={handleDisconnect}
              disabled={saving}
              className="h-[36px] shrink-0 rounded-[12px] bg-[#ededed] px-[14px] text-[12px] font-bold tracking-[-0.02em] text-[#6f6f6f] transition-colors hover:bg-[#e0e0e0] disabled:opacity-50"
            >
              Desconectar
            </button>
          ) : !editing ? (
            <button
              onClick={startEdit}
              className="h-[36px] shrink-0 rounded-[12px] bg-[#D51007] px-[14px] text-[12px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90"
            >
              Conectar
            </button>
          ) : null
        )}
      </div>

      {/* Spinner */}
      {(loading || saving) && (
        <div className="mt-[20px] flex justify-center">
          <svg className="capas-spinner h-[24px] w-[24px] [&_circle]:stroke-[#D51007]" viewBox="25 25 50 50">
            <circle r="20" cy="50" cx="50" />
          </svg>
        </div>
      )}

      {/* Username input */}
      {!loading && !saving && editing && (
        <div className="mt-[20px] flex gap-[8px]">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setEditing(false); }}
            placeholder="User"
            className="min-w-0 flex-1 rounded-[12px] border border-[#e0e0e0] bg-[#f7f7f7] px-[14px] py-[10px] text-[13px] font-medium tracking-[-0.02em] text-[#0f0f0f] outline-none focus:border-[#D51007] focus:ring-1 focus:ring-[#D51007]"
          />
          <button
            onClick={handleSave}
            disabled={!input.trim()}
            className="h-[42px] shrink-0 rounded-[12px] bg-[#D51007] px-[16px] text-[12px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Salvar
          </button>
          <button
            onClick={() => setEditing(false)}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] bg-[#ededed] text-[#6f6f6f] transition-colors hover:bg-[#e0e0e0]"
          >
            <svg viewBox="0 0 10 10" fill="none" className="h-[12px] w-[12px]" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round">
              <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" />
            </svg>
          </button>
        </div>
      )}

      {/* Connected: edit username link */}
      {!loading && !saving && connected && !editing && (
        <button
          onClick={startEdit}
          className="mt-[6px] px-[10px] text-[12px] font-medium text-[#b0b0b0] transition-colors hover:text-[#D51007]"
        >
          @{data?.username} · alterar
        </button>
      )}

      {/* Tracks */}
      {!loading && !saving && connected && data && (
        <div className="mt-[16px] space-y-[16px]">
          {data.topTracks.length > 0 && (
            <div>
              <SectionHeading>
                {data.topTracksRange === "medium" ? "Mais ouvidas (últimos 6 meses)" : "Mais ouvidas (último mês)"}
              </SectionHeading>
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
              Nenhuma música encontrada ainda.
            </p>
          )}
        </div>
      )}

      {/* Desconectado */}
      {!loading && !saving && !connected && !editing && (
        <p className="mt-[12px] text-[13px] font-medium text-[#9d9d9d]">
          Conecte seu Last.fm para exibir suas músicas favoritas no perfil.
        </p>
      )}
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function LastFmSkeleton() {
  return (
    <div className="rounded-[var(--panel-radius-card)] bg-white p-[24px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="mb-[16px] flex items-center gap-[8px]">
        <div className="h-[18px] w-[18px] rounded-full skeleton-shimmer" />
        <div className="h-[13px] w-[52px] rounded-[5px] skeleton-shimmer" />
      </div>
      {/* Section label */}
      <div className="mb-[8px] px-[10px]">
        <div className="h-[11px] w-[160px] rounded-[4px] skeleton-shimmer" />
      </div>
      {/* 5 track rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-[12px] px-[10px] py-[8px]">
          <div className="h-[12px] w-[18px] shrink-0 rounded-[3px] skeleton-shimmer" />
          <div className="h-[40px] w-[40px] shrink-0 rounded-[6px] skeleton-shimmer" />
          <div className="flex-1 space-y-[6px]">
            <div className="h-[12px] w-3/4 rounded-[4px] skeleton-shimmer" />
            <div className="h-[10px] w-1/2 rounded-[4px] skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Public profile module ─────────────────────────────────────────────────────
export function LastFmProfileModule({ slug }: { slug: string }) {
  const { data, loading } = useMemberLastFm(slug);

  if (loading) return <LastFmSkeleton />;
  if (!data?.connected) return null;

  const nowPlaying = data.recentlyPlayed.find((t) => t.nowPlaying);

  return (
    <div className="rounded-[var(--panel-radius-card)] bg-white p-[24px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <div className="mb-[16px] flex items-center gap-[8px]">
        <LastFmLogo className="h-[18px] w-[18px]" />
        <h3 className="text-[14px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
          Last.fm
        </h3>
        {nowPlaying && (
          <span className="flex items-center gap-[5px] rounded-full bg-[#D51007]/10 px-[8px] py-[2px] text-[11px] font-bold text-[#D51007]">
            <span className="h-[6px] w-[6px] rounded-full bg-[#D51007] animate-pulse" />
            ouvindo agora
          </span>
        )}
      </div>
      {data.topTracks.length > 0 && (
        <div className="mb-[12px]">
          <SectionHeading>
            {data.topTracksRange === "medium" ? "Mais ouvidas (últimos 6 meses)" : "Mais ouvidas (último mês)"}
          </SectionHeading>
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
          Nenhuma música encontrada ainda.
        </p>
      )}
    </div>
  );
}
