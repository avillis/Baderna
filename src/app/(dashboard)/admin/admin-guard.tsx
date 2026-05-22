"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/features/panel/use-auth";

/**
 * Guard client-side que só renderiza children pra admins.
 * Não-admin é redirecionado pra home.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, hydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!hydrated) return;
    if (!user || !user.is_admin) {
      router.replace("/");
    }
  }, [hydrated, user, router]);

  if (!hydrated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[13px] text-[#8d8d8d]">
        Carregando...
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[13px] text-[#8d8d8d]">
        Acesso restrito a administradores.
      </div>
    );
  }

  return <>{children}</>;
}
