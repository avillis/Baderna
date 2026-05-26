/**
 * Overrides pra IDs internos da Riot que não viram nome de display via
 * camelCase → espaço. "MonkeyKing" é o id interno do Wukong (legado de
 * antes do rework); os outros têm apóstrofo que o split não cobre.
 */
const CHAMPION_NAME_OVERRIDES: Record<string, string> = {
  MonkeyKing: "Wukong",
  Belveth: "Bel'Veth",
  Chogath: "Cho'Gath",
  Khazix: "Kha'Zix",
  KogMaw: "Kog'Maw",
  Kaisa: "Kai'Sa",
  Velkoz: "Vel'Koz",
  Reksai: "Rek'Sai",
  LeBlanc: "LeBlanc",
  Nunu: "Nunu & Willump",
  DrMundo: "Dr. Mundo",
  // Renomeio recente (RenataGlasc é a key normal, mas formal é "Renata Glasc")
};

/**
 * Converte o slug/key da Riot em nome legível.
 * "AurelionSol" → "Aurelion Sol"
 * "MissFortune" → "Miss Fortune"
 * "RenataGlasc" → "Renata Glasc"
 * "JarvanIV"    → "Jarvan IV"   (já tem maiúscula em "I")
 * "MonkeyKing"  → "Wukong"      (override)
 * "Khazix"      → "Kha'Zix"     (override)
 */
export function formatChampionName(slug: string): string {
  if (!slug) return slug;
  if (CHAMPION_NAME_OVERRIDES[slug]) return CHAMPION_NAME_OVERRIDES[slug];
  // Insere espaço antes de cada maiúscula que vem após uma minúscula.
  return slug.replace(/([a-z])([A-Z])/g, "$1 $2");
}
