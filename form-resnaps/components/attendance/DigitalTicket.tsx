// Tiket Digital / Boarding Pass Acara RE:SNAPS dengan efek Glassmorphism & Animasi Perayaan.
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  Share2,
  PartyPopper,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { ConfettiCanvas } from "@/components/ui/ConfettiCanvas";
import { playSuccessChime } from "@/lib/sound";
import { formatWib } from "@/lib/time";
import type { Mode } from "@/lib/qr-token";

type DigitalTicketProps = {
  mode: Mode;
  guestName: string;
  category: string | null;
  scannedAt: string;
  onFinish?: () => void;
};

export function DigitalTicket({
  mode,
  guestName,
  category,
  scannedAt,
  onFinish,
}: DigitalTicketProps) {
  const [copied, setCopied] = useState(false);
  const isMasuk = mode === "in";

  // Bunyikan nada harmonik sukses saat tiket pertama kali muncul
  useEffect(() => {
    try {
      playSuccessChime();
    } catch {
      // Abaikan bila audio diblokir browser
    }
  }, []);

  const ticketSerial = `CRS-${isMasuk ? "IN" : "OUT"}-${Math.abs(
    guestName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) * 17
  )
    .toString(36)
    .toUpperCase()
    .slice(0, 6)}`;

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tiket Absensi RE:SNAPS — ${guestName}`,
          text: `Saya sudah absen ${isMasuk ? "Masuk" : "Pulang"} di Closing Party CHRYSALIS (Pukul ${formatWib(scannedAt)}).`,
          url: window.location.href,
        });
      } catch {
        // Dibatalkan
      }
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="relative flex w-full max-w-md flex-col items-center animate-in fade-in zoom-in-95 duration-500">
      {/* Konfeti Berjatuhan */}
      <ConfettiCanvas />

      {/* Banner Selamat Datang */}
      <div className="mb-4 flex items-center gap-2 rounded-full border border-white/60 bg-surface/80 px-4 py-1.5 shadow-sm backdrop-blur-md">
        <PartyPopper className="size-4 text-brand-gold animate-bounce" />
        <span className="text-xs font-black uppercase tracking-wider text-brand-blue">
          {isMasuk ? "Selamat Datang di Acara!" : "Sampai Jumpa Kembali!"}
        </span>
        <Sparkles className="size-3.5 text-brand-coral" />
      </div>

      {/* Kartu Tiket Mewah (Glassmorphism & Perforated Stub) */}
      <div className="relative w-full overflow-hidden rounded-3xl border border-white/80 bg-gradient-to-b from-white/95 via-surface/90 to-surface-soft/90 p-0 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5">
        {/* Strip Gradien Atas */}
        <div className="h-2.5 w-full bg-gradient-brand" />

        {/* Bagian Utama Tiket */}
        <div className="flex flex-col p-6 sm:p-7">
          {/* Header Tiket: Logo Resmi & Tipe Akses */}
          <div className="flex items-center justify-between border-b border-line/60 pb-5">
            <div className="flex items-center gap-3">
              <div className="relative size-12 overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5">
                <Image
                  src="/brand/logo.png"
                  alt="RE:SNAPS"
                  width={96}
                  height={96}
                  className="size-full object-cover"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-widest text-brand-blue">
                  OFFICIAL PASS
                </span>
                <span className="text-sm font-extrabold text-ink">CHRYSALIS 2026</span>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${
                isMasuk
                  ? "bg-success/15 text-success ring-1 ring-success/30"
                  : "bg-brand-purple/15 text-brand-purple ring-1 ring-brand-purple/30"
              }`}
            >
              <CheckCircle2 className="size-3.5" />
              {isMasuk ? "ADMIT ONE" : "CHECK-OUT"}
            </span>
          </div>

          {/* Nama Tamu & Kategori */}
          <div className="flex flex-col py-6 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Nama Tamu Undangan
            </span>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
              {guestName}
            </h1>
            {category ? (
              <div className="mt-2.5 flex justify-center">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-blue/10 px-3.5 py-1 text-xs font-extrabold text-brand-blue ring-1 ring-brand-blue/20">
                  <ShieldCheck className="size-3" />
                  {category}
                </span>
              </div>
            ) : null}
          </div>

          {/* Rincian Waktu & Gerbang */}
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line/60 bg-surface/70 p-3.5 text-center text-xs backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center gap-0.5 border-r border-line/60 pr-2">
              <span className="flex items-center gap-1 text-[11px] font-bold text-ink-muted">
                <Clock className="size-3 text-brand-blue" />
                Waktu Tercatat
              </span>
              <span className="text-sm font-black tabular-nums text-ink">
                {formatWib(scannedAt)}
              </span>
            </div>

            <div className="flex flex-col items-center justify-center gap-0.5 pl-2">
              <span className="flex items-center gap-1 text-[11px] font-bold text-ink-muted">
                <Calendar className="size-3 text-brand-purple" />
                Status Gerbang
              </span>
              <span className="text-sm font-black uppercase tracking-wide text-success">
                {isMasuk ? "Masuk Terkonfirmasi" : "Selesai Pulang"}
              </span>
            </div>
          </div>
        </div>

        {/* Garis Sobekan Tiket (Perforation with Circular Notches) */}
        <div className="relative flex items-center justify-between px-2">
          <div className="size-6 -translate-x-3 rounded-full bg-canvas shadow-inner" />
          <div className="h-0 flex-1 border-b-2 border-dashed border-line/80" />
          <div className="size-6 translate-x-3 rounded-full bg-canvas shadow-inner" />
        </div>

        {/* Bagian Bawah Tiket (Stub / Barcode Estetik) */}
        <div className="flex flex-col gap-3.5 bg-surface-soft/60 p-6 pt-5 backdrop-blur-sm sm:px-7">
          <div className="flex items-center justify-between text-xs text-ink-muted">
            <span className="font-mono text-[11px] font-extrabold tracking-widest text-ink">
              NO: #{ticketSerial}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider">
              Verifikasi Kriptografis QR
            </span>
          </div>

          {/* Garis Barcode Dekoratif */}
          <div className="flex h-10 w-full items-center justify-between rounded-lg bg-white/80 px-4 py-2 shadow-inner">
            <div className="flex h-full w-full items-center justify-between gap-1 overflow-hidden opacity-85">
              {[4, 2, 6, 3, 8, 2, 4, 3, 2, 7, 3, 5, 2, 8, 3, 2, 6, 4, 3, 7, 2, 5, 4, 8, 2].map(
                (w, i) => (
                  <div
                    key={i}
                    className="h-full bg-ink"
                    style={{ width: `${w * 1.5}px` }}
                  />
                )
              )}
            </div>
          </div>

          <p className="text-center text-[11px] font-semibold text-ink-muted">
            {isMasuk
              ? "Tunjukkan tiket ini kepada panitia bila diperlukan saat berada di venue."
              : "Terima kasih atas kehadiranmu di Closing Party CHRYSALIS!"}
          </p>
        </div>
      </div>

      {/* Tombol Aksi Bawah Tiket */}
      <div className="mt-5 flex w-full flex-col gap-2.5">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface/90 px-4 py-3 text-sm font-bold text-ink shadow-sm backdrop-blur-md transition hover:bg-surface-soft"
        >
          {copied ? (
            <>
              <CheckCircle2 className="size-4 text-success" />
              Tautan Tersalin!
            </>
          ) : (
            <>
              <Share2 className="size-4 text-brand-blue" />
              Bagikan Bukti Kehadiran
            </>
          )}
        </button>

        {onFinish ? (
          <button
            type="button"
            onClick={onFinish}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-brand-blue px-4 py-3 text-sm font-extrabold text-white shadow-md transition hover:brightness-95"
          >
            Selesai & Scan Tamu Lain
            <ArrowRight className="size-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
