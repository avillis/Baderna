import { InhouseDetailClient } from "@/features/panel/components/inhouse-detail-client";
import { PanelShell } from "@/features/panel/components/panel-shell";

export default async function InhouseDetailPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  return (
    <PanelShell showBanner={false}>
      <InhouseDetailClient matchId={matchId} />
    </PanelShell>
  );
}
