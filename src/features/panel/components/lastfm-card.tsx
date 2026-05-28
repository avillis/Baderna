"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useMyLastFm, useMemberLastFm, type LastFmTrack } from "@/features/panel/use-lastfm";

// ── Last.fm logo ──────────────────────────────────────────────────────────────
function LastFmLogo({ className = "h-[20px] w-[20px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#D51007">
      <path d="M10.785 17.867l-.504-1.372s-.816.912-2.04.912c-1.08 0-1.848-.936-1.848-2.436 0-1.92.972-2.604 1.932-2.604.96 0 1.716.456 1.716 1.944v.384l-2.316.012c0 0-.012 1.284 1.332 1.284.468 0 .852-.204.852-.204l.408 1.08c0 0-.552.324-1.416.324C7.26 21 6 19.608 6 16.98c0-2.628 1.38-4.02 3.252-4.02 1.572 0 2.496.732 2.496.732l-.963 4.175zm5.328.912c-1.452 0-2.028-.936-2.028-.936v.756h-1.548V6.5l1.548-.312v5.244s.624-.72 2.004-.72c1.788 0 2.868 1.452 2.868 3.972 0 2.736-1.26 4.095-2.844 4.095zm-.372-6.492c-.972 0-1.584.744-1.584.744v3.672s.576.744 1.548.744c1.008 0 1.56-.924 1.56-2.616 0-1.584-.516-2.544-1.524-2.544z" />
    </svg>
  );
}

// ── Track row ─────────────────────────────────────────────────────────────────
function TrackRow({ track, index }: { track: LastFmTrack; index: number }) {
  return (
    <a
      href={track.url ?? "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-[12px] rounded-[10px] px-[10px] py-[8px] transition-colors hover:bg-[#f5f5f5]"
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
          {track.nowPlaying && (
            <span className="ml-[6px] text-[11px] font-semibold text-[#D51007]">
              ouvindo agora
            </span>
          )}
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
            placeholder="seu username no Last.fm"
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

// ── Public profile module ─────────────────────────────────────────────────────
export function LastFmProfileModule({ slug }: { slug: string }) {
  const { data, loading } = useMemberLastFm(slug);

  if (loading || !data?.connected) return null;

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
