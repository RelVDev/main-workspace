// Komponen SVG Barcode 1D Standar Code-128B bergaya VIP Gala Pass RE:SNAPS
// dengan quiet zone presisi tinggi agar cepat terbaca oleh kamera maupun laser scanner.
"use client";

import { useMemo } from "react";
import { ShieldCheck, ScanLine } from "lucide-react";
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
  height = 64,
  className = "",
  showLabel = true,
  variant = "default",
}: Barcode128Props) {
  const { bars, totalModules } = useMemo(() => {
    try {
      const bits = encodeCode128B(value);
      const quietZone = 12;
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
          // Start symbol (11 modul pertama) dan Stop symbol (13 modul terakhir) diberi efek guard bar
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
  }, [value]);

  if (bars.length === 0) return null;

  // Format kode agar mudah dibaca mata (mis. RSNP-8F3A92C1 -> RSNP · 8F3A · 92C1)
  const cleanCode = value.trim().toUpperCase();
  const rawBody = cleanCode.replace(/^RSNP-/, "");
  const formattedSerial =
    rawBody.length === 8
      ? `RSNP  •  ${rawBody.slice(0, 4)}  •  ${rawBody.slice(4, 8)}`
      : cleanCode;

  const guardExtra = 6;
  const svgHeight = height + guardExtra;

  return (
    <div
      className={`relative flex w-full flex-col items-center overflow-hidden rounded-2xl border border-brand-purple/25 bg-white p-3.5 shadow-md ${className}`}
    >
      {/* Garis Aksen Holografik RE:SNAPS di Atas Barcode */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-brand" />

      {/* Header Mikro Keamanan Barcode */}
      <div className="mb-2 flex w-full items-center justify-between border-b border-line/60 pb-1.5 text-[10px] font-black uppercase tracking-widest text-ink-muted">
        <span className="inline-flex items-center gap-1.5 text-brand-purple">
          <span className="inline-block size-2 rounded-full bg-success animate-pulse" />
          RE:SNAPS 1D BARCODE
        </span>
        <span className="inline-flex items-center gap-1 font-mono text-[9px] text-brand-blue">
          <ScanLine className="size-3" />
          CODE-128B
        </span>
      </div>

      {/* Zona Putih Bersih (Quiet Zone) dengan Siku Viewfinder untuk Akurasi Scanner */}
      <div className="relative flex w-full items-center justify-center rounded-xl bg-white px-2 py-2.5 ring-1 ring-ink/8">
        {/* 4 Siku Penanda Fokus Kamera */}
        <span className="pointer-events-none absolute top-1.5 left-1.5 size-2.5 rounded-tl border-t-2 border-l-2 border-brand-blue" />
        <span className="pointer-events-none absolute top-1.5 right-1.5 size-2.5 rounded-tr border-t-2 border-r-2 border-brand-purple" />
        <span className="pointer-events-none absolute bottom-1.5 left-1.5 size-2.5 rounded-bl border-b-2 border-l-2 border-brand-magenta" />
        <span className="pointer-events-none absolute right-1.5 bottom-1.5 size-2.5 rounded-br border-r-2 border-b-2 border-brand-orange" />

        <svg
          viewBox={`0 0 ${totalModules} ${svgHeight}`}
          className={`${
            variant === "zoom" ? "h-20 sm:h-24" : "h-16 sm:h-18"
          } w-full max-w-[360px] select-none`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Barcode ${value}`}
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
      </div>

      {/* Label Nomor Seri di Bawah Batang Barcode */}
      {showLabel ? (
        <div className="mt-2.5 flex w-full items-center justify-between gap-2 rounded-xl bg-surface-soft/90 px-3 py-1.5 ring-1 ring-line/80">
          <span className="font-mono text-xs font-black tracking-[0.18em] text-ink sm:text-[13px]">
            {formattedSerial}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-success">
            <ShieldCheck className="size-3" />
            OPTICAL READY
          </span>
        </div>
      ) : null}
    </div>
  );
}
