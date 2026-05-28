export type LevelFrame = {
  level: number;
  slug: string;
  imageSrc: string;
  price: number;
  tier: 1 | 2 | 3 | 4;
};

export type ChampionFrame = {
  champion: string;
  slug: string;
  imageSrc: string;
  price: number;
};

// Pricing per frame (sequential, not per level number):
// Tier 1 (1–100):   +50 each  → 50, 100, 150, 175, 175, 200, 250
// Tier 2 (125–250): +100 each → 350, 450, 550, 650, 750, 850
// Tier 3 (275–375): +120 each → 970, 1090, 1210, 1330, 1450
// Tier 4 (400+):    +200 each → 425=1850, 450=2050, 475=2250, 500=2450, 525=2650, 550=2850, 575=3050, 600=3250
export const LEVEL_FRAMES: LevelFrame[] = [
  { level: 1,   slug: "level-frame-1",   imageSrc: "/images/level-frames/Level_1_Summoner_Icon_Border.png",   price: 50,   tier: 1 },
  { level: 30,  slug: "level-frame-30",  imageSrc: "/images/level-frames/Level_30_Summoner_Icon_Border.png",  price: 100,  tier: 1 },
  { level: 50,  slug: "level-frame-50",  imageSrc: "/images/level-frames/Level_50_Summoner_Icon_Border.png",  price: 150,  tier: 1 },
  { level: 68,  slug: "level-frame-68",  imageSrc: "/images/level-frames/Level_68.png",                       price: 175,  tier: 1 },
  { level: 69,  slug: "level-frame-69",  imageSrc: "/images/level-frames/Level_69.png",                       price: 175,  tier: 1 },
  { level: 75,  slug: "level-frame-75",  imageSrc: "/images/level-frames/Level_75_Summoner_Icon_Border.png",  price: 200,  tier: 1 },
  { level: 100, slug: "level-frame-100", imageSrc: "/images/level-frames/Level_100_Summoner_Icon_Border.png", price: 250,  tier: 1 },
  { level: 125, slug: "level-frame-125", imageSrc: "/images/level-frames/Level_125_Summoner_Icon_Border.png", price: 350,  tier: 2 },
  { level: 150, slug: "level-frame-150", imageSrc: "/images/level-frames/Level_150_Summoner_Icon_Border.png", price: 450,  tier: 2 },
  { level: 175, slug: "level-frame-175", imageSrc: "/images/level-frames/Level_175_Summoner_Icon_Border.png", price: 550,  tier: 2 },
  { level: 200, slug: "level-frame-200", imageSrc: "/images/level-frames/Level_200_Summoner_Icon_Border.png", price: 650,  tier: 2 },
  { level: 225, slug: "level-frame-225", imageSrc: "/images/level-frames/Level_225_Summoner_Icon_Border.png", price: 750,  tier: 2 },
  { level: 250, slug: "level-frame-250", imageSrc: "/images/level-frames/Level_250_Summoner_Icon_Border.png", price: 850,  tier: 2 },
  { level: 275, slug: "level-frame-275", imageSrc: "/images/level-frames/Level_275_Summoner_Icon_Border.png", price: 970,  tier: 3 },
  { level: 300, slug: "level-frame-300", imageSrc: "/images/level-frames/Level_300_Summoner_Icon_Border.png", price: 1090, tier: 3 },
  { level: 325, slug: "level-frame-325", imageSrc: "/images/level-frames/Level_325_Summoner_Icon_Border.png", price: 1210, tier: 3 },
  { level: 350, slug: "level-frame-350", imageSrc: "/images/level-frames/Level_350_Summoner_Icon_Border.png", price: 1330, tier: 3 },
  { level: 375, slug: "level-frame-375", imageSrc: "/images/level-frames/Level_375_Summoner_Icon_Border.png", price: 1450, tier: 3 },
  { level: 425, slug: "level-frame-425", imageSrc: "/images/level-frames/Level_425_Summoner_Icon_Border.png", price: 1850, tier: 4 },
  { level: 450, slug: "level-frame-450", imageSrc: "/images/level-frames/Level_450_Summoner_Icon_Border.png", price: 2050, tier: 4 },
  { level: 475, slug: "level-frame-475", imageSrc: "/images/level-frames/Level_475_Summoner_Icon_Border.png", price: 2250, tier: 4 },
  { level: 500, slug: "level-frame-500", imageSrc: "/images/level-frames/Level_500_Summoner_Icon_Border.png", price: 2450, tier: 4 },
  { level: 525, slug: "level-frame-525", imageSrc: "/images/level-frames/Level_525.png",                      price: 2650, tier: 4 },
  { level: 550, slug: "level-frame-550", imageSrc: "/images/level-frames/Level_550.png",                      price: 2850, tier: 4 },
  { level: 575, slug: "level-frame-575", imageSrc: "/images/level-frames/Level_575.png",                      price: 3050, tier: 4 },
  { level: 600, slug: "level-frame-600", imageSrc: "/images/level-frames/Level_600.png",                      price: 3250, tier: 4 },
];

