"use client";

import { X, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

export function AddMemberModal() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [nick, setNick] = useState("");
  const [tag, setTag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function reset() {
    setName("");
    setNick("");
    setTag("");
    setError(null);
    setSubmitting(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !nick.trim() || !tag.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = authToken();
      const res = await fetch(`${API_BASE}/admin/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: name.trim(),
          summoner_name: nick.trim(),
          tagLine: tag.trim(),
        }),
      });
      const body = (await res.json().catch(() => null)) as
        | { errors?: Record<string, string[]>; message?: string }
        | null;
      if (!res.ok) {
        const firstErr = body?.errors
          ? Object.values(body.errors)[0]?.[0]
          : null;
        throw new Error(firstErr ?? body?.message ?? `API respondeu ${res.status}`);
      }
      // Limpa cache pra forçar refetch
      try {
        window.localStorage.removeItem("baderna:members-cache");
      } catch {
        /* ignore */
      }
      window.dispatchEvent(new Event("baderna:members-updated"));
      setOpen(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao adicionar membro.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-[50px] items-center justify-center gap-[6px] rounded-[18px] bg-[#ededed] px-6 text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-colors hover:bg-[#e0e0e0]"
      >
        <Plus className="h-[16px] w-[16px]" strokeWidth={2.4} />
        Adicionar membro
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative flex w-full max-w-[440px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
                className="absolute right-[20px] top-[20px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85"
              >
                <X className="h-[16px] w-[16px]" strokeWidth={2.4} />
              </button>

              <div className="border-b border-[#ededed] px-[28px] pt-[28px] pb-[16px]">
                <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                  Adicionar membro
                </h2>
                <p className="mt-[4px] text-[13px] tracking-[-0.01em] text-[#7c7c7c]">
                  A conta fica pendente até a pessoa fazer o cadastro com esse
                  mesmo nick + tag.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-[14px] px-[28px] py-[20px]"
              >
                <label className="flex flex-col gap-[6px]">
                  <span className="text-[12px] font-semibold text-[#8d8d8d]">
                    Nome
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: João Silva"
                    autoFocus
                    className="w-full rounded-full border-none bg-[#ededed] px-4 py-3 text-[14px] font-semibold text-[#0f0f0f] outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#ff4100]/20"
                  />
                </label>

                <div className="flex gap-[10px]">
                  <label className="flex flex-1 flex-col gap-[6px]">
                    <span className="text-[12px] font-semibold text-[#8d8d8d]">
                      Nick da conta
                    </span>
                    <input
                      type="text"
                      value={nick}
                      onChange={(e) => setNick(e.target.value)}
                      placeholder="Avillis"
                      className="w-full rounded-full border-none bg-[#ededed] px-4 py-3 text-[14px] font-semibold text-[#0f0f0f] outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#ff4100]/20"
                    />
                  </label>
                  <label className="flex w-[110px] flex-col gap-[6px]">
                    <span className="text-[12px] font-semibold text-[#8d8d8d]">
                      Tag
                    </span>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-[18px] top-1/2 -translate-y-1/2 text-[14px] font-semibold text-gray-400">
                        #
                      </span>
                      <input
                        type="text"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        maxLength={5}
                        placeholder="BR1"
                        className="w-full rounded-full border-none bg-[#ededed] px-4 py-3 pl-[32px] text-[14px] font-semibold text-[#0f0f0f] outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-[#ff4100]/20"
                      />
                    </div>
                  </label>
                </div>

                {error && (
                  <p className="text-[12px] font-semibold text-[#c53030]">
                    {error}
                  </p>
                )}

                <div className="mt-[6px] flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={
                      submitting || !name.trim() || !nick.trim() || !tag.trim()
                    }
                    className="flex h-[50px] flex-1 basis-0 items-center justify-center rounded-[18px] bg-[#ff4100] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting ? (
                      <svg
                        className="capas-spinner h-[20px] w-[20px] [&_circle]:stroke-white"
                        viewBox="25 25 50 50"
                      >
                        <circle r="20" cy="50" cx="50" />
                      </svg>
                    ) : (
                      "Adicionar"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={submitting}
                    className="h-[50px] flex-1 basis-0 rounded-[18px] bg-[#ededed] text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-colors hover:bg-[#e0e0e0] disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
