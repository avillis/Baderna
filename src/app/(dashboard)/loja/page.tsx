import { CapasBoard } from "@/features/panel/components/capas-board";
import { PanelShell } from "@/features/panel/components/panel-shell";
import { getSplashCatalog } from "@/features/panel/splash-catalog";

export default async function LojaPage() {
  const splashGroups = await getSplashCatalog();
  const allBanners = splashGroups.flatMap((group) =>
    group.variants.map((v) => v.fileName),
  );

  return (
    <PanelShell showBanner={false} bgClassName="bg-[#f7f7f7]">
      <CapasBoard pool={allBanners} />
    </PanelShell>
  );
}
