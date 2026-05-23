"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import { useToast } from "@/components/toast";
import { GiphyPickerInline } from "@/features/panel/components/giphy-picker-modal";
import { useAccount } from "@/features/panel/use-account";
import {
  MAX_VIDEO_SIZE_BYTES,
  uploadPostImage,
  uploadPostVideo,
  type FeedPost,
} from "@/features/panel/use-posts";

export function PostComposer({
  onCreate,
}: {
  onCreate: (input: {
    content: string;
    imageUrl?: string | null;
    gifUrl?: string | null;
    videoUrl?: string | null;
  }) => Promise<FeedPost | null>;
}) {
  const { account } = useAccount();
  const toast = useToast();
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [giphyOpen, setGiphyOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  const canPost = text.trim().length > 0 || imageUrl || gifUrl || videoUrl;

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadPostImage(file);
      if (!url) throw new Error("Falha no upload.");
      setImageUrl(url);
      // Mídia mutuamente exclusiva pra simplificar layout.
      setGifUrl(null);
      setVideoUrl(null);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  async function handleVideoFile(file: File) {
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      toast.show("Vídeo até 20MB.");
      return;
    }
    setUploading(true);
    try {
      const url = await uploadPostVideo(file);
      if (!url) throw new Error("Falha no upload do vídeo.");
      setVideoUrl(url);
      setImageUrl(null);
      setGifUrl(null);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!canPost || posting) return;
    setPosting(true);
    try {
      const created = await onCreate({
        content: text.trim(),
        imageUrl,
        gifUrl,
        videoUrl,
      });
      if (!created) {
        toast.show("Não foi possível postar. Tenta de novo.");
        return;
      }
      setText("");
      setImageUrl(null);
      setGifUrl(null);
      setVideoUrl(null);
    } finally {
      setPosting(false);
    }
  }

  const mediaUrl = imageUrl ?? gifUrl;
  const isVideoMedia = !!videoUrl && !mediaUrl;

  return (
    <div className="rounded-[18px] bg-white p-[14px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] sm:rounded-[20px] sm:p-[20px]">
      <div className="flex gap-[10px] sm:gap-[14px]">
        {/* Avatar */}
        <div className="relative h-[40px] w-[40px] flex-shrink-0 overflow-hidden rounded-full bg-[#ededed] sm:h-[48px] sm:w-[48px]">
          {account.avatarSrc ? (
            <Image
              src={account.avatarSrc}
              alt=""
              fill
              className="object-cover"
              sizes="48px"
              unoptimized
            />
          ) : null}
        </div>

        {/* Coluna principal */}
        <div className="flex min-w-0 flex-1 flex-col gap-[12px] sm:gap-[14px]">
          {/* Linha texto + mídia lateral. Texto fica em flex-1, mídia
              ocupa coluna fixa à direita só quando existe. */}
          <div className="flex gap-[14px]">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Qual a boa de hoje?"
              rows={4}
              maxLength={2000}
              className="min-w-0 flex-1 resize-none border-none bg-transparent text-[15px] tracking-[-0.01em] text-[#0f0f0f] outline-none placeholder:text-[#a89e99] sm:text-[16px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            />

            {mediaUrl && (
              <div className="relative h-fit w-[180px] flex-shrink-0 overflow-hidden rounded-[16px] bg-[#ededed]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl(null);
                    setGifUrl(null);
                  }}
                  aria-label="Remover mídia"
                  className="absolute right-[6px] top-[6px] flex h-[24px] w-[24px] items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:opacity-85"
                >
                  <X className="h-[12px] w-[12px]" strokeWidth={2.4} />
                </button>
              </div>
            )}

            {isVideoMedia && (
              <div className="relative h-fit w-[200px] flex-shrink-0 overflow-hidden rounded-[16px] bg-black">
                <video
                  src={videoUrl ?? undefined}
                  className="pointer-events-none aspect-video w-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                  /* Sem controls, sem play — só preview estática (primeiro frame). */
                />
                {/* Overlay sutil indicando que é vídeo, sem controles. */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                  <span className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white/85 text-[#0f0f0f]">
                    <svg viewBox="0 0 24 24" className="ml-[2px] h-[16px] w-[16px]" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setVideoUrl(null)}
                  aria-label="Remover vídeo"
                  className="absolute right-[6px] top-[6px] z-10 flex h-[24px] w-[24px] items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:opacity-85"
                >
                  <X className="h-[12px] w-[12px]" strokeWidth={2.4} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Linha botões — fora da coluna do avatar pra alinhar com a borda
          esquerda do card, igual o avatar. */}
      <div className="mt-[14px] flex items-center justify-between">
            <div className="flex items-center gap-[10px]">
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
                aria-label="Adicionar imagem"
                className="flex h-[32px] w-[32px] items-center justify-center transition-opacity hover:opacity-70 disabled:opacity-50"
              >
                <svg
                  className="h-[26px] w-[26px] text-[#0f0f0f]"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <clipPath id="img-icon-clip">
                      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                    </clipPath>
                  </defs>
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                    ry="5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <g clipPath="url(#img-icon-clip)">
                    <circle
                      cx="8.5"
                      cy="9"
                      r="1.6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M21 15.5L16.5 11L6 21.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setGiphyOpen((v) => !v)}
                aria-label="Adicionar GIF"
                aria-expanded={giphyOpen}
                className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] text-[9px] font-bold text-[#0f0f0f] shadow-[inset_0_0_0_1.5px_#0f0f0f] transition-opacity hover:opacity-70"
              >
                GIF
              </button>
              <input
                ref={videoInput}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleVideoFile(f);
                  if (videoInput.current) videoInput.current.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => videoInput.current?.click()}
                disabled={uploading}
                aria-label="Adicionar vídeo (até 20MB)"
                title="Adicionar vídeo (até 20MB)"
                className="flex h-[32px] w-[32px] items-center justify-center text-[#0f0f0f] transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  className="h-[26px] w-[26px]"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="3"
                    y="3"
                    width="18"
                    height="18"
                    rx="5"
                    ry="5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M10 8.5L16 12L10 15.5V8.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {uploading && (
                <svg
                  className="capas-spinner [&_circle]:stroke-[#ff4100]"
                  viewBox="25 25 50 50"
                  style={{ width: 12, height: 12 }}
                >
                  <circle r="20" cy="50" cx="50" />
                </svg>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canPost || posting}
              className="flex h-[40px] w-[96px] flex-shrink-0 items-center justify-center gap-[8px] rounded-[14px] bg-[#ff4100] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:h-[50px] sm:w-[120px] sm:rounded-[18px]"
            >
              {posting ? (
                <svg
                  className="capas-spinner h-[18px] w-[18px] [&_circle]:stroke-white"
                  viewBox="25 25 50 50"
                >
                  <circle r="20" cy="50" cx="50" />
                </svg>
              ) : (
                "Postar"
              )}
            </button>
      </div>

      <GiphyPickerInline
        open={giphyOpen}
        onSelect={(url) => {
          setGifUrl(url);
          setImageUrl(null);
          setGiphyOpen(false);
        }}
      />
    </div>
  );
}
