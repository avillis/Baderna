"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

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
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [giphyOpen, setGiphyOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const canPost = text.trim().length > 0 || imageUrl || gifUrl;

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const url = await uploadPostImage(file);
      if (!url) throw new Error("Falha no upload.");
      setImageUrl(url);
      // Imagem e GIF são mutuamente exclusivos pra simplificar layout.
      setGifUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!canPost || posting) return;
    setError(null);
    setPosting(true);
    try {
      const created = await onCreate({
        content: text.trim(),
        imageUrl,
        gifUrl,
      });
      if (!created) {
        setError("Não foi possível postar. Tenta de novo.");
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
    <div className="rounded-[20px] border border-[#ededed] bg-white p-[20px]">
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
              placeholder="O que está acontecendo?"
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

          {/* Linha botões */}
          <div className="flex items-center justify-between">
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
                  className="h-[22px] w-[22px] text-[#0f0f0f]"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16.2 21H6.93137C6.32555 21 6.02265 21 5.88238 20.8802C5.76068 20.7763 5.69609 20.6203 5.70865 20.4608C5.72312 20.2769 5.93731 20.0627 6.36569 19.6343L14.8686 11.1314C15.2646 10.7354 15.4627 10.5373 15.691 10.4632C15.8918 10.3979 16.1082 10.3979 16.309 10.4632C16.5373 10.5373 16.7354 10.7354 17.1314 11.1314L21 15V16.2M16.2 21C17.8802 21 18.7202 21 19.362 20.673C19.9265 20.3854 20.3854 19.9265 20.673 19.362C21 18.7202 21 17.8802 21 16.2M16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V7.8C3 6.11984 3 5.27976 3.32698 4.63803C3.6146 4.07354 4.07354 3.6146 4.63803 3.32698C5.27976 3 6.11984 3 7.8 3H16.2C17.8802 3 18.7202 3 19.362 3.32698C19.9265 3.6146 20.3854 4.07354 20.673 4.63803C21 5.27976 21 6.11984 21 7.8V16.2M10.5 8.5C10.5 9.60457 9.60457 10.5 8.5 10.5C7.39543 10.5 6.5 9.60457 6.5 8.5C6.5 7.39543 7.39543 6.5 8.5 6.5C9.60457 6.5 10.5 7.39543 10.5 8.5Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setGiphyOpen((v) => !v)}
                aria-label="Adicionar GIF"
                aria-expanded={giphyOpen}
                className="flex h-[20px] w-[20px] items-center justify-center rounded-[4px] text-[8px] font-black text-[#0f0f0f] shadow-[inset_0_0_0_2px_#0f0f0f] transition-opacity hover:opacity-70"
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

          {error && (
            <p className="text-[12px] font-semibold text-[#c53030]">
              {error}
            </p>
          )}
        </div>
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
