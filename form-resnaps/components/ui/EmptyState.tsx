// P02.5: keadaan kosong dengan ikon + judul + penjelasan.
import type { ComponentType, ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ "aria-hidden"?: boolean; className?: string }>;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
      <Icon aria-hidden={true} className="size-10 text-ink-muted" />
      <p className="text-lg font-semibold text-ink">{title}</p>
      {children ? <div className="max-w-sm text-base text-ink-muted">{children}</div> : null}
    </div>
  );
}
