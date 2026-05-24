import { ImageResponse } from "next/og";

export const runtime = "edge";

const W = 1080;
const H = 1080;
const ORANGE = "#ff4100";

const AVATAR_BOX = 300;
// Mesma proporção do RankedAvatar (avatarInset 21 / size 156, frameScale 2.72,
// frameOffsetY -40 / 156) aplicada na escala do cartão.
const AVATAR_INSET = Math.round((21 / 156) * AVATAR_BOX);
const FRAME_OFFSET_Y = Math.round((-40 / 156) * AVATAR_BOX);
const FRAME_SCALE = 2.72;

const RANK_TYPES = new Set([
  "iron",
  "bronze",
  "silver",
  "gold",
  "platinum",
  "diamond",
  "master",
  "grandmaster",
  "challenger",
]);

// Resolve a URL final da imagem (seguindo redirects) — nossas rotas de
// splash/tile fazem 302 pro CDN, e o Satori tropeça no proxy. Devolvendo a
// URL final (ddragon/hostinger) o Satori busca direto. "" se falhar → fallback.
async function resolveImage(u: string): Promise<string> {
  if (!u) return "";
  try {
    const r = await fetch(u);
    if (r.ok && (r.headers.get("content-type") || "").startsWith("image")) {
      return r.url;
    }
  } catch {
    /* ignora */
  }
  return "";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;
  const origin = url.origin;

  const name = (sp.get("name") || "Membro").slice(0, 24);
  const full = (sp.get("full") || "").slice(0, 40);
  const elo = (sp.get("elo") || "Sem classificação").slice(0, 24);
  const pos = (sp.get("pos") || "").slice(0, 4);
  const color = sp.get("color") || "#0f0f0f";
  const wr = (sp.get("wr") || "").slice(0, 4);
  const rankType = (sp.get("rankType") || "").toLowerCase();
  const frameUrl = RANK_TYPES.has(rankType)
    ? `${origin}/images/rank-frames/${rankType}.png`
    : "";

  // O splash em tamanho "full" é grande demais e o Satori não rasteriza —
  // usamos a versão "thumb" (bem menor), que renderiza de boa.
  const bannerParam = (sp.get("banner") || "").replace("size=full", "size=thumb");

  const [fontReg, fontBold, avatar, banner, frame, logo] = await Promise.all([
    fetch(new URL("./Inter-Regular.ttf", import.meta.url)).then((r) =>
      r.arrayBuffer(),
    ),
    fetch(new URL("./Inter-Bold.ttf", import.meta.url)).then((r) =>
      r.arrayBuffer(),
    ),
    resolveImage(sp.get("avatar") || ""),
    resolveImage(bannerParam),
    resolveImage(frameUrl),
    resolveImage(`${origin}/logo.png`),
  ]);

  const stats: { label: string; value: string }[] = [];
  if (pos) stats.push({ label: "POSIÇÃO", value: `#${pos}` });
  stats.push({ label: "ELO", value: elo });
  if (wr) stats.push({ label: "WINRATE", value: `${wr}%` });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f7f7",
          padding: 56,
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            width: 968,
            background: "#ffffff",
            borderRadius: 56,
            boxShadow: "0 30px 90px rgba(0,0,0,0.10)",
            overflow: "hidden",
          }}
        >
          {/* Logo (branca) no canto superior esquerdo, sobre o banner */}
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt=""
              width={84}
              height={84}
              style={{
                position: "absolute",
                top: 36,
                left: 40,
                width: 84,
                height: 84,
                objectFit: "contain",
              }}
            />
          ) : null}

          {/* Banner (splash do campeão) */}
          <div
            style={{
              display: "flex",
              width: "100%",
              height: 360,
              background: banner
                ? "#ededed"
                : `linear-gradient(135deg, ${ORANGE}, #ff8a4c)`,
            }}
          >
            {banner ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={banner}
                alt=""
                width={968}
                height={360}
                style={{ width: 968, height: 360, objectFit: "cover" }}
              />
            ) : null}
          </div>

          {/* Conteúdo */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "0 56px 56px",
            }}
          >
            {/* Avatar com moldura de rank, sobrepondo o banner */}
            <div
              style={{
                position: "relative",
                display: "flex",
                width: AVATAR_BOX,
                height: AVATAR_BOX,
                marginTop: -150,
              }}
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt=""
                  style={{
                    position: "absolute",
                    top: AVATAR_INSET,
                    left: AVATAR_INSET,
                    width: AVATAR_BOX - AVATAR_INSET * 2,
                    height: AVATAR_BOX - AVATAR_INSET * 2,
                    borderRadius: "50%",
                    objectFit: "cover",
                    background: "#ededed",
                  }}
                />
              ) : (
                <div
                  style={{
                    position: "absolute",
                    top: AVATAR_INSET,
                    left: AVATAR_INSET,
                    width: AVATAR_BOX - AVATAR_INSET * 2,
                    height: AVATAR_BOX - AVATAR_INSET * 2,
                    borderRadius: "50%",
                    background: "#ededed",
                    display: "flex",
                  }}
                />
              )}
              {frame ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={frame}
                  alt=""
                  width={AVATAR_BOX}
                  height={AVATAR_BOX}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: AVATAR_BOX,
                    height: AVATAR_BOX,
                    objectFit: "contain",
                    transform: `translateY(${FRAME_OFFSET_Y}px) scale(${FRAME_SCALE})`,
                  }}
                />
              ) : null}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 24,
                fontSize: 72,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color,
                textAlign: "center",
                maxWidth: 820,
              }}
            >
              {name}
            </div>

            {full ? (
              <div
                style={{
                  display: "flex",
                  marginTop: 6,
                  fontSize: 30,
                  color: "#989898",
                }}
              >
                {full}
              </div>
            ) : null}

            <div style={{ display: "flex", marginTop: 40, gap: 20 }}>
              {stats.map((s) => (
                <div
                  key={s.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f2f2f2",
                    borderRadius: 26,
                    padding: "24px 32px",
                    minWidth: 210,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      fontSize: 21,
                      letterSpacing: 2,
                      color: "#8d8d8d",
                      marginBottom: 10,
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      fontSize: 42,
                      fontWeight: 700,
                      color: "#0f0f0f",
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 44,
                fontSize: 24,
                color: "#b0b0b0",
              }}
            >
              bdrn.com.br
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: "Inter", data: fontReg, weight: 400, style: "normal" },
        { name: "Inter", data: fontBold, weight: 700, style: "normal" },
      ],
    },
  );
}
