// Processes the 8K splash arts from campeões/splash_arts into web-friendly
// WebP files at two sizes (full HD + thumbnail). Renames files like
// "Aatrox_OriginalSkin_HD.jpg" → "Aatrox_Original.webp".
//
// Run with: node scripts/process-splashes.mjs

import { readdir, mkdir, stat, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(path.join(import.meta.dirname, ".."));
const SRC_DIR = path.join(ROOT, "campeões", "splash_arts");
const OUT_DIR = path.join(ROOT, "campeões", "splash_processed");
const OUT_FULL = path.join(OUT_DIR, "full");
const OUT_THUMB = path.join(OUT_DIR, "thumb");

const FULL_WIDTH = 1920;
const THUMB_WIDTH = 480;
const FULL_QUALITY = 82;
const THUMB_QUALITY = 78;

const args = new Set(process.argv.slice(2));
const FORCE = args.has("--force");

function targetFileName(inputFileName) {
  // Maps source filenames into the catalog's `Champion_Skin.webp` shape.
  //   "Aatrox_OriginalSkin_HD.jpg"          → "Aatrox_Original.webp"
  //   "Aatrox_OriginalSkin_old_HD.jpg"      → "Aatrox_OriginalOld.webp"
  //   "Aatrox_OriginalSkin_old2_HD.jpg"     → "Aatrox_OriginalOld2.webp"
  //   "Ahri_OriginalSkin_Ch_HD.jpg"         → "Ahri_OriginalCh.webp"
  //   "Akali_CrimsonSkin_Ch_old_HD.jpg"     → "Akali_CrimsonChOld.webp"
  //   "AcademySkin_HD.jpg"                  → "Academy.webp"
  const noExt = inputFileName.replace(/\.(jpg|jpeg|png|webp)$/i, "");
  const noHd = noExt.replace(/_HD$/i, "");
  // Match the literal word "Skin" followed by zero or more "_tokens" up to
  // end-of-string. Capitalise + concatenate the tokens so the catalog still
  // sees one cohesive skin name.
  const collapsed = noHd.replace(/Skin((?:_[A-Za-z0-9]+)+)?$/, (_match, tail) => {
    if (!tail) return "";
    return tail
      .split("_")
      .filter(Boolean)
      .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
      .join("");
  });
  return `${collapsed}.webp`;
}

async function ensureDirs() {
  await mkdir(OUT_FULL, { recursive: true });
  await mkdir(OUT_THUMB, { recursive: true });
}

async function listSourceFiles() {
  // Recurse so we also pick up A/Old, A/Tencent, SHARED/Old, etc.
  const out = [];
  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (/\.(jpe?g|png|webp)$/i.test(entry.name)) {
        out.push(full);
      }
    }
  }
  await walk(SRC_DIR);
  return out;
}

async function processOne(srcPath) {
  const fileName = path.basename(srcPath);
  const outName = targetFileName(fileName);
  const fullOut = path.join(OUT_FULL, outName);
  const thumbOut = path.join(OUT_THUMB, outName);

  const skipFull = !FORCE && existsSync(fullOut);
  const skipThumb = !FORCE && existsSync(thumbOut);
  if (skipFull && skipThumb) {
    return { outName, skipped: true };
  }

  const input = await readFile(srcPath);

  if (!skipFull) {
    await sharp(input)
      .resize({ width: FULL_WIDTH, withoutEnlargement: true })
      .webp({ quality: FULL_QUALITY, effort: 4 })
      .toFile(fullOut);
  }
  if (!skipThumb) {
    await sharp(input)
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY, effort: 4 })
      .toFile(thumbOut);
  }
  return { outName, skipped: false };
}

async function main() {
  await ensureDirs();
  const files = await listSourceFiles();
  console.log(`Found ${files.length} source images.`);

  let done = 0;
  let skipped = 0;
  const start = Date.now();
  const concurrency = 4;
  let cursor = 0;

  async function worker(id) {
    while (cursor < files.length) {
      const i = cursor++;
      const file = files[i];
      try {
        const r = await processOne(file);
        if (r.skipped) skipped++;
        done++;
        if (done % 50 === 0 || done === files.length) {
          const elapsed = ((Date.now() - start) / 1000).toFixed(1);
          console.log(`  ${done}/${files.length} (${elapsed}s)`);
        }
      } catch (err) {
        console.warn(`! Failed: ${path.basename(file)} — ${err.message}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: concurrency }, (_, i) => worker(i)),
  );

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`Done. ${done} processed (${skipped} skipped) in ${elapsed}s`);

  const fullStats = await readdir(OUT_FULL);
  const thumbStats = await readdir(OUT_THUMB);
  console.log(`Full: ${fullStats.length} files  Thumb: ${thumbStats.length} files`);

  let fullSize = 0;
  let thumbSize = 0;
  for (const f of fullStats) {
    fullSize += (await stat(path.join(OUT_FULL, f))).size;
  }
  for (const f of thumbStats) {
    thumbSize += (await stat(path.join(OUT_THUMB, f))).size;
  }
  console.log(
    `Output sizes — Full: ${(fullSize / 1e9).toFixed(2)} GB, Thumb: ${(thumbSize / 1e6).toFixed(0)} MB`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
