"use client";

import {
  createContext,
  useContext,
  useEffect,
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

/**
 * Região da página que é "empurrada" pra direita quando o drawer mobile abre.
 * Usa `left` (e não `transform`) de propósito: assim os elementos `fixed` lá
 * dentro (o header e o próprio drawer) continuam ancorados na viewport e não
 * se mexem junto. O overflow horizontal é cortado pelo PanelShell.
 */
export function MobilePushRegion({ children }: { children: ReactNode }) {
  const { open } = useMobileNav();
  return (
    <div
      className={cn(
        "relative transition-[left] duration-300 ease-out xl:left-0",
        open ? "left-[280px]" : "left-0",
      )}
    >
      {children}
    </div>
  );
}
