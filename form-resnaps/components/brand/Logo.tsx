// P02.4: logo memakai public/brand/logo.svg. Masih placeholder (TODO-ASSET).
import Image from "next/image";

export function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/brand/logo.svg"
      alt="RE:SNAPS"
      width={120}
      height={40}
      className={className}
      priority
    />
  );
}
