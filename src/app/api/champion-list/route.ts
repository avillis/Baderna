import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const versionsRes = await fetch(
      "https://ddragon.leagueoflegends.com/api/versions.json",
      { next: { revalidate: 3600 } },
    );
    const versions = (await versionsRes.json()) as string[];
    const version = versions[0];

    const champRes = await fetch(
      `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`,
      { next: { revalidate: 3600 } },
    );
    const champData = (await champRes.json()) as {
      data: Record<string, { id: string; name: string }>;
    };

    const champions = Object.values(champData.data)
      .map((c) => ({ id: c.id, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ champions }, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch champions" }, { status: 503 });
  }
}
