"use client";

import { ChevronLeft, RotateCcw } from "lucide-react";
import { useEffect } from "react";

/**
 * Erro catastrófico no root layout — não consegue usar nada do app shell.
 * Versão minimalista do error.tsx, mesmo visual, sem PanelShell.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string; status?: number };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  const code =
    error.status ??
    (() => {
      const m = error.message?.match(/\b(4\d\d|5\d\d)\b/);
      return m ? Number(m[1]) : null;
    })();

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#f7f7f7",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "16px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gifs/sad-riot.gif"
            alt=""
            style={{
              height: 180,
              width: 180,
              objectFit: "contain",
              marginBottom: 18,
            }}
          />
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#0f0f0f",
              margin: 0,
            }}
          >
            {code ? `Erro ${code}` : "Algo deu errado"}
          </p>
          <p
            style={{
              marginTop: 6,
              fontSize: 13,
              color: "#7c7c7c",
              maxWidth: 420,
            }}
          >
            Tivemos um problema aqui do nosso lado. Tenta de novo ou volta pra
            home — a galera da Baderna já foi avisada.
          </p>
          <div
            style={{
              marginTop: 18,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 50,
                padding: "0 24px",
                borderRadius: 18,
                border: "none",
                cursor: "pointer",
                background: "#ff4100",
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              <RotateCcw size={16} strokeWidth={2.4} />
              Tentar de novo
            </button>
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                height: 50,
                padding: "0 24px",
                borderRadius: 18,
                background: "#0f0f0f",
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                textDecoration: "none",
              }}
            >
              <ChevronLeft size={16} strokeWidth={2.4} />
              Voltar para o início
            </a>
          </div>
        </section>
      </body>
    </html>
  );
}
