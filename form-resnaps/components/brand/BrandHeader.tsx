// Header identitas merek RE:SNAPS dengan strip gradien foil, logo resmi, dan navigasi ringkas.
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Logo } from "./Logo";

export function BrandHeader({
  title,
  subtitle,
  badgeText = "CHRYSALIS 2026",
}: {
  title: string;
  subtitle?: string;
  badgeText?: string;
}) {
  return (
    <header className="relative z-20 w-full border-b border-white/80 bg-surface/80 shadow-2xs backdrop-blur-xl">
      <div className="h-1.5 w-full bg-gradient-brand animate-shimmer" aria-hidden="true" />
      <div className="mx-auto flex max-w-xl flex-col gap-2 px-4 pt-4 pb-3.5">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="transition hover:opacity-90">
            <Logo className="size-10" subtitle="Closing Party" />
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-purple/20 bg-gradient-to-r from-brand-blue/10 via-brand-magenta/10 to-brand-gold/15 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-brand-purple shadow-2xs">
            <Sparkles className="size-3 text-brand-gold" />
            {badgeText}
          </span>
        </div>

        <div className="mt-1 flex flex-col gap-0.5">
          <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">{title}</h1>
          {subtitle ? (
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
