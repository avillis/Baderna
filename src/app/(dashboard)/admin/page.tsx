import { PanelShell } from "@/features/panel/components/panel-shell";
import { MembersTable } from "@/app/(dashboard)/admin/members-table";
import { AdminGuard } from "@/app/(dashboard)/admin/admin-guard";
import { AdminCoinRewardsCard } from "@/features/panel/components/admin-coin-rewards-card";
import { AdminErrorLogsCard } from "@/features/panel/components/admin-error-logs-card";
import { AdminInhousePointsCard } from "@/features/panel/components/admin-inhouse-points-card";
import { AdminIntegrationsCard } from "@/features/panel/components/admin-integrations-card";
import { CreateTitleModal } from "@/features/panel/components/create-title-modal";
import { InhouseCreatorModal } from "@/features/panel/components/inhouse-creator-modal";

export default function AdminPage() {
  return (
    <PanelShell showBanner={false}>
      <AdminGuard>
        <div className="flex flex-col gap-6 pt-[1.5vh] sm:pt-[6vh]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start">

            <MembersTable />

            <div className="flex w-full flex-col gap-6 xl:w-[320px]">
              {/* Ações em destaque no topo */}
              <aside className="flex flex-col gap-3 rounded-[var(--panel-radius-card)] bg-white p-4 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
                <InhouseCreatorModal />
                <CreateTitleModal />
              </aside>

              <AdminIntegrationsCard />
              <AdminCoinRewardsCard />
              <AdminInhousePointsCard />
            </div>

          </div>

          {/* Logs ocupam linha inteira abaixo */}
          <AdminErrorLogsCard />
        </div>
      </AdminGuard>
    </PanelShell>
  );
}
