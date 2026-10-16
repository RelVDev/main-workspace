// P02.4: strip gradien tipis + logo + judul acara. Gradien hanya di sini (§7).
import { Logo } from "./Logo";

export function BrandHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="w-full">
      <div className="h-1.5 w-full bg-gradient-brand" aria-hidden="true" />
      <div className="mx-auto flex max-w-xl flex-col gap-2 px-4 pt-4 pb-2">
        <Logo />
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {subtitle ? <p className="text-sm text-ink-muted">{subtitle}</p> : null}
      </div>
    </header>
  );
}
