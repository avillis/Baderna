"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUp, Heart, X } from "lucide-react";
import { useRef, useState } from "react";

import { useToast } from "@/components/toast";
import { GiphyPickerInline } from "@/features/panel/components/giphy-picker-modal";
import { ImageLightbox } from "@/features/panel/components/image-lightbox";
import { getMemberSlug } from "@/features/panel/members-data";
import { StyledName } from "@/features/panel/components/styled-name";
import { useAuth } from "@/features/panel/use-auth";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import { formatCommentDate, type Comment } from "@/features/panel/use-comments";
import { usePostComments } from "@/features/panel/use-post-comments";
import { uploadPostImage } from "@/features/panel/use-posts";

/* ─── Reply input inline ─────────────────────────────────────────────── */
function ReplyInput({
  onSubmit,
  onCancel,
}: {
  onSubmit: (body: string, imageUrl: string | null) => Promise<void>;
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

  function handlePaste(e: React.ClipboardEvent) {
    const imageItem = Array.from(e.clipboardData.items).find((item) =>
      item.type.startsWith("image/"),
    );
    if (!imageItem) return;
    e.preventDefault();
    const file = imageItem.getAsFile();
    if (file) handleImageFile(file);
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

  return (
    <div className="mt-[10px]">
      {imageUrl && (
        <div className="relative mb-[8px] inline-block overflow-hidden rounded-[10px] bg-[#ededed]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="max-h-[120px] w-auto max-w-full object-contain" />
          <button
            type="button"
            onClick={() => setImageUrl(null)}
            aria-label="Remover imagem"
            className="absolute right-[4px] top-[4px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-black/60 text-white"
          >
            <X className="h-[10px] w-[10px]" strokeWidth={2.4} />
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-[8px] rounded-full bg-[#EDEDED] pl-[14px] pr-[6px] py-[5px]">
          <input
            ref={(el) => { if (el) el.focus(); }}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onPaste={handlePaste}
            placeholder="Escrever resposta..."
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
            <svg className="h-[20px] w-[20px] text-[#0f0f0f]" viewBox="0 0 24 24" fill="none">
              <defs>
                <clipPath id="reply-img-clip">
                  <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                </clipPath>
              </defs>
              <rect x="3" y="3" width="18" height="18" rx="5" ry="5" stroke="currentColor" strokeWidth="1.5" />
              <g clipPath="url(#reply-img-clip)">
                <circle cx="8.5" cy="9" r="1.6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M21 15.5L16.5 11L6 21.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
            </svg>
          </button>
          <button
            type="submit"
            aria-label="Enviar resposta"
            disabled={!canSubmit}
            className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp className="h-[13px] w-[13px]" strokeWidth={2.4} />
          </button>
        </div>
      </form>
      <button
        type="button"
        onClick={onCancel}
        className="mt-[6px] ml-[4px] text-[11px] font-medium text-[#b0a8a4] hover:text-[#0f0f0f] transition-colors"
      >
        Cancelar
      </button>
    </div>
  );
}

/* ─── Single comment row ─────────────────────────────────────────────── */
function CommentRow({
  comment,
  isReply = false,
  canDelete,
  likedByMe,
  likesCount,
  nickByUserId,
  styleByUserId,
  onDelete,
  onLike,
  onReply,
  onImageClick,
}: {
  comment: Comment;
  isReply?: boolean;
  canDelete: boolean;
  likedByMe: boolean;
  likesCount: number;
  nickByUserId: Map<number, string>;
  styleByUserId: Map<number, string | undefined>;
  onDelete: () => void;
  onLike: () => void;
  onReply?: () => void;
  onImageClick: (src: string) => void;
}) {
  const liveNick = comment.authorId ? nickByUserId.get(comment.authorId) : undefined;
  const displayNick = liveNick ?? comment.author;
  const authorStyleId = comment.authorId ? styleByUserId.get(comment.authorId) : undefined;
  const profileHref = `/membro/${getMemberSlug({ nickname: displayNick })}`;
  const avatarSize = isReply ? 32 : 42;

  return (
    <div className="group relative flex items-start gap-[10px]">
      <Link
        href={profileHref}
        aria-label={`Ver perfil de ${displayNick}`}
        className="shrink-0 transition-opacity hover:opacity-80"
        style={{ width: avatarSize, height: avatarSize }}
      >
        {comment.authorAvatar ? (
          <div
            className="relative overflow-hidden rounded-full bg-[#efeae6]"
            style={{ width: avatarSize, height: avatarSize }}
          >
            <Image
              src={comment.authorAvatar}
              alt={displayNick}
              fill
              className="object-cover"
              sizes={`${avatarSize}px`}
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-center rounded-full bg-[#efeae6] font-bold tracking-[-0.03em] text-[#0f0f0f]"
            style={{
              width: avatarSize,
              height: avatarSize,
              fontSize: isReply ? 12 : 15,
            }}
          >
            {displayNick.charAt(0)}
          </div>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={profileHref}
          className="inline-block max-w-full truncate-glow text-[13px] font-bold tracking-[-0.03em] text-[#0f0f0f] transition-opacity hover:opacity-70"
        >
          <StyledName styleId={authorStyleId}>{displayNick}</StyledName>
        </Link>
        <p className="-mt-[1px] text-[11px] font-medium tracking-[-0.03em] text-[#adadad]">
          {formatCommentDate(comment.createdAt)}
        </p>
        {comment.body && (
          <p
            className={`mt-[8px] font-medium leading-[1.45] tracking-[-0.02em] text-[#666666] ${
              isReply ? "text-[12px]" : "text-[13px]"
            }`}
          >
            {comment.body}
          </p>
        )}
        {(comment.imageUrl || comment.gifUrl) && (
          <button
            type="button"
            onClick={() => onImageClick(comment.imageUrl ?? comment.gifUrl ?? "")}
            className="mt-[10px] block w-full max-w-[360px] overflow-hidden rounded-[14px] bg-[#ededed] text-left transition-opacity hover:opacity-95"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={comment.imageUrl ?? comment.gifUrl ?? ""}
              alt=""
              className="h-[260px] w-full object-cover object-center"
            />
          </button>
        )}

        {/* Like + Reply row */}
        <div className="mt-[8px] flex items-center gap-[14px]">
          <button
            type="button"
            onClick={onLike}
            className={`flex items-center gap-[4px] text-[11px] font-semibold tracking-[-0.01em] transition-colors ${
              likedByMe ? "text-[#ff4100]" : "text-[#c9bfba] hover:text-[#ff4100]"
            }`}
          >
            <Heart
              className="h-[13px] w-[13px]"
              strokeWidth={2}
              fill={likedByMe ? "currentColor" : "none"}
            />
            {likesCount > 0 && <span>{likesCount}</span>}
          </button>

          {!isReply && onReply && (
            <button
              type="button"
              onClick={onReply}
              className="text-[11px] font-medium text-[#b0a8a4] transition-colors hover:text-[#0f0f0f]"
            >
              Responder
            </button>
          )}
        </div>
      </div>

      {canDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Excluir comentário"
          className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[#b0a8a4] opacity-0 transition-opacity hover:bg-[#fee2e2] hover:text-[#c53030] group-hover:opacity-100"
        >
          <X className="h-[11px] w-[11px]" strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}

/* ─── Main section ───────────────────────────────────────────────────── */
export function PostCommentsSection({
  postId,
  postOwnerId,
  onCountChange,
}: {
  postId: number;
  postOwnerId: number | null;
  onCountChange?: (count: number) => void;
}) {
  const { comments, addComment, addReply, removeComment, toggleLike } = usePostComments(postId);
  const { user } = useAuth();
  const members = useBadernaMembers();
  const toast = useToast();
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [giphyOpen, setGiphyOpen] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const fileInput = useRef<HTMLInputElement>(null);

  const mediaUrl = imageUrl ?? gifUrl;
  const canSubmit = (draft.trim().length > 0 || mediaUrl) && !submitting && !uploading;

  // Mapeia user_id → nick/estilo live
  const nickByUserId = new Map<number, string>();
  const styleByUserId = new Map<number, string | undefined>();
  for (const m of members) {
    if (m.userId) {
      nickByUserId.set(m.userId, m.nickname);
      styleByUserId.set(m.userId, m.activeNameId);
    }
  }

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

  function handlePaste(e: React.ClipboardEvent) {
    const imageItem = Array.from(e.clipboardData.items).find((item) =>
      item.type.startsWith("image/"),
    );
    if (!imageItem) return;
    e.preventDefault();
    const file = imageItem.getAsFile();
    if (file) handleImageFile(file);
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
    if (ok) {
      // Count top-level comments
      const totalAfter = comments.filter((c) => c.id !== id).length;
      onCountChange?.(totalAfter);
    }
  }

  function toggleExpanded(id: string) {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function canDeleteComment(comment: Comment): boolean {
    if (!user) return false;
    return (
      (comment.authorId != null && comment.authorId === user.id) ||
      (postOwnerId != null && postOwnerId === user.id) ||
      !!user.is_admin
    );
  }

  const totalReplies = comments.reduce((acc, c) => acc + (c.replies?.length ?? 0), 0);
  const totalCount = comments.length + totalReplies;

  return (
    <section className="rounded-[20px] bg-white p-[24px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <div>
        {comments.length === 0 ? (
          <p className="py-[24px] text-center text-[13px] font-medium tracking-[-0.02em] text-[#b0a8a4]">
            Nenhum comentário ainda. Seja o primeiro!
          </p>
        ) : (
          <div className="space-y-[22px]">
            {comments.map((comment) => {
              const replies = comment.replies ?? [];
              const isExpanded = expandedReplies.has(comment.id);
              const isReplying = replyingTo === comment.id;

              return (
                <article
                  key={comment.id}
                  className="border-b border-[#f3efec] pb-[18px] last:border-b-0 last:pb-0"
                >
                  <CommentRow
                    comment={comment}
                    canDelete={canDeleteComment(comment)}
                    likedByMe={comment.likedByMe ?? false}
                    likesCount={comment.likesCount ?? 0}
                    nickByUserId={nickByUserId}
                    styleByUserId={styleByUserId}
                    onDelete={() => handleRemove(comment.id)}
                    onLike={() => toggleLike(comment.id)}
                    onReply={() => {
                      setReplyingTo((prev) => (prev === comment.id ? null : comment.id));
                      // Auto-expand replies when replying
                      if (replies.length > 0) {
                        setExpandedReplies((prev) => new Set([...prev, comment.id]));
                      }
                    }}
                    onImageClick={setLightboxSrc}
                  />

                  {/* Reply input */}
                  {isReplying && (
                    <div className="mt-[10px] pl-[52px]">
                      <ReplyInput
                        onSubmit={async (body, img) => {
                          const created = await addReply(comment.id, body, img, null);
                          if (created) {
                            setReplyingTo(null);
                            setExpandedReplies((prev) => new Set([...prev, comment.id]));
                          }
                        }}
                        onCancel={() => setReplyingTo(null)}
                      />
                    </div>
                  )}

                  {/* Replies */}
                  {replies.length > 0 && (
                    <div className="mt-[10px] pl-[52px]">
                      <button
                        type="button"
                        onClick={() => toggleExpanded(comment.id)}
                        className="mb-[12px] text-[11px] font-semibold tracking-[-0.01em] text-[#b0a8a4] transition-colors hover:text-[#0f0f0f]"
                      >
                        {isExpanded
                          ? "Ocultar respostas"
                          : `Ver ${replies.length} ${replies.length === 1 ? "resposta" : "respostas"}`}
                      </button>

                      {isExpanded && (
                        <div className="space-y-[16px]">
                          {replies.map((reply) => (
                            <CommentRow
                              key={reply.id}
                              comment={reply}
                              isReply
                              canDelete={canDeleteComment(reply)}
                              likedByMe={reply.likedByMe ?? false}
                              likesCount={reply.likesCount ?? 0}
                              nickByUserId={nickByUserId}
                              styleByUserId={styleByUserId}
                              onDelete={() => handleRemove(reply.id)}
                              onLike={() => toggleLike(reply.id)}
                              onImageClick={setLightboxSrc}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Main comment input */}
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
              onClick={() => { setImageUrl(null); setGifUrl(null); }}
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
            className="flex h-[30px] w-[30px] shrink-0 items-center justify-center transition-opacity hover:opacity-70 disabled:opacity-50"
          >
            <svg className="h-[24px] w-[24px] text-[#0f0f0f]" viewBox="0 0 24 24" fill="none">
              <defs>
                <clipPath id="comment-img-icon-clip">
                  <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                </clipPath>
              </defs>
              <rect x="3" y="3" width="18" height="18" rx="5" ry="5" stroke="currentColor" strokeWidth="1.5" />
              <g clipPath="url(#comment-img-icon-clip)">
                <circle cx="8.5" cy="9" r="1.6" stroke="currentColor" strokeWidth="1.5" />
                <path d="M21 15.5L16.5 11L6 21.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </section>
  );
}
