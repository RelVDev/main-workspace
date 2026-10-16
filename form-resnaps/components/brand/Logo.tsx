// Logo resmi RE:SNAPS dari aset 20261003_121137_0000.png
import Image from "next/image";

export function Logo({
  className = "size-9",
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={`relative overflow-hidden rounded-xl shadow-xs shrink-0 ${className}`}>
        <Image
          src="/brand/logo.png"
          alt="RE:SNAPS"
          width={80}
          height={80}
          className="size-full object-cover"
          priority
        />
      </div>
      {showText ? (
        <span className="font-extrabold tracking-tight text-ink font-sans text-lg sm:text-xl">
          RE:<span className="text-brand-blue">SNAPS</span>
        </span>
      ) : null}
    </div>
  );
}
