"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";

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
import { useMobileNav } from "@/features/panel/components/mobile-nav";

function MenuItem({
  label,
  tone,
  href,
  mobile = false,
  onClick,
}: {
  label: string;
  tone: "active" | "default";
  href: string;
  mobile?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
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

/* ─── Ícones do menu (estilo Untitled UI: stroke 2, line caps redondos) ──── */
function MenuIcon({ label }: { label: string }) {
  const cls = "h-[20px] w-[20px] flex-shrink-0";
  const props = {
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: cls,
  };
  switch (label) {
    case "Feed":
      // home-line
      return (
        <svg {...props}>
          <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" />
        </svg>
      );
    case "Meu Perfil":
      // user-circle
      return (
        <svg {...props}>
          <path d="M5.31221 18.5396C5.95135 17.0083 7.47208 15.9388 9.24304 15.9388H14.757C16.5279 15.9388 18.0489 17.0083 18.6878 18.5396M12 12C10.067 12 8.5 10.433 8.5 8.5C8.5 6.567 10.067 5 12 5C13.933 5 15.5 6.567 15.5 8.5C15.5 10.433 13.933 12 12 12ZM12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22Z" />
        </svg>
      );
    case "Membros":
      // users-01
      return (
        <svg {...props}>
          <path d="M22 21V19C22 17.1362 20.7252 15.5701 19 15.126M15.5 3.29076C16.9659 3.88415 18 5.32131 18 7C18 8.67869 16.9659 10.1159 15.5 10.7092M17 21C17 19.1362 17 18.2044 16.6955 17.4693C16.2895 16.4892 15.5108 15.7105 14.5307 15.3045C13.7956 15 12.8638 15 11 15H8C6.13623 15 5.20435 15 4.46927 15.3045C3.48915 15.7105 2.71046 16.4892 2.30448 17.4693C2 18.2044 2 19.1362 2 21M13.5 7C13.5 9.20914 11.7091 11 9.5 11C7.29086 11 5.5 9.20914 5.5 7C5.5 4.79086 7.29086 3 9.5 3C11.7091 3 13.5 4.79086 13.5 7Z" />
        </svg>
      );
    case "Ranking":
      // trophy-01
      return (
        <svg {...props}>
          <path d="M9 21H15M12 17V21M7 4H17M7 4H4C3.44772 4 3 4.44772 3 5V7C3 8.65685 4.34315 10 6 10H7M17 4H20C20.5523 4 21 4.44772 21 5V7C21 8.65685 19.6569 10 18 10H17M7 4V13C7 15.7614 9.23858 17 12 17C14.7614 17 17 15.7614 17 13V4" />
        </svg>
      );
    case "Inhouse":
      // gaming-pad-01
      return (
        <svg {...props}>
          <path d="M14.5 9.5H14.51M17 12.5H17.01M8 8V12M6 10H10M8 18H16C19.3137 18 22 15.3137 22 12C22 8.68629 19.3137 6 16 6H8C4.68629 6 2 8.68629 2 12C2 15.3137 4.68629 18 8 18Z" />
        </svg>
      );
    case "Flex":
      // bar-chart-square-up
      return (
        <svg {...props}>
          <path d="M9 17V11M12 17V7M15 17V13M6.2 21H17.8C18.9201 21 19.4802 21 19.908 20.782C20.2843 20.5903 20.5903 20.2843 20.782 19.908C21 19.4802 21 18.9201 21 17.8V6.2C21 5.07989 21 4.51984 20.782 4.09202C20.5903 3.71569 20.2843 3.40973 19.908 3.21799C19.4802 3 18.9201 3 17.8 3H6.2C5.0799 3 4.51984 3 4.09202 3.21799C3.71569 3.40973 3.40973 3.71569 3.21799 4.09202C3 4.51984 3 5.07989 3 6.2V17.8C3 18.9201 3 19.4802 3.21799 19.908C3.40973 20.2843 3.71569 20.5903 4.09202 20.782C4.51984 21 5.07989 21 6.2 21Z" />
        </svg>
      );
    case "RPG":
      // cube-04 (dado 3D)
      return (
        <svg {...props}>
          <path d="M3.27002 6.96L12 12.01L20.73 6.96M12 22.08V12M21 16V8.00002C20.9996 7.6491 20.9071 7.30441 20.7315 7.00055C20.556 6.69669 20.3037 6.44436 20 6.26902L13 2.26902C12.696 2.09322 12.3511 2.00067 12 2.00067C11.6489 2.00067 11.304 2.09322 11 2.26902L4 6.26902C3.69626 6.44436 3.44398 6.69669 3.26846 7.00055C3.09294 7.30441 3.00036 7.6491 3 8.00002V16C3.00036 16.3509 3.09294 16.6956 3.26846 16.9995C3.44398 17.3033 3.69626 17.5557 4 17.731L11 21.731C11.304 21.9068 11.6489 21.9994 12 21.9994C12.3511 21.9994 12.696 21.9068 13 21.731L20 17.731C20.3037 17.5557 20.556 17.3033 20.7315 16.9995C20.9071 16.6956 20.9996 16.3509 21 16V16Z" />
        </svg>
      );
    case "Loja":
      // shopping-bag-03
      return (
        <svg {...props}>
          <path d="M8 11V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V11M5.50221 22H18.4978C19.5777 22 20.4499 21.1207 20.4499 20.0408V8.61224C20.4499 7.53231 19.5777 6.65306 18.4978 6.65306H5.50221C4.42228 6.65306 3.55003 7.53231 3.55003 8.61224V20.0408C3.55003 21.1207 4.42228 22 5.50221 22Z" />
        </svg>
      );
    case "Admin":
      // shield-01 — pra futuro item admin no menu
      return (
        <svg {...props}>
          <path d="M3 7L12 3L21 7V12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12V7Z" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Nav com pill laranja que desliza pro item hoverado e fica fixo no clique.
 */
function SlidingNav({
  menuItems,
  pathname,
  onNavigate,
}: {
  menuItems: { label: string; href: string }[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [pill, setPill] = useState<{ top: number; height: number } | null>(null);
  const [ready, setReady] = useState(false);

  const activeIdx = menuItems.findIndex((item) => pathname === item.href);
  const targetIdx = hoveredIdx ?? activeIdx;

  useLayoutEffect(() => {
    const el = itemRefs.current[targetIdx < 0 ? 0 : targetIdx];
    if (!el) return;
    const next = { top: el.offsetTop, height: el.offsetHeight };
    setPill(next);
    // Primeira renderização: posiciona sem transição
    if (!ready) setTimeout(() => setReady(true), 0);
  }, [targetIdx, ready]);

  return (
    <div className="relative px-[14px]" onMouseLeave={() => setHoveredIdx(null)}>
      {/* Pill deslizante */}
      {pill && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-[14px] right-[14px] rounded-[var(--panel-radius-chip)] bg-[#ededed]"
          style={{
            top: pill.top,
            height: pill.height,
            transition: ready
              ? "top 0.32s cubic-bezier(0.4, 0, 0.2, 1)"
              : "none",
          }}
        />
      )}

      <div className="space-y-[15px]">
        {menuItems.map((item, index) => {
          const isTarget = index === targetIdx;
          return (
            <div
              key={item.label}
              ref={(el) => { itemRefs.current[index] = el; }}
              onMouseEnter={() => setHoveredIdx(index)}
            >
              <Link
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "relative z-[1] flex min-h-[39px] w-full items-center gap-[12px] rounded-[var(--panel-radius-chip)] px-[14px] text-left text-[16px] font-bold tracking-[-0.03em] transition-colors duration-150",
                  "text-[#0f0f0f]",
                )}
              >
                <MenuIcon label={item.label} />
                <span>{item.label}</span>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
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
  registerClose,
  anchorRect,
  dropdownRef,
  placement = "right",
}: {
  onClose: () => void;
  registerClose?: (fn: () => void) => void;
  anchorRect: DOMRect;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  placement?: "right" | "below" | "above";
}) {
  const mobileDrawerDropdownLeft = 20;
  const positionStyle =
    placement === "right"
      ? {
          position: "fixed" as const,
          left: anchorRect.right + 36,
          bottom: window.innerHeight - anchorRect.bottom,
          zIndex: 9999,
        }
      : placement === "above"
        ? {
            position: "fixed" as const,
            left: mobileDrawerDropdownLeft,
            bottom: window.innerHeight - anchorRect.top + 8,
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

  function handleClose() {
    setClosing(true);
  }

  async function handleLogout() {
    handleClose();
    await logout();
    router.push("/entrar");
  }

  const [closing, setClosing] = useState(false);

  useEffect(() => {
    registerClose?.(() => setClosing(true));
  }, [registerClose]);

  const directionClass =
    placement === "below" ? "dropdown-down" : "dropdown-up";

  return createPortal(
    <div
      ref={dropdownRef}
      style={positionStyle}
      onAnimationEnd={() => { if (closing) onClose(); }}
      className={`w-[240px] overflow-hidden rounded-[16px] bg-white shadow-[0px_8px_40px_rgba(0,0,0,0.14)] ${closing ? `${directionClass}-out` : `${directionClass}-in`}`}
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
          onClick={handleClose}
          className="flex items-center rounded-[10px] px-[10px] py-[9px] text-[14px] font-semibold tracking-[-0.02em] text-[#0f0f0f] transition-colors duration-150 hover:bg-[#fff4f4]"
        >
          Minha Conta
        </Link>

        {user?.is_admin && (
          <Link
            href="/admin"
            onClick={handleClose}
            className="flex items-center gap-[8px] rounded-[10px] px-[10px] py-[9px] text-[14px] font-semibold tracking-[-0.02em] text-[#0f0f0f] transition-colors duration-150 hover:bg-[#fff4f4]"
          >
            <span className="h-[8px] w-[8px] shrink-0 rounded-full bg-[#ff4100]" />
            {panelSidebarAdminItem.label}
          </Link>
        )}

        {panelProfile.isAdmin && (
          <Link
            href="/labs"
            onClick={handleClose}
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

/**
 * Conteúdo interno da sidebar (logo, navegação e bloco de conta). É reusado
 * tanto na sidebar fixa do desktop quanto no drawer deslizante do mobile.
 */
function SidebarInner({
  menuItems,
  pathname,
  isOnFeed,
  showLogo = true,
  dropdownPlacement = "right",
  onNavigate,
}: {
  menuItems: { label: string; href: string }[];
  pathname: string;
  isOnFeed: boolean;
  /** No drawer mobile o logo fica no header flutuante, então escondemos aqui. */
  showLogo?: boolean;
  dropdownPlacement?: "right" | "above";
  /** Chamado ao clicar num link (no mobile serve pra fechar o drawer). */
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { account } = useAccount();
  const profileSlugSource = account.gameNick.split("#")[0] || user?.name || "";

  const [acctOpen, setAcctOpen] = useState(false);
  const [acctRect, setAcctRect] = useState<DOMRect | null>(null);
  const acctBtnRef = useRef<HTMLButtonElement>(null);
  const acctDropdownRef = useRef<HTMLDivElement>(null);
  const acctClosingRef = useRef<(() => void) | null>(null);

  function closeAcct() {
    if (acctClosingRef.current) {
      acctClosingRef.current();
    } else {
      setAcctOpen(false);
    }
  }

  function toggleAcct() {
    if (acctOpen) { closeAcct(); return; }
    if (acctBtnRef.current) setAcctRect(acctBtnRef.current.getBoundingClientRect());
    setAcctOpen(true);
  }

  useEffect(() => {
    if (!acctOpen) return;
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        acctBtnRef.current?.contains(target) ||
        acctDropdownRef.current?.contains(target)
      )
        return;
      closeAcct();
    }
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [acctOpen]);

  return (
    <div className="flex h-full flex-col">
      {showLogo && (
        <div className="flex items-center justify-between px-[14px] pt-[12px]">
          <Link
            href="/"
            aria-label="Baderna"
            onClick={onNavigate}
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
              <svg
                viewBox="0 0 10 10"
                fill="none"
                className="h-[12px] w-[12px]"
                stroke="white"
                strokeWidth={1.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6.5 1.5L3 5l3.5 3.5" />
              </svg>
            </button>
          )}
        </div>
      )}

      <div className={showLogo ? "pt-[44px]" : undefined}>
        <SlidingNav
          menuItems={menuItems}
          pathname={pathname}
          onNavigate={onNavigate}
        />
      </div>

      <div className="mt-auto border-t border-[#f3ebe8] px-[6px] pb-[12px] pt-[18px]">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/minha-conta"
            onClick={onNavigate}
            className="flex min-w-0 items-center gap-3 px-[2px] py-[2px] text-left transition-opacity duration-200 hover:opacity-80"
          >
            <div className="relative h-[30px] w-[30px] shrink-0 overflow-hidden rounded-full ring-1 ring-[#ece1db]">
              <Image
                src={
                  account.avatarSrc ||
                  panelSidebarAccount.avatarSrc ||
                  getChampionAvatarSrc(
                    profileSlugSource ? slugify(profileSlugSource) : "guest",
                  )
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
                  className="max-w-[156px] truncate-glow pr-1 text-[16px] font-semibold leading-none tracking-[-0.03em] text-[#0f0f0f]"
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
            <NotificationBell
              placement={dropdownPlacement === "above" ? "above" : "up"}
            />
            <SidebarIconButton
              label="Mais opções"
              onClick={toggleAcct}
              buttonRef={acctBtnRef}
            >
              <MoreHorizontal className="h-[16px] w-[16px]" strokeWidth={2.1} />
            </SidebarIconButton>
          </div>
        </div>
      </div>

      {acctOpen && acctRect && (
        <AccountDropdown
          onClose={() => setAcctOpen(false)}
          registerClose={(fn) => { acctClosingRef.current = fn; }}
          anchorRect={acctRect}
          dropdownRef={acctDropdownRef}
          placement={dropdownPlacement}
        />
      )}
    </div>
  );
}

/**
 * Resolve a lista de itens do menu (com o "Meu Perfil" apontando pro slug do
 * próprio user). Compartilhado pela sidebar do desktop e pelo drawer mobile.
 */
function usePanelMenuModel() {
  const pathname = usePathname();
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
  return { menuItems, pathname, isOnFeed };
}

export function PanelSidebar() {
  const { menuItems, pathname, isOnFeed } = usePanelMenuModel();
  const { open: drawerOpen, setOpen: setDrawerOpen } = useMobileNav();

  return (
    <>
      {/* Desktop: sidebar fixa */}
      <aside className="relative hidden w-[318px] xl:block">
        <div className="sticky top-[45px] z-30 h-[calc(100vh-90px)] w-full">
          <div className="h-full rounded-[var(--panel-radius-card)] bg-white px-[19px] py-[24px] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
            <SidebarInner
              menuItems={menuItems}
              pathname={pathname}
              isOnFeed={isOnFeed}
            />
          </div>
        </div>
      </aside>

      {/* Mobile: header (hamburguer à esquerda, logo à direita) */}
      <header className="fixed inset-x-0 top-[12px] z-[80] flex h-[64px] items-center justify-between bg-transparent px-[16px] sm:px-[24px] xl:hidden">
        <button
          type="button"
          aria-label={drawerOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((v) => !v)}
          className="flex h-[48px] w-[48px] cursor-pointer items-center justify-center rounded-full bg-[#ededed] text-[#0f0f0f] transition-opacity hover:opacity-85"
        >
          <BurgerIcon open={drawerOpen} />
        </button>

        <Link
          href="/"
          aria-label="Baderna"
          className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#ff4100] text-white"
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
      </header>

      {/* Spacer pra reservar o espaço do header fixo (só no mobile). */}
      <div className="h-[76px] xl:hidden" />
    </>
  );
}

/**
 * Menu mobile que fica "embaixo" da página: um painel fixo na esquerda, atrás
 * do card da página (z menor). A página (MobilePushRegion) é que desliza pra
 * direita e revela este menu — por isso aqui não tem animação de translate.
 * Renderizado como irmão do card no PanelShell, nunca aninhado dentro dele.
 */
export function MobileMenu() {
  const { menuItems, pathname, isOnFeed } = usePanelMenuModel();
  const { open, setOpen } = useMobileNav();

  return (
    <div
      aria-hidden={!open}
      className={cn(
        "fixed inset-y-0 left-0 z-[20] flex w-[280px] flex-col bg-white px-[19px] pb-[24px] pt-[120px] after:pointer-events-none after:absolute after:bottom-0 after:right-[-25px] after:top-0 after:w-[25px] after:bg-white after:content-[''] xl:hidden",
        open ? "" : "pointer-events-none",
      )}
    >
      <SidebarInner
        menuItems={menuItems}
        pathname={pathname}
        isOnFeed={isOnFeed}
        showLogo={false}
        dropdownPlacement="above"
        onNavigate={() => setOpen(false)}
      />
    </div>
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
