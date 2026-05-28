export type TitleRarity =
  | "limitado"
  | "lendaria"
  | "exclusivo"
  | "epico"
  | "raro"
  | "comum";

export type Title = {
  id: string;
  label: string;
  rarity: TitleRarity;
};

export const RARITY_ORDER: TitleRarity[] = [
  "limitado",
  "lendaria",
  "exclusivo",
  "epico",
  "raro",
  "comum",
];

export const RARITY_META: Record<
  TitleRarity,
  { label: string; pillGradient: string; pillText: string; headerColor: string }
> = {
  limitado: {
    label: "Limitado",
    pillGradient: "linear-gradient(135deg, #0f1f33 0%, #4a8fc7 60%, #a0d8ff 100%)",
    pillText: "#ffffff",
    headerColor: "#0f0f0f",
  },
  lendaria: {
    label: "Lendário",
    pillGradient: "linear-gradient(135deg, #7d5a0b 0%, #ffd700 60%, #fffacd 100%)",
    pillText: "#ffffff",
    headerColor: "#0f0f0f",
  },
  exclusivo: {
    label: "Exclusivo",
    pillGradient: "linear-gradient(135deg, #1a0000 0%, #8b0000 60%, #c0392b 100%)",
    pillText: "#ffffff",
    headerColor: "#0f0f0f",
  },
  epico: {
    label: "Épico",
    pillGradient: "#1D49FF",
    pillText: "#ffffff",
    headerColor: "#0f0f0f",
  },
  raro: {
    label: "Raro",
    pillGradient: "#EE89B3",
    pillText: "#ffffff",
    headerColor: "#0f0f0f",
  },
  comum: {
    label: "Comum",
    pillGradient: "#4a4a4a",
    pillText: "#ffffff",
    headerColor: "#0f0f0f",
  },
};

export const TITLES: Title[] = [
  // Único default. Todo o resto vem do admin via API (DB).
  { id: "aprendiz", label: "Aprendiz", rarity: "comum" },
];

export function getTitleById(id: string): Title | undefined {
  return TITLES.find((t) => t.id === id);
}
