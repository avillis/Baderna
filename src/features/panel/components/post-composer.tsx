"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import { useToast } from "@/components/toast";
import { GiphyPickerInline } from "@/features/panel/components/giphy-picker-modal";
import { useAccount } from "@/features/panel/use-account";
import { uploadPostImage, type FeedPost } from "@/features/panel/use-posts";

export function PostComposer({
  onCreate,
}: {
  onCreate: (input: {
    content: string;
    imageUrl?: string | null;
    gifUrl?: string | null;
  }) => Promise<FeedPost | null>;
}) {
  const { account } = useAccount();
  const toast = useToast();
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [giphyOpen, setGiphyOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const canPost = text.trim().length > 0 || imageUrl || gifUrl;

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadPostImage(file);
      if (!url) throw new Error("Falha no upload.");
      setImageUrl(url);
      // Imagem e GIF são mutuamente exclusivos pra simplificar layout.
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
      });
      if (!created) {
        toast.show("Não foi possível postar. Tenta de novo.");
        return;
      }
      setText("");
      setImageUrl(null);
      setGifUrl(null);
    } finally {
      setPosting(false);
    }
  }

  const mediaUrl = imageUrl ?? gifUrl;

  return (
    <div className="rounded-[20px] bg-white p-[20px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <div className="flex gap-[14px]">
        {/* Avatar */}
        <div className="relative h-[48px] w-[48px] flex-shrink-0 overflow-hidden rounded-full bg-[#ededed]">
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
        <div className="flex min-w-0 flex-1 flex-col gap-[14px]">
          {/* Linha texto + mídia lateral. Texto fica em flex-1, mídia
              ocupa coluna fixa à direita só quando existe. */}
          <div className="flex gap-[14px]">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Qual a boa de hoje?"
              rows={4}
              maxLength={2000}
              className="min-w-0 flex-1 resize-none border-none bg-transparent text-[16px] tracking-[-0.01em] text-[#0f0f0f] outline-none placeholder:text-[#a89e99] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
              {uploading && (
                <span className="text-[12px] text-[#8d8d8d]">Enviando...</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canPost || posting}
              className="flex h-[50px] w-[120px] flex-shrink-0 items-center justify-center gap-[8px] rounded-[18px] bg-[#ff4100] text-[13px] font-bold tracking-[-0.02em] text-white transition-opacity hover:opacity-90 disabled:opacity-50"
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
