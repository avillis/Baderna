export type LevelFrame = {
  level: number;
  slug: string;
  imageSrc: string;
  price: number;
  tier: 1 | 2 | 3 | 4;
};

// Pricing per frame (sequential, not per level number):
// Tier 1 (1–100):   +50 each  → 50, 100, 150, 200, 250
// Tier 2 (125–250): +100 each → 350, 450, 550, 650, 750, 850
// Tier 3 (275–375): +120 each → 970, 1090, 1210, 1330, 1450
// Tier 4 (400+):    +200 each → 400=1650 (missing), 425=1850, 450=2050, 475=2250, 500=2450
export const LEVEL_FRAMES: LevelFrame[] = [
  { level: 1,   slug: "level-frame-1",   imageSrc: "/images/level-frames/Level_1_Summoner_Icon_Border.png",   price: 50,   tier: 1 },
  { level: 30,  slug: "level-frame-30",  imageSrc: "/images/level-frames/Level_30_Summoner_Icon_Border.png",  price: 100,  tier: 1 },
  { level: 50,  slug: "level-frame-50",  imageSrc: "/images/level-frames/Level_50_Summoner_Icon_Border.png",  price: 150,  tier: 1 },
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
];

export const TIER_INFO: Record<1 | 2 | 3 | 4, { label: string; levels: string; color: string }> = {
  1: { label: "Iniciante",  levels: "Nível 1–100",   color: "#b0a8a4" },
  2: { label: "Veterano",   levels: "Nível 125–250",  color: "#e3b34a" },
  3: { label: "Elite",      levels: "Nível 275–375",  color: "#5b8def" },
  4: { label: "Lendário",   levels: "Nível 400+",     color: "#b25cdb" },
};
