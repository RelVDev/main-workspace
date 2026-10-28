"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LogIn,
  LogOut,
  Sparkles,
  Ticket,
  Utensils,
  Camera,
  ShieldCheck,
  ArrowRight,
  QrCode,
} from "lucide-react";
import {
  DigitalTicket,
  SAVED_TICKET_STORAGE_KEY,
  clearSavedTicketFromStorage,
  type SavedGuestTicket,
} from "@/components/attendance/DigitalTicket";

export default function Home() {
  const [savedTicket, setSavedTicket] = useState<SavedGuestTicket | null>(null);
  const [showFullTicket, setShowFullTicket] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_TICKET_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedGuestTicket;
        if (parsed && parsed.guestName && parsed.voucherCode) {
          setSavedTicket(parsed);
          // Verifikasi apakah Admin melakukan recovery / pembatalan absen
          const param = parsed.guestId
            ? `guest_id=${encodeURIComponent(parsed.guestId)}`
            : `code=${encodeURIComponent(parsed.voucherCode)}`;
          fetch(`/api/attendance/ticket-status?${param}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (d?.ok && d.ticket?.status === "belum_hadir") {
                clearSavedTicketFromStorage();
                setSavedTicket(null);
                setShowFullTicket(false);
              }
            })
            .catch(() => {});
        }
      }
    } catch {
      // Abaikan bila localStorage tidak tersedia
    }
  }, []);

  return (
    <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden bg-canvas px-4 py-10">
      {/* Ambient Aurora Orbs Berpalet Logo RE:SNAPS */}
      <div
        aria-hidden="true"
        className="animate-float-slow pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-brand-blue/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-float-slow pointer-events-none absolute top-1/3 -right-24 size-84 rounded-full bg-brand-magenta/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-float-slow pointer-events-none absolute -bottom-24 left-1/4 size-80 rounded-full bg-brand-gold/18 blur-3xl"
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-6">
        {/* Jika tamu membuka tampilan penuh tiket tersimpan */}
        {showFullTicket && savedTicket ? (
          <div className="flex w-full flex-col items-center gap-4">
            <DigitalTicket
              mode={savedTicket.mode}
              guestId={savedTicket.guestId}
              guestName={savedTicket.guestName}
              category={savedTicket.category}
              allergies={savedTicket.allergies}
              scannedAt={savedTicket.scannedAt}
              voucherCode={savedTicket.voucherCode}
              initialMealRedeemedAt={savedTicket.mealRedeemedAt}
              initialPhotoboothRedeemedAt={savedTicket.photoboothRedeemedAt}
              isHomePreview={true}
              onFinish={() => setShowFullTicket(false)}
              onDeviceRecovered={() => {
                setSavedTicket(null);
                setShowFullTicket(false);
              }}
            />
          </div>
        ) : (
          <>
            {/* Kartu Identitas Utama RE:SNAPS */}
            <div className="w-full overflow-hidden rounded-[28px] bg-gradient-brand p-[2px] shadow-2xl animate-shimmer">
              <div className="flex flex-col items-center gap-4 rounded-[26px] bg-gradient-to-b from-white via-surface to-surface-soft p-7 text-center">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-purple/20 bg-gradient-to-r from-brand-blue/10 via-brand-magenta/10 to-brand-gold/15 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-brand-purple">
                  <Sparkles className="size-3.5 text-brand-gold" />
                  <span>CLOSING PARTY CHRYSALIS 2026</span>
                </div>

                {/* Logo Resmi RE:SNAPS */}
                <div className="relative size-28 overflow-hidden rounded-3xl bg-white p-1.5 shadow-xl ring-1 ring-brand-purple/15">
                  <Image
                    src="/brand/logo.png"
                    alt="RE:SNAPS Official Logo"
                    width={160}
                    height={160}
                    className="size-full rounded-2xl object-cover"
                    priority
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
                    RE:SNAPS — Sistem Absensi
                  </h1>
                  <p className="text-xs font-semibold leading-relaxed text-ink-muted">
                    Gerbang Kehadiran Digital, Gala Pass, serta Voucher Terpadu Konsumsi &
                    Photobooth.
                  </p>
                </div>

                {/* Highlight Fitur Voucher 2-in-1 */}
                <div className="grid w-full grid-cols-2 gap-2.5 pt-1 text-left text-xs">
                  <div className="flex items-center gap-2.5 rounded-2xl border border-line/80 bg-white/90 p-3 shadow-2xs">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-warm text-white">
                      <Utensils className="size-4" />
                    </div>
                    <div>
                      <p className="font-black text-ink">Voucher Makan</p>
                      <p className="text-[10px] font-semibold text-ink-muted">1x Scan Barcode</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-2xl border border-line/80 bg-white/90 p-3 shadow-2xs">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-cool text-white">
                      <Camera className="size-4" />
                    </div>
                    <div>
                      <p className="font-black text-ink">Photobooth</p>
                      <p className="text-[10px] font-semibold text-ink-muted">1x Scan Barcode</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kartu Akses Instan Bila Tamu Sudah Punya Tiket Tersimpan di Browser */}
            {savedTicket ? (
              <div className="w-full overflow-hidden rounded-3xl border border-brand-purple/30 bg-white/95 p-5 shadow-xl backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand text-white shadow-md">
                      <Ticket className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-wider text-brand-purple">
                        Tiket & Barcode Tersimpan
                      </span>
                      <span className="text-base font-black text-ink">{savedTicket.guestName}</span>
                      <span className="font-mono text-xs font-bold text-brand-blue">
                        Kode: {savedTicket.voucherCode}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFullTicket(true)}
                    className="inline-flex items-center gap-1.5 rounded-2xl bg-gradient-brand px-4 py-2.5 text-xs font-black text-white shadow-md transition hover:brightness-95"
                  >
                    Buka Barcode
                    <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            ) : null}

            {/* Navigasi Gerbang Tamu & Panel Panitia */}
            <div className="flex w-full flex-col gap-3">
              <Link
                href="/masuk"
                className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/90 p-4 shadow-md backdrop-blur-md transition hover:scale-[1.01] hover:bg-white hover:shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-blue/12 text-brand-blue">
                    <LogIn className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-ink">
                      Gerbang Absen Masuk & Voucher
                    </span>
                    <span className="text-xs font-semibold text-ink-muted">
                      Check-in kehadiran & ambil barcode Makan + Photobooth
                    </span>
                  </div>
                </div>
                <ArrowRight className="size-4 text-brand-blue" />
              </Link>

              <Link
                href="/keluar"
                className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/90 p-4 shadow-md backdrop-blur-md transition hover:scale-[1.01] hover:bg-white hover:shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-purple/12 text-brand-purple">
                    <LogOut className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-ink">Gerbang Absen Pulang</span>
                    <span className="text-xs font-semibold text-ink-muted">
                      Check-out saat meninggalkan area venue
                    </span>
                  </div>
                </div>
                <ArrowRight className="size-4 text-brand-purple" />
              </Link>

              <Link
                href="/panitia"
                className="mt-1 flex items-center justify-center gap-2 rounded-2xl border border-line/80 bg-surface-soft/70 px-4 py-3 text-xs font-extrabold text-ink-muted transition hover:bg-surface hover:text-ink"
              >
                <ShieldCheck className="size-4 text-brand-purple" />
                <span>Portal Dashboard & Scanner Panitia</span>
                <QrCode className="size-3.5" />
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
