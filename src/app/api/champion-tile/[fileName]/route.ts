// Redireciona pra Data Dragon — CDN oficial da Riot, gratuito.
// Antes liamos as imagens do filesystem (`campeões/img/champion/tiles/`),
// mas isso explodiu o bundle em prod. DDragon serve as mesmas imagens.

const DDRAGON_TILES = "https://ddragon.leagueoflegends.com/cdn/img/champion/tiles";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/champion-tile/[fileName]">,
) {
  const { fileName } = await context.params;

  if (!/^[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(fileName)) {
    return new Response("Arquivo invalido.", { status: 400 });
  }

  return Response.redirect(`${DDRAGON_TILES}/${fileName}`, 302);
}
