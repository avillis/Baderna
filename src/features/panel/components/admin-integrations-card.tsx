"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { authToken } from "@/features/panel/use-auth";

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.87601 18.1156C2.92195 17.7021 2.94493 17.4954 3.00748 17.3022C3.06298 17.1307 3.1414 16.9676 3.24061 16.8171C3.35242 16.6475 3.49952 16.5005 3.7937 16.2063L17 3C18.1046 1.89543 19.8954 1.89543 21 3C22.1046 4.10457 22.1046 5.89543 21 7L7.7937 20.2063C7.49951 20.5005 7.35242 20.6475 7.18286 20.7594C7.03242 20.8586 6.86926 20.937 6.69782 20.9925C6.50457 21.055 6.29783 21.078 5.88434 21.124L2.49997 21.5L2.87601 18.1156Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api";

function authHeaders(): Record<string, string> {
  const token = authToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type RiotKeyState = {
  masked: string | null;
  present: boolean;
  source: "admin" | "env";
  healthy: boolean;
};

type FetchState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: RiotKeyState };

function StatusPill({ healthy }: { healthy: boolean }) {
  return healthy ? (
    <span className="rounded bg-[#f2faf5] px-2 py-0.5 text-[11px] font-bold text-[#2f855a]">
      Conectado
    </span>
  ) : (
    <span className="rounded bg-[#fef3c7] px-2 py-0.5 text-[11px] font-bold text-[#d97706]">
      Pendente
    </span>
  );
}

export function AdminIntegrationsCard() {
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [showDraft, setShowDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function refresh() {
    try {
      const res = await fetch(`${API_BASE}/admin/riot-key`, {
        headers: { Accept: "application/json", ...authHeaders() },
      });
      if (!res.ok) throw new Error(`API respondeu ${res.status}`);
      const data = (await res.json()) as RiotKeyState;
      setState({ status: "ready", data });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao consultar a API.";
      setState({ status: "error", message: msg });
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function save() {
    const key = draft.trim();
    if (!key) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${API_BASE}/admin/riot-key`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ key }),
      });
      const body = (await res.json().catch(() => null)) as
        | (RiotKeyState & { error?: string })
        | null;
      if (!res.ok) {
        throw new Error(body?.error ?? `API respondeu ${res.status}`);
      }
      setState({ status: "ready", data: body as RiotKeyState });
      setEditing(false);
      setDraft("");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <aside className="rounded-[var(--panel-radius-card)] bg-white p-6 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <h2 className="mb-5 text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
        Integrações
      </h2>

      <div className="space-y-4">
        {/* Riot API */}
        <div className="border-b border-[#efebe8] pb-4">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-semibold text-[#313131]">Riot API</span>
            {state.status === "ready" ? (
              <StatusPill healthy={state.data.healthy} />
            ) : (
              <span className="rounded bg-[#f0f0f0] px-2 py-0.5 text-[11px] font-bold text-[#8d8d8d]">
                {state.status === "loading" ? "Verificando..." : "Offline"}
              </span>
            )}
          </div>

          {/* Inline display / edit */}
          {!editing ? (
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 truncate rounded-[10px] bg-[#f7f7f7] px-3 py-2 font-mono text-[11px] text-[#6f6f6f]">
                {state.status === "ready"
                  ? state.data.masked ?? "—"
                  : state.status === "loading"
                    ? "carregando..."
                    : "—"}
              </code>
              <button
                type="button"
                onClick={() => {
                  setDraft("");
                  setSaveError(null);
                  setEditing(true);
                }}
                className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#ededed] text-[#0f0f0f] transition-colors hover:bg-[#e0e0e0]"
                title="Editar chave"
              >
                <PencilIcon className="h-[14px] w-[14px]" />
              </button>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <div className="relative">
                <input
                  type={showDraft ? "text" : "password"}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="RGAPI-..."
                  autoFocus
                  className="w-full rounded-full border-none bg-[#ededed] py-3 pl-4 pr-10 font-mono text-[12px] text-[#0f0f0f] outline-none placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20"
                />
                <button
                  type="button"
                  onClick={() => setShowDraft((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d8d8d] hover:text-[#0f0f0f]"
                  title={showDraft ? "Ocultar" : "Mostrar"}
                >
                  {showDraft ? (
                    <EyeOff className="h-[16px] w-[16px]" />
                  ) : (
                    <Eye className="h-[16px] w-[16px]" />
                  )}
                </button>
              </div>
              {saveError && (
                <p className="text-[11px] font-semibold text-[#c53030]">
                  {saveError}
                </p>
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={!draft.trim() || saving}
                  className="flex h-[50px] flex-1 items-center justify-center rounded-[18px] bg-[#ff4100] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? (
                    <svg
                      className="capas-spinner h-[20px] w-[20px] [&_circle]:stroke-white"
                      viewBox="25 25 50 50"
                    >
                      <circle r="20" cy="50" cx="50" />
                    </svg>
                  ) : (
                    "Salvar"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setDraft("");
                    setSaveError(null);
                  }}
                  disabled={saving}
                  className="h-[50px] rounded-[18px] bg-[#ededed] px-6 text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-colors hover:bg-[#e0e0e0] disabled:opacity-40"
                >
                  Cancelar
                </button>
              </div>
              <p className="text-[10px] text-[#9a9a9a]">
                A chave é testada antes de salvar. Você pode renová-la em{" "}
                <a
                  href="https://developer.riotgames.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#ff4100] underline"
                >
                  developer.riotgames.com
                </a>
                .
              </p>
            </div>
          )}
        </div>

        {/* Discord Bot — placeholder */}
        <div className="flex items-center justify-between border-b border-[#efebe8] pb-4">
          <span className="text-[14px] font-semibold text-[#313131]">Discord Bot</span>
          <span className="rounded bg-[#fef3c7] px-2 py-0.5 text-[11px] font-bold text-[#d97706]">
            Pendente
          </span>
        </div>

        {/* Database */}
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-semibold text-[#313131]">Database</span>
          <span className="rounded bg-[#f2faf5] px-2 py-0.5 text-[11px] font-bold text-[#2f855a]">
            Conectado
          </span>
        </div>
      </div>
    </aside>
  );
}
