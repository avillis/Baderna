"use client";

import { Pause, Play } from "lucide-react";

function VolumeFullIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M19.7479 4.99993C21.1652 6.97016 22 9.38756 22 11.9999C22 14.6123 21.1652 17.0297 19.7479 18.9999M15.7453 7.99993C16.5362 9.13376 17 10.5127 17 11.9999C17 13.4872 16.5362 14.8661 15.7453 15.9999M9.63432 4.36561L6.46863 7.5313C6.29568 7.70425 6.2092 7.79073 6.10828 7.85257C6.01881 7.9074 5.92127 7.9478 5.81923 7.9723C5.70414 7.99993 5.58185 7.99993 5.33726 7.99993H3.6C3.03995 7.99993 2.75992 7.99993 2.54601 8.10892C2.35785 8.20479 2.20487 8.35777 2.10899 8.54594C2 8.75985 2 9.03987 2 9.59993V14.3999C2 14.96 2 15.24 2.10899 15.4539C2.20487 15.6421 2.35785 15.7951 2.54601 15.8909C2.75992 15.9999 3.03995 15.9999 3.6 15.9999H5.33726C5.58185 15.9999 5.70414 15.9999 5.81923 16.0276C5.92127 16.0521 6.01881 16.0925 6.10828 16.1473C6.2092 16.2091 6.29568 16.2956 6.46863 16.4686L9.63431 19.6342C10.0627 20.0626 10.2769 20.2768 10.4608 20.2913C10.6203 20.3038 10.7763 20.2392 10.8802 20.1175C11 19.9773 11 19.6744 11 19.0686V4.9313C11 4.32548 11 4.02257 10.8802 3.88231C10.7763 3.76061 10.6203 3.69602 10.4608 3.70858C10.2769 3.72305 10.0627 3.93724 9.63432 4.36561Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VolumeMidIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M18.2451 7.99993C19.036 9.13376 19.4998 10.5127 19.4998 11.9999C19.4998 13.4872 19.036 14.8661 18.2451 15.9999M12.1343 4.36561L8.96863 7.5313C8.79568 7.70425 8.7092 7.79073 8.60828 7.85257C8.51881 7.9074 8.42127 7.9478 8.31923 7.9723C8.20414 7.99993 8.08185 7.99993 7.83726 7.99993H6.1C5.53995 7.99993 5.25992 7.99993 5.04601 8.10892C4.85785 8.20479 4.70487 8.35777 4.60899 8.54594C4.5 8.75985 4.5 9.03987 4.5 9.59993V14.3999C4.5 14.96 4.5 15.24 4.60899 15.4539C4.70487 15.6421 4.85785 15.7951 5.04601 15.8909C5.25992 15.9999 5.53995 15.9999 6.1 15.9999H7.83726C8.08185 15.9999 8.20414 15.9999 8.31923 16.0276C8.42127 16.0521 8.51881 16.0925 8.60828 16.1473C8.7092 16.2091 8.79568 16.2956 8.96863 16.4686L12.1343 19.6342C12.5627 20.0626 12.7769 20.2768 12.9608 20.2913C13.1203 20.3038 13.2763 20.2392 13.3802 20.1175C13.5 19.9773 13.5 19.6744 13.5 19.0686V4.9313C13.5 4.32548 13.5 4.02257 13.3802 3.88231C13.2763 3.76061 13.1203 3.69602 12.9608 3.70858C12.7769 3.72305 12.5627 3.93724 12.1343 4.36561Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VolumeMuteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22 8.99993L16 14.9999M16 8.99993L22 14.9999M9.63432 4.36561L6.46863 7.5313C6.29568 7.70425 6.2092 7.79073 6.10828 7.85257C6.01881 7.9074 5.92127 7.9478 5.81923 7.9723C5.70414 7.99993 5.58185 7.99993 5.33726 7.99993H3.6C3.03995 7.99993 2.75992 7.99993 2.54601 8.10892C2.35785 8.20479 2.20487 8.35777 2.10899 8.54594C2 8.75985 2 9.03987 2 9.59993V14.3999C2 14.96 2 15.24 2.10899 15.4539C2.20487 15.6421 2.35785 15.7951 2.54601 15.8909C2.75992 15.9999 3.03995 15.9999 3.6 15.9999H5.33726C5.58185 15.9999 5.70414 15.9999 5.81923 16.0276C5.92127 16.0521 6.01881 16.0925 6.10828 16.1473C6.2092 16.2091 6.29568 16.2956 6.46863 16.4686L9.63431 19.6342C10.0627 20.0626 10.2769 20.2768 10.4608 20.2913C10.6203 20.3038 10.7763 20.2392 10.8802 20.1175C11 19.9773 11 19.6744 11 19.0686V4.9313C11 4.32548 11 4.02257 10.8802 3.88231C10.7763 3.76061 10.6203 3.69602 10.4608 3.70858C10.2769 3.72305 10.0627 3.93724 9.63432 4.36561Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FullscreenIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V8M8 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V16M21 8V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H16M21 16V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H16"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
import { useEffect, useRef, useState } from "react";

