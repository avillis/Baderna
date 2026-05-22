import type { TitleRarity } from "@/features/panel/titles-data";

// Visual styles for a member's `displayName`. Same rarity scale as titles
// so the loja roulette weights reuse the title formula.

export type NameStyle = {
  id: string;
  label: string;
  rarity: TitleRarity;
  // Visual treatment — applied to the text element. Either a flat colour
  // (cheap path for commons/raros) or a CSS class for gradients/animations.
  color?: string;
  className?: string;
};

export const NAME_STYLES: NameStyle[] = [
  // Comum
  { id: "preto",   label: "Clássico",  rarity: "comum", color: "#0f0f0f" },
  { id: "chumbo",  label: "Chumbo",    rarity: "comum", color: "#4a4a4a" },
  { id: "ardosia", label: "Ardósia",   rarity: "comum", color: "#3a4a5c" },
  { id: "terra",   label: "Terra",     rarity: "comum", color: "#7a4a2b" },

  // Raro — solid colors e gradients suaves
  { id: "azul-baderna",   label: "Azul Baderna",   rarity: "raro", color: "#1D49FF" },
  { id: "vermelho-sangue", label: "Vermelho sangue", rarity: "raro", color: "#c41e3a" },
  { id: "verde-toxico",   label: "Verde tóxico",   rarity: "raro", color: "#1f9d3a" },
  { id: "rosa-neon",      label: "Rosa neon",      rarity: "raro", color: "#ff10a0" },
  { id: "ciano",          label: "Ciano",          rarity: "raro", color: "#00b8d4" },
  { id: "mint",           label: "Mint",           rarity: "raro", className: "name-gradient-mint" },
  { id: "sakura",         label: "Sakura",         rarity: "raro", className: "name-gradient-sakura" },
  { id: "lavanda",        label: "Lavanda",        rarity: "raro", className: "name-gradient-lavanda" },
  { id: "tangerina",      label: "Tangerina",      rarity: "raro", className: "name-gradient-tangerina" },
  { id: "coral",          label: "Coral",          rarity: "raro", className: "name-gradient-coral" },
  { id: "esmeralda",      label: "Esmeralda",      rarity: "raro", className: "name-gradient-esmeralda" },
  { id: "cobalto",        label: "Cobalto",        rarity: "raro", className: "name-gradient-cobalto" },

  // Épico — gradients vibrantes e multi-cor
  { id: "sunset",         label: "Sunset",         rarity: "epico", className: "name-gradient-sunset" },
  { id: "ocean",          label: "Ocean",          rarity: "epico", className: "name-gradient-ocean" },
  { id: "lava",           label: "Lava",           rarity: "epico", className: "name-gradient-lava" },
  { id: "galaxy",         label: "Galaxy",         rarity: "epico", className: "name-gradient-galaxy" },
  { id: "twilight",       label: "Twilight",       rarity: "epico", className: "name-gradient-twilight" },
  { id: "inferno",        label: "Inferno",        rarity: "epico", className: "name-gradient-inferno" },
  { id: "tropical",       label: "Tropical",       rarity: "epico", className: "name-gradient-tropical" },
  { id: "royal",          label: "Royal",          rarity: "epico", className: "name-gradient-royal" },
  { id: "cyberpunk",      label: "Cyberpunk",      rarity: "epico", className: "name-gradient-cyberpunk" },
  { id: "rose-gold",      label: "Rose Gold",      rarity: "epico", className: "name-gradient-rose-gold" },

  // Exclusivo — neons com glow
  { id: "fogo",           label: "Fogo",           rarity: "exclusivo", className: "name-fire" },
  { id: "neon-rosa",      label: "Neon rosa",      rarity: "exclusivo", className: "name-neon-pink" },
  { id: "neon-ciano",     label: "Neon ciano",     rarity: "exclusivo", className: "name-neon-cyan" },
  { id: "neon-verde",     label: "Neon verde",     rarity: "exclusivo", className: "name-neon-green" },
  { id: "neon-roxo",      label: "Neon roxo",      rarity: "exclusivo", className: "name-neon-purple" },
  { id: "acid",           label: "Acid",           rarity: "exclusivo", className: "name-acid" },
  { id: "plasma",         label: "Plasma",         rarity: "exclusivo", className: "name-plasma" },

  // Lendário — efeitos animados
  { id: "rainbow",        label: "Rainbow",        rarity: "lendaria", className: "name-rainbow" },
  { id: "shimmer-gold",   label: "Shimmer Gold",   rarity: "lendaria", className: "name-shimmer-gold" },
  { id: "aurora",         label: "Aurora",         rarity: "lendaria", className: "name-aurora" },
  { id: "diamante",       label: "Diamante",       rarity: "lendaria", className: "name-diamante" },

  // Limitado (não entram na roleta — só dados por admin)
  { id: "holografico",    label: "Holográfico",    rarity: "limitado", className: "name-holographic" },
];

export const NAME_BY_ID: Record<string, NameStyle> = Object.fromEntries(
  NAME_STYLES.map((s) => [s.id, s]),
);
