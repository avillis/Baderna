"use client";

import { useRouter } from "next/navigation";
import { LinkPreview } from "@/features/panel/components/link-preview";
import { formatPostDate, type FeedPost } from "@/features/panel/use-posts";

// ── YouTube helpers (mesma lógica do post-card) ──────────────────────────────
const YT_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s]*)?/g;

function extractYouTubeId(text: string): string | null {
  YT_RE.lastIndex = 0;
  const m = YT_RE.exec(text);
  return m ? m[1] : null;
}

function stripYouTubeUrl(text: string): string {
  YT_RE.lastIndex = 0;
  return text.replace(YT_RE, "").replace(/\n{3,}/g, "\n\n").trim();
}

const URL_RE = /https?:\/\/[^\s]+/g;

/** Play overlay idêntico ao do feed (YouTubeEmbed no post-card). */
function PlayOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-white/95 text-[#0f0f0f] shadow-[0_8px_24px_rgba(0,0,0,0.3)]">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-[24px] w-[24px] translate-x-[1px]">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </div>
  );
}

/** Thumbnail estática do YouTube com play overlay. */
function YouTubeThumbnail({ videoId }: { videoId: string }) {
  const thumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const fallback = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  return (
    <div className="relative mb-[14px] aspect-video w-full overflow-hidden rounded-[12px] bg-black">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumb}
        alt="Thumbnail do vídeo"
        className="h-full w-full object-cover"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = fallback; }}
        loading="lazy"
      />
      <PlayOverlay />
    </div>
  );
}

/** Preview do primeiro frame de vídeo uploadado. */
function VideoThumbnail({ src }: { src: string }) {
  return (
    <div className="relative mb-[14px] aspect-video w-full overflow-hidden rounded-[12px] bg-black">
      {/* #t=0.1 faz o browser pré-carregar o primeiro frame como poster */}
      <video
        src={`${src}#t=0.1`}
        preload="metadata"
        className="h-full w-full object-cover"
        muted
        playsInline
      />
      <PlayOverlay />
    </div>
  );
}

export function PinnedPostCard({
  post,
  onUnpin,
}: {
  post: FeedPost;
  onUnpin?: () => void;
}) {
  const router = useRouter();
  const media = post.imageUrl ?? post.gifUrl;
  const href = `/post/${post.shortCode || post.id}`;

  const ytId = post.content ? extractYouTubeId(post.content) : null;
  const displayText = post.content
    ? ytId
      ? stripYouTubeUrl(post.content)
      : post.content
    : "";
  URL_RE.lastIndex = 0;
  const firstPlainUrl =
    !ytId && post.content
      ? (post.content.match(URL_RE) ?? [])[0] ?? null
      : null;

  return (
    <div
      onClick={() => router.push(href)}
      className="group relative cursor-pointer rounded-[var(--panel-radius-card)] bg-white p-[22px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#fafafa]"
    >
      {/* Cabeçalho — mesmo estilo de "Histórico de Partidas" etc. */}
      <h3 className="mb-[14px] text-[14px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
        Post em destaque
      </h3>

      {/* Botão remover (só aparece quando onUnpin for passado) */}
      {onUnpin && (
        <button
          type="button"
          aria-label="Remover post em destaque"
          onClick={(e) => { e.stopPropagation(); onUnpin(); }}
          className="absolute right-[12px] top-[12px] flex h-[22px] w-[22px] items-center justify-center rounded-full text-[#b0a8a4] opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[#fee2e2] hover:text-[#c53030]"
        >
          <svg viewBox="0 0 24 24" className="h-[11px] w-[11px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* YouTube thumbnail estática com play */}
      {ytId && <YouTubeThumbnail videoId={ytId} />}

      {/* Vídeo uploadado — primeiro frame + play overlay */}
      {!ytId && !media && post.videoUrl && (
        <VideoThumbnail src={post.videoUrl} />
      )}

      {/* Imagem/GIF do post */}
      {!ytId && media && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media}
          alt=""
          className="mb-[14px] h-[180px] w-full rounded-[12px] object-cover"
          loading="lazy"
        />
      )}

      {/* Texto */}
      {displayText && (
        <p className="line-clamp-3 text-[13px] leading-[1.5] tracking-[-0.01em] text-[#0f0f0f]">
          {displayText}
        </p>
      )}

      {/* Link preview (Instagram, TikTok, etc.) — stopPropagation pra não
          disparar duas navegações quando o usuário clica no link do preview. */}
      {!ytId && firstPlainUrl && (
        <div onClick={(e) => e.stopPropagation()}>
          <LinkPreview url={firstPlainUrl} />
        </div>
      )}

      {/* Rodapé */}
      <div className="mt-[12px] flex items-center gap-[6px] text-[11px] font-medium text-[#a0a0a0]">
        <span>
          {post.likesCount} curtida{post.likesCount !== 1 ? "s" : ""}
        </span>
        <span>·</span>
        <span>
          {post.commentsCount} comentário{post.commentsCount !== 1 ? "s" : ""}
        </span>
        <span>·</span>
        <span>{formatPostDate(post.createdAt)}</span>
      </div>
    </div>
  );
}