function formatTime(sec: number): string {
  if (!Number.isFinite(sec)) return "0:00";
  const total = Math.max(0, Math.floor(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function VideoPlayer({
  src,
  expanded = false,
}: {
  src: string;
  /** True na página permalink: usa max-h maior. */
  expanded?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [volume, setVolume] = useState(1);
  const [volumeOpen, setVolumeOpen] = useState(false);
  // Antes do primeiro play, só o botão central aparece (sem barra inferior).
  // Depois da primeira interação, controles seguem o padrão hover/pausado.
  const [hasInteracted, setHasInteracted] = useState(false);

  // Sincroniza estado de fullscreen com a API do browser (Esc também sai).
  useEffect(() => {
    function onChange() {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    function onTime() {
      if (!scrubbing && v) setCurrent(v.currentTime);
    }
    function onMeta() {
      if (!v) return;
      setDuration(v.duration || 0);
      // Força o navegador a renderizar o primeiro frame como thumbnail.
      // Safari/iOS não mostra preview do vídeo sem isso.
      if (!hasInteracted && v.currentTime === 0) {
        try {
          v.currentTime = 0.1;
        } catch {
          /* alguns codecs reclamam de seek antes de buffer; ignora */
        }
      }
    }
    function onPlay() {
      setPlaying(true);
    }
    function onPause() {
      setPlaying(false);
    }
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, [scrubbing]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (!hasInteracted) setHasInteracted(true);
    if (v.paused) void v.play();
    else v.pause();
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function onVolume(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v) return;
    const val = Number(e.target.value);
    setVolume(val);
    v.volume = val;
    // Mexer no slider auto-desmuta.
    if (val > 0 && v.muted) {
      v.muted = false;
      setMuted(false);
    }
    if (val === 0 && !v.muted) {
      v.muted = true;
      setMuted(true);
    }
  }

  function onSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const v = videoRef.current;
    if (!v) return;
    const t = Number(e.target.value);
    setCurrent(t);
    v.currentTime = t;
  }

  function toggleFullscreen() {
    const w = wrapperRef.current;
    if (!w) return;
    if (!document.fullscreenElement) {
      void w.requestFullscreen?.();
    } else {
      void document.exitFullscreen?.();
    }
  }

  const progressPct = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div
      ref={wrapperRef}
      className={`group relative overflow-hidden bg-black ${
        isFullscreen
          ? "flex h-screen w-screen items-center justify-center rounded-none"
          : "rounded-[16px]"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <video
        ref={videoRef}
        src={src}
        className={
          isFullscreen
            ? "h-full w-full object-contain"
            : expanded
              ? "h-auto max-h-[80vh] w-full"
              : "max-h-[520px] w-full"
        }
        playsInline
        preload="metadata"
        onClick={togglePlay}
      />

      {/* Botão central de play (visível quando pausado) */}
      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play"
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
        >
          <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-white/95 text-[#0f0f0f] shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-transform hover:scale-105">
            <Play className="h-[24px] w-[24px]" fill="currentColor" />
          </span>
        </button>
      )}

      {/* Controles bottom — só renderiza depois do primeiro play. Depois disso,
          aparecem on hover quando playing e sempre quando pausado. */}
      {hasInteracted && (
      <div
        className={`absolute inset-x-0 bottom-0 flex flex-col gap-[6px] bg-gradient-to-t from-black/70 via-black/40 to-transparent px-[12px] pb-[10px] pt-[28px] transition-opacity ${
          playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        }`}
      >
        {/* Progress */}
        <div className="relative flex items-center">
          <div className="absolute inset-x-0 h-[3px] rounded-full bg-white/25" />
          <div
            className="absolute h-[3px] rounded-full bg-[#ff4100]"
            style={{ width: `${progressPct}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.01}
            value={current}
            onChange={onSeek}
            onPointerDown={() => setScrubbing(true)}
            onPointerUp={() => setScrubbing(false)}
            aria-label="Progresso"
            className="relative z-10 h-[16px] w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-[14px] [&::-moz-range-thumb]:w-[14px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-[#ff4100] [&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:w-[14px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#ff4100]"
          />
        </div>

        {/* Ações */}
        <div className="flex items-center gap-[10px] text-white">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pausar" : "Tocar"}
            className="flex h-[28px] w-[28px] items-center justify-center rounded-full transition-opacity hover:opacity-80"
          >
            {playing ? (
              <Pause className="h-[16px] w-[16px]" fill="currentColor" />
            ) : (
              <Play className="ml-[1px] h-[16px] w-[16px]" fill="currentColor" />
            )}
          </button>

          <span className="text-[11px] font-semibold tabular-nums tracking-[-0.01em]">
            {formatTime(current)} / {formatTime(duration)}
          </span>

          <div className="ml-auto flex items-center gap-[6px]">
            {/* Volume: hover na área expande o slider à direita do ícone */}
            <div
              className="flex items-center"
              onMouseEnter={() => setVolumeOpen(true)}
              onMouseLeave={() => setVolumeOpen(false)}
            >
              <button
                type="button"
                onClick={toggleMute}
                aria-label={muted ? "Desmutar" : "Mutar"}
                className="flex h-[28px] w-[28px] items-center justify-center rounded-full transition-opacity hover:opacity-80"
              >
                {(() => {
                  const effective = muted ? 0 : volume;
                  if (effective === 0) return <VolumeMuteIcon className="h-[16px] w-[16px]" />;
                  if (effective <= 0.5) return <VolumeMidIcon className="h-[16px] w-[16px]" />;
                  return <VolumeFullIcon className="h-[16px] w-[16px]" />;
                })()}
              </button>
              <div
                className={`overflow-hidden transition-[width] duration-200 ease-out ${
                  volumeOpen ? "w-[80px]" : "w-0"
                }`}
              >
                <div className="relative flex h-[16px] w-[76px] items-center">
                  <div className="absolute inset-x-0 h-[3px] rounded-full bg-white/25" />
                  <div
                    className="absolute h-[3px] rounded-full bg-white"
                    style={{ width: `${(muted ? 0 : volume) * 100}%` }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={muted ? 0 : volume}
                    onChange={onVolume}
                    aria-label="Volume"
                    className="relative z-10 h-[16px] w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-[12px] [&::-moz-range-thumb]:w-[12px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:w-[12px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Tela cheia"
              className="flex h-[28px] w-[28px] items-center justify-center rounded-full transition-opacity hover:opacity-80"
            >
              <FullscreenIcon className="h-[16px] w-[16px]" />
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
