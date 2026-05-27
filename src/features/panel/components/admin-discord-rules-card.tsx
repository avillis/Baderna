"use client";

import { useState } from "react";

import { authToken } from "@/features/panel/use-auth";
import { useToast } from "@/components/toast";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export function AdminDiscordRulesCard() {
  const [syncing, setSyncing] = useState(false);
  const toast = useToast();

  async function handleSync() {
    if (syncing) return;
    setSyncing(true);
    try {
      const token = authToken();
      if (!token) { toast.show("Sem autenticação."); return; }

      const res = await fetch(`${API_BASE}/admin/sync-rules-discord`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.show(err.error ?? "Erro ao sincronizar.");
        return;
      }

      toast.show("Regras sincronizadas no Discord!", "success");
    } catch {
      toast.show("Erro de conexão.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <aside className="rounded-[var(--panel-radius-card)] bg-white p-6 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <div className="mb-4 flex items-center gap-2">
        {/* ícone Discord */}
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 fill-[#5865F2]">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
        </svg>
        <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
          Discord
        </h2>
      </div>

      <p className="mb-4 text-[12px] leading-[1.5] text-[#9a9a9a]">
        Posta (ou edita) as regras da Baderna no canal{" "}
        <span className="font-semibold text-[#5865F2]">#regras</span> do Discord.
        Clique sempre que atualizar as regras no site.
      </p>

      <button
        type="button"
        onClick={() => void handleSync()}
        disabled={syncing}
        className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#5865F2] text-[13px] font-bold tracking-[-0.02em] text-white transition-colors hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {syncing ? (
          <>
            <svg className="capas-spinner h-[16px] w-[16px] [&_circle]:stroke-white" viewBox="25 25 50 50">
              <circle r="20" cy="50" cx="50" />
            </svg>
            Sincronizando...
          </>
        ) : (
          "Sincronizar #regras"
        )}
      </button>
    </aside>
  );
}
