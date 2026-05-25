"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type MobileNavValue = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const MobileNavContext = createContext<MobileNavValue | null>(null);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Fecha ao trocar de rota.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Trava o scroll do body + Escape fecha, enquanto o drawer tá aberto.
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

  return (
    <MobileNavContext.Provider value={{ open, setOpen }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const ctx = useContext(MobileNavContext);
  if (!ctx) {
    throw new Error("useMobileNav precisa estar dentro de <MobileNavProvider>");
  }
  return ctx;
}

/** Largura do drawer mobile — também é o quanto a página é empurrada. */
export const MOBILE_DRAWER_WIDTH = 280;
const MOBILE_CARD_RADIUS = 25;
const MOBILE_DRAWER_SWIPE_EDGE = 32;
const MOBILE_DRAWER_SWIPE_DISTANCE = 56;

/**
 * Card da página: opaco (tapa o <MobileMenu/> atrás dele) e empurrado pra
 * direita quando o drawer abre, revelando o menu. Usa `left` (e não
 * `transform`) de propósito: o header fixo lá dentro continua ancorado na
 * viewport e não desliza junto. O overflow horizontal é cortado pelo PanelShell.
 */
export function MobilePushRegion({
  children,
  bgClassName = "bg-[#f7f7f7]",
}: {
  children: ReactNode;
  /** Mesmo fundo da página: o card precisa ser opaco pra tapar o menu atrás
   *  dele quando o drawer está fechado. */
  bgClassName?: string;
}) {
  const { open, setOpen } = useMobileNav();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleSwipeGesture(startX: number, deltaX: number) {
    if (!open && startX > MOBILE_DRAWER_SWIPE_EDGE) return;
    if (!open && deltaX > MOBILE_DRAWER_SWIPE_DISTANCE) {
      setOpen(true);
      return;
    }
    if (open && deltaX < -MOBILE_DRAWER_SWIPE_DISTANCE) {
      setOpen(false);
    }
  }

  function handleTouchCancel() {
    touchStartRef.current = null;
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={(event) => {
        const start = touchStartRef.current;
        if (!start || event.changedTouches.length !== 1) {
          touchStartRef.current = null;
          return;
        }
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - start.x;
        const deltaY = touch.clientY - start.y;
        touchStartRef.current = null;

        if (Math.abs(deltaX) < MOBILE_DRAWER_SWIPE_DISTANCE) return;
        if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

        handleSwipeGesture(start.x, deltaX);
      }}
      onTouchCancel={handleTouchCancel}
      className={cn(
        "relative z-[30] min-h-screen transition-[left] duration-300 ease-out xl:left-0",
        open ? "left-[280px]" : "left-0",
      )}
    >
      {open && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-l-[25px] bg-[#ededed] shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)] xl:hidden"
        />
      )}

      <div
        className={cn(
          "relative min-h-screen xl:min-h-0",
          bgClassName,
          open ? "overflow-hidden rounded-l-[25px]" : "",
        )}
      >
        {children}

        {/* Captura toques na página empurrada pra fechar o drawer. Fica colado na
            caixa do card (que já está deslocada 280px à direita), então não cobre
            o menu revelado à esquerda. */}
        <button
          type="button"
          aria-label="Fechar menu"
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(false)}
          className={cn(
            "absolute inset-0 z-[40] bg-transparent xl:hidden",
            open ? "" : "pointer-events-none",
          )}
        />
      </div>
    </div>
  );
}
