import { PanelShell } from "@/features/panel/components/panel-shell";
import { ListaFlexClient } from "@/features/panel/components/lista-flex-client";

export default function ListaFlexPage() {
  return (
    <PanelShell showBanner={false}>
      <ListaFlexClient />
    </PanelShell>
  );
}
