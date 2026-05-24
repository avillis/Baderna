import { ImageResponse } from "next/og";

export const runtime = "edge";

const W = 1080;
const H = 1080;
const ORANGE = "#ff4100";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = (searchParams.get("name") || "Membro").slice(0, 24);
  const full = (searchParams.get("full") || "").slice(0, 40);
  const elo = (searchParams.get("elo") || "Sem classificação").slice(0, 24);
  const pos = (searchParams.get("pos") || "").slice(0, 4);
  const avatar = searchParams.get("avatar") || "";
  const color = searchParams.get("color") || "#ffffff";
  const wr = (searchParams.get("wr") || "").slice(0, 4);

  const font = await fetch(
    new URL("./Geist-Regular.ttf", import.meta.url),
  ).then((r) => r.arrayBuffer());

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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 50% 28%, #241a14 0%, #0f0f0f 62%)",
          padding: "72px",
          fontFamily: "Geist",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 6,
            color: ORANGE,
            marginBottom: 56,
          }}
        >
          BADERNA
        </div>

        <div
          style={{
            display: "flex",
            width: 372,
            height: 372,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${ORANGE}, #ff8a4c)`,
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 80px ${ORANGE}55`,
          }}
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              width={344}
              height={344}
              style={{
                width: 344,
                height: 344,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                width: 344,
                height: 344,
                borderRadius: "50%",
                background: "#ededed",
              }}
            />
          )}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 44,
            fontSize: 76,
            fontWeight: 700,
            color,
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          {name}
        </div>

        {full ? (
          <div
            style={{
              display: "flex",
              marginTop: 8,
              fontSize: 30,
              color: "#9a9a9a",
            }}
          >
            {full}
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            marginTop: 56,
            gap: 24,
          }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "#ffffff0d",
                border: "1px solid #ffffff1a",
                borderRadius: 28,
                padding: "26px 34px",
                minWidth: 220,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  letterSpacing: 3,
                  color: "#8d8d8d",
                  marginBottom: 10,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 44,
                  fontWeight: 700,
                  color: "#ffffff",
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
            marginTop: 64,
            fontSize: 28,
            color: "#7c7c7c",
          }}
        >
          bdrn.com.br
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
