// Redireciona pra Data Dragon — CDN oficial da Riot, gratuito.
// "full" → splash art completa, "thumb" → loading screen (menor).

const DDRAGON_SPLASH = "https://ddragon.leagueoflegends.com/cdn/img/champion/splash";
const DDRAGON_LOADING = "https://ddragon.leagueoflegends.com/cdn/img/champion/loading";

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

  // Data Dragon só tem .jpg pra splash/loading. Normaliza:
  //   - "Garen_Original.webp" → "Garen_0.jpg" (Original = skin index 0)
  //   - "Garen_BloodMoon.webp" → "Garen_0.jpg" (sem mapping de skin nome→id, cai no 0)
  //   - "Garen_0.jpg" → "Garen_0.jpg" (passa direto)
  const noExt = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, "");
  const ddragonName = /^[A-Za-z0-9]+_\d+$/.test(noExt)
    ? `${noExt}.jpg`
    : `${noExt.split("_")[0]}_0.jpg`;
  const base = size === "thumb" ? DDRAGON_LOADING : DDRAGON_SPLASH;

  return Response.redirect(`${base}/${ddragonName}`, 302);
}
