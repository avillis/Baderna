// Baixa as tiles dos campeões que faltam do Data Dragon.
// Run: node scripts/download-missing-tiles.mjs
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.join(import.meta.dirname, ".."));
const OUT_DIR = path.join(ROOT, "campeões", "img", "champion", "tiles");

const MISSING = [
  "Akshan","Ambessa","Aurora","Belveth","Briar","Fiddlesticks","Gwen","Hwei",
  "KSante","Lillia","Mel","Milio","Naafiri","Nilah","Rell","Renata","Samira",
  "Seraphine","Smolder","Vex","Viego","Yone","Yunara","Zaahen","Zeri",
];

const TILE_URL = (champ) =>
  `https://ddragon.leagueoflegends.com/cdn/img/champion/tiles/${champ}_0.jpg`;

await mkdir(OUT_DIR, { recursive: true });

let ok = 0, miss = 0;
for (const champ of MISSING) {
  const out = path.join(OUT_DIR, `${champ}_0.jpg`);
  if (existsSync(out)) { console.log(`= ${champ} (já existe)`); continue; }
  const res = await fetch(TILE_URL(champ));
  if (!res.ok) {
    console.log(`✗ ${champ} (${res.status})`);
    miss++;
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(out, buf);
  console.log(`✓ ${champ} (${Math.round(buf.length / 1024)}kb)`);
  ok++;
}
console.log(`\nDone — ${ok} baixados, ${miss} falharam.`);
