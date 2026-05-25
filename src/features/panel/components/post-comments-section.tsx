"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUp, X } from "lucide-react";
import { useRef, useState } from "react";

import { useToast } from "@/components/toast";
import { GiphyPickerInline } from "@/features/panel/components/giphy-picker-modal";
import { getMemberSlug } from "@/features/panel/members-data";
import { StyledName } from "@/features/panel/components/styled-name";
import { useAuth } from "@/features/panel/use-auth";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import { formatCommentDate } from "@/features/panel/use-comments";
import { usePostComments } from "@/features/panel/use-post-comments";
import { uploadPostImage } from "@/features/panel/use-posts";

export function PostCommentsSection({
  postId,
  postOwnerId,
  onCountChange,
}: {
  postId: number;
  postOwnerId: number | null;
  /** Notifica o pai quando a contagem muda (pra sincronizar o ícone do PostCard). */
  onCountChange?: (count: number) => void;
}) {
  const { comments, addComment, removeComment } = usePostComments(postId);
  const { user } = useAuth();
  const members = useBadernaMembers();
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [giphyOpen, setGiphyOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const mediaUrl = imageUrl ?? gifUrl;
  const canSubmit = (draft.trim().length > 0 || mediaUrl) && !submitting && !uploading;

  async function handleImageFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadPostImage(file);
      if (!url) throw new Error("Falha no upload.");
      setImageUrl(url);
      setGifUrl(null);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  // Mapeia user_id → nickname/estilo do autor, pra exibir o nome com o
  // estilo escolhido pela pessoa (StyledName) e refletir mudança de nick
  // sem invalidar o cache local de comentários.
  const nickByUserId = new Map<number, string>();
  const styleByUserId = new Map<number, string | undefined>();
  for (const m of members) {
    if (m.userId) {
      nickByUserId.set(m.userId, m.nickname);
      styleByUserId.set(m.userId, m.activeNameId);
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const body = draft.trim();
    if (!canSubmit) return;
    setSubmitting(true);
    const created = await addComment(body, imageUrl, gifUrl);
    setSubmitting(false);
    if (created) {
      setDraft("");
      setImageUrl(null);
      setGifUrl(null);
      setGiphyOpen(false);
      onCountChange?.(comments.length + 1);
    }
  }

  async function handleRemove(id: string) {
    const ok = await removeComment(id);
    if (ok) onCountChange?.(Math.max(0, comments.length - 1));
  }

  return (
    <section className="rounded-[20px] bg-white p-[24px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <div>
        {comments.length === 0 ? (
          <p className="py-[24px] text-center text-[13px] font-medium tracking-[-0.02em] text-[#b0a8a4]">
            Nenhum comentário ainda. Seja o primeiro!
          </p>
        ) : (
          <div className="space-y-[18px]">
            {comments.map((comment) => {
              const liveNick = comment.authorId
                ? nickByUserId.get(comment.authorId)
                : undefined;
              const displayNick = liveNick ?? comment.author;
              const authorStyleId = comment.authorId
                ? styleByUserId.get(comment.authorId)
                : undefined;
              const profileHref = `/membro/${getMemberSlug({ nickname: displayNick })}`;
              const canDelete =
                user != null &&
                ((comment.authorId != null && comment.authorId === user.id) ||
                  (postOwnerId != null && postOwnerId === user.id) ||
                  user.is_admin);
              return (
                <article
                  key={comment.id}
                  className="group relative border-b border-[#f3efec] pb-[16px] last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start gap-[12px]">
                    <Link
                      href={profileHref}
                      aria-label={`Ver perfil de ${displayNick}`}
                      className="shrink-0 transition-opacity hover:opacity-80"
                    >
                      {comment.authorAvatar ? (
                        <div className="relative h-[42px] w-[42px] overflow-hidden rounded-full bg-[#efeae6]">
                          <Image
                            src={comment.authorAvatar}
                            alt={displayNick}
                            fill
                            className="object-cover"
                            sizes="42px"
                          />
                        </div>
                      ) : (
                        <div className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full bg-[#efeae6] text-[15px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                          {displayNick.charAt(0)}
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={profileHref}
                        className="inline-block max-w-full truncate-glow text-[13px] font-bold tracking-[-0.03em] text-[#0f0f0f] transition-opacity hover:opacity-70"
                      >
                        <StyledName styleId={authorStyleId}>
                          {displayNick}
                        </StyledName>
                      </Link>
                      <p className="-mt-[1px] text-[11px] font-medium tracking-[-0.03em] text-[#adadad]">
                        {formatCommentDate(comment.createdAt)}
                      </p>
                      {comment.body && (
                        <p className="mt-[10px] text-[13px] font-medium leading-[1.45] tracking-[-0.02em] text-[#666666]">
                          {comment.body}
                        </p>
                      )}
                      {(comment.imageUrl || comment.gifUrl) && (
                        <div className="mt-[10px] overflow-hidden rounded-[12px] bg-[#ededed]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={comment.imageUrl ?? comment.gifUrl ?? ""}
                            alt=""
                            className="max-h-[280px] w-auto max-w-full object-contain"
                          />
                        </div>
                      )}
                    </div>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleRemove(comment.id)}
                        aria-label="Excluir comentário"
                        className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full text-[#b0a8a4] opacity-0 transition-opacity hover:bg-[#fee2e2] hover:text-[#c53030] group-hover:opacity-100"
                      >
                        <X className="h-[12px] w-[12px]" strokeWidth={2.4} />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-[20px]">
        {mediaUrl && (
          <div className="relative mb-[10px] inline-block max-w-full overflow-hidden rounded-[12px] bg-[#ededed]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl}
              alt=""
              className="max-h-[180px] w-auto max-w-full object-contain"
            />
            <button
              type="button"
              onClick={() => {
                setImageUrl(null);
                setGifUrl(null);
              }}
              aria-label="Remover mídia"
              className="absolute right-[6px] top-[6px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:opacity-85"
            >
              <X className="h-[11px] w-[11px]" strokeWidth={2.4} />
            </button>
          </div>
        )}

        <div className="flex items-center gap-[8px] rounded-full bg-[#EDEDED] pl-[18px] pr-[6px] py-[6px]">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Fazer um comentário..."
            className="min-w-0 flex-1 bg-transparent text-[13px] font-medium tracking-[-0.02em] text-[#0f0f0f] outline-none placeholder:text-[#a4a4a4]"
          />

          {/* Botoes de midia (imagem + gif). Toggle entre eles: escolher um zera o outro. */}
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImageFile(f);
              if (fileInput.current) fileInput.current.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            aria-label="Adicionar imagem"
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center text-[#0f0f0f] transition-opacity hover:opacity-70 disabled:opacity-50"
          >
            <svg className="h-[20px] w-[20px]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.8" />
              <circle cx="9" cy="9" r="1.5" fill="currentColor" />
              <path d="M21 15l-4-4-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setGiphyOpen((v) => !v)}
            aria-label="Adicionar GIF"
            className={`flex h-[30px] shrink-0 items-center justify-center rounded-md border-[1.6px] px-[6px] text-[10px] font-bold transition-colors ${
              giphyOpen
                ? "border-[#ff4100] text-[#ff4100]"
                : "border-[#0f0f0f] text-[#0f0f0f] hover:border-[#ff4100] hover:text-[#ff4100]"
            }`}
          >
            GIF
          </button>

          <button
            type="submit"
            aria-label="Enviar comentário"
            disabled={!canSubmit}
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp className="h-[16px] w-[16px] translate-x-[0.5px]" strokeWidth={2.4} />
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
      </form>
    </section>
  );
}
