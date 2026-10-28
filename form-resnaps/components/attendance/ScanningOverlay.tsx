// Animasi pemindai futuristik berpalet RE:SNAPS saat tamu memverifikasi token QR.
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { QrCode, Sparkles } from "lucide-react";
import { playScanBlip } from "@/lib/sound";

export function ScanningOverlay({ mode }: { mode: "in" | "out" }) {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    try {
      playScanBlip();
    } catch {
      // Abaikan bila audio diblokir
    }

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-10 animate-in fade-in duration-300">
      {/* Bingkai Pemindai Kaca (Glassmorphic Viewfinder) */}
      <div className="relative flex size-68 flex-col items-center justify-center overflow-hidden rounded-[28px] border border-white/90 bg-gradient-to-b from-white/95 via-surface/90 to-surface-soft/85 p-6 shadow-2xl backdrop-blur-2xl ring-1 ring-brand-purple/15 sm:size-76">
        {/* Sudut-sudut Viewfinder Glowing Berpalet RE:SNAPS */}
        <div className="absolute top-3.5 left-3.5 size-6 rounded-tl-xl border-t-3 border-l-3 border-brand-blue" />
        <div className="absolute top-3.5 right-3.5 size-6 rounded-tr-xl border-t-3 border-r-3 border-brand-purple" />
        <div className="absolute bottom-3.5 left-3.5 size-6 rounded-bl-xl border-b-3 border-l-3 border-brand-magenta" />
        <div className="absolute bottom-3.5 right-3.5 size-6 rounded-br-xl border-b-3 border-r-3 border-brand-orange" />

        {/* Laser Pemindai Bergerak Halus Naik-Turun */}
        <div
          className="animate-scanline pointer-events-none absolute inset-x-4 h-1 rounded-full bg-gradient-brand shadow-[0_0_18px_rgba(179,19,165,0.75)]"
        />

        {/* Ikon Logo Resmi Tengah */}
        <div className="relative flex size-24 items-center justify-center rounded-3xl bg-white p-1.5 shadow-lg ring-1 ring-brand-purple/15">
          <div className="relative size-full overflow-hidden rounded-2xl">
            <Image
              src="/brand/logo.png"
              alt="RE:SNAPS"
              width={96}
              height={96}
              className="size-full object-cover animate-pulse"
              priority
            />
          </div>
          <div className="absolute -right-1.5 -bottom-1.5 rounded-full bg-gradient-brand p-1.5 text-white shadow-md">
            <QrCode className="size-4" />
          </div>
        </div>

        {/* Teks Status Pemindaian */}
        <div className="mt-5 flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gradient-brand">
            <Sparkles className="size-3.5 text-brand-gold animate-spin" />
            <span>Memverifikasi Kode QR</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-ink-muted">
            Menghubungkan gerbang {mode === "in" ? "Masuk" : "Pulang"}
            <span className="inline-block w-4 text-left font-mono">{dots}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
