// Komponen SVG Barcode 1D Code-128B minimalis & presisi tinggi untuk Tiket VIP RE:SNAPS.
// Mengenkode payload padat ber-bar lebar agar sangat cepat terbaca oleh webcam laptop, iPad, maupun HP.
"use client";

import { useMemo } from "react";
import { encodeCode128B } from "@/lib/voucher";

type Barcode128Props = {
  value: string;
  height?: number;
  className?: string;
  showLabel?: boolean;
  variant?: "default" | "zoom";
};

export function Barcode128({
  value,
  height = 72,
  className = "",
  showLabel = true,
  variant = "default",
}: Barcode128Props) {
  const cleanCode = value.trim().toUpperCase();
  const rawBody = cleanCode.replace(/^RSNP-/, "");

  // Gunakan payload 8-karakter inti untuk kepadatan batang 50% lebih lebar (otomatis dinormalisasi ke RSNP-XXXX saat scan)
  const encodedPayload = /^[0-9A-F]{8}$/.test(rawBody) ? rawBody : cleanCode;

  const { bars, totalModules } = useMemo(() => {
    try {
      const bits = encodeCode128B(encodedPayload);
      const quietZone = 14;
      const rects: { x: number; w: number; isGuard: boolean }[] = [];
      let i = 0;
      while (i < bits.length) {
        if (bits[i] === "1") {
          let w = 0;
          const start = i;
          while (i < bits.length && bits[i] === "1") {
            w++;
            i++;
          }
          const isGuard = start < 11 || start >= bits.length - 13;
          rects.push({ x: quietZone + start, w, isGuard });
        } else {
          i++;
        }
      }
      return {
        bars: rects,
        totalModules: bits.length + quietZone * 2,
      };
    } catch {
      return { bars: [], totalModules: 100 };
    }
  }, [encodedPayload]);

  if (bars.length === 0) return null;

  const formattedSerial =
    rawBody.length === 8
      ? `RSNP   ${rawBody.slice(0, 4)}   ${rawBody.slice(4, 8)}`
      : cleanCode;

  const guardExtra = 6;
  const svgHeight = height + guardExtra;

  return (
    <div
      className={`flex w-full flex-col items-center justify-center rounded-2xl bg-white px-4 py-3.5 ${className}`}
    >
      <svg
        viewBox={`0 0 ${totalModules} ${svgHeight}`}
        className={`${
          variant === "zoom" ? "h-24 sm:h-28" : "h-18 sm:h-20"
        } w-full max-w-[340px] select-none`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Barcode ${cleanCode}`}
      >
        <rect width={totalModules} height={svgHeight} fill="#FFFFFF" />
        {bars.map((b, idx) => (
          <rect
            key={idx}
            x={b.x}
            y={0}
            width={b.w}
            height={b.isGuard ? svgHeight : height}
            fill="#000000"
            shapeRendering="crispEdges"
          />
        ))}
      </svg>

      {showLabel ? (
        <span className="mt-2.5 font-mono text-[11px] font-bold tracking-[0.28em] text-ink/80">
          {formattedSerial}
        </span>
      ) : null}
    </div>
  );
}
