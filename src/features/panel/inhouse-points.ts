// Pontos da Baderna (PB) creditados por partida. Separado do sistema
// de moedas — esses pontos viram ranking interno.

export const DEFAULT_INHOUSE_POINTS = {
  flex: { win: 10, loss: 5 },
  inhouse: { win: 25, loss: 15 },
} as const;

export type PointsByOutcome = {
  win: number;
  loss: number;
};

export type InhousePoints = {
  flex: PointsByOutcome;
  inhouse: PointsByOutcome;
};
