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
  // ── Comum (cores sólidas simples) ────────────────────────────────────
  { id: "preto",     label: "Clássico", rarity: "comum", color: "#0f0f0f" },
  { id: "chumbo",    label: "Chumbo",   rarity: "comum", color: "#4a4a4a" },
  { id: "ardosia",   label: "Ardósia",  rarity: "comum", color: "#3a4a5c" },
  { id: "terra",     label: "Terra",    rarity: "comum", color: "#7a4a2b" },
  { id: "carvao",    label: "Carvão",   rarity: "comum", color: "#1f1f1f" },
  { id: "grafite",   label: "Grafite",  rarity: "comum", color: "#383838" },
  { id: "pedra",     label: "Pedra",    rarity: "comum", color: "#6b7280" },
  { id: "areia",     label: "Areia",    rarity: "comum", color: "#c4a878" },
  { id: "musgo",     label: "Musgo",    rarity: "comum", color: "#4a5d23" },
  { id: "ferrugem",  label: "Ferrugem", rarity: "comum", color: "#b7410e" },
  { id: "vinho",     label: "Vinho",    rarity: "comum", color: "#722f37" },
  { id: "gelo",      label: "Gelo",     rarity: "comum", color: "#8ab8d0" },

  // ── Raro — cores vibrantes sólidas e gradients suaves ───────────────
  { id: "azul-baderna",    label: "Azul Baderna",   rarity: "raro", color: "#1D49FF" },
  { id: "vermelho-sangue", label: "Vermelho sangue", rarity: "raro", color: "#c41e3a" },
  { id: "verde-toxico",    label: "Verde tóxico",   rarity: "raro", color: "#1f9d3a" },
  { id: "rosa-neon",       label: "Rosa neon",      rarity: "raro", color: "#ff10a0" },
  { id: "ciano",           label: "Ciano",          rarity: "raro", color: "#00b8d4" },
  { id: "limao",           label: "Limão",          rarity: "raro", color: "#d4e157" },
  { id: "amora",           label: "Amora",          rarity: "raro", color: "#6c0035" },
  { id: "framboesa",       label: "Framboesa",      rarity: "raro", color: "#d10056" },
  { id: "cereja",          label: "Cereja",         rarity: "raro", color: "#d23051" },
  { id: "jade",            label: "Jade",           rarity: "raro", color: "#00a86b" },
  { id: "turquesa",        label: "Turquesa",       rarity: "raro", color: "#40e0d0" },
  { id: "indigo",          label: "Índigo",         rarity: "raro", color: "#4b0082" },
  { id: "malva",           label: "Malva",          rarity: "raro", color: "#993366" },
  { id: "fucsia",          label: "Fúcsia",         rarity: "raro", color: "#e600e6" },
  { id: "marsala",         label: "Marsala",        rarity: "raro", color: "#955251" },
  { id: "mint",        label: "Mint",         rarity: "raro", className: "name-gradient-mint" },
  { id: "sakura",      label: "Sakura",       rarity: "raro", className: "name-gradient-sakura" },
  { id: "lavanda",     label: "Lavanda",      rarity: "raro", className: "name-gradient-lavanda" },
  { id: "tangerina",   label: "Tangerina",    rarity: "raro", className: "name-gradient-tangerina" },
  { id: "coral",       label: "Coral",        rarity: "raro", className: "name-gradient-coral" },
  { id: "esmeralda",   label: "Esmeralda",    rarity: "raro", className: "name-gradient-esmeralda" },
  { id: "cobalto",     label: "Cobalto",      rarity: "raro", className: "name-gradient-cobalto" },
  { id: "citrico",     label: "Cítrico",      rarity: "raro", className: "name-gradient-citrico" },
  { id: "blueberry",   label: "Blueberry",    rarity: "raro", className: "name-gradient-blueberry" },
  { id: "hortela",     label: "Hortelã",      rarity: "raro", className: "name-gradient-hortela" },
  { id: "peridot",     label: "Peridoto",     rarity: "raro", className: "name-gradient-peridot" },
  { id: "safira",      label: "Safira",       rarity: "raro", className: "name-gradient-safira" },
  { id: "ametista",    label: "Ametista",     rarity: "raro", className: "name-gradient-ametista" },
  { id: "topazio",     label: "Topázio",      rarity: "raro", className: "name-gradient-topazio" },
  { id: "rubi",        label: "Rubi",         rarity: "raro", className: "name-gradient-rubi" },

  // ── Épico — gradients vibrantes e multi-cor ────────────────────────
  { id: "sunset",      label: "Sunset",       rarity: "epico", className: "name-gradient-sunset" },
  { id: "ocean",       label: "Ocean",        rarity: "epico", className: "name-gradient-ocean" },
  { id: "lava",        label: "Lava",         rarity: "epico", className: "name-gradient-lava" },
  { id: "galaxy",      label: "Galaxy",       rarity: "epico", className: "name-gradient-galaxy" },
  { id: "twilight",    label: "Twilight",     rarity: "epico", className: "name-gradient-twilight" },
  { id: "inferno",     label: "Inferno",      rarity: "epico", className: "name-gradient-inferno" },
  { id: "tropical",    label: "Tropical",     rarity: "epico", className: "name-gradient-tropical" },
  { id: "royal",       label: "Royal",        rarity: "epico", className: "name-gradient-royal" },
  { id: "cyberpunk",   label: "Cyberpunk",    rarity: "epico", className: "name-gradient-cyberpunk" },
  { id: "rose-gold",   label: "Rose Gold",    rarity: "epico", className: "name-gradient-rose-gold" },
  { id: "vaporwave",   label: "Vaporwave",    rarity: "epico", className: "name-gradient-vaporwave" },
  { id: "nebulosa",    label: "Nebulosa",     rarity: "epico", className: "name-gradient-nebulosa" },
  { id: "mar-egeu",    label: "Mar Egeu",     rarity: "epico", className: "name-gradient-mar-egeu" },
  { id: "savana",      label: "Savana",       rarity: "epico", className: "name-gradient-savana" },
  { id: "magma",       label: "Magma",        rarity: "epico", className: "name-gradient-magma" },
  { id: "crepusculo",  label: "Crepúsculo",   rarity: "epico", className: "name-gradient-crepusculo" },
  { id: "carnaval",    label: "Carnaval",     rarity: "epico", className: "name-gradient-carnaval" },
  { id: "natal",       label: "Natal",        rarity: "epico", className: "name-gradient-natal" },
  { id: "vinho-tinto", label: "Vinho Tinto",  rarity: "epico", className: "name-gradient-vinho-tinto" },
  { id: "mosaico",     label: "Mosaico",      rarity: "epico", className: "name-gradient-mosaico" },

  // ── Exclusivo — neons com glow ─────────────────────────────────────
  { id: "fogo",         label: "Fogo",         rarity: "exclusivo", className: "name-fire" },
  { id: "neon-rosa",    label: "Neon rosa",    rarity: "exclusivo", className: "name-neon-pink" },
  { id: "neon-ciano",   label: "Neon ciano",   rarity: "exclusivo", className: "name-neon-cyan" },
  { id: "neon-verde",   label: "Neon verde",   rarity: "exclusivo", className: "name-neon-green" },
  { id: "neon-roxo",    label: "Neon roxo",    rarity: "exclusivo", className: "name-neon-purple" },
  { id: "acid",         label: "Acid",         rarity: "exclusivo", className: "name-acid" },
  { id: "plasma",       label: "Plasma",       rarity: "exclusivo", className: "name-plasma" },
  { id: "neon-amarelo", label: "Neon amarelo", rarity: "exclusivo", className: "name-neon-amarelo" },
  { id: "neon-laranja", label: "Neon laranja", rarity: "exclusivo", className: "name-neon-laranja" },
  { id: "neon-vermelho",label: "Neon vermelho",rarity: "exclusivo", className: "name-neon-vermelho" },
  { id: "neon-azul",    label: "Neon azul",    rarity: "exclusivo", className: "name-neon-azul" },
  { id: "neon-branco",  label: "Neon branco",  rarity: "exclusivo", className: "name-neon-branco" },
  { id: "eletric",      label: "Elétrico",     rarity: "exclusivo", className: "name-eletric" },
  { id: "toxic",        label: "Tóxico",       rarity: "exclusivo", className: "name-toxic" },
  { id: "radioativo",   label: "Radioativo",   rarity: "exclusivo", className: "name-radioativo" },
  { id: "led",          label: "LED",          rarity: "exclusivo", className: "name-led" },
  { id: "glitch",       label: "Glitch",       rarity: "exclusivo", className: "name-glitch" },

  // ── Lendária — animações elaboradas ────────────────────────────────
  { id: "rainbow",     label: "Rainbow",      rarity: "lendaria", className: "name-rainbow" },
  { id: "shimmer-gold",label: "Shimmer Gold", rarity: "lendaria", className: "name-shimmer-gold" },
  { id: "aurora",      label: "Aurora",       rarity: "lendaria", className: "name-aurora" },
  { id: "diamante",    label: "Diamante",     rarity: "lendaria", className: "name-diamante" },
  { id: "phoenix",     label: "Phoenix",      rarity: "lendaria", className: "name-phoenix" },
  { id: "tide",        label: "Maré",         rarity: "lendaria", className: "name-tide" },
  { id: "thunder",     label: "Trovão",       rarity: "lendaria", className: "name-thunder" },
  { id: "zen",         label: "Zen",          rarity: "lendaria", className: "name-zen" },
  { id: "nebula",      label: "Nebula",       rarity: "lendaria", className: "name-nebula" },
  { id: "prismatic",   label: "Prismático",   rarity: "lendaria", className: "name-prismatic" },

  // ── Limitado — admin grant only (não entram na roleta) ─────────────
  { id: "holografico", label: "Holográfico",  rarity: "limitado", className: "name-holographic" },
  { id: "chrome",      label: "Chrome",       rarity: "limitado", className: "name-chrome" },
  { id: "liquid-gold", label: "Liquid Gold",  rarity: "limitado", className: "name-liquid-gold" },
  { id: "void",        label: "Void",         rarity: "limitado", className: "name-void" },
];

export const NAME_BY_ID: Record<string, NameStyle> = Object.fromEntries(
  NAME_STYLES.map((s) => [s.id, s]),
);
