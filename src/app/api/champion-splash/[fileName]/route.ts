// Strategy:
//   - Files like "Akali_0.jpg" (numbered → Data Dragon original/canonical skins)
//     → redirect to Data Dragon CDN (livre, oficial Riot)
//   - Files like "Akali_BloodMoon.webp" (named skins, custom catalog)
//     → redirect to Hostinger storage onde os splashes processados moram

const DDRAGON_SPLASH = "https://ddragon.leagueoflegends.com/cdn/img/champion/splash";
const DDRAGON_LOADING = "https://ddragon.leagueoflegends.com/cdn/img/champion/loading";
const HOSTINGER_BASE =
  "https://api.bdrn.com.br/storage/campeoes/splash_processed";

const ALLOWED_SIZES = new Set(["full", "thumb"]);

export const dynamic = "force-dynamic";

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

  const noExt = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, "");

  // Numerados (Akali_0, Akali_1 etc) → Data Dragon
  if (/^[A-Za-z0-9]+_\d+$/.test(noExt)) {
    const base = size === "thumb" ? DDRAGON_LOADING : DDRAGON_SPLASH;
    return Response.redirect(`${base}/${noExt}.jpg`, 302);
  }

  // Skins nomeadas (Akali_BloodMoon, Garen_Original, etc) → Hostinger
  return Response.redirect(`${HOSTINGER_BASE}/${size}/${fileName}`, 302);
}
