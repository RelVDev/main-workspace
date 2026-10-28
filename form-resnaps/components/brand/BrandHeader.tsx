// Header identitas merek RE:SNAPS yang bersih & minimalis.
import Link from "next/link";
import { Logo } from "./Logo";

export function BrandHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  badgeText?: string;
}) {
  return (
    <header className="relative z-20 w-full border-b border-line/60 bg-white/85 backdrop-blur-xl">
      <div className="h-1 w-full bg-gradient-brand" aria-hidden="true" />
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-3.5">
        <Link href="/" className="transition hover:opacity-85">
          <Logo className="size-9" subtitle="Chrysalis" />
        </Link>

        <div className="flex flex-col text-right">
          <h1 className="text-sm font-black tracking-tight text-ink sm:text-base">{title}</h1>
          {subtitle ? (
            <p className="text-[11px] font-semibold text-ink-muted">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
