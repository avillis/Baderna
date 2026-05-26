/**
 * Converte o slug/key da Riot em nome legível.
 * "AurelionSol" → "Aurelion Sol"
 * "MissFortune" → "Miss Fortune"
 * "RenataGlasc" → "Renata Glasc"
 * "JarvanIV"    → "Jarvan IV"   (já tem maiúscula em "I")
 */
export function formatChampionName(slug: string): string {
  if (!slug) return slug;
  // Insere espaço antes de cada maiúscula que vem após uma minúscula.
  return slug.replace(/([a-z])([A-Z])/g, "$1 $2");
}
