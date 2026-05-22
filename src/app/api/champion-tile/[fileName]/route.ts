import { readFile } from "node:fs/promises";
import path from "node:path";

const TILE_DIRECTORY = path.join(
  process.cwd(),
  "campeões",
  "img",
  "champion",
  "tiles",
);

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/champion-tile/[fileName]">,
) {
  const { fileName } = await context.params;

  if (!/^[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(fileName)) {
    return new Response("Arquivo invalido.", { status: 400 });
  }

  const resolvedDirectory = path.resolve(TILE_DIRECTORY);
  const resolvedFile = path.resolve(path.join(TILE_DIRECTORY, fileName));

  if (!resolvedFile.startsWith(`${resolvedDirectory}${path.sep}`)) {
    return new Response("Arquivo invalido.", { status: 400 });
  }

  try {
    const buffer = await readFile(resolvedFile);
    const extension = path.extname(fileName).toLowerCase();

    return new Response(buffer, {
      headers: {
        "Content-Type": MIME_TYPES[extension] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return new Response("Tile nao encontrado.", { status: 404 });
  }
}
