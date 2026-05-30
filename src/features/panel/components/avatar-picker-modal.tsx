"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper from "react-easy-crop";

import {
  CHAMPION_AVATAR_FILES,
  getChampionTileSrc,
} from "@/features/panel/champion-avatar";
import { useAccount } from "@/features/panel/use-account";
import { authToken } from "@/features/panel/use-auth";
import { useToast } from "@/components/toast";

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<File> {
  const img = new window.Image();
  img.src = imageSrc;
  await new Promise<void>((resolve) => { img.onload = () => resolve(); });

  const size = Math.min(pixelCrop.width, pixelCrop.height, 800);
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.drawImage(
    img,
    pixelCrop.x, pixelCrop.y,
    pixelCrop.width, pixelCrop.height,
    0, 0,
    size, size,
  );

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(new File([blob!], "avatar.jpg", { type: "image/jpeg" })),
      "image/jpeg",
      0.92,
    );
  });
}

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
  const [closing, setClosing] = useState(false);
  // Inicial: Riot se tiver ícone disponível, senão Campeões
  const [tab, setTab] = useState<Tab>(riotIconUrl ? "riot" : "champions");
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const toast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  function handleClose() {
    setClosing(true);
  }

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setClosing(false);
      return;
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open || !mounted) return null;

  const filtered = query
    ? CHAMPION_AVATAR_FILES.filter((f) =>
        f.toLowerCase().includes(query.toLowerCase()),
      )
    : CHAMPION_AVATAR_FILES;

  async function handleFile(file: File) {
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
      handleClose();
      onSelect(body.url);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  return createPortal(
    <div
      className={`${closing ? "modal-backdrop-out" : "modal-backdrop-in"} fixed inset-0 z-[9999] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]`}
      onClick={handleClose}
    >
      <div
        className={`${closing ? "modal-panel-out" : "modal-panel-in"} relative flex max-h-[86vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[24px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]`}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={() => { if (closing) onClose(); }}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar"
          className="absolute right-[20px] top-[20px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85"
        >
          <svg
            viewBox="0 0 10 10"
            fill="none"
            className="h-[12px] w-[12px]"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" />
          </svg>
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
              O ícone que você usa no League.
              <br />
              Atualiza junto com sua conta da Riot.
            </p>
            <button
              type="button"
              onClick={() => {
                handleClose();
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
                handleClose();
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
              <div className="relative w-full">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="pointer-events-none absolute left-[18px] top-1/2 h-[16px] w-[16px] -translate-y-1/2 text-[#b0a8a4]"
                  stroke="currentColor"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar campeão..."
                  className="w-full rounded-full border-none bg-white py-3.5 pl-[46px] pr-[40px] text-[13px] font-medium text-[#0f0f0f] shadow-[0_2px_16px_rgba(0,0,0,0.10)] outline-none placeholder:text-[#b0a8a4] focus:ring-2 focus:ring-[#ff4100]/30"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[#0f0f0f] transition-colors hover:text-[#ff4100]"
                  >
                    <svg
                      viewBox="0 0 10 10"
                      fill="none"
                      className="h-[12px] w-[12px]"
                      stroke="currentColor"
                      strokeWidth={1.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            <div className="grid min-h-0 flex-1 auto-rows-min grid-cols-5 items-start gap-[16px] overflow-y-auto no-scrollbar p-[24px] sm:grid-cols-6">
              {filtered.map((file) => {
                const src = getChampionTileSrc(file);
                const isCurrent = currentSrc === src;
                return (
                  <ChampionTile
                    key={file}
                    file={file}
                    src={src}
                    isCurrent={isCurrent}
                    onPick={() => {
                      handleClose();
                      onSelect(src);
                    }}
                  />
                );
              })}
              {filtered.length === 0 && (
                <p className="col-span-full py-[40px] text-center text-[13px] text-[#8d8d8d]">
                  Nenhum campeão encontrado.
                </p>
              )}
            </div>
          </div>
        ) : imageSrc ? (
          /* ── Crop mode ───────────────────────────────────────── */
          <div className="flex flex-1 flex-col">
            <div className="relative h-[320px] w-full overflow-hidden bg-[#111]">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_croppedArea, croppedAreaPixels) => {
                  setCroppedAreaPixels(croppedAreaPixels);
                }}
              />
              {/* Botões de zoom — canto superior esquerdo sobre o cropper */}
              <div className="absolute right-[12px] top-[12px] z-10 flex flex-col overflow-hidden rounded-[10px] shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                <button
                  type="button"
                  aria-label="Aumentar zoom"
                  onClick={() => setZoom((z) => Math.min(3, +(z + 0.2).toFixed(2)))}
                  className="flex h-[36px] w-[36px] items-center justify-center bg-white/90 text-[20px] font-bold text-[#0f0f0f] transition-colors hover:bg-white active:bg-[#f0f0f0]"
                >
                  +
                </button>
                <div className="h-[1px] bg-black/10" />
                <button
                  type="button"
                  aria-label="Diminuir zoom"
                  onClick={() => setZoom((z) => Math.max(1, +(z - 0.2).toFixed(2)))}
                  className="flex h-[36px] w-[36px] items-center justify-center bg-white/90 text-[20px] font-bold text-[#0f0f0f] transition-colors hover:bg-white active:bg-[#f0f0f0]"
                >
                  −
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-[16px] px-[28px] py-[20px]">
              <div className="flex gap-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setImageSrc(null);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                  }}
                  className="flex-1 rounded-[14px] bg-[#ededed] py-[14px] text-[13px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-opacity hover:opacity-80"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!croppedAreaPixels || uploading}
                  onClick={async () => {
                    if (!croppedAreaPixels) return;
                    const file = await getCroppedImg(imageSrc, croppedAreaPixels);
                    await handleFile(file);
                    setImageSrc(null);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                  }}
                  className="flex flex-1 items-center justify-center gap-[8px] rounded-[14px] bg-[#ff4100] py-[14px] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {uploading ? (
                    <svg className="capas-spinner h-[16px] w-[16px] [&_circle]:stroke-white" viewBox="25 25 50 50">
                      <circle r="20" cy="50" cx="50" />
                    </svg>
                  ) : "Salvar corte"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── File picker ─────────────────────────────────────── */
          <div className="flex flex-1 flex-col items-center justify-center gap-[18px] px-[28px] py-[40px]">
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const reader = new FileReader();
                  reader.onload = () => setImageSrc(reader.result as string);
                  reader.readAsDataURL(f);
                }
                if (fileInput.current) fileInput.current.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex h-[50px] items-center justify-center gap-[8px] rounded-[18px] bg-[#ff4100] px-8 text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90"
            >
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7 11C6.07003 11 5.60504 11 5.22354 11.1022C4.18827 11.3796 3.37962 12.1883 3.10222 13.2235C3 13.605 3 14.07 3 15V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H16.2C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2V15C21 14.07 21 13.605 20.8978 13.2235C20.6204 12.1883 19.8117 11.3796 18.7765 11.1022C18.395 11 17.93 11 17 11M16 7L12 3M12 3L8 7M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Escolher arquivo
            </button>
            <p className="max-w-[320px] text-center text-[12px] text-[#8d8d8d]">
              PNG, JPG, WEBP ou GIF. Máx. 5 MB. A imagem fica salva no servidor
              e some se você trocar de avatar.
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function ChampionTile({
  file,
  src,
  isCurrent,
  onPick,
}: {
  file: string;
  src: string;
  isCurrent: boolean;
  onPick: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <button
      type="button"
      onClick={onPick}
      title={file.replace("_0.jpg", "")}
      className={`relative aspect-square w-full overflow-hidden rounded-full ring-2 transition-all hover:scale-[1.06] ${
        isCurrent ? "ring-[#ff4100]" : "ring-transparent"
      }`}
    >
      {!loaded && (
        <div className="absolute inset-0 animate-pulse rounded-full bg-[#ededed]" />
      )}
      <Image
        src={src}
        alt={file}
        fill
        className={`object-cover transition-opacity duration-200 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        sizes="110px"
        unoptimized
        onLoad={() => setLoaded(true)}
      />
    </button>
  );
}
