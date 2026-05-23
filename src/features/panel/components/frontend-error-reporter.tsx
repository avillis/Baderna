"use client";

import { useEffect } from "react";

import { reportFrontendError } from "@/features/panel/use-error-logs";

/**
 * Captura erros JS não tratados (window.onerror) e rejeições de promise
 * (unhandledrejection) e manda pro backend pra aparecer no painel admin.
 * Monta sem render — só registra os listeners globais.
 */
export function FrontendErrorReporter() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    function onError(e: ErrorEvent) {
      void reportFrontendError({
        message: e.message || "Unknown error",
        url: window.location.href,
        stackTrace: e.error?.stack ?? `${e.filename}:${e.lineno}:${e.colno}`,
        context: {
          filename: e.filename,
          lineno: e.lineno,
          colno: e.colno,
        },
      });
    }

    function onRejection(e: PromiseRejectionEvent) {
      const reason = e.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection";
      const stack = reason instanceof Error ? reason.stack : undefined;
      void reportFrontendError({
        message,
        url: window.location.href,
        stackTrace: stack,
        context: { kind: "unhandledrejection" },
      });
    }

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
