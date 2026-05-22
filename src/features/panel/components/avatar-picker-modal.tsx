"use client";

import { X, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  CHAMPION_AVATAR_FILES,
  getChampionTileSrc,
} from "@/features/panel/champion-avatar";
import { useAccount } from "@/features/panel/use-account";
import { authToken } from "@/features/panel/use-auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api";

type Tab = "riot" | "champions" | "upload";

export function AvatarPickerModal({
  open,
  onClose,
  currentSrc,
  ownerId,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  currentSrc: string;
  ownerId: string;
  onSelect: (src: string) => void;
}) {
  const { account } = useAccount();
  const riotIconUrl = account.riotIconUrl ?? null;
  const [mounted, setMounted] = useState(false);
  // Inicial: Riot se tiver ícone disponível, senão Campeões
  const [tab, setTab] = useState<Tab>(riotIconUrl ? "riot" : "champions");
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const filtered = query
    ? CHAMPION_AVATAR_FILES.filter((f) =>
        f.toLowerCase().includes(query.toLowerCase()),
      )
    : CHAMPION_AVATAR_FILES;

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const token = authToken();
      if (!token) throw new Error("Você precisa estar logado pra subir avatar.");
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE}/account/avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: form,
      });
      const body = (await res.json().catch(() => null)) as
        | { url?: string; message?: string; errors?: Record<string, string[]> }
        | null;
      if (!res.ok || !body?.url) {
        const firstErr = body?.errors
          ? Object.values(body.errors)[0]?.[0]
          : undefined;
        throw new Error(
          firstErr ?? body?.message ?? `Falha no upload (${res.status})`,
        );
      }
      onClose();
      onSelect(body.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[86vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-[20px] top-[20px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85"
        >
          <X className="h-[16px] w-[16px]" strokeWidth={2.4} />
        </button>

        <div className="border-b border-[#ededed] px-[28px] pt-[28px] pb-[16px]">
          <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Foto de perfil
          </h2>
          <div className="mt-[14px]">
            {(() => {
              const tabs: Tab[] = riotIconUrl
                ? ["riot", "champions", "upload"]
                : ["champions", "upload"];
              const labels: Record<Tab, string> = {
                riot: "Riot",
                champions: "Campeões",
                upload: "Importar",
              };
              const width = riotIconUrl ? 300 : 220;
              const activeIdx = tabs.indexOf(tab);
              return (
                <div
                  className="relative flex h-[40px] items-center rounded-[25px] p-[4px]"
                  style={{ background: "#ededed", width }}
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute top-[4px] bottom-[4px] rounded-[25px]"
                    style={{
                      background: "#ffffff",
                      width: `calc((100% - 8px) / ${tabs.length})`,
                      transform: `translateX(${activeIdx * 100}%)`,
                      transition:
                        "transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                      zIndex: 0,
                    }}
                  />
                  {tabs.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTab(t)}
                      className={`relative z-[1] flex h-full flex-1 items-center justify-center rounded-[25px] text-[13px] font-semibold transition-colors duration-300 ${
                        tab === t
                          ? "text-[#0f0f0f]"
                          : "text-black/40 hover:text-black/70"
                      }`}
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {labels[t]}
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>

        {tab === "riot" && riotIconUrl ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-[18px] px-[28px] py-[40px]">
            <p className="max-w-[360px] text-center text-[13px] text-[#8d8d8d]">
              O ícone que você usa no League. Atualiza junto com sua conta da
              Riot.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelect(riotIconUrl);
              }}
              className="relative h-[148px] w-[148px] overflow-hidden rounded-full ring-4 ring-transparent transition-all hover:scale-[1.04] hover:ring-[#ff4100]"
              title="Usar ícone Riot"
            >
              <Image
                src={riotIconUrl}
                alt="Ícone Riot"
                fill
                className="object-cover"
                sizes="148px"
                unoptimized
              />
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelect(riotIconUrl);
              }}
              className="flex h-[50px] items-center justify-center rounded-[18px] bg-[#ff4100] px-8 text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90"
            >
              Usar ícone Riot
            </button>
          </div>
        ) : tab === "champions" ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-[#ededed] px-[28px] py-[12px]">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar campeão..."
                className="w-full rounded-full border-none bg-[#ededed] px-[16px] py-[8px] text-[13px] outline-none placeholder:text-[#a89e99] focus:ring-2 focus:ring-[#ff4100]/20"
              />
            </div>
            <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-5 items-start gap-[16px] overflow-y-auto p-[24px] sm:grid-cols-6">
              {filtered.map((file) => {
                const src = getChampionTileSrc(file);
                const isCurrent = currentSrc === src;
                return (
                  <button
                    key={file}
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelect(src);
                    }}
                    title={file.replace("_0.jpg", "")}
                    className={`relative aspect-square w-full overflow-hidden rounded-full ring-2 transition-all hover:scale-[1.06] ${
                      isCurrent ? "ring-[#ff4100]" : "ring-transparent"
                    }`}
                  >
                    <Image
                      src={src}
                      alt={file}
                      fill
                      className="object-cover"
                      sizes="110px"
                      unoptimized
                    />
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="col-span-full py-[40px] text-center text-[13px] text-[#8d8d8d]">
                  Nenhum campeão encontrado.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-[18px] px-[28px] py-[40px]">
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                if (fileInput.current) fileInput.current.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="flex h-[50px] items-center justify-center gap-[8px] rounded-[18px] bg-[#ff4100] px-8 text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {uploading ? (
                <svg
                  className="capas-spinner h-[16px] w-[16px] [&_circle]:stroke-white"
                  viewBox="25 25 50 50"
                >
                  <circle r="20" cy="50" cx="50" />
                </svg>
              ) : (
                <Upload className="h-[16px] w-[16px]" strokeWidth={2.4} />
              )}
              {uploading ? "Enviando..." : "Escolher arquivo"}
            </button>
            <p className="max-w-[320px] text-center text-[12px] text-[#8d8d8d]">
              PNG, JPG, WEBP ou GIF. Máx. 5 MB. A imagem fica salva no servidor
              e some se você trocar de avatar.
            </p>
            {error && (
              <p className="text-[12px] font-semibold text-[#c53030]">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
