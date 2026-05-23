import { PanelShell } from "@/features/panel/components/panel-shell";

export default function RPGPage() {
  return (
    <PanelShell showBanner={false}>
      <section className="-mt-4 -mb-10 flex h-screen w-full flex-col items-center justify-center px-4 text-center sm:-mt-6 xl:-mt-[45px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/gifs/braum2.gif"
          alt=""
          className="mb-[18px] h-[260px] w-[260px] object-contain"
        />
        <p className="text-[16px] font-semibold tracking-[-0.02em] text-[#0f0f0f]">
          Tem coisa boa vindo ai...
        </p>
        <p className="mt-[6px] text-[13px] text-[#7c7c7c]">
          Em breve. Aqui vai rolar o sistema de RPG da Baderna.
        </p>
      </section>
    </PanelShell>
  );
}
