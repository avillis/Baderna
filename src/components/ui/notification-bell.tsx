"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useNotifications } from "@/features/panel/use-notifications";

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    setIsOpen(false);
  };

  return (
    <div className="relative flex items-center" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center rounded-full p-2 text-[#313131] transition-colors duration-200 hover:bg-[#fff4f4]"
        title="Notificações"
      >
        <svg className="h-[20px] w-[20px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute right-[2px] top-[2px] flex h-[16px] w-[16px] items-center justify-center rounded-full border-2 border-white bg-[#ff4100] text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Menu Suspenso */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-[12px] w-[320px] overflow-hidden rounded-[16px] border border-[#f0e9e5] bg-white shadow-[0px_8px_40px_rgba(0,0,0,0.14)] z-[9999]">
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
        </div>
      )}
    </div>
  );
}