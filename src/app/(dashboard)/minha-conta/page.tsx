import { PanelShell } from "@/features/panel/components/panel-shell";
import { MinhaContaClient } from "@/features/panel/components/minha-conta-client";
import { getSplashCatalog } from "@/features/panel/splash-catalog";
import { NAME_STYLES } from "@/features/panel/names-data";

export default async function MinhaContaPage() {
  const splashGroups = await getSplashCatalog();
  const bannersTotal = splashGroups.reduce(
    (sum, group) => sum + group.variants.length,
    0,
  );
  return (
    <PanelShell showBanner={false}>
      <MinhaContaClient bannersTotal={bannersTotal} namesTotal={NAME_STYLES.length} />
    </PanelShell>
  );
}
