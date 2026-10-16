// Header identitas merek RE:SNAPS dengan strip gradien dan logo resmi.
import { Logo } from "./Logo";

export function BrandHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="w-full border-b border-line/60 bg-surface/70 backdrop-blur-md">
      <div className="h-1.5 w-full bg-gradient-brand" aria-hidden="true" />
      <div className="mx-auto flex max-w-xl flex-col gap-1.5 px-4 pt-4 pb-3">
        <Logo className="size-10" />
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {subtitle ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
            {subtitle}
          </p>
        ) : null}
      </div>
    </header>
  );
}
