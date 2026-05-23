"use client";

import { useCallback, useEffect, useState } from "react";

import { useToast } from "@/components/toast";
import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

type EmailTemplate = {
  id: string;
  label: string;
  subject: string;
  preview: string;
};

function authHeaders(): Record<string, string> {
  const token = authToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Esconde a scrollbar do iframe de preview sem bloquear o scroll. Injeta
// um <style> no <head> do HTML que vem do backend — o conteúdo continua
// rolável com mouse wheel/touch, só não mostra a barra cinza.
function hideScrollbar(html: string): string {
  if (!html) return html;
  const css =
    "<style>html,body{scrollbar-width:none;-ms-overflow-style:none;}html::-webkit-scrollbar,body::-webkit-scrollbar{display:none;width:0;height:0;}</style>";
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${css}</head>`);
  }
  // Fallback: sem <head>, injeta antes do </html> ou no fim.
  return css + html;
}

export function AdminEmailsCard() {
  const toast = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [sending, setSending] = useState(false);

  // Lista templates ao montar
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/admin/emails`, {
          headers: { Accept: "application/json", ...authHeaders() },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { templates: EmailTemplate[] };
        if (cancelled) return;
        setTemplates(data.templates);
        if (data.templates[0]) setSelectedId(data.templates[0].id);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Carrega preview do template selecionado
  const loadPreview = useCallback(async (id: string) => {
    setLoadingPreview(true);
    try {
      const res = await fetch(`${API_BASE}/admin/emails/${id}/preview`, {
        headers: { Accept: "text/html", ...authHeaders() },
      });
      if (!res.ok) {
        setPreviewHtml("");
        return;
      }
      const html = await res.text();
      setPreviewHtml(html);
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    void loadPreview(selectedId);
  }, [selectedId, loadPreview]);

  async function handleSendTest() {
    if (!selectedId || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/admin/emails/${selectedId}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({ to: testEmail.trim() || undefined }),
      });
      const body = (await res.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;
      if (!res.ok) {
        toast.show(body?.error ?? "Falha ao enviar teste.");
        return;
      }
      toast.show(body?.message ?? "Teste enviado.", "success");
      setTestEmail("");
    } finally {
      setSending(false);
    }
  }

  const selected = templates.find((t) => t.id === selectedId);

  return (
    <section className="rounded-[var(--panel-radius-card)] bg-white p-6 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <div className="mb-[14px] flex flex-col gap-[6px]">
        <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
          Emails
        </h2>
        <p className="text-[13px] font-medium text-[#8d8d8d]">
          Templates enviados pelo backend. Manda teste pra ver no inbox.
        </p>
      </div>

      {templates.length === 0 ? (
        <p className="mt-6 text-[12px] text-[#8d8d8d]">Carregando templates…</p>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Lista de templates à esquerda */}
          <div className="flex flex-col gap-2">
            {templates.map((t) => {
              const active = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`rounded-[14px] px-[14px] py-[12px] text-left transition-colors ${
                    active
                      ? "bg-[#0f0f0f] text-white"
                      : "bg-[#f7f7f7] text-[#0f0f0f] hover:bg-[#ededed]"
                  }`}
                >
                  <p className="text-[13px] font-bold tracking-[-0.02em]">
                    {t.label}
                  </p>
                  <p
                    className={`mt-[2px] text-[11px] ${
                      active ? "text-white/70" : "text-[#8d8d8d]"
                    }`}
                  >
                    {t.subject}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Preview + send test */}
          <div className="flex min-w-0 flex-col gap-4">
            {selected && (
              <div className="rounded-[14px] bg-[#f7f7f7] p-[16px]">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="Email do admin por padrão"
                    className="min-w-0 flex-1 rounded-full border-none bg-white px-5 py-3 text-[13px] text-[#0f0f0f] outline-none placeholder:text-[#a4a4a4] focus:outline-none focus:ring-2 focus:ring-[#ff4100]/20"
                  />
                  <button
                    type="button"
                    onClick={handleSendTest}
                    disabled={sending}
                    className="flex h-[50px] items-center justify-center rounded-[18px] bg-[#ff4100] px-[24px] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sending ? (
                      <svg
                        className="capas-spinner h-[20px] w-[20px] [&_circle]:stroke-white"
                        viewBox="25 25 50 50"
                      >
                        <circle r="20" cy="50" cx="50" />
                      </svg>
                    ) : (
                      "Enviar teste"
                    )}
                  </button>
                </div>
                <p className="mt-[8px] text-[11px] text-[#8d8d8d]">
                  {selected.preview}
                </p>
              </div>
            )}

            <div className="overflow-hidden rounded-[14px] border border-[#ececec] bg-white">
              {loadingPreview ? (
                <div className="flex h-[500px] items-center justify-center text-[12px] text-[#8d8d8d]">
                  Carregando…
                </div>
              ) : (
                <iframe
                  title="Preview do email"
                  srcDoc={hideScrollbar(previewHtml)}
                  className="h-[640px] w-full border-none"
                  sandbox=""
                />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
