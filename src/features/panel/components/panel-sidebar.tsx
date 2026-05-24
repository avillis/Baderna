"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, MoreHorizontal, X } from "lucide-react";

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 17L21 12M21 12L16 7M21 12H9M12 17C12 17.93 12 18.395 11.8978 18.7765C11.6204 19.8117 10.8117 20.6204 9.77646 20.8978C9.39496 21 8.92997 21 8 21H7.5C6.10218 21 5.40326 21 4.85195 20.7716C4.11687 20.4672 3.53284 19.8831 3.22836 19.1481C3 18.5967 3 17.8978 3 16.5V7.5C3 6.10217 3 5.40326 3.22836 4.85195C3.53284 4.11687 4.11687 3.53284 4.85195 3.22836C5.40326 3 6.10218 3 7.5 3H8C8.92997 3 9.39496 3 9.77646 3.10222C10.8117 3.37962 11.6204 4.18827 11.8978 5.22354C12 5.60504 12 6.07003 12 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

import {
  panelSidebarAdminItem,
  panelMenuItems,
  panelProfile,
  panelSidebarAccount,
} from "@/features/panel/panel-data";
import { StyledName } from "@/features/panel/components/styled-name";
import { getChampionAvatarSrc } from "@/features/panel/champion-avatar";
import { useAuth } from "@/features/panel/use-auth";
import { useAccount } from "@/features/panel/use-account";
import { useBadernaMembers } from "@/features/panel/use-baderna-members";
import { useMemberCoins } from "@/features/panel/use-member-coins";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/ui/notification-bell";

function MenuItem({
  label,
  tone,
  href,
  mobile = false,
}: {
  label: string;
  tone: "active" | "default";
  href: string;
  mobile?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-h-[39px] w-full items-center rounded-[var(--panel-radius-chip)] px-[14px] text-left text-[16px] font-bold tracking-[-0.03em] transition-colors duration-200",
        tone === "active"
          ? "bg-[#ff4100] text-white"
          : "text-[#0f0f0f] hover:bg-[#fff4f4]",
        mobile && "min-w-max whitespace-nowrap",
      )}
    >
      {label}
    </Link>
  );
}

function SidebarIconButton({
  children,
  label,
  onClick,
  buttonRef,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#efe6e2] text-[#313131] transition-colors duration-200 hover:bg-[#fff4f4]"
    >
      {children}
    </button>
  );
}

