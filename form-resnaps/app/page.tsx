"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { LogIn, LogOut, Ticket, ShieldCheck, ArrowRight } from "lucide-react";
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
      {/* Ambient Aurora Halus */}
      <div
        aria-hidden="true"
        className="animate-float-slow pointer-events-none absolute -top-28 -left-28 size-80 rounded-full bg-brand-blue/12 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-float-slow pointer-events-none absolute -right-28 bottom-0 size-80 rounded-full bg-brand-magenta/10 blur-3xl"
      />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-5">
        {showFullTicket && savedTicket ? (
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
        ) : (
          <>
            {/* Kartu Identitas Utama Minimalis */}
            <div className="w-full overflow-hidden rounded-[30px] border border-white/90 bg-white/95 p-7 text-center shadow-xl backdrop-blur-xl">
              <div className="mx-auto flex size-22 items-center justify-center overflow-hidden rounded-3xl bg-white p-1.5 shadow-md ring-1 ring-line">
                <Image
                  src="/brand/logo.png"
                  alt="RE:SNAPS"
                  width={144}
                  height={144}
                  className="size-full rounded-2xl object-cover"
                  priority
                />
              </div>

              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-gradient-brand">
                CLOSING PARTY CHRYSALIS
              </p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-ink">RE:SNAPS</h1>
              <p className="mt-1 text-xs font-medium text-ink-muted">
                Kehadiran Digital &amp; Pass Voucher Acara
              </p>
            </div>

            {/* Kartu Tiket Aktif bila Tersimpan */}
            {savedTicket ? (
              <button
                type="button"
                onClick={() => setShowFullTicket(true)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl bg-gradient-brand p-[2px] text-left shadow-lg transition hover:scale-[1.01]"
              >
                <div className="flex w-full items-center justify-between gap-3 rounded-[14px] bg-white px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple">
                      <Ticket className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-purple">
                        Pass Aktif Anda
                      </span>
                      <span className="text-sm font-black text-ink">{savedTicket.guestName}</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 rounded-xl bg-ink px-3 py-1.5 text-xs font-bold text-white">
                    Buka Pass
                    <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </button>
            ) : null}

            {/* Menu Gerbang Tamu */}
            <div className="flex w-full flex-col gap-2.5">
              <Link
                href="/masuk"
                className="flex items-center justify-between rounded-2xl border border-line/80 bg-white/95 px-4 py-3.5 shadow-xs transition hover:border-brand-blue/40 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                    <LogIn className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-ink">Check-In Masuk</span>
                    <span className="text-xs text-ink-muted">Absen masuk &amp; klaim pass</span>
                  </div>
                </div>
                <ArrowRight className="size-4 text-ink-muted" />
              </Link>

              <Link
                href="/keluar"
                className="flex items-center justify-between rounded-2xl border border-line/80 bg-white/95 px-4 py-3.5 shadow-xs transition hover:border-brand-purple/40 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple">
                    <LogOut className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-ink">Check-Out Pulang</span>
                    <span className="text-xs text-ink-muted">Konfirmasi kepulangan</span>
                  </div>
                </div>
                <ArrowRight className="size-4 text-ink-muted" />
              </Link>

              <Link
                href="/panitia"
                className="mt-2 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-ink-muted transition hover:text-ink"
              >
                <ShieldCheck className="size-3.5 text-brand-purple" />
                <span>Portal Panitia</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
