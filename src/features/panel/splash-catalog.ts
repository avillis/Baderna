import { getSplashImageSrc } from "@/features/panel/banner-selection";
// Catálogo pré-gerado a partir da pasta local `campeões/splash_processed/full/`.
// Regenera com: `node scripts/generate-splash-catalog.js` (todo: criar esse script).
import catalogData from "@/features/panel/splash-catalog.json";

export type SplashVariant = {
  fileName: string;
  src: string;
  champion: string;
  displayChampion: string;
  skin: string;
  displaySkin: string;
};

export type SplashGroup = {
  champion: string;
  displayChampion: string;
  variants: SplashVariant[];
};

type RawVariant = {
  fileName: string;
  skin: string;
  displaySkin: string;
};

type RawGroup = {
  champion: string;
  displayChampion: string;
  variants: RawVariant[];
};

// Cache em memória — `src` é gerado a cada call só na primeira vez.
let cachedCatalog: SplashGroup[] | null = null;

export async function getSplashCatalog(): Promise<SplashGroup[]> {
  if (cachedCatalog) return cachedCatalog;
  cachedCatalog = (catalogData as RawGroup[]).map((group) => ({
    champion: group.champion,
    displayChampion: group.displayChampion,
    variants: group.variants.map((v) => ({
      fileName: v.fileName,
      src: getSplashImageSrc(v.fileName),
      champion: group.champion,
      displayChampion: group.displayChampion,
      skin: v.skin,
      displaySkin: v.displaySkin,
    })),
  }));
  return cachedCatalog;
}
