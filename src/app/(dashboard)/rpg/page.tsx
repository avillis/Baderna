import { PanelShell } from "@/features/panel/components/panel-shell";

export default function RPGPage() {
  return (
    <PanelShell showBanner={false}>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 pt-[1.5vh] text-center sm:pt-[6vh]">
        <h1 className="text-[32px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
          RPG
        </h1>
        <p className="max-w-[420px] text-[14px] leading-[1.5] text-[#7c7c7c]">
          Em breve. Aqui vai rolar o sistema de RPG da Baderna.
        </p>
      </div>
    </PanelShell>
  );
}
