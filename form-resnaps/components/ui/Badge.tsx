// P02.5: badge selalu dengan ikon + label (§7).
import type { ComponentType, ReactNode } from "react";

type Tone = "neutral" | "success" | "warning" | "error" | "info" | "brand";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-soft text-ink border-line",
  success: "bg-success text-white border-success",
  warning: "bg-warning text-white border-warning",
  error: "bg-error text-white border-error",
  info: "bg-info text-white border-info",
  brand: "bg-brand-blue text-white border-brand-blue",
};

export function Badge({
  tone = "neutral",
  icon: Icon,
  children,
}: {
  tone?: Tone;
  icon?: ComponentType<{ "aria-hidden"?: boolean; className?: string }>;
  children: ReactNode;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${tones[tone]}`}>
      {Icon ? <Icon aria-hidden={true} className="size-4" /> : null}
      {children}
    </span>
  );
}
