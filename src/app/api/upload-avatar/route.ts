import { NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);
const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const ownerRaw = form.get("owner");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo ausente." }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: "Tipo de arquivo não suportado." },
        { status: 415 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Arquivo maior que 5 MB." },
        { status: 413 },
      );
    }

    const owner = typeof ownerRaw === "string" && ownerRaw.trim()
      ? ownerRaw.trim().replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 32)
      : "guest";
    const ext = MIME_TO_EXT[file.type] ?? "png";
    const filename = `${owner}-${Date.now()}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), buffer);

    return NextResponse.json({ url: `/uploads/avatars/${filename}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha no upload.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
