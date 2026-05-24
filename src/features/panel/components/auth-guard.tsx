"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  installSessionExpiryInterceptor,
  useAuth,
} from "@/features/panel/use-auth";

/**
 * Wraps protected routes. Once hydrated, if there's no token in localStorage
 * we redirect the user to /entrar. Renders children only when authenticated.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, hydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Detecta 401 (sessão expirada no backend) e limpa a sessão local; o redirect
  // abaixo então leva pro /entrar automaticamente.
  useEffect(() => {
    installSessionExpiryInterceptor();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      const next = encodeURIComponent(pathname ?? "/");
      router.replace(`/entrar?next=${next}`);
    }
  }, [hydrated, token, pathname, router]);

  if (!hydrated || !token) return null;
  return <>{children}</>;
}
