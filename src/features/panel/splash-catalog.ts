import { getSplashImageSrc } from "@/features/panel/banner-selection";
import { CHAMPION_AVATAR_FILES } from "@/features/panel/champion-avatar";

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

// Nomes "bonitinhos" — alguns campeões precisam de display especial.
const CHAMPION_DISPLAY: Record<string, string> = {
  AurelionSol: "Aurelion Sol",
  Belveth: "Bel'Veth",
  Chogath: "Cho'Gath",
  DrMundo: "Dr Mundo",
  FiddleSticks: "Fiddlesticks",
  JarvanIV: "Jarvan IV",
  Kaisa: "Kai'Sa",
  Khazix: "Kha'Zix",
  KogMaw: "Kog'Maw",
  KSante: "K'Sante",
  Leblanc: "LeBlanc",
  LeeSin: "Lee Sin",
  MasterYi: "Master Yi",
  MissFortune: "Miss Fortune",
  MonkeyKing: "Wukong",
  RekSai: "Rek'Sai",
  TahmKench: "Tahm Kench",
  TwistedFate: "Twisted Fate",
  Velkoz: "Vel'Koz",
  XinZhao: "Xin Zhao",
  Bard: "Bardo",
};

function championDisplay(rawId: string): string {
  return CHAMPION_DISPLAY[rawId] ?? rawId;
}

// Catálogo agora é gerado da lista estática de campeões.
// Cada campeão tem 1 variante (skin Original = _0.jpg do Data Dragon).
// Imagens vêm da Riot via /api/champion-splash → Data Dragon.
let cachedCatalog: SplashGroup[] | null = null;

export async function getSplashCatalog(): Promise<SplashGroup[]> {
  if (cachedCatalog) return cachedCatalog;
  cachedCatalog = buildCatalog();
  return cachedCatalog;
}

function buildCatalog(): SplashGroup[] {
  const groups: SplashGroup[] = CHAMPION_AVATAR_FILES.map((fileName) => {
    // Akali_0.jpg → champion id "Akali"
    const rawId = fileName.replace(/_\d+\.(jpg|jpeg|png|webp)$/i, "");
    const display = championDisplay(rawId);
    return {
      champion: display,
      displayChampion: display,
      variants: [
        {
          fileName,
          src: getSplashImageSrc(fileName),
          champion: display,
          displayChampion: display,
          skin: "Original",
          displaySkin: "Padrão",
        },
      ],
    };
  });

  return groups.sort((a, b) => a.champion.localeCompare(b.champion));
}
