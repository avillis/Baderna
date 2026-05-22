import { cn } from "@/lib/utils";

export function PanelEmptyCard({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <section
      className={cn(
        "min-h-[471px] rounded-[var(--panel-radius-card)] bg-white shadow-[0px_14px_50px_12px_rgba(0,0,0,0.05)]",
        className,
      )}
    >
      {label ? (
        <div className="p-6 text-sm font-semibold text-[#cfcfcf]">{label}</div>
      ) : null}
    </section>
  );
}
