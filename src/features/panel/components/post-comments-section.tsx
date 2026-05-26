"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUp, Heart, X } from "lucide-react";
import { useRef, useState } from "react";

import { useToast } from "@/components/toast";
import { GiphyPickerInline } from "@/features/panel/components/giphy-picker-modal";
import { getMemberSlug } from "@/features/panel/members-data";
import { StyledName } from "@/features/panel/components/styled-name";
import { useAuth } from "@/features/panel/use-auth";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import type { Comment } from "@/features/panel/use-comments";
import { formatCommentDate } from "@/features/panel/use-comments";
import { usePostComments } from "@/features/panel/use-post-comments";
import { uploadPostImage } from "@/features/panel/use-posts";

// ─── Reply input ───────────────────────────────────────────────────────────────

function ReplyInput({
  onSubmit,
  onCancel,
}: {
  onSubmit: (body: string, imageUrl?: string | null) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const canSubmit = (draft.trim().length > 0 || imageUrl) && !submitting && !uploading;

  async function handleImageFile(file: File) {
    setUploading(true);
    try {
      const url = await uploadPostImage(file);
      if (!url) throw new Error("Falha no upload.");
      setImageUrl(url);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    await onSubmit(draft.trim(), imageUrl);
    setSubmitting(false);
    setDraft("");
    setImageUrl(null);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const file = Array.from(e.clipboardData.files).find((f) =>
      f.type.startsWith("image/"),
    );
    if (file) {
      e.preventDefault();
      handleImageFile(file);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-[8px]">
      {imageUrl && (
        <div className="relative mb-[8px] inline-block max-w-full overflow-hidden rounded-[12px] bg-[#ededed]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="max-h-[140px] w-auto max-w-full object-contain"
          />
          <button
            type="button"
            onClick={() => setImageUrl(null)}
            aria-label="Remover imagem"
            className="absolute right-[6px] top-[6px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-black/60 text-white transition-opacity hover:opacity-85"
          >
            <X className="h-[10px] w-[10px]" strokeWidth={2.4} />
          </button>
        </div>
      )}
      <div className="flex items-center gap-[8px] rounded-full bg-[#EDEDED] pl-[16px] pr-[6px] py-[5px]">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onPaste={handlePaste}
          placeholder="Responder..."
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-[12px] font-medium tracking-[-0.02em] text-[#0f0f0f] outline-none placeholder:text-[#a4a4a4]"
        />
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
          className="flex h-[26px] w-[26px] shrink-0 items-center justify-center transition-opacity hover:opacity-70 disabled:opacity-50"
        >
          <svg
            className="h-[20px] w-[20px] text-[#0f0f0f]"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <clipPath id="reply-img-icon-clip">
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
            <g clipPath="url(#reply-img-icon-clip)">
              <circle cx="8.5" cy="9" r="1.6" stroke="currentColor" strokeWidth="1.5" />
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
          type="submit"
          aria-label="Enviar resposta"
          disabled={!canSubmit}
          className="ml-[4px] flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowUp className="h-[14px] w-[14px] translate-x-[0.5px]" strokeWidth={2.4} />
        </button>
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="mt-[6px] ml-[4px] text-[11px] font-medium tracking-[-0.01em] text-[#b0a8a4] transition-colors hover:text-[#0f0f0f]"
      >
        Cancelar
      </button>
    </form>
  );
}

// ─── Reply item ────────────────────────────────────────────────────────────────

function ReplyItem({
  reply,
  nickByUserId,
  styleByUserId,
  onLike,
  onDelete,
  canDelete,
}: {
  reply: Comment;
  nickByUserId: Map<number, string>;
  styleByUserId: Map<number, string | undefined>;
  onLike: () => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const liveNick = reply.authorId ? nickByUserId.get(reply.authorId) : undefined;
  const displayNick = liveNick ?? reply.author;
  const authorStyleId = reply.authorId ? styleByUserId.get(reply.authorId) : undefined;
  const profileHref = `/membro/${getMemberSlug({ nickname: displayNick })}`;

  return (
    <article className="group relative flex items-start gap-[10px]">
      <Link
        href={profileHref}
        aria-label={`Ver perfil de ${displayNick}`}
        className="shrink-0 transition-opacity hover:opacity-80"
      >
        {reply.authorAvatar ? (
          <div className="relative h-[32px] w-[32px] overflow-hidden rounded-full bg-[#efeae6]">
            <Image
              src={reply.authorAvatar}
              alt={displayNick}
              fill
              className="object-cover"
              sizes="32px"
            />
          </div>
        ) : (
          <div className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[#efeae6] text-[12px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            {displayNick.charAt(0)}
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={profileHref}
          className="inline-block max-w-full truncate-glow text-[12px] font-bold tracking-[-0.03em] text-[#0f0f0f] transition-opacity hover:opacity-70"
        >
          <StyledName styleId={authorStyleId}>{displayNick}</StyledName>
        </Link>
        <p className="-mt-[1px] text-[10px] font-medium tracking-[-0.03em] text-[#adadad]">
          {formatCommentDate(reply.createdAt)}
        </p>
        {reply.body && (
          <p className="mt-[6px] text-[12px] font-medium leading-[1.45] tracking-[-0.02em] text-[#666666]">
            {reply.body}
          </p>
        )}
        {(reply.imageUrl || reply.gifUrl) && (
          <div className="mt-[8px] overflow-hidden rounded-[10px] bg-[#ededed]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={reply.imageUrl ?? reply.gifUrl ?? ""}
              alt=""
              className="max-h-[200px] w-auto max-w-full object-contain"
            />
          </div>
        )}

        {/* Like row for reply */}
        <div className="mt-[6px] flex items-center gap-[10px]">
          <button
            type="button"
            onClick={onLike}
            aria-label={reply.likedByMe ? "Descurtir resposta" : "Curtir resposta"}
            className="flex items-center gap-[4px] text-[11px] font-semibold tracking-[-0.01em] transition-colors"
          >
            <Heart
              className={`h-[12px] w-[12px] transition-colors ${
                reply.likedByMe
                  ? "fill-[#ff4100] text-[#ff4100]"
                  : "text-[#c9bfba]"
              }`}
              strokeWidth={2}
            />
            {(reply.likesCount ?? 0) > 0 && (
              <span
                className={
                  reply.likedByMe ? "text-[#ff4100]" : "text-[#c9bfba]"
                }
              >
                {reply.likesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Excluir resposta"
          className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[#b0a8a4] opacity-0 transition-opacity hover:bg-[#fee2e2] hover:text-[#c53030] group-hover:opacity-100"
        >
          <X className="h-[10px] w-[10px]" strokeWidth={2.4} />
        </button>
      )}
    </article>
  );
}

// ─── Main section ──────────────────────────────────────────────────────────────

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
  const { comments, addComment, removeComment, toggleLike, addReply } =
    usePostComments(postId);
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

  // Which comment's reply input is open (by comment id).
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  // Which comments have their replies expanded (by comment id).
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

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

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const file = Array.from(e.clipboardData.files).find((f) =>
      f.type.startsWith("image/"),
    );
    if (file) {
      e.preventDefault();
      handleImageFile(file);
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

  function toggleRepliesExpanded(commentId: string) {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
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

              const replies = comment.replies ?? [];
              const repliesExpanded = expandedReplies.has(comment.id);
              const isReplying = replyingTo === comment.id;

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

                      {/* Like + Reply row */}
                      <div className="mt-[8px] flex items-center gap-[12px]">
                        <button
                          type="button"
                          onClick={() =>
                            toggleLike(comment.id, false, undefined)
                          }
                          aria-label={
                            comment.likedByMe
                              ? "Descurtir comentário"
                              : "Curtir comentário"
                          }
                          className="flex items-center gap-[4px] text-[11px] font-semibold tracking-[-0.01em] transition-colors"
                        >
                          <Heart
                            className={`h-[13px] w-[13px] transition-colors ${
                              comment.likedByMe
                                ? "fill-[#ff4100] text-[#ff4100]"
                                : "text-[#c9bfba]"
                            }`}
                            strokeWidth={2}
                          />
                          {(comment.likesCount ?? 0) > 0 && (
                            <span
                              className={
                                comment.likedByMe
                                  ? "text-[#ff4100]"
                                  : "text-[#c9bfba]"
                              }
                            >
                              {comment.likesCount}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setReplyingTo(isReplying ? null : comment.id)
                          }
                          className="text-[11px] font-medium tracking-[-0.01em] text-[#b0a8a4] transition-colors hover:text-[#0f0f0f]"
                        >
                          Responder
                        </button>
                      </div>

                      {/* Reply input */}
                      {isReplying && (
                        <ReplyInput
                          onSubmit={async (body, imgUrl) => {
                            await addReply(comment.id, body, imgUrl, null);
                            setReplyingTo(null);
                            // Auto-expand replies after posting.
                            setExpandedReplies((prev) => {
                              const next = new Set(prev);
                              next.add(comment.id);
                              return next;
                            });
                          }}
                          onCancel={() => setReplyingTo(null)}
                        />
                      )}

                      {/* Replies section */}
                      {replies.length > 0 && (
                        <div className="mt-[10px]">
                          {!repliesExpanded && (
                            <button
                              type="button"
                              onClick={() => toggleRepliesExpanded(comment.id)}
                              className="text-[11px] font-semibold tracking-[-0.01em] text-[#b0a8a4] transition-colors hover:text-[#0f0f0f]"
                            >
                              Ver {replies.length}{" "}
                              {replies.length === 1 ? "resposta" : "respostas"}
                            </button>
                          )}

                          {repliesExpanded && (
                            <>
                              <div className="ml-[54px] space-y-[12px]">
                                {replies.map((reply) => {
                                  const canDeleteReply =
                                    user != null &&
                                    ((reply.authorId != null &&
                                      reply.authorId === user.id) ||
                                      (postOwnerId != null &&
                                        postOwnerId === user.id) ||
                                      user.is_admin);
                                  return (
                                    <ReplyItem
                                      key={reply.id}
                                      reply={reply}
                                      nickByUserId={nickByUserId}
                                      styleByUserId={styleByUserId}
                                      onLike={() =>
                                        toggleLike(reply.id, true, comment.id)
                                      }
                                      onDelete={() => handleRemove(reply.id)}
                                      canDelete={canDeleteReply}
                                    />
                                  );
                                })}
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  toggleRepliesExpanded(comment.id)
                                }
                                className="mt-[8px] text-[11px] font-semibold tracking-[-0.01em] text-[#b0a8a4] transition-colors hover:text-[#0f0f0f]"
                              >
                                Ocultar respostas
                              </button>
                            </>
                          )}
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
            onPaste={handlePaste}
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
          {/* Mesmos icones do post-composer, escala reduzida pra caber na linha
              do comment composer: imagem SVG 22x22 e GIF pill 20x20 com
              rounded-[5px]. Visualmente equilibrados (~mesmo bounding box). */}
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            aria-label="Adicionar imagem"
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center transition-opacity hover:opacity-70 disabled:opacity-50"
          >
            <svg
              className="h-[24px] w-[24px] text-[#0f0f0f]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <clipPath id="comment-img-icon-clip">
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
              <g clipPath="url(#comment-img-icon-clip)">
                <circle cx="8.5" cy="9" r="1.6" stroke="currentColor" strokeWidth="1.5" />
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
            className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[6px] text-[8px] font-bold text-[#0f0f0f] shadow-[inset_0_0_0_1.5px_#0f0f0f] transition-opacity hover:opacity-70"
          >
            GIF
          </button>

          <button
            type="submit"
            aria-label="Enviar comentário"
            disabled={!canSubmit}
            className="ml-[8px] flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
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
