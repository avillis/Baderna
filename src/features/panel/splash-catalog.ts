import { readdir } from "node:fs/promises";
import path from "node:path";

import { getSplashImageSrc } from "@/features/panel/banner-selection";

export type SplashVariant = {
  fileName: string;
  src: string;
  champion: string;
  displayChampion: string;
  // Skin identifier ("Original", "BloodMoon", "Mecha", ...)
  skin: string;
  displaySkin: string;
};

export type SplashGroup = {
  champion: string;
  displayChampion: string;
  variants: SplashVariant[];
};

const SPLASH_DIRECTORY = path.join(
  process.cwd(),
  "campeões",
  "splash_processed",
  "full",
);

// Multi-word / apostrophe champion names as they appear in source filenames.
// Two source conventions exist:
//   1. Underscore separator (Aurelion_Sol, Bel_Veth, Cho_Gath)
//   2. "27" inline = URL-encoded apostrophe (Vel27Koz, Kha27Zix, K27Sante)
// Longest-prefix match wins so "Aurelion_Sol" beats "Aurelion".
// Maps each raw source spelling to the canonical display name.
const CHAMPION_DISPLAY: Record<string, string> = {
  Aurelion_Sol: "Aurelion Sol",
  Bel_Veth: "Bel'Veth",
  Cho_Gath: "Cho'Gath",
  Dr_Mundo: "Dr Mundo",
  "Dr._Mundo": "Dr Mundo",
  Jarvan_IV: "Jarvan IV",
  Kai_Sa: "Kai'Sa",
  Kai27Sa: "Kai'Sa",
  Kha_Zix: "Kha'Zix",
  Kha27Zix: "Kha'Zix",
  K_Sante: "K'Sante",
  K27Sante: "K'Sante",
  Kog_Maw: "Kog'Maw",
  Kog27Maw: "Kog'Maw",
  Lee_Sin: "Lee Sin",
  Master_Yi: "Master Yi",
  Miss_Fortune: "Miss Fortune",
  Monkey_King: "Wukong",
  Nunu_Willump: "Nunu & Willump",
  Rek_Sai: "Rek'Sai",
  Rek27Sai: "Rek'Sai",
  Renata_Glasc: "Renata Glasc",
  Tahm_Kench: "Tahm Kench",
  Twisted_Fate: "Twisted Fate",
  Vel_Koz: "Vel'Koz",
  Vel27Koz: "Vel'Koz",
  Xin_Zhao: "Xin Zhao",
  // Single-word champions with localised names
  Bard: "Bardo",
};

const KNOWN_CHAMPIONS = Object.keys(CHAMPION_DISPLAY);

const KNOWN_CHAMPIONS_SORTED = [...KNOWN_CHAMPIONS].sort(
  (a, b) => b.length - a.length,
);

// Group multiple file naming conventions into a single canonical champion id.
// e.g. "Vel27Koz" → "Vel'Koz", "Aurelion_Sol" → "Aurelion Sol".
function extractChampion(rawChampion: string): string {
  for (const known of KNOWN_CHAMPIONS_SORTED) {
    if (rawChampion === known || rawChampion.startsWith(`${known}_`)) {
      return CHAMPION_DISPLAY[known];
    }
  }
  // SHARED-skin filenames concatenate champion names without separator
  // ("AsheZeri", "HeimerdingerJarvanIVSyndra"). Take the first PascalCase
  // word as the lead champion.
  const match = rawChampion.match(/^[A-Z][a-z]+/);
  const lead = match ? match[0] : rawChampion;
  return CHAMPION_DISPLAY[lead] ?? lead;
}

function formatSkinLabel(skin: string): string {
  if (skin === "Original") return "Padrão";
  // 1. Insert spaces around camel boundaries and digits.
  let s = skin
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2");
  // 2. Title-case any ALL-CAPS token (PROJECT → Project).
  s = s
    .split(" ")
    .map((word) =>
      word.length > 1 && word === word.toUpperCase() && /[A-Z]/.test(word)
        ? word[0] + word.slice(1).toLowerCase()
        : word,
    )
    .join(" ");
  // 3. Capitalize the first character.
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Cache em memória do processo. Catálogo só muda quando adicionamos splash
// files — fica válido pra sempre durante a vida do server. Evita re-listar
// milhares de arquivos a cada request.
let cachedCatalog: Awaited<ReturnType<typeof buildCatalog>> | null = null;

export async function getSplashCatalog() {
  if (cachedCatalog) return cachedCatalog;
  cachedCatalog = await buildCatalog();
  return cachedCatalog;
}

async function buildCatalog() {
  let files: string[] = [];
  try {
    files = await readdir(SPLASH_DIRECTORY);
  } catch {
    return [];
  }
  const groups = new Map<string, SplashVariant[]>();

  for (const fileName of files) {
    const noExt = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, "");
    // Champion_Skin.webp — champion names may contain underscores/periods
    // (Bel_Veth, Aurelion_Sol, Dr._Mundo), skin names may contain hyphens
    // (All-star, Re-Gifted).
    const match = noExt.match(/^(.+)_([A-Za-z0-9-]+)$/);
    let rawChampion: string;
    let skin: string;
    if (match) {
      [, rawChampion, skin] = match;
    } else {
      // SHARED group skins without a champion in the name (Academy, AnimaSquad).
      rawChampion = "Compartilhadas";
      skin = noExt;
    }
    const champion = match ? extractChampion(rawChampion) : "Compartilhadas";
    const currentGroup = groups.get(champion) ?? [];
    currentGroup.push({
      fileName,
      src: getSplashImageSrc(fileName),
      champion,
      displayChampion: champion,
      skin,
      displaySkin: formatSkinLabel(skin),
    });
    groups.set(champion, currentGroup);
  }

  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([champion, variants]) => ({
      champion,
      displayChampion: champion,
      variants: variants.sort((a, b) => {
        if (a.skin === "Original" && b.skin !== "Original") return -1;
        if (b.skin === "Original" && a.skin !== "Original") return 1;
        return a.skin.localeCompare(b.skin);
      }),
    }));
}
