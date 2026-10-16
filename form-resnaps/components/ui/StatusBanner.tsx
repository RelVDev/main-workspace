// P02.5: success/warning/error/info SELALU dengan ikon + label (§7, Lampiran A.3).
import { CircleCheck, CircleAlert, CircleX, Info } from "lucide-react";
import type { ReactNode } from "react";

type Kind = "success" | "warning" | "error" | "info";

const meta: Record<Kind, { Icon: typeof Info; label: string; box: string; text: string }> = {
  success: { Icon: CircleCheck, label: "Berhasil", box: "border-success bg-surface", text: "text-success" },
  warning: { Icon: CircleAlert, label: "Perhatian", box: "border-warning bg-surface", text: "text-warning" },
  error: { Icon: CircleX, label: "Gagal", box: "border-error bg-surface", text: "text-error" },
  info: { Icon: Info, label: "Info", box: "border-info bg-surface", text: "text-info" },
};

export function StatusBanner({
  kind,
  title,
  children,
}: {
  kind: Kind;
  title?: string;
  children?: ReactNode;
}) {
  const { Icon, label, box, text } = meta[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"} className={`flex gap-3 rounded-card border-2 p-4 ${box}`}>
      <Icon aria-hidden={true} className={`mt-0.5 size-6 shrink-0 ${text}`} />
      <div className="flex flex-col gap-1">
        <p className={`text-sm font-bold uppercase tracking-wide ${text}`}>{label}</p>
        {title ? <p className="text-lg font-semibold text-ink">{title}</p> : null}
        {children ? <div className="text-base text-ink-muted">{children}</div> : null}
      </div>
    </div>
  );
}
