import { PanelShell } from "@/features/panel/components/panel-shell";

export default function FeedPage() {
  return (
    <PanelShell showBanner={false}>
      <section className="-mt-4 -mb-10 flex h-screen w-full flex-col items-center justify-center px-4 text-center sm:-mt-6 xl:-mt-[45px] xl:pr-[45px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/gifs/alistar.gif"
          alt=""
          className="mb-[2px] h-[260px] w-[260px] object-contain"
        />
        <p className="text-[16px] font-semibold tracking-[-0.02em] text-[#0f0f0f]">
          Nenhum post por aqui ainda.
        </p>
        <p className="mt-[6px] text-[13px] text-[#7c7c7c]">
          Em breve você vai poder compartilhar plays, prints e babação de ovo do João.
        </p>
      </section>
    </PanelShell>
  );
}
