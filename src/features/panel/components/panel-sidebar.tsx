"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, MoreHorizontal, LogOut } from "lucide-react";

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
}: {
  onClose: () => void;
  anchorRect: DOMRect;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
}) {
  const left = anchorRect.right + 36;
  const bottom = window.innerHeight - anchorRect.bottom;
  const router = useRouter();
  const { user, logout } = useAuth();
  const displayFullName = user?.name ?? panelProfile.fullName;
  const displayEmail = user?.email ?? panelProfile.email;

  async function handleLogout() {
    onClose();
    await logout();
    router.push("/entrar");
  }

  return createPortal(
    <div
      ref={dropdownRef}
      style={{ position: "fixed", left, bottom, zIndex: 9999 }}
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
          <LogOut className="h-[14px] w-[14px]" strokeWidth={2.2} />
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

                  <div className="flex items-center">
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

      <div className="xl:hidden">
        <div className="rounded-[var(--panel-radius-card)] bg-white px-5 py-5 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
          <div className="mb-4 text-[13px] font-semibold uppercase tracking-[0.22em] text-[#8d8d8d]">
            {"Navegação"}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {panelMenuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <MenuItem
                  key={item.label}
                  label={item.label}
                  tone={isActive ? "active" : "default"}
                  href={item.href}
                  mobile
                />
              );
            })}
            {user?.is_admin && (
              <MenuItem
                label="Admin"
                tone={pathname === "/admin" ? "active" : "default"}
                href="/admin"
                mobile
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
