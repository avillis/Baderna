// Proxy para a RAWG API (https://rawg.io/apidocs).
// A chave fica server-side — nunca exposta ao cliente.
// Requer RAWG_API_KEY no .env(.local).

import { NextRequest, NextResponse } from "next/server";

const RAWG_KEY = process.env.RAWG_API_KEY ?? "";

export const dynamic = "force-dynamic";

// Tags RAWG que indicam conteúdo adulto/hentai (slug da tag).
const BLOCKED_TAG_SLUGS = new Set([
  "adult",
  "hentai",
  "nsfw",
  "eroge",
  "visual-novel-adult",
  "adult-only",
  "sexual-content",
  "nudity",
  "explicit-sexual-content",
  "18",
  "adults-only",
  "ecchi",
  "erotic",
  "porn",
  "xxx",
]);

// Termos bloqueados no nome do jogo (case-insensitive).
const BLOCKED_NAME_TERMS = [
  "sex",
  "hentai",
  "porn",
  "xxx",
  "erotic",
  "adult",
  "nsfw",
  "nude",
  "naked",
  "ecchi",
  "lewd",
  "bdsm",
];

const blockedNameRe = new RegExp(
  `\\b(${BLOCKED_NAME_TERMS.join("|")})\\b`,
  "i",
);

type RawgTag = { id: number; slug: string; name: string };

type RawgGame = {
  id: number;
  name: string;
  background_image: string | null;
  released: string | null;
  tags?: RawgTag[];
};

function isNsfw(game: RawgGame): boolean {
  if (blockedNameRe.test(game.name)) return true;
  if (game.tags?.some((t) => BLOCKED_TAG_SLUGS.has(t.slug.toLowerCase())))
    return true;
  return false;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  if (!RAWG_KEY) {
    console.warn("[rawg-search] RAWG_API_KEY não configurada.");
    return NextResponse.json(
      { error: "RAWG_API_KEY not configured" },
      { status: 503 },
    );
  }

  const url = new URL("https://api.rawg.io/api/games");
  url.searchParams.set("key", RAWG_KEY);
  url.searchParams.set("search", q);
  // Pedimos mais resultados para compensar os que serão filtrados.
  url.searchParams.set("page_size", "24");
  url.searchParams.set("search_precise", "true");
  url.searchParams.set("ordering", "-rating");

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // cache por 1h
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `RAWG retornou ${res.status}` },
        { status: res.status },
      );
    }

    const data = (await res.json()) as { results?: RawgGame[] };

    const results = (data.results ?? [])
      .filter((g) => !isNsfw(g))
      .slice(0, 12)
      .map((g) => ({
        id: g.id,
        name: g.name,
        cover: g.background_image ?? null,
        year: g.released?.slice(0, 4) ?? null,
      }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[rawg-search]", err);
    return NextResponse.json({ error: "Erro de rede" }, { status: 502 });
  }
}
