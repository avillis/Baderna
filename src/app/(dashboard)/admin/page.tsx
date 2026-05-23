import { PanelShell } from "@/features/panel/components/panel-shell";
import { MembersTable } from "@/app/(dashboard)/admin/members-table";
import { AdminGuard } from "@/app/(dashboard)/admin/admin-guard";
import { AdminCoinRewardsCard } from "@/features/panel/components/admin-coin-rewards-card";
import { AdminEmailsCard } from "@/features/panel/components/admin-emails-card";
import { AdminErrorLogsCard } from "@/features/panel/components/admin-error-logs-card";
import { AdminInhousePointsCard } from "@/features/panel/components/admin-inhouse-points-card";
import { AdminIntegrationsCard } from "@/features/panel/components/admin-integrations-card";
import { CreateTitleModal } from "@/features/panel/components/create-title-modal";
import { InhouseCreatorModal } from "@/features/panel/components/inhouse-creator-modal";

export default function AdminPage() {
  return (
    <PanelShell showBanner={false}>
      <AdminGuard>
        <div className="flex flex-col gap-6 pt-[1.5vh] sm:pt-[6vh] xl:flex-row xl:items-start">

          {/* Mobile-only: ações no topo, antes da tabela de membros */}
          <aside className="flex flex-col gap-3 rounded-[var(--panel-radius-card)] bg-white p-4 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] xl:hidden">
            <InhouseCreatorModal />
            <CreateTitleModal />
          </aside>

          {/* Coluna esquerda — membros, emails, logs */}
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <MembersTable />
            <AdminEmailsCard />
            <AdminErrorLogsCard />
          </div>

          {/* Coluna direita — ações + cards de config (desktop) */}
          <div className="flex w-full flex-col gap-6 xl:w-[320px]">
            <aside className="hidden flex-col gap-3 rounded-[var(--panel-radius-card)] bg-white p-4 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] xl:flex">
              <InhouseCreatorModal />
              <CreateTitleModal />
            </aside>

            <AdminIntegrationsCard />
            <AdminCoinRewardsCard />
            <AdminInhousePointsCard />
          </div>

        </div>
      </AdminGuard>
    </PanelShell>
  );
}
