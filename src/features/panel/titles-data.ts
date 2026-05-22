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
    pillGradient: "#E8B53C",
    pillText: "#ffffff",
    headerColor: "#0f0f0f",
  },
  exclusivo: {
    label: "Exclusivo",
    pillGradient: "#EE89B3",
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
    pillGradient: "#0c8c8c",
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
