import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PanelShell } from "@/features/panel/components/panel-shell";

export default function ComunidadePage() {
  return (
    <PanelShell showBanner={false}>
      <section className="-mt-4 -mb-10 flex h-screen w-full flex-col items-center justify-center px-4 text-center sm:-mt-6 xl:-mt-[45px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/gifs/akali.gif" alt="" className="mb-[18px] h-[200px] w-[200px] object-contain" />
        <p className="text-[16px] font-semibold tracking-[-0.02em] text-[#0f0f0f]">
          Em construção
        </p>
        <p className="mt-[6px] text-[13px] text-[#7c7c7c]">
          A página de Comunidade ainda está sendo preparada.
        </p>
        <Link
          href="/"
          className="mt-[18px] inline-flex h-[50px] items-center justify-center gap-[6px] rounded-[18px] bg-[#0f0f0f] px-6 text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-85"
        >
          <ChevronLeft className="h-[16px] w-[16px]" strokeWidth={2.4} />
          Voltar para o início
        </Link>
      </section>
    </PanelShell>
  );
}
