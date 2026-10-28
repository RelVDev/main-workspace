// Komponen SVG Barcode 1D Standar Code-128B dengan quiet zone otomatis agar mudah di-scan kamera & scanner.
"use client";

import { useMemo } from "react";
import { encodeCode128B } from "@/lib/voucher";

type Barcode128Props = {
  value: string;
  height?: number;
  className?: string;
  showLabel?: boolean;
};

export function Barcode128({
  value,
  height = 56,
  className = "",
  showLabel = true,
}: Barcode128Props) {
  const { bars, totalModules } = useMemo(() => {
    try {
      const bits = encodeCode128B(value);
      const quietZone = 10;
      const rects: { x: number; w: number }[] = [];
      let i = 0;
      while (i < bits.length) {
        if (bits[i] === "1") {
          let w = 0;
          const start = i;
          while (i < bits.length && bits[i] === "1") {
            w++;
            i++;
          }
          rects.push({ x: quietZone + start, w });
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

  return (
    <div className={`flex flex-col items-center rounded-2xl bg-white p-3 shadow-inner ${className}`}>
      <svg
        viewBox={`0 0 ${totalModules} ${height}`}
        className="h-14 w-full max-w-[320px] select-none"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Barcode ${value}`}
      >
        <rect width={totalModules} height={height} fill="#FFFFFF" />
        {bars.map((b, idx) => (
          <rect
            key={idx}
            x={b.x}
            y={0}
            width={b.w}
            height={height}
            fill="#000000"
            shapeRendering="crispEdges"
          />
        ))}
      </svg>
      {showLabel ? (
        <span className="mt-1.5 font-mono text-xs font-black tracking-[0.22em] text-ink">
          {value}
        </span>
      ) : null}
    </div>
  );
}
