"use client";

import Link from "next/link";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { PanelShell } from "@/features/panel/components/panel-shell";

/**
 * Erros runtime dentro de qualquer rota do app. Mesmo visual do 404.
 * Mostra o "código" se conseguir extrair (status HTTP, digest, etc).
 */
export default function ErrorPage({
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

  // Tenta extrair um código numérico da mensagem ("respondeu 503") ou da prop status.
  const code =
    error.status ??
    (() => {
      const m = error.message?.match(/\b(4\d\d|5\d\d)\b/);
      return m ? Number(m[1]) : null;
    })();

  return (
    <PanelShell showBanner={false}>
      <section className="-mt-4 -mb-10 flex h-screen w-full flex-col items-center justify-center px-4 text-center sm:-mt-6 xl:-mt-[45px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/gifs/sad-riot.gif"
          alt=""
          className="mb-[18px] h-[180px] w-[180px] object-contain"
        />
        <p className="text-[16px] font-semibold tracking-[-0.02em] text-[#0f0f0f]">
          {code ? `Erro ${code}` : "Algo deu errado"}
        </p>
        <p className="mt-[6px] max-w-[420px] text-[13px] text-[#7c7c7c]">
          Tivemos um problema aqui do nosso lado. Tenta de novo ou volta pra
          home — a galera da Baderna já foi avisada.
        </p>
        <div className="mt-[18px] flex flex-wrap items-center justify-center gap-[8px]">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-[50px] items-center justify-center gap-[6px] rounded-[18px] bg-[#ff4100] px-6 text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90"
          >
            <RotateCcw className="h-[16px] w-[16px]" strokeWidth={2.4} />
            Tentar de novo
          </button>
          <Link
            href="/"
            className="inline-flex h-[50px] items-center justify-center gap-[6px] rounded-[18px] bg-[#0f0f0f] px-6 text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-85"
          >
            <ChevronLeft className="h-[16px] w-[16px]" strokeWidth={2.4} />
            Voltar para o início
          </Link>
        </div>
      </section>
    </PanelShell>
  );
}
