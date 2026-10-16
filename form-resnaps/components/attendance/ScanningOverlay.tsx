// Animasi pemindai futuristik saat tamu memverifikasi token QR.
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
      <div className="relative flex size-64 flex-col items-center justify-center overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-b from-white/90 via-surface/80 to-surface-soft/80 p-6 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 sm:size-72">
        {/* Sudut-sudut Viewfinder Glowing */}
        <div className="absolute top-3 left-3 size-5 border-t-3 border-l-3 border-brand-blue rounded-tl-lg" />
        <div className="absolute top-3 right-3 size-5 border-t-3 border-r-3 border-brand-blue rounded-tr-lg" />
        <div className="absolute bottom-3 left-3 size-5 border-b-3 border-l-3 border-brand-purple rounded-bl-lg" />
        <div className="absolute bottom-3 right-3 size-5 border-b-3 border-r-3 border-brand-purple rounded-br-lg" />

        {/* Laser Pemindai Bergerak Naik-Turun */}
        <div
          className="absolute inset-x-4 h-1 rounded-full bg-gradient-to-r from-brand-blue via-brand-magenta to-brand-coral shadow-[0_0_15px_rgba(22,119,184,0.8)] animate-bounce duration-1000"
          style={{ animationDuration: "1.8s" }}
        />

        {/* Ikon Logo Tengah */}
        <div className="relative flex size-24 items-center justify-center rounded-2xl bg-surface-soft/90 shadow-inner">
          <div className="relative size-16 overflow-hidden rounded-xl">
            <Image
              src="/brand/logo.png"
              alt="RE:SNAPS"
              width={96}
              height={96}
              className="size-full object-cover animate-pulse"
              priority
            />
          </div>
          <div className="absolute -bottom-1.5 -right-1.5 rounded-full bg-brand-blue p-1 text-white shadow-xs">
            <QrCode className="size-3.5" />
          </div>
        </div>

        {/* Teks Status Pemindaian */}
        <div className="mt-5 flex flex-col items-center text-center">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-brand-blue">
            <Sparkles className="size-3 text-brand-gold animate-spin" />
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
