"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useNotifications, type AppNotification } from "@/features/panel/use-notifications";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import { StyledName } from "@/features/panel/components/styled-name";

/** Item de notificação individual: busca avatar e estilo de nome atuais do autor. */
function NotifItem({
  notif,
  onClick,
  onRemove,
}: {
  notif: AppNotification;
  onClick: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const members = useBadernaMembers();

  // Lookup primário: por slug (notificações novas que têm author_slug no payload).
  const memberBySlug = notif.data.author_slug
    ? members.find((m) => m.id === notif.data.author_slug)
    : null;

  // Fallback pra notificações antigas (sem author_slug): testa name E nickname
  // separadamente — não "name || nickname", que ignoraria nickname quando name
  // existe mas é o nome da conta (display_name ausente).
  // API retorna: name = display_name ?: account_name; nickname = summoner_name.
  // Mentions::authorDisplayName usa display_name ?: summoner_name ?: name,
  // então a mensagem pode começar com qualquer um dos dois.
  const memberByMsg = !memberBySlug
    ? members.find((m) => {
        const msg = notif.data.message;
        return (m.name ? msg.startsWith(m.name) : false) ||
               (m.nickname ? msg.startsWith(m.nickname) : false);
      })
    : null;

  const member = memberBySlug ?? memberByMsg;

  const avatarSrc = member?.avatarSrc || notif.data.author_avatar || "/default-avatar.png";

  // author_name: vem do payload nas novas; derivado do prefixo que casou nas antigas.
  const authorName = notif.data.author_name ?? (() => {
    if (!memberByMsg) return null;
    const msg = notif.data.message;
    if (memberByMsg.name && msg.startsWith(memberByMsg.name)) return memberByMsg.name;
    if (memberByMsg.nickname && msg.startsWith(memberByMsg.nickname)) return memberByMsg.nickname;
    return null;
  })();

  // Separa nome da ação ("X curtiu seu post" → "X" + " curtiu seu post")
  const action =
    authorName && notif.data.message.startsWith(authorName)
      ? notif.data.message.slice(authorName.length)
      : null;

  return (
    <div
      className={`flex cursor-pointer items-center gap-[12px] border-b border-[#f0e9e5] p-[12px] transition-colors duration-150 ${
        notif.read_at ? "bg-white opacity-70 hover:bg-[#fafafa]" : "bg-[#fff4f4] sm:hover:bg-[#efefef]"
      }`}
      onClick={() => onClick(notif.id)}
    >
      <img
        src={avatarSrc}
        alt="Avatar"
        className="h-[36px] w-[36px] shrink-0 rounded-full object-cover ring-1 ring-[#ece1db]"
      />
      <div className="min-w-0 flex-1">
        <Link
          href={notif.data.action_url}
          className="block text-[13px] font-medium leading-snug tracking-[-0.01em] text-[#0f0f0f] hover:text-[#ff4100]"
        >
          {action ? (
            <>
              <StyledName styleId={member?.activeNameId ?? "preto"}>{authorName!}</StyledName>
              {action}
            </>
          ) : (
            notif.data.message
          )}
        </Link>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(notif.id); }}
        aria-label="Excluir notificação"
        className="flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full text-[#a59c95] transition-colors hover:bg-[#f0e9e5] hover:text-[#0f0f0f]"
      >
        <svg className="h-[12px] w-[12px]" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 6L6 18M6 6l12 12" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

export default function NotificationBell({
  placement = "up",
}: {
  /** "up": abre pra cima ancorado ao botão, em fluxo (sidebar do desktop, que
   *  fica no canto inferior). "above": abre pra cima também, mas via portal no
   *  body — usado no drawer mobile, onde o menu fica num stacking context
   *  abaixo do card da página, então um dropdown em fluxo ficaria atrás dele.
   *  "below": abre pra baixo via portal, ancorado à direita do viewport. */
  placement?: "up" | "above" | "below";
}) {
  const { notifications, unreadCount, markAsRead, remove, removeAll } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function handleClose() {
    setClosing(true);
  }

  function handleAnimationEnd() {
    if (closing) {
      setIsOpen(false);
      setClosing(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      handleClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (isOpen) { handleClose(); return; }
    if (buttonRef.current) setAnchorRect(buttonRef.current.getBoundingClientRect());
    setIsOpen(true);
    setClosing(false);
  };

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    setIsOpen(false);
  };

  // No header mobile (placement="below") o botão usa o mesmo círculo cinza
  // 48x48 do menu/foto de perfil; na sidebar do desktop fica enxuto.
  const buttonClass =
    placement === "below"
      ? "relative flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#ededed] text-[#0f0f0f] transition-opacity duration-200 hover:opacity-85"
      : "relative flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#efe6e2] text-[#313131] transition-colors duration-200 hover:bg-[#fff4f4]";

  const bellPath =
    "M9.35419 21C10.0593 21.6224 10.9856 22 12 22C13.0145 22 13.9407 21.6224 14.6458 21M18 8C18 6.4087 17.3679 4.88258 16.2427 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.8826 2.63214 7.75738 3.75736C6.63216 4.88258 6.00002 6.4087 6.00002 8C6.00002 11.0902 5.22049 13.206 4.34968 14.6054C3.61515 15.7859 3.24788 16.3761 3.26134 16.5408C3.27626 16.7231 3.31488 16.7926 3.46179 16.9016C3.59448 17 4.19261 17 5.38887 17H18.6112C19.8074 17 20.4056 17 20.5382 16.9016C20.6852 16.7926 20.7238 16.7231 20.7387 16.5408C20.7522 16.3761 20.3849 15.7859 19.6504 14.6054C18.7795 13.206 18 11.0902 18 8Z";

  const panel = (
    <>
      <div className="flex items-center justify-between border-b border-[#f0e9e5] px-[16px] py-[12px]">
        <div className="flex items-center gap-[8px]">
          <h3 className="text-[15px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Notificações
          </h3>
          {unreadCount > 0 && (
            <span className="rounded-full bg-[#fff4f4] px-[8px] py-[4px] text-[12px] font-semibold text-[#ff4100]">
              {unreadCount} novas
            </span>
          )}
        </div>
        {notifications.length > 0 && (
          <button
            type="button"
            onClick={() => removeAll?.()}
            className="rounded-full bg-[#f0f0f0] px-[8px] py-[4px] text-[12px] font-semibold text-[#8d8d8d] transition-colors hover:bg-[#e5e5e5] hover:text-[#0f0f0f]"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="max-h-[320px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-[8px] px-[24px] py-[32px] text-center">
            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#f7f3f0] text-[#c7bdb6]">
              <svg
                className="h-[22px] w-[22px]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.35419 21C10.0593 21.6224 10.9856 22 12 22C13.0145 22 13.9407 21.6224 14.6458 21M18 8C18 6.4087 17.3679 4.88258 16.2427 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.8826 2.63214 7.75738 3.75736C6.63216 4.88258 6.00002 6.4087 6.00002 8C6.00002 11.0902 5.22049 13.206 4.34968 14.6054C3.61515 15.7859 3.24788 16.3761 3.26134 16.5408C3.27626 16.7231 3.31488 16.7926 3.46179 16.9016C3.59448 17 4.19261 17 5.38887 17H18.6112C19.8074 17 20.4056 17 20.5382 16.9016C20.6852 16.7926 20.7238 16.7231 20.7387 16.5408C20.7522 16.3761 20.3849 15.7859 19.6504 14.6054C18.7795 13.206 18 11.0902 18 8Z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <p className="text-[14px] font-bold tracking-[-0.02em] text-[#6f6f6f]">
              Tudo em dia!
            </p>
            <p className="text-[12px] font-medium text-[#a59c95]">
              Você não tem notificações novas.
            </p>
          </div>
        ) : (
          notifications.map((notif) => (
            <NotifItem
              key={notif.id}
              notif={notif}
              onClick={handleNotificationClick}
              onRemove={remove}
            />
          ))
        )}
      </div>
    </>
  );

  return (
    <div className="relative flex items-center">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={buttonClass}
        title="Notificações"
      >
        <svg
          className={placement === "below" ? "h-[20px] w-[20px]" : "h-[16px] w-[16px]"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={bellPath}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute right-[1px] top-[1px] h-[9px] w-[9px] rounded-full border-[1.5px] border-white bg-[#ff4100]" />
        )}
      </button>

      {/* Sidebar do desktop: abre pra cima, centralizado horizontalmente
          em relacao ao botao do sino (left-1/2 + -translate-x-1/2). */}
      {isOpen && placement === "up" && (
        <div
          ref={dropdownRef}
          onAnimationEnd={handleAnimationEnd}
          className={`absolute bottom-full left-1/2 mb-[12px] w-[320px] -translate-x-1/2 overflow-hidden rounded-[16px] border border-[#f0e9e5] bg-white shadow-[0px_8px_40px_rgba(0,0,0,0.14)] z-[9999] ${closing ? "dropdown-up-out" : "dropdown-up-in"}`}
        >
          {panel}
        </div>
      )}

      {/* Drawer mobile: abre pra cima via portal (left alinhado à margem do
          drawer), pra escapar do stacking context do menu e ficar sobre o
          card da página. */}
      {isOpen &&
        placement === "above" &&
        anchorRect &&
        createPortal(
          <div
            ref={dropdownRef}
            onAnimationEnd={handleAnimationEnd}
            style={{
              position: "fixed",
              left: 16,
              bottom: window.innerHeight - anchorRect.top + 8,
              zIndex: 9999,
            }}
            className={`w-[320px] max-w-[calc(100vw-40px)] overflow-hidden rounded-[16px] border border-[#f0e9e5] bg-white shadow-[0px_8px_40px_rgba(0,0,0,0.14)] ${closing ? "dropdown-up-out" : "dropdown-up-in"}`}
          >
            {panel}
          </div>,
          document.body,
        )}

      {/* Header mobile: abre pra baixo via portal, ancorado à direita do
          viewport — mesmo posicionamento do dropdown da foto de perfil. */}
      {isOpen &&
        placement === "below" &&
        anchorRect &&
        createPortal(
          <div
            ref={dropdownRef}
            onAnimationEnd={handleAnimationEnd}
            style={{
              position: "fixed",
              right: 20,
              top: anchorRect.bottom + 8,
              zIndex: 9999,
            }}
            className={`w-[320px] max-w-[calc(100vw-40px)] overflow-hidden rounded-[16px] border border-[#f0e9e5] bg-white shadow-[0px_8px_40px_rgba(0,0,0,0.14)] ${closing ? "dropdown-down-out" : "dropdown-down-in"}`}
          >
            {panel}
          </div>,
          document.body,
        )}
    </div>
  );
}
