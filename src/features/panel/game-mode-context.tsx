"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type GameMode = "Todos" | "Flex" | "Inhouse";

const GameModeContext = createContext<{
  mode: GameMode;
  setMode: (m: GameMode) => void;
}>({ mode: "Todos", setMode: () => {} });

export function GameModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<GameMode>("Todos");
  return (
    <GameModeContext.Provider value={{ mode, setMode }}>
      {children}
    </GameModeContext.Provider>
  );
}

export function useGameMode() {
  return useContext(GameModeContext);
}