export const CHAMPION_FRAMES: ChampionFrame[] = [
  { champion: "Azir",     slug: "champion-frame-azir",     imageSrc: "/images/level-frames/Level_Azir.png",     price: 700 },
  { champion: "Gnar",     slug: "champion-frame-gnar",     imageSrc: "/images/level-frames/Level_Gnar.png",     price: 700 },
  { champion: "Illaoi",   slug: "champion-frame-illaoi",   imageSrc: "/images/level-frames/Level_Illaoi.png",   price: 700 },
  { champion: "Jinx",     slug: "champion-frame-jinx",     imageSrc: "/images/level-frames/Level_Jinx.png",     price: 700 },
  { champion: "Katarina", slug: "champion-frame-katarina", imageSrc: "/images/level-frames/Level_Katarina.png", price: 700 },
  { champion: "Leona",    slug: "champion-frame-leona",    imageSrc: "/images/level-frames/Level_Leona.png",    price: 700 },
  { champion: "Lilia",    slug: "champion-frame-lilia",    imageSrc: "/images/level-frames/Level_Lilia.png",    price: 700 },
  { champion: "Lux",      slug: "champion-frame-lux",      imageSrc: "/images/level-frames/Level_Lux.png",      price: 700 },
  { champion: "Nautilus", slug: "champion-frame-nautilus", imageSrc: "/images/level-frames/Level_Nautilus.png", price: 700 },
  { champion: "Rell",     slug: "champion-frame-rell",     imageSrc: "/images/level-frames/Level_Rell.png",     price: 700 },
  { champion: "Smolder",  slug: "champion-frame-smolder",  imageSrc: "/images/level-frames/Level_Smolder.png",  price: 700 },
  { champion: "Thresh",   slug: "champion-frame-thresh",   imageSrc: "/images/level-frames/Level_Thresh.png",   price: 700 },
  { champion: "Veigar",   slug: "champion-frame-veigar",   imageSrc: "/images/level-frames/Level_Veigar.png",   price: 700 },
  { champion: "Vex",      slug: "champion-frame-vex",      imageSrc: "/images/level-frames/Level_Vex.png",      price: 700 },
  { champion: "Zoe",      slug: "champion-frame-zoe",      imageSrc: "/images/level-frames/Level_Zoe.png",      price: 700 },
];

/** Resolve qualquer slug de moldura (nível ou campeão) para o imageSrc.
 *  Retorna undefined se o slug não for reconhecido ou for nulo. */
export function resolveFrameSrc(slug: string | null | undefined): string | undefined {
  if (!slug || slug === "none") return undefined;
  return (
    LEVEL_FRAMES.find((f) => f.slug === slug)?.imageSrc ??
    CHAMPION_FRAMES.find((f) => f.slug === slug)?.imageSrc
  );
}

export const TIER_INFO: Record<1 | 2 | 3 | 4, { label: string; levels: string; color: string }> = {
  1: { label: "Iniciante",  levels: "Nível 1–100",   color: "#b0a8a4" },
  2: { label: "Veterano",   levels: "Nível 125–250",  color: "#e3b34a" },
  3: { label: "Elite",      levels: "Nível 275–375",  color: "#5b8def" },
  4: { label: "Lendário",   levels: "Nível 400+",     color: "#b25cdb" },
};
