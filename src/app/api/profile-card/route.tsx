import { ImageResponse } from "next/og";

export const runtime = "edge";

const W = 1080;
const H = 1080;
const ORANGE = "#ff4100";

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function fetchDataUri(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "image/jpeg";
    return `data:${ct};base64,${toBase64(await res.arrayBuffer())}`;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = (searchParams.get("name") || "Membro").slice(0, 24);
  const full = (searchParams.get("full") || "").slice(0, 40);
  const elo = (searchParams.get("elo") || "Sem classificação").slice(0, 24);
  const pos = (searchParams.get("pos") || "").slice(0, 4);
  const color = searchParams.get("color") || "#0f0f0f";
  const wr = (searchParams.get("wr") || "").slice(0, 4);

  const [font, avatar, banner] = await Promise.all([
    fetch(new URL("./Geist-Regular.ttf", import.meta.url)).then((r) =>
      r.arrayBuffer(),
    ),
    fetchDataUri(searchParams.get("avatar") || ""),
    fetchDataUri(searchParams.get("banner") || ""),
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
          fontFamily: "Geist",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 968,
            background: "#ffffff",
            borderRadius: 56,
            boxShadow: "0 30px 90px rgba(0,0,0,0.10)",
            overflow: "hidden",
          }}
        >
          {/* Banner (splash do campeão) */}
          <div
            style={{
              display: "flex",
              width: "100%",
              height: 392,
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
                height={392}
                style={{ width: 968, height: 392, objectFit: "cover" }}
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
            {/* Avatar com anel laranja, sobrepondo o banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 288,
                height: 288,
                marginTop: -144,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${ORANGE}, #ff8a4c)`,
                border: "10px solid #ffffff",
                boxShadow: "0 14px 40px rgba(0,0,0,0.12)",
              }}
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt=""
                  width={244}
                  height={244}
                  style={{
                    width: 244,
                    height: 244,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    width: 244,
                    height: 244,
                    borderRadius: "50%",
                    background: "#ededed",
                  }}
                />
              )}
            </div>

            <div
              style={{
                display: "flex",
                marginTop: 28,
                fontSize: 72,
                fontWeight: 700,
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

            <div style={{ display: "flex", marginTop: 44, gap: 20 }}>
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
                alignItems: "center",
                marginTop: 48,
                fontSize: 26,
                fontWeight: 700,
                letterSpacing: 5,
                color: ORANGE,
              }}
            >
              BADERNA
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 6,
                fontSize: 22,
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
        { name: "Geist", data: font, weight: 400, style: "normal" },
        { name: "Geist", data: font, weight: 700, style: "normal" },
      ],
    },
  );
}
