"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useNotifications } from "@/features/panel/use-notifications";

export default function NotificationBell({
  placement = "up",
}: {
  /** "up": abre pra cima ancorado ao botão (sidebar do desktop, que fica no
   *  canto inferior). "below": abre pra baixo via portal, ancorado à direita
   *  do viewport — igual o dropdown da foto de perfil no header mobile. */
  placement?: "up" | "below";
}) {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      setAnchorRect(buttonRef.current.getBoundingClientRect());
    }
    setIsOpen((v) => !v);
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
      : "relative flex items-center justify-center rounded-full p-2 text-[#313131] transition-colors duration-200 hover:bg-[#fff4f4]";

  const panel = (
    <>
      <div className="flex items-center justify-between border-b border-[#f0e9e5] px-[16px] py-[12px]">
        <h3 className="text-[15px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
          Notificações
        </h3>
        {unreadCount > 0 && (
          <span className="rounded-full bg-[#fff4f4] px-[8px] py-[4px] text-[12px] font-semibold text-[#ff4100]">
            {unreadCount} novas
          </span>
        )}
      </div>

      <div className="max-h-[320px] overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="p-[24px] text-center text-[14px] text-[#8d8d8d]">
            Nenhuma notificação por aqui.
          </p>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`flex cursor-pointer gap-[12px] border-b border-[#f0e9e5] p-[12px] transition-colors duration-150 ${
                notif.read_at ? "bg-white opacity-70 hover:bg-[#fafafa]" : "bg-[#fff4f4] hover:bg-[#ffeaea]"
              }`}
              onClick={() => handleNotificationClick(notif.id)}
            >
              <img
                src={notif.data.author_avatar || "/default-avatar.png"}
                alt="Avatar"
                className="h-[36px] w-[36px] shrink-0 rounded-full object-cover ring-1 ring-[#ece1db]"
              />
              <div className="flex-1">
                <Link
                  href={notif.data.action_url}
                  className="block text-[13px] font-medium leading-snug tracking-[-0.01em] text-[#0f0f0f] hover:text-[#ff4100]"
                >
                  {notif.data.message}
                </Link>
              </div>
            </div>
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
          className="h-[20px] w-[20px]"
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

        {unreadCount > 0 && (
          <span className="absolute right-[2px] top-[2px] flex h-[16px] w-[16px] items-center justify-center rounded-full border-2 border-white bg-[#ff4100] text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Sidebar do desktop: abre pra cima, ancorado ao botão. */}
      {isOpen && placement === "up" && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 mb-[12px] w-[320px] overflow-hidden rounded-[16px] border border-[#f0e9e5] bg-white shadow-[0px_8px_40px_rgba(0,0,0,0.14)] z-[9999]"
        >
          {panel}
        </div>
      )}

      {/* Header mobile: abre pra baixo via portal, ancorado à direita do
          viewport — mesmo posicionamento do dropdown da foto de perfil. */}
      {isOpen &&
        placement === "below" &&
        anchorRect &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "fixed",
              right: 20,
              top: anchorRect.bottom + 8,
              zIndex: 9999,
            }}
            className="w-[320px] max-w-[calc(100vw-40px)] overflow-hidden rounded-[16px] border border-[#f0e9e5] bg-white shadow-[0px_8px_40px_rgba(0,0,0,0.14)]"
          >
            {panel}
          </div>,
          document.body,
        )}
    </div>
  );
}
