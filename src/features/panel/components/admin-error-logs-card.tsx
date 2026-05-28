"use client";

import { ChevronDown, RotateCw } from "lucide-react";

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 6V5.2C16 4.0799 16 3.51984 15.782 3.09202C15.5903 2.71569 15.2843 2.40973 14.908 2.21799C14.4802 2 13.9201 2 12.8 2H11.2C10.0799 2 9.51984 2 9.09202 2.21799C8.71569 2.40973 8.40973 2.71569 8.21799 3.09202C8 3.51984 8 4.0799 8 5.2V6M3 6H21M19 6V17.2C19 18.8802 19 19.7202 18.673 20.362C18.3854 20.9265 17.9265 21.3854 17.362 21.673C16.7202 22 15.8802 22 14.2 22H9.8C8.11984 22 7.27976 22 6.63803 21.673C6.07354 21.3854 5.6146 20.9265 5.32698 20.362C5 19.7202 5 18.8802 5 17.2V6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useErrorLogs, type ErrorLog } from "@/features/panel/use-error-logs";

function ConfirmClearLogsModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);

  function handleClose() {
    setClosing(true);
  }

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) {
      setClosing(false);
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={`${closing ? "modal-backdrop-out" : "modal-backdrop-in"} fixed inset-0 z-[9999] flex items-center justify-center bg-black/38 px-4 py-6 backdrop-blur-[2px]`}
      onClick={handleClose}
    >
      <div
        className={`${closing ? "modal-panel-out" : "modal-panel-in"} relative w-full max-w-[440px] overflow-hidden rounded-[24px] bg-white shadow-[0px_30px_90px_rgba(0,0,0,0.18)]`}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={() => { if (closing) onClose(); }}
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar"
          className="absolute right-[20px] top-[20px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#ff4100] text-white transition-opacity hover:opacity-85"
        >
          <svg
            viewBox="0 0 10 10"
            fill="none"
            className="h-[12px] w-[12px]"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5" />
          </svg>
        </button>

        <div className="px-[28px] pt-[28px] pb-[20px]">
          <h2 className="text-[22px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Limpar logs
          </h2>
          <p className="mt-[10px] text-[13px] leading-[1.6] tracking-[-0.01em] text-[#5f5f5f]">
            Tem certeza que deseja apagar <strong className="text-[#0f0f0f]">todos os logs</strong>? Essa ação não pode ser desfeita.
          </p>
        </div>

        <div className="flex justify-end border-t border-[#f3ebe8] px-[28px] py-[16px]">
          <button
            type="button"
            onClick={() => {
              onConfirm();
              handleClose();
            }}
            className="rounded-full px-5 py-2.5 text-[13px] font-bold tracking-[-0.02em] text-[#c53030] transition-colors hover:bg-[#fff0f0]"
          >
            Limpar tudo
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function levelStyle(level: ErrorLog["level"]): string {
  switch (level) {
    case "error":
      return "bg-[#fee2e2] text-[#c53030]";
    case "warning":
      return "bg-[#fef3c7] text-[#d97706]";
    default:
      return "bg-[#e0f2fe] text-[#0c5e8a]";
  }
}

function sourceStyle(source: ErrorLog["source"]): string {
  switch (source) {
    case "frontend":
      return "bg-[#ede9fe] text-[#6d28d9]";
    case "http":
      return "bg-[#fef3c7] text-[#92400e]";
    default:
      return "bg-[#f3f4f6] text-[#374151]";
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function LogRow({
  log,
  onDelete,
}: {
  log: ErrorLog;
  onDelete: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <li className="rounded-[12px] border border-[#efebe8] bg-[#fafafa]">
      <div
        onClick={() => setExpanded((v) => !v)}
        className="flex cursor-pointer items-center gap-[10px] px-[14px] py-[10px] transition-colors hover:bg-[#f4f4f4]"
      >
        <span
          className={`shrink-0 rounded-full px-[8px] py-[2px] text-[10px] font-bold uppercase tracking-wide ${levelStyle(log.level)}`}
        >
          {log.level}
        </span>
        <span
          className={`shrink-0 rounded-full px-[8px] py-[2px] text-[10px] font-bold uppercase tracking-wide ${sourceStyle(log.source)}`}
        >
          {log.source}
        </span>
        {log.statusCode && (
          <span className="shrink-0 rounded-full bg-[#f3f4f6] px-[8px] py-[2px] text-[10px] font-bold text-[#374151]">
            {log.statusCode}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#0f0f0f]">
          {log.message}
        </span>
        <span className="shrink-0 text-[11px] font-medium text-[#8d8d8d]">
          {formatDate(log.occurredAt)}
        </span>
        <ChevronDown
          className={`h-[14px] w-[14px] shrink-0 text-[#8d8d8d] transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          strokeWidth={2.2}
        />
      </div>
      {expanded && (
        <div className="space-y-[10px] border-t border-[#efebe8] bg-white px-[14px] py-[12px] text-[12px]">
          {log.url && (
            <DetailRow label="URL">
              <code className="break-all">{log.method ? `${log.method} ` : ""}{log.url}</code>
            </DetailRow>
          )}
          {log.user && (
            <DetailRow label="Usuário">
              {log.user.name}{" "}
              <span className="text-[#8d8d8d]">
                ({log.user.summonerName ?? `#${log.user.id}`})
              </span>
            </DetailRow>
          )}
          {log.ip && <DetailRow label="IP">{log.ip}</DetailRow>}
          {log.userAgent && (
            <DetailRow label="UA">
              <span className="break-all text-[11px]">{log.userAgent}</span>
            </DetailRow>
          )}
          {log.file && (
            <DetailRow label="Arquivo">
              <code className="break-all">{log.file}:{log.line}</code>
            </DetailRow>
          )}
          {log.stackTrace && (
            <DetailRow label="Stack">
              <pre className="max-h-[300px] overflow-auto whitespace-pre-wrap break-all rounded-[8px] bg-[#0f0f0f] p-[10px] text-[11px] text-[#d9d9d9]">
                {log.stackTrace}
              </pre>
            </DetailRow>
          )}
          {log.context && (
            <DetailRow label="Contexto">
              <pre className="max-h-[200px] overflow-auto rounded-[8px] bg-[#f3f4f6] p-[10px] text-[11px]">
                {JSON.stringify(log.context, null, 2)}
              </pre>
            </DetailRow>
          )}
          <div className="flex justify-end pt-[6px]">
            <button
              type="button"
              onClick={() => onDelete(log.id)}
              className="flex items-center gap-[6px] rounded-[10px] px-[10px] py-[6px] text-[11px] font-bold text-[#c53030] transition-colors hover:bg-[#fff4f4]"
            >
              <TrashIcon className="h-[12px] w-[12px]" />
              Apagar log
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-[2px] text-[10px] font-bold uppercase tracking-wide text-[#8d8d8d]">
        {label}
      </div>
      <div className="text-[12px] text-[#0f0f0f] break-words">{children}</div>
    </div>
  );
}

export function AdminErrorLogsCard() {
  const {
    logs,
    loading,
    loadingMore,
    hasMore,
    refresh,
    loadMore,
    deleteLog,
    clearAll,
  } = useErrorLogs();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore || loading) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "100px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadMore]);

  async function handleClearAll() {
    await clearAll();
  }

  return (
    <section className="rounded-[var(--panel-radius-card)] bg-white p-6 shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]">
      <div className="mb-[14px] flex flex-col gap-[6px] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[18px] font-bold tracking-[-0.03em] text-[#0f0f0f]">
            Logs do site
          </h2>
          <p className="text-[13px] font-medium text-[#8d8d8d]">
            Erros e exceções capturados — backend e frontend.
          </p>
        </div>
        <div className="flex items-center gap-[8px]">
          <button
            type="button"
            onClick={() => setConfirmClear(true)}
            disabled={loading || logs.length === 0}
            className="flex h-[36px] items-center gap-[6px] rounded-[12px] bg-[#ededed] px-[14px] text-[12px] font-bold tracking-[-0.02em] text-[#c53030] transition-colors hover:bg-[#fff0f0] disabled:opacity-40"
          >
            <TrashIcon className="h-[14px] w-[14px]" />
            Limpar
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="flex h-[36px] items-center gap-[6px] rounded-[12px] bg-[#ededed] px-[14px] text-[12px] font-bold tracking-[-0.02em] text-[#0f0f0f] transition-colors hover:bg-[#e3e3e3] disabled:opacity-60"
          >
            <RotateCw
              className={`h-[14px] w-[14px] ${loading ? "animate-spin" : ""}`}
              strokeWidth={2.2}
            />
            Atualizar
          </button>
        </div>
      </div>

      {loading && logs.length === 0 && (
        <div className="flex items-center justify-center py-[40px]">
          <svg
            className="capas-spinner h-[28px] w-[28px] [&_circle]:stroke-[#ff4100]"
            viewBox="25 25 50 50"
          >
            <circle r="20" cy="50" cx="50" />
          </svg>
        </div>
      )}

      {!loading && logs.length === 0 && (
        <p className="py-[40px] text-center text-[13px] text-[#8d8d8d]">
          Nenhum erro registrado.
        </p>
      )}

      <ul className="space-y-[8px]">
        {logs.map((log) => (
          <LogRow key={log.id} log={log} onDelete={deleteLog} />
        ))}
      </ul>

      {hasMore && <div ref={sentinelRef} className="h-[1px]" />}
      {loadingMore && (
        <div className="flex items-center justify-center py-[16px]">
          <svg
            className="capas-spinner h-[20px] w-[20px] [&_circle]:stroke-[#ff4100]"
            viewBox="25 25 50 50"
          >
            <circle r="20" cy="50" cx="50" />
          </svg>
        </div>
      )}

      <ConfirmClearLogsModal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => void handleClearAll()}
      />
    </section>
  );
}
