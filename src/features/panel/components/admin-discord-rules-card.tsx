"use client";

import { useState } from "react";

import { authToken } from "@/features/panel/use-auth";
import { useToast } from "@/components/toast";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

function DiscordIcon() {
  return (
    <svg
      viewBox="0 0 127.14 96.36"
      className="h-[20px] w-[20px] shrink-0 fill-[#5865F2]"
    >
      <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
    </svg>
  );
}

async function postSync(endpoint: string, token: string) {
  return fetch(`${API_BASE}/admin/${endpoint}`, {
    method: "POST",
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });
}

export function AdminDiscordRulesCard() {
  const [syncingRules, setSyncingRules] = useState(false);
  const [syncingRanking, setSyncingRanking] = useState(false);
  const [syncingBirthdays, setSyncingBirthdays] = useState(false);
  const toast = useToast();

  async function handleSyncRules() {
    if (syncingRules) return;
    setSyncingRules(true);
    try {
      const token = authToken();
      if (!token) { toast.show("Sem autenticação."); return; }
      const res = await postSync("sync-rules-discord", token);
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.show(err.error ?? "Erro ao sincronizar."); return;
      }
      toast.show("Regras sincronizadas no Discord!", "success");
    } catch { toast.show("Erro de conexão."); }
    finally { setSyncingRules(false); }
  }

  async function handleSyncRanking() {
    if (syncingRanking) return;
    setSyncingRanking(true);
    try {
      const token = authToken();
      if (!token) { toast.show("Sem autenticação."); return; }
      const res = await postSync("sync-ranking-discord", token);
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.show(err.error ?? "Erro ao sincronizar."); return;
      }
      toast.show("Ranking sincronizado no Discord!", "success");
    } catch { toast.show("Erro de conexão."); }
    finally { setSyncingRanking(false); }
  }

  async function handleSyncBirthdays() {
    if (syncingBirthdays) return;
    setSyncingBirthdays(true);
    try {
      const token = authToken();
      if (!token) { toast.show("Sem autenticação."); return; }
      const res = await postSync("sync-birthdays-discord", token);
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.show(err.error ?? "Erro ao sincronizar."); return;
      }
      toast.show("Aniversários sincronizados no Discord!", "success");
    } catch { toast.show("Erro de conexão."); }
    finally { setSyncingBirthdays(false); }
  }

  return (
    <aside className="rounded-[var(--panel-radius-card)] bg-white p-6 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <div className="mb-4 flex items-center gap-[10px]">
        <DiscordIcon />
        <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
          Discord
        </h2>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void handleSyncRules()}
          disabled={syncingRules}
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#5865F2] text-[13px] font-bold tracking-[-0.02em] text-white transition-colors hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {syncingRules ? (
            <>
              <svg className="capas-spinner h-[16px] w-[16px] [&_circle]:stroke-white" viewBox="25 25 50 50">
                <circle r="20" cy="50" cx="50" />
              </svg>
              Sincronizando...
            </>
          ) : "Sincronizar #regras"}
        </button>

        <button
          type="button"
          onClick={() => void handleSyncRanking()}
          disabled={syncingRanking}
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#5865F2] text-[13px] font-bold tracking-[-0.02em] text-white transition-colors hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {syncingRanking ? (
            <>
              <svg className="capas-spinner h-[16px] w-[16px] [&_circle]:stroke-white" viewBox="25 25 50 50">
                <circle r="20" cy="50" cx="50" />
              </svg>
              Sincronizando...
            </>
          ) : "Sincronizar #rank-baderna"}
        </button>

        <button
          type="button"
          onClick={() => void handleSyncBirthdays()}
          disabled={syncingBirthdays}
          className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#5865F2] text-[13px] font-bold tracking-[-0.02em] text-white transition-colors hover:bg-[#4752c4] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {syncingBirthdays ? (
            <>
              <svg className="capas-spinner h-[16px] w-[16px] [&_circle]:stroke-white" viewBox="25 25 50 50">
                <circle r="20" cy="50" cx="50" />
              </svg>
              Sincronizando...
            </>
          ) : "Sincronizar #aniversários"}
        </button>
      </div>
    </aside>
  );
}
