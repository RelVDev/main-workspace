// Logo resmi RE:SNAPS dari aset 20261003_121137_0000.png dengan tipografi gradien merek.
import Image from "next/image";

export function Logo({
  className = "size-10",
  showText = true,
  subtitle,
}: {
  className?: string;
  showText?: boolean;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`relative shrink-0 overflow-hidden rounded-2xl bg-white p-0.5 shadow-md ring-1 ring-brand-purple/15 ${className}`}
      >
        <Image
          src="/brand/logo.png"
          alt="RE:SNAPS Official Logo"
          width={96}
          height={96}
          className="size-full rounded-[14px] object-cover"
          priority
        />
      </div>
      {showText ? (
        <div className="flex flex-col leading-none">
          <span className="font-sans text-lg font-black tracking-tight sm:text-xl">
            <span className="text-brand-blue">Re</span>
            <span className="text-brand-purple">:</span>
            <span className="text-gradient-brand">snaps</span>
          </span>
          {subtitle ? (
            <span className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-ink-muted">
              {subtitle}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
