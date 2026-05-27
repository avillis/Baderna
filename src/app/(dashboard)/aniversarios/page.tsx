import { PanelShell } from "@/features/panel/components/panel-shell";
import { AniversariosClient } from "@/features/panel/components/aniversarios-client";

export const metadata = { title: "Aniversários · Baderna" };

export default function AniversariosPage() {
  return (
    <PanelShell showBanner={false}>
      <AniversariosClient />
    </PanelShell>
  );
}
