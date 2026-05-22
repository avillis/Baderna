"use client";

import { useGameMode, type GameMode } from "@/features/panel/game-mode-context";

const MODES: GameMode[] = ["Todos", "Inhouse", "Flex"];

export function PanelGameModeToggle() {
  const { mode, setMode } = useGameMode();
  const activeIdx = MODES.indexOf(mode);

  return (
    <div
      className="relative flex h-[40px] w-[240px] items-center rounded-[25px] p-[4px]"
      style={{
        background: "#ededed",
        border: "none",
      }}
    >
      {/* Sliding pill */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[4px] bottom-[4px] w-[calc((100%-8px)/3)] rounded-[25px]"
        style={{
          background: "#ffffff",
          boxShadow: "none",
          transform: `translateX(${activeIdx * 100}%)`,
          transition: "transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
          zIndex: 0,
        }}
      />

      {MODES.map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => setMode(m)}
          className={`relative z-[1] flex h-full flex-1 items-center justify-center rounded-[25px] text-[13px] font-semibold transition-colors duration-300 ${
            mode === m
              ? "text-[#0f0f0f]"
              : "text-black/40 hover:text-black/70"
          }`}
          style={{ whiteSpace: "nowrap" }}
        >
          {m}
        </button>
      ))}
    </div>
  );
}
