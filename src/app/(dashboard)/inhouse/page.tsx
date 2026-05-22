import { InhouseLobbyBoard } from "@/features/panel/components/inhouse-lobby-board";
import { PanelShell } from "@/features/panel/components/panel-shell";

export default function InhousePage() {
  return (
    <PanelShell showBanner={false}>
      <InhouseLobbyBoard />
    </PanelShell>
  );
}