function AccountDropdown({
  onClose,
  anchorRect,
  dropdownRef,
  placement = "right",
}: {
  onClose: () => void;
  anchorRect: DOMRect;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  /** "right": cresce pra direita do anchor (desktop sidebar). "below":
   *  cresce pra baixo do anchor, alinhado à direita do anchor (mobile). */
  placement?: "right" | "below";
}) {
  const positionStyle =
    placement === "right"
      ? {
          position: "fixed" as const,
          left: anchorRect.right + 36,
          bottom: window.innerHeight - anchorRect.bottom,
          zIndex: 9999,
        }
      : {
          // Alinhado à margem direita do viewport (mesma usada no header).
          position: "fixed" as const,
          right: 20,
          top: anchorRect.bottom + 8,
          zIndex: 9999,
        };
  const router = useRouter();
  const { user, logout } = useAuth();
  const { account } = useAccount();
  const displayFullName = account.name || user?.name || panelProfile.fullName;
  const displayEmail = account.email || user?.email || panelProfile.email;

  async function handleLogout() {
    onClose();
    await logout();
    router.push("/entrar");
  }

  return createPortal(
    <div
      ref={dropdownRef}
      style={positionStyle}
      className="w-[240px] overflow-hidden rounded-[16px] bg-white shadow-[0px_8px_40px_rgba(0,0,0,0.14)]"
    >
      {/* Conta */}
      <div className="px-[16px] pb-[12px] pt-[16px]">
        <p className="text-[15px] font-bold leading-none tracking-[-0.03em] text-[#0f0f0f]">
          {displayFullName}
        </p>
        <p className="mt-[4px] text-[13px] leading-none text-[#8d8d8d]">
          {displayEmail}
        </p>
      </div>

      <div className="mx-[10px] h-px bg-[#f0e9e5]" />

      <CoinsRow />

      <div className="mx-[10px] h-px bg-[#f0e9e5]" />

      <div className="px-[6px] py-[6px]">
        <Link
          href="/minha-conta"
          onClick={onClose}
          className="flex items-center rounded-[10px] px-[10px] py-[9px] text-[14px] font-semibold tracking-[-0.02em] text-[#0f0f0f] transition-colors duration-150 hover:bg-[#fff4f4]"
        >
          Minha Conta
        </Link>

        {user?.is_admin && (
          <Link
            href="/admin"
            onClick={onClose}
            className="flex items-center gap-[8px] rounded-[10px] px-[10px] py-[9px] text-[14px] font-semibold tracking-[-0.02em] text-[#0f0f0f] transition-colors duration-150 hover:bg-[#fff4f4]"
          >
            <span className="h-[8px] w-[8px] shrink-0 rounded-full bg-[#ff4100]" />
            {panelSidebarAdminItem.label}
          </Link>
        )}

        {panelProfile.isAdmin && (
          <Link
            href="/labs"
            onClick={onClose}
            className="flex items-center rounded-[10px] px-[10px] py-[9px] text-[14px] font-semibold tracking-[-0.02em] text-[#0f0f0f] transition-colors duration-150 hover:bg-[#fff4f4]"
          >
            Labs
          </Link>
        )}

      </div>

      <div className="mx-[10px] h-px bg-[#f0e9e5]" />

      <div className="px-[6px] py-[6px]">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-[10px] rounded-[10px] px-[10px] py-[9px] text-[14px] font-semibold tracking-[-0.02em] text-[#cc2200] transition-colors duration-150 hover:bg-[#fff4f4]"
        >
          <LogOutIcon className="h-[14px] w-[14px]" />
          Sair
        </button>
      </div>
    </div>,
    document.body,
  );
}

function CoinsRow() {
  const { getCoinsFor } = useMemberCoins();
  const { user } = useAuth();
  const memberId = user ? String(user.id) : "__guest__";
  const coins = getCoinsFor(memberId, 0);
  return (
    <div className="flex items-center justify-between px-[16px] py-[12px]">
      <span className="text-[13px] font-semibold text-[#8d8d8d]">Saldo</span>
      <span className="inline-flex items-center gap-[6px] text-[14px] font-bold tracking-[-0.02em] text-[#0f0f0f]">
        <Image
          src="/images/coin/Coin_icon2.png"
          alt="moedas"
          width={16}
          height={16}
          className="shrink-0"
        />
        {coins.toLocaleString("pt-BR")}
      </span>
    </div>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function PanelSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { account } = useAccount();
  const members = useBadernaMembers();
  const profileSlugSource = account.gameNick.split("#")[0] || user?.name || "";
  // Prioriza o id que a API devolveu pro próprio user (evita divergência
  // de slugify entre front/backend). Fallback: gera localmente.
  const selfMember = profileSlugSource
    ? members.find((m) => m.nickname === profileSlugSource)
    : undefined;
  const meuPerfilSlug =
    selfMember?.id || (profileSlugSource ? slugify(profileSlugSource) : "");
  const isOnFeed = pathname === "/";
  const menuItems = panelMenuItems.map((item) =>
    item.label === "Meu Perfil"
      ? {
          ...item,
          href: meuPerfilSlug ? `/membro/${meuPerfilSlug}` : item.href,
        }
      : item,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function handleToggle() {
    if (!menuOpen && buttonRef.current) {
      setAnchorRect(buttonRef.current.getBoundingClientRect());
    }
    setMenuOpen((v) => !v);
  }

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (buttonRef.current && buttonRef.current.contains(e.target as Node)) return;
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) return;
      setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <>
      <aside className="relative hidden w-[318px] xl:block">
        <div className="sticky top-[45px] z-30 h-[calc(100vh-90px)] w-full">
          <div className="h-full rounded-[var(--panel-radius-card)] bg-white px-[19px] py-[24px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between px-[14px] pt-[12px]">
                <Link
                  href="/"
                  aria-label="Baderna"
                  className="inline-flex text-[#0f0f0f] transition-colors duration-200 hover:text-[#ff4100]"
                >
                  <span
                    className="block h-[44px] w-[64px] bg-current"
                    style={{
                      maskImage: "url('/logo.svg')",
                      maskPosition: "left center",
                      maskRepeat: "no-repeat",
                      maskSize: "contain",
                      WebkitMaskImage: "url('/logo.svg')",
                      WebkitMaskPosition: "left center",
                      WebkitMaskRepeat: "no-repeat",
                      WebkitMaskSize: "contain",
                    }}
                  />
                </Link>

                {!isOnFeed && (
                  <button
                    type="button"
                    aria-label="Voltar"
                    onClick={() => router.back()}
                    className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-transform duration-150 hover:scale-105 active:scale-95"
                  >
                    <ArrowLeft className="h-[16px] w-[16px]" strokeWidth={2.4} />
                  </button>
                )}
              </div>

              <div className="pt-[44px]">
                <div className="space-y-[15px] px-[14px]">
                  {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <MenuItem
                        key={item.label}
                        label={item.label}
                        tone={isActive ? "active" : "default"}
                        href={item.href}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="mt-auto border-t border-[#f3ebe8] px-[6px] pb-[12px] pt-[18px]">
                <div className="flex items-center justify-between gap-3">
                  <Link
                    href="/minha-conta"
                    className="flex min-w-0 items-center gap-3 px-[2px] py-[2px] text-left transition-opacity duration-200 hover:opacity-80"
                  >
                    <div className="relative h-[30px] w-[30px] shrink-0 overflow-hidden rounded-full ring-1 ring-[#ece1db]">
                      <Image
                        src={
                          account.avatarSrc ||
                          panelSidebarAccount.avatarSrc ||
                          getChampionAvatarSrc(profileSlugSource ? slugify(profileSlugSource) : "guest")
                        }
                        alt={user?.name ?? panelProfile.fullName}
                        fill
                        className="object-cover"
                        sizes="30px"
                        unoptimized
                      />
                    </div>
                    {(() => {
                      const [nick, tag] = account.gameNick.split("#");
                      const fallback = user?.name ?? panelProfile.displayName;
                      return (
                        <span
                          title={account.gameNick || fallback}
                          className="max-w-[156px] truncate pr-1 text-[16px] font-semibold leading-none tracking-[-0.03em] text-[#0f0f0f]"
                        >
                          {nick ? (
                            <>
                              <StyledName styleId={account.activeNameId}>
                                {nick}
                              </StyledName>
                              {tag && (
                                <span className="ml-[4px] text-[#8d8d8d]">#{tag}</span>
                              )}
                            </>
                          ) : (
                            fallback
                          )}
                        </span>
                      );
                    })()}
                  </Link>

                  <div className="flex items-center gap-1">
                    <NotificationBell />
                    <SidebarIconButton
                      label="Mais opções"
                      onClick={handleToggle}
                      buttonRef={buttonRef}
                    >
                      <MoreHorizontal className="h-[16px] w-[16px]" strokeWidth={2.1} />
                    </SidebarIconButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {menuOpen && anchorRect && (
        <AccountDropdown onClose={() => setMenuOpen(false)} anchorRect={anchorRect} dropdownRef={dropdownRef} />
      )}

      <MobileHeader />
    </>
  );
}

/**
 * Burger de 2 listras → X. Cada traço fica a 4px do centro; quando `open`,
 * ambos colapsam pro centro e giram pra formar o X.
 */
function BurgerIcon({ open }: { open: boolean }) {
  return (
    <div className="relative h-[18px] w-[18px]">
      <span
        className={cn(
          "absolute left-0 top-1/2 block h-[2px] w-full -translate-y-1/2 rounded-full bg-current transition-transform duration-300 ease-out",
          open ? "rotate-45" : "-translate-y-[5px]",
        )}
      />
      <span
        className={cn(
          "absolute left-0 top-1/2 block h-[2px] w-full -translate-y-1/2 rounded-full bg-current transition-transform duration-300 ease-out",
          open ? "-rotate-45" : "translate-y-[3px]",
        )}
      />
    </div>
  );
}

function MobileHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { account } = useAccount();
  const members = useBadernaMembers();
  const profileSlugSource = account.gameNick.split("#")[0] || user?.name || "";
  const selfMember = profileSlugSource
    ? members.find((m) => m.nickname === profileSlugSource)
    : undefined;
  const meuPerfilSlug =
    selfMember?.id || (profileSlugSource ? slugify(profileSlugSource) : "");
  const [open, setOpen] = useState(false);
  // `mounted` controla se o overlay tá no DOM; `open` controla o estado
  // ativo. Quando fecha, mantém montado pela duração da animação reversa.
  const [mounted, setMounted] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const [acctRect, setAcctRect] = useState<DOMRect | null>(null);
  const acctBtnRef = useRef<HTMLButtonElement>(null);
  const acctDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    // Tempo total: 0.4s (animação base) + atraso máximo dos itens.
    const t = window.setTimeout(() => setMounted(false), 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggleAcct() {
    const rect = acctBtnRef.current?.getBoundingClientRect();
    if (rect) setAcctRect(rect);
    setAcctOpen((v) => !v);
  }

  // Fecha dropdown clicando fora.
  useEffect(() => {
    if (!acctOpen) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        acctBtnRef.current?.contains(target) ||
        acctDropdownRef.current?.contains(target)
      ) return;
      setAcctOpen(false);
    }
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [acctOpen]);

  // Trava scroll do body quando o menu tá aberto.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Fecha ao trocar de rota.
  useEffect(() => {
    setOpen(false);
    setAcctOpen(false);
  }, [pathname]);

  const items = panelMenuItems.map((item) =>
    item.label === "Meu Perfil"
      ? { ...item, href: meuPerfilSlug ? `/membro/${meuPerfilSlug}` : item.href }
      : item,
  );

  return (
    <>
      <header className="fixed inset-x-0 top-[12px] z-[70] flex h-[64px] items-center justify-between bg-transparent px-[16px] sm:px-[24px] xl:hidden">
        <Link
          href="/"
          aria-label="Baderna"
          className={cn(
            "flex h-[48px] w-[48px] items-center justify-center rounded-full transition-colors duration-300",
            open ? "bg-white text-[#ff4100]" : "bg-[#ff4100] text-white",
          )}
        >
          <span
            className="block h-[40px] w-[40px] bg-current"
            style={{
              maskImage: "url('/logo.svg')",
              maskPosition: "center",
              maskRepeat: "no-repeat",
              maskSize: "contain",
              WebkitMaskImage: "url('/logo.svg')",
              WebkitMaskPosition: "center",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskSize: "contain",
            }}
          />
        </Link>

        <div className="flex items-center gap-[10px]">
          {user && <NotificationBell />}
          {user && (
            <button
              ref={acctBtnRef}
              type="button"
              aria-label="Abrir conta"
              aria-expanded={acctOpen}
              onClick={toggleAcct}
              className="relative h-[48px] w-[48px] overflow-hidden rounded-full bg-[#ededed] transition-opacity hover:opacity-85"
            >
              {account.avatarSrc ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={account.avatarSrc}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-[14px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
                  {(account.name || user.name || "?").charAt(0).toUpperCase()}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-[48px] w-[48px] cursor-pointer flex-col items-center justify-center rounded-full bg-[#ededed] text-[#0f0f0f] transition-opacity hover:opacity-85"
          >
            <BurgerIcon open={open} />
          </button>
        </div>
      </header>

      {acctOpen && acctRect && (
        <AccountDropdown
          onClose={() => setAcctOpen(false)}
          anchorRect={acctRect}
          dropdownRef={acctDropdownRef}
          placement="below"
        />
      )}

      {/* Spacer pra reservar o espaço do header fixo (só no mobile). */}
      <div className="h-[76px] xl:hidden" />

      {/* Overlay full-screen — vermelho/laranja da brand, igual o screenshot
          do Visu Haus que serviu de referência. */}
      {mounted && (
        <div
          className={cn(
            "fixed inset-0 z-[60] flex flex-col bg-[#ff4100] xl:hidden transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0",
          )}
        >
          <nav className="flex flex-1 flex-col gap-[20px] overflow-y-auto px-[24px] pb-[32px] pt-[140px]">
            {items.map((item, i) => {
              const isActive = pathname === item.href;
              const delay = open
                ? 60 + i * 50
                : (items.length - 1 - i) * 35;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  style={{ animationDelay: `${delay}ms` }}
                  className={cn(
                    "w-fit text-[44px] font-bold leading-[1.05] tracking-[-0.04em] text-white transition-opacity",
                    open ? "mobile-menu-item-in" : "mobile-menu-item-out",
                    isActive ? "opacity-100" : "opacity-90 hover:opacity-100",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </>
  );
}
