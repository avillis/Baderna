"use client";

import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
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
      if (v) setDuration(v.duration || 0);
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

      {/* Controles bottom — aparecem on hover sempre, e sempre quando pausado */}
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
                {muted || volume === 0 ? (
                  <VolumeX className="h-[16px] w-[16px]" />
                ) : (
                  <Volume2 className="h-[16px] w-[16px]" />
                )}
              </button>
              <div
                className={`overflow-hidden transition-[width] duration-200 ease-out ${
                  volumeOpen ? "w-[80px]" : "w-0"
                }`}
              >
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  onChange={onVolume}
                  aria-label="Volume"
                  className="h-[16px] w-[76px] cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-[12px] [&::-moz-range-thumb]:w-[12px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:h-[3px] [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-white/30 [&::-webkit-slider-runnable-track]:h-[3px] [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-white/30 [&::-webkit-slider-thumb]:mt-[-4.5px] [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:w-[12px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  style={{
                    background: `linear-gradient(to right, white 0%, white ${
                      (muted ? 0 : volume) * 100
                    }%, transparent ${(muted ? 0 : volume) * 100}%)`,
                  }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label="Tela cheia"
              className="flex h-[28px] w-[28px] items-center justify-center rounded-full transition-opacity hover:opacity-80"
            >
              <Maximize2 className="h-[14px] w-[14px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
