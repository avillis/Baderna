import { readFile } from "node:fs/promises";
import path from "node:path";

const PROCESSED_ROOT = path.join(
  process.cwd(),
  "campeões",
  "splash_processed",
);
const LEGACY_DIRECTORY = path.join(
  process.cwd(),
  "campeões",
  "img",
  "champion",
  "splash",
);

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const ALLOWED_SIZES = new Set(["full", "thumb"]);

export const dynamic = "force-dynamic";

function resolveSafe(baseDir: string, fileName: string): string | null {
  const resolvedDir = path.resolve(baseDir);
  const resolvedFile = path.resolve(path.join(baseDir, fileName));
  if (!resolvedFile.startsWith(`${resolvedDir}${path.sep}`)) return null;
  return resolvedFile;
}

async function tryRead(filePath: string | null) {
  if (!filePath) return null;
  try {
    return await readFile(filePath);
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  context: RouteContext<"/api/champion-splash/[fileName]">,
) {
  const { fileName } = await context.params;
  const url = new URL(request.url);
  const size = url.searchParams.get("size") ?? "full";

  if (!ALLOWED_SIZES.has(size)) {
    return new Response("Tamanho inválido.", { status: 400 });
  }
  if (!/^[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$/i.test(fileName)) {
    return new Response("Arquivo inválido.", { status: 400 });
  }

  // 1) Look in the processed (new) folder for the requested size.
  const processedPath = resolveSafe(path.join(PROCESSED_ROOT, size), fileName);
  let buffer = await tryRead(processedPath);

  // 2) Fall back to the legacy /img/champion/splash/ folder.
  //    Lets old "Champion_0.jpg" URLs keep working for things like the
  //    featured-champion card while we still benefit from processed thumbs
  //    elsewhere.
  if (!buffer) {
    const legacyPath = resolveSafe(LEGACY_DIRECTORY, fileName);
    buffer = await tryRead(legacyPath);
  }

  if (!buffer) {
    return new Response("Splash não encontrada.", { status: 404 });
  }

  const extension = path.extname(fileName).toLowerCase();
  return new Response(buffer, {
    headers: {
      "Content-Type": MIME_TYPES[extension] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": "inline",
    },
  });
}
