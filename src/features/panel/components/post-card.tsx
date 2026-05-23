"use client";

import { MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getMemberSlug } from "@/features/panel/members-data";
import { useAuth } from "@/features/panel/use-auth";
import { formatPostDate, type FeedPost } from "@/features/panel/use-posts";

export function PostCard({
  post,
  onLike,
  onDelete,
  expanded = false,
}: {
  post: FeedPost;
  onLike?: (id: number) => void;
  onDelete?: (id: number) => void;
  /** True na página permalink: imagem em resolução completa sem crop. */
  expanded?: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const media = post.imageUrl ?? post.gifUrl;
  const canDelete =
    onDelete && user && (user.id === post.author.id || user.is_admin);

  // Slug do autor pra link do perfil (mesma lógica do useBadernaMembers)
  const authorSlug = post.author.gameNick
    ? getMemberSlug({ nickname: post.author.gameNick.split("#")[0] })
    : "";

  // Click no card → permalink do post. Buttons/links internos param
  // propagação pra não disparar duas navegações.
  function handleCardClick(e: React.MouseEvent) {
    // Ignora clicks em mídia (deixa zoom no futuro), texto selecionado, etc.
    const target = e.target as HTMLElement;
    if (window.getSelection()?.toString()) return; // user selecionando texto
    if (target.closest("a, button")) return;
    router.push(`/post/${post.id}`);
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  function handleDelete() {
    if (!onDelete) return;
    if (window.confirm("Apagar esse post? Não dá pra desfazer.")) {
      onDelete(post.id);
    }
    setMenuOpen(false);
  }

  return (
    <article
      onClick={handleCardClick}
      className="cursor-pointer rounded-[20px] bg-white p-[20px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] transition-colors hover:bg-[#fafafa]"
    >
      <div className="flex items-start gap-[14px]">
        {authorSlug ? (
          <Link
            href={`/membro/${authorSlug}`}
            className="relative h-[48px] w-[48px] flex-shrink-0 overflow-hidden rounded-full bg-[#ededed] transition-opacity hover:opacity-85"
          >
            {post.author.avatarSrc ? (
              <Image
                src={post.author.avatarSrc}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
                unoptimized
              />
            ) : null}
          </Link>
        ) : (
          <div className="relative h-[48px] w-[48px] flex-shrink-0 overflow-hidden rounded-full bg-[#ededed]">
            {post.author.avatarSrc ? (
              <Image
                src={post.author.avatarSrc}
                alt=""
                fill
                className="object-cover"
                sizes="48px"
                unoptimized
              />
            ) : null}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-[8px]">
            {authorSlug ? (
              <Link
                href={`/membro/${authorSlug}`}
                className="truncate text-[15px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-opacity hover:opacity-80"
              >
                {post.author.name ?? "Anônimo"}
              </Link>
            ) : (
              <span className="truncate text-[15px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
                {post.author.name ?? "Anônimo"}
              </span>
            )}
            {post.author.gameNick && authorSlug ? (
              <Link
                href={`/membro/${authorSlug}`}
                className="truncate text-[13px] text-[#8d8d8d] transition-opacity hover:opacity-80"
              >
                @{post.author.gameNick.split("#")[0]}
              </Link>
            ) : (
              post.author.gameNick && (
                <span className="truncate text-[13px] text-[#8d8d8d]">
                  @{post.author.gameNick.split("#")[0]}
                </span>
              )
            )}
            <span className="text-[13px] text-[#8d8d8d]">·</span>
            <span className="text-[13px] text-[#8d8d8d]">
              {formatPostDate(post.createdAt)}
            </span>
            {canDelete && (
              <div className="relative ml-auto" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label="Mais opções"
                  className="flex h-[28px] w-[28px] items-center justify-center rounded-full text-[#8d8d8d] transition-colors hover:bg-[#f4f4f4]"
                >
                  <MoreHorizontal className="h-[16px] w-[16px]" strokeWidth={2} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-[34px] z-10 overflow-hidden rounded-[12px] bg-white shadow-[0px_8px_40px_rgba(0,0,0,0.14)]">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex w-full items-center gap-[8px] px-[14px] py-[10px] text-[13px] font-semibold text-[#c53030] transition-colors hover:bg-[#fff4f4]"
                    >
                      <svg
                        className="h-[14px] w-[14px]"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Apagar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {post.content && (
            <p className="mt-[6px] whitespace-pre-wrap break-words text-[15px] leading-[1.45] text-[#0f0f0f]">
              {post.content}
            </p>
          )}

          {media && (
            <div className="mt-[12px] overflow-hidden rounded-[16px] bg-[#ededed]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={media}
                alt=""
                className={
                  expanded
                    ? "h-auto w-full object-contain"
                    : "max-h-[520px] w-full object-cover"
                }
                loading="lazy"
              />
            </div>
          )}

          {/* Linha de ações: like + comentários */}
          <div className="mt-[18px] flex items-center gap-[16px]">
            <LikeButton
              liked={post.liked}
              count={post.likesCount}
              onClick={() => onLike?.(post.id)}
            />
            <CommentButton
              count={post.commentsCount}
              href={`/post/${post.id}`}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Botão de comentários: ícone muda quando o post já tem comentários
 * (balão com 3 pontinhos) vs vazio (balão sem dots). Link pro permalink.
 */
function CommentButton({ count, href }: { count: number; href: string }) {
  const hasComments = count > 0;
  return (
    <Link
      href={href}
      aria-label="Comentários"
      className="group flex items-center gap-[6px] text-[13px] font-semibold text-[#8d8d8d] transition-colors hover:text-[#ff4100]"
    >
      <span className="relative inline-flex h-[20px] w-[20px] items-center justify-center">
        {hasComments ? (
          <svg
            className="h-[18px] w-[18px]"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.5 10.5H7.51M12 10.5H12.01M16.5 10.5H16.51M9.9 19.2L11.36 21.1467C11.5771 21.4362 11.6857 21.5809 11.8188 21.6327C11.9353 21.678 12.0647 21.678 12.1812 21.6327C12.3143 21.5809 12.4229 21.4362 12.64 21.1467L14.1 19.2C14.3931 18.8091 14.5397 18.6137 14.7185 18.4645C14.9569 18.2656 15.2383 18.1248 15.5405 18.0535C15.7671 18 16.0114 18 16.5 18C17.8978 18 18.5967 18 19.1481 17.7716C19.8831 17.4672 20.4672 16.8831 20.7716 16.1481C21 15.5967 21 14.8978 21 13.5V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V13.5C3 14.8978 3 15.5967 3.22836 16.1481C3.53284 16.8831 4.11687 17.4672 4.85195 17.7716C5.40326 18 6.10218 18 7.5 18C7.98858 18 8.23287 18 8.45951 18.0535C8.76169 18.1248 9.04312 18.2656 9.2815 18.4645C9.46028 18.6137 9.60685 18.8091 9.9 19.2ZM8 10.5C8 10.7761 7.77614 11 7.5 11C7.22386 11 7 10.7761 7 10.5C7 10.2239 7.22386 10 7.5 10C7.77614 10 8 10.2239 8 10.5ZM12.5 10.5C12.5 10.7761 12.2761 11 12 11C11.7239 11 11.5 10.7761 11.5 10.5C11.5 10.2239 11.7239 10 12 10C12.2761 10 12.5 10.2239 12.5 10.5ZM17 10.5C17 10.7761 16.7761 11 16.5 11C16.2239 11 16 10.7761 16 10.5C16 10.2239 16.2239 10 16.5 10C16.7761 10 17 10.2239 17 10.5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            className="h-[18px] w-[18px]"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3 7.8C3 6.11984 3 5.27976 3.32698 4.63803C3.6146 4.07354 4.07354 3.6146 4.63803 3.32698C5.27976 3 6.11984 3 7.8 3H16.2C17.8802 3 18.7202 3 19.362 3.32698C19.9265 3.6146 20.3854 4.07354 20.673 4.63803C21 5.27976 21 6.11984 21 7.8V13.5C21 14.8978 21 15.5967 20.7716 16.1481C20.4672 16.8831 19.8831 17.4672 19.1481 17.7716C18.5967 18 17.8978 18 16.5 18C16.0114 18 15.7671 18 15.5405 18.0535C15.2383 18.1248 14.9569 18.2656 14.7185 18.4645C14.5397 18.6137 14.3931 18.8091 14.1 19.2L12.64 21.1467C12.4229 21.4362 12.3143 21.5809 12.1812 21.6327C12.0647 21.678 11.9353 21.678 11.8188 21.6327C11.6857 21.5809 11.5771 21.4362 11.36 21.1467L9.9 19.2C9.60685 18.8091 9.46028 18.6137 9.2815 18.4645C9.04312 18.2656 8.76169 18.1248 8.45951 18.0535C8.23287 18 7.98858 18 7.5 18C6.10218 18 5.40326 18 4.85195 17.7716C4.11687 17.4672 3.53284 16.8831 3.22836 16.1481C3 15.5967 3 14.8978 3 13.5V7.8Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span>{count > 0 ? count : ""}</span>
    </Link>
  );
}

/**
 * Botão de like com animação pop + celebrate ao curtir.
 */
function LikeButton({
  liked,
  count,
  onClick,
}: {
  liked: boolean;
  count: number;
  onClick: () => void;
}) {
  // Trigger pra animação: incrementa toda vez que o user curte. Usamos isso
  // como `key` no SVG filled pra forçar remount + replay da animação.
  const [animKey, setAnimKey] = useState(0);

  function handleClick() {
    // Só dispara animação na ação de CURTIR (não no descurtir).
    if (!liked) setAnimKey((k) => k + 1);
    onClick();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={liked ? "Descurtir" : "Curtir"}
      className="group flex items-center gap-[6px] text-[13px] font-semibold text-[#8d8d8d] transition-colors hover:text-[#ff4100]"
    >
      <span className="relative inline-flex h-[20px] w-[20px] items-center justify-center">
        {/* Outline quando não curtido */}
        {!liked && (
          <svg
            className="h-[18px] w-[18px] text-[#8d8d8d] transition-colors group-hover:text-[#ff4100]"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.9932 5.13581C9.9938 2.7984 6.65975 2.16964 4.15469 4.31001C1.64964 6.45038 1.29697 10.029 3.2642 12.5604C4.89982 14.6651 9.84977 19.1041 11.4721 20.5408C11.6536 20.7016 11.7444 20.7819 11.8502 20.8135C11.9426 20.8411 12.0437 20.8411 12.1361 20.8135C12.2419 20.7819 12.3327 20.7016 12.5142 20.5408C14.1365 19.1041 19.0865 14.6651 20.7221 12.5604C22.6893 10.029 22.3797 6.42787 19.8316 4.31001C17.2835 2.19216 13.9925 2.7984 11.9932 5.13581Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {/* Filled curtido — animação pop ao surgir via key */}
        {liked && (
          <svg
            key={animKey}
            className="heart-pop h-[18px] w-[18px] text-[#ff4100]"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.9932 5.13581C9.9938 2.7984 6.65975 2.16964 4.15469 4.31001C1.64964 6.45038 1.29697 10.029 3.2642 12.5604C4.89982 14.6651 9.84977 19.1041 11.4721 20.5408C11.6536 20.7016 11.7444 20.7819 11.8502 20.8135C11.9426 20.8411 12.0437 20.8411 12.1361 20.8135C12.2419 20.7819 12.3327 20.7016 12.5142 20.5408C14.1365 19.1041 19.0865 14.6651 20.7221 12.5604C22.6893 10.029 22.3797 6.42787 19.8316 4.31001C17.2835 2.19216 13.9925 2.7984 11.9932 5.13581Z"
            />
          </svg>
        )}
        {/* Raios celebrate centralizados no coração */}
        {liked && animKey > 0 && (
          <svg
            key={`celebrate-${animKey}`}
            className="heart-celebrate absolute left-1/2 top-1/2 h-[28px] w-[28px] -translate-x-1/2 -translate-y-1/2 text-[#ff4100]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
            <line x1="4.5" y1="4.5" x2="6.5" y2="6.5" />
            <line x1="17.5" y1="17.5" x2="19.5" y2="19.5" />
            <line x1="19.5" y1="4.5" x2="17.5" y2="6.5" />
            <line x1="6.5" y1="17.5" x2="4.5" y2="19.5" />
          </svg>
        )}
      </span>
      <span className={liked ? "text-[#ff4100]" : ""}>
        {count > 0 ? count : ""}
      </span>
    </button>
  );
}
