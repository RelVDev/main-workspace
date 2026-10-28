// Tiket Digital VIP & Voucher Terpadu 2-in-1 (Kupon Makan + Kupon Photobooth) RE:SNAPS.
// Dilengkapi Keamanan Kunci Perangkat (1 Perangkat = 1 Tamu) & Recovery otomatis via Admin.
"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import {
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  Share2,
  PartyPopper,
  ArrowLeft,
  ShieldCheck,
  Utensils,
  Camera,
  Maximize2,
  X,
  RefreshCw,
  QrCode,
  AlertTriangle,
  Lock,
  ScanLine,
} from "lucide-react";
import { ConfettiCanvas } from "@/components/ui/ConfettiCanvas";
import { Barcode128 } from "./Barcode128";
import { playSuccessChime } from "@/lib/sound";
import { formatWib } from "@/lib/time";
import type { Mode } from "@/lib/qr-token";

export const SAVED_TICKET_STORAGE_KEY = "resnaps_guest_ticket_v1";

export type SavedGuestTicket = {
  guestId: string;
  guestName: string;
  category: string | null;
  allergies?: string | null;
  mode: Mode;
  status: "on_hold" | "active" | "checked_out";
  paymentStatus: "lunas" | "belum_lunas";
  scannedAt: string;
  holdAt?: string | null;
  voucherCode: string;
  mealRedeemedAt: string | null;
  photoboothRedeemedAt: string | null;
};

export function clearSavedTicketFromStorage() {
  try {
    localStorage.removeItem(SAVED_TICKET_STORAGE_KEY);
    localStorage.removeItem("resnaps_last_attended");
  } catch {
    // Abaikan bila localStorage tidak tersedia
  }
}

type DigitalTicketProps = {
  mode: Mode;
  guestId?: string;
  guestName: string;
  category: string | null;
  allergies?: string | null;
  scannedAt: string;
  voucherCode?: string;
  initialMealRedeemedAt?: string | null;
  initialPhotoboothRedeemedAt?: string | null;
  onFinish?: () => void;
  onDeviceRecovered?: () => void;
  isHomePreview?: boolean;
};

export function DigitalTicket({
  mode,
  guestId,
  guestName,
  category,
  allergies: initialAllergies = null,
  scannedAt,
  voucherCode: propVoucherCode,
  initialMealRedeemedAt = null,
  initialPhotoboothRedeemedAt = null,
  onFinish,
  onDeviceRecovered,
  isHomePreview = false,
}: DigitalTicketProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deviceLockEnabled, setDeviceLockEnabled] = useState(true);
  const [allergies, setAllergies] = useState<string | null>(initialAllergies);
  const [mealRedeemedAt, setMealRedeemedAt] = useState<string | null>(initialMealRedeemedAt);
  const [photoboothRedeemedAt, setPhotoboothRedeemedAt] = useState<string | null>(
    initialPhotoboothRedeemedAt,
  );

  const isMasuk = mode === "in";

  // Fallback kode voucher deterministik bila prop belum terisi
  const computedFallbackCode = `RSNP-${Math.abs(
    (guestId || guestName).split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 7),
  )
    .toString(16)
    .toUpperCase()
    .padStart(8, "0")
    .slice(0, 8)}`;

  const [voucherCode, setVoucherCode] = useState<string>(propVoucherCode || computedFallbackCode);

  // Bunyikan nada harmonik sukses saat tiket pertama kali muncul
  useEffect(() => {
    try {
      playSuccessChime();
    } catch {
      // Abaikan bila audio diblokir browser
    }
  }, []);

  // Generate QR Code ber-kontras tinggi untuk kode voucher
  useEffect(() => {
    let active = true;
    if (voucherCode) {
      QRCode.toDataURL(voucherCode, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 340,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
        .then((url) => {
          if (active) setQrDataUrl(url);
        })
        .catch(() => {
          if (active) setQrDataUrl("");
        });
    }
    return () => {
      active = false;
    };
  }, [voucherCode]);

  // Simpan tiket & barcode di localStorage browser tamu agar tidak hilang walau tab ditutup
  const persistTicketToStorage = useCallback(
    (
      nextVoucher: string,
      nextMealAt: string | null,
      nextPhotoAt: string | null,
      nextAllergies: string | null,
    ) => {
      try {
        const payload: SavedGuestTicket = {
          guestId: guestId || "",
          guestName,
          category,
          allergies: nextAllergies,
          mode,
          status: isMasuk ? "active" : "checked_out",
          paymentStatus: "lunas",
          scannedAt,
          voucherCode: nextVoucher,
          mealRedeemedAt: nextMealAt,
          photoboothRedeemedAt: nextPhotoAt,
        };
        localStorage.setItem(SAVED_TICKET_STORAGE_KEY, JSON.stringify(payload));
        localStorage.setItem(
          "resnaps_last_attended",
          JSON.stringify({
            guestId: guestId || "",
            name: guestName,
            mode,
            at: scannedAt,
            voucherCode: nextVoucher,
          }),
        );
      } catch {
        // Abaikan bila storage penuh / private mode
      }
    },
    [guestId, guestName, category, mode, isMasuk, scannedAt],
  );

  useEffect(() => {
    persistTicketToStorage(voucherCode, mealRedeemedAt, photoboothRedeemedAt, allergies);
  }, [voucherCode, mealRedeemedAt, photoboothRedeemedAt, allergies, persistTicketToStorage]);

  // Sinkronisasi status pemakaian Voucher Makan & Photobooth SERTA cek apakah Admin melakukan Recovery (Reset Absen)
  const syncVoucherStatus = useCallback(async () => {
    const key = guestId || voucherCode;
    if (!key) return;
    setIsSyncing(true);
    try {
      const param = guestId
        ? `guest_id=${encodeURIComponent(guestId)}`
        : `code=${encodeURIComponent(voucherCode)}`;
      const res = await fetch(`/api/attendance/ticket-status?${param}`);
      if (!res.ok) return;
      const d = await res.json();
      if (d.ok && d.ticket) {
        if (typeof d.deviceLockEnabled === "boolean") {
          setDeviceLockEnabled(d.deviceLockEnabled);
        }

        // Jika Admin/Panitia membatalkan / me-recovery absensi tamu ini kembali ke 'belum_hadir',
        // otomatis hapus tiket dari localStorage dan buka kunci perangkat!
        if (d.ticket.status === "belum_hadir") {
          clearSavedTicketFromStorage();
          if (onDeviceRecovered) {
            onDeviceRecovered();
          } else if (onFinish) {
            onFinish();
          }
          return;
        }

        if (d.ticket.voucherCode) setVoucherCode(d.ticket.voucherCode);
        const syncedAllergies = d.ticket.allergies ?? allergies ?? null;
        setAllergies(syncedAllergies);
        setMealRedeemedAt(d.ticket.mealRedeemedAt ?? null);
        setPhotoboothRedeemedAt(d.ticket.photoboothRedeemedAt ?? null);
        persistTicketToStorage(
          d.ticket.voucherCode || voucherCode,
          d.ticket.mealRedeemedAt ?? null,
          d.ticket.photoboothRedeemedAt ?? null,
          syncedAllergies,
        );
      }
    } catch {
      // Abaikan gangguan jaringan sesaat
    } finally {
      setIsSyncing(false);
    }
  }, [guestId, voucherCode, allergies, persistTicketToStorage, onDeviceRecovered, onFinish]);

  useEffect(() => {
    void syncVoucherStatus();
    const timer = setInterval(() => {
      void syncVoucherStatus();
    }, 4500);
    return () => clearInterval(timer);
  }, [syncVoucherStatus]);

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `VIP Gala Pass RE:SNAPS — ${guestName}`,
          text: `Tiket & Voucher Makan/Photobooth Closing Party CHRYSALIS (${guestName} · Kode ${voucherCode}).`,
          url: window.location.origin,
        });
      } catch {
        // Dibatalkan
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${guestName} — Voucher RE:SNAPS: ${voucherCode}`);
      } catch {
        // Abaikan
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="relative flex w-full max-w-md flex-col items-center animate-in fade-in zoom-in-95 duration-500">
      {/* Konfeti Perayaan */}
      <ConfettiCanvas />

      {/* Lencana Atas: Status Aktif & Kunci Perangkat */}
      <div className="mb-3.5 flex flex-wrap items-center justify-center gap-2">
        <div className="flex items-center gap-2 rounded-full border border-white/80 bg-white/95 px-4 py-1.5 shadow-md backdrop-blur-md">
          <PartyPopper className="size-4 text-brand-gold animate-bounce" />
          <span className="text-xs font-black uppercase tracking-wider text-gradient-brand">
            {isMasuk ? "Gala Pass & Voucher Aktif!" : "Check-out Selesai · Sampai Jumpa!"}
          </span>
          <Sparkles className="size-3.5 text-brand-magenta" />
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-purple/30 bg-brand-purple/10 px-3 py-1 text-[11px] font-extrabold text-brand-purple">
          <Lock className="size-3" />
          <span>Terkunci & Tersimpan di HP Ini</span>
        </div>
      </div>

      {/* Kartu Tiket VIP Holografik RE:SNAPS */}
      <div className="relative w-full overflow-hidden rounded-[30px] bg-gradient-brand p-[2.5px] shadow-2xl animate-shimmer">
        <div className="relative flex w-full flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-white via-surface to-surface-soft">
          {/* Pendaran Dekoratif Palet RE:SNAPS di Sudut Tiket */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 -right-16 size-44 rounded-full bg-brand-magenta/12 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 -left-16 size-44 rounded-full bg-brand-blue/12 blur-2xl"
          />

          {/* Bagian 1: Identitas Acara & Tamu */}
          <div className="relative z-10 flex flex-col p-6 pb-5 sm:p-7 sm:pb-6">
            {/* Header Tiket: Logo Resmi RE:SNAPS & Badge Pass */}
            <div className="flex items-center justify-between border-b border-line/70 pb-4">
              <div className="flex items-center gap-3">
                <div className="relative size-12 overflow-hidden rounded-2xl bg-white p-0.5 shadow-md ring-1 ring-brand-purple/20">
                  <Image
                    src="/brand/logo.png"
                    alt="RE:SNAPS"
                    width={96}
                    height={96}
                    className="size-full rounded-[14px] object-cover"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-black uppercase tracking-widest text-gradient-brand">
                    RE:SNAPS VIP PASS
                  </span>
                  <span className="text-sm font-black tracking-tight text-ink">
                    CHRYSALIS CLOSING PARTY
                  </span>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider shadow-2xs ${
                  isMasuk ? "bg-success text-white" : "bg-brand-purple text-white"
                }`}
              >
                <CheckCircle2 className="size-3.5" />
                {isMasuk ? "VERIFIED IN" : "CHECKED OUT"}
              </span>
            </div>

            {/* Nama Tamu, Kategori/Kating, & Alergi Makanan */}
            <div className="flex flex-col py-5 text-center">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-ink-muted">
                Tamu Undangan Terdaftar
              </span>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
                {guestName}
              </h2>
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                {category ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-blue/10 px-3.5 py-1 text-xs font-extrabold text-brand-blue ring-1 ring-brand-blue/25">
                    <ShieldCheck className="size-3.5" />
                    {category}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-3 py-1 text-xs font-extrabold text-success ring-1 ring-success/25">
                  <CheckCircle2 className="size-3" />
                  HTM LUNAS
                </span>
                {allergies ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-3 py-1 text-xs font-extrabold text-warning ring-1 ring-warning/35">
                    <AlertTriangle className="size-3.5" />
                    Alergi Makanan: {allergies}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-soft px-3 py-1 text-xs font-bold text-ink-muted ring-1 ring-line">
                    <Utensils className="size-3" />
                    Tidak Ada Alergi Makanan
                  </span>
                )}
              </div>
            </div>

            {/* Rincian Waktu & Kode Seri */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-line/70 bg-white/85 p-3.5 text-center text-xs shadow-2xs">
              <div className="flex flex-col items-center justify-center gap-0.5 border-r border-line/70 pr-2">
                <span className="flex items-center gap-1 text-[11px] font-bold text-ink-muted">
                  <Clock className="size-3 text-brand-blue" />
                  Waktu Absen
                </span>
                <span className="text-sm font-black tabular-nums text-ink">
                  {formatWib(scannedAt)}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center gap-0.5 pl-2">
                <span className="flex items-center gap-1 text-[11px] font-bold text-ink-muted">
                  <Calendar className="size-3 text-brand-magenta" />
                  Kode Voucher
                </span>
                <span className="font-mono text-sm font-black tracking-wider text-brand-purple">
                  {voucherCode}
                </span>
              </div>
            </div>
          </div>

          {/* Garis Sobekan Tiket (Perforation Notch) */}
          <div className="relative flex items-center justify-between px-2">
            <div className="size-6 -translate-x-3.5 rounded-full bg-canvas shadow-inner ring-1 ring-black/5" />
            <div className="h-0 flex-1 border-b-2 border-dashed border-brand-purple/25" />
            <div className="size-6 translate-x-3.5 rounded-full bg-canvas shadow-inner ring-1 ring-black/5" />
          </div>

          {/* Bagian 2: VOUCHER TERPADU 2-IN-1 (DESAIN BARCODE & QR PREMIUM) */}
          <div className="relative z-10 flex flex-col gap-4 bg-gradient-to-b from-surface-soft/50 to-surface-soft/95 p-6 pt-5 sm:px-7">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-wider text-gradient-brand">
                  ALL-IN-ONE VOUCHER BARCODE & QR
                </span>
                <span className="text-xs font-bold text-ink-muted">
                  1 Barcode untuk Kupon Makan (1x) & Photobooth (1x)
                </span>
              </div>

              <button
                type="button"
                onClick={() => void syncVoucherStatus()}
                className="inline-flex items-center gap-1 rounded-xl border border-line bg-white px-2.5 py-1.5 text-[11px] font-bold text-ink shadow-2xs hover:bg-surface-soft"
                title="Segarkan status kupon"
              >
                <RefreshCw className={`size-3 ${isSyncing ? "animate-spin text-brand-blue" : ""}`} />
                Sync
              </button>
            </div>

            {/* Stub Barcode 1D Penuh + QR Code Berbingkai Holografik */}
            <div className="flex flex-col gap-3 rounded-3xl border border-brand-purple/20 bg-gradient-to-b from-white to-surface-soft/60 p-4 shadow-lg">
              {/* Baris Atas: QR Code 2D + Ringkasan Cepat + Tombol Fullscreen */}
              <div className="flex items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => setShowZoomModal(true)}
                  className="group relative flex size-26 shrink-0 items-center justify-center rounded-2xl bg-gradient-brand p-[2px] shadow-md transition hover:scale-[1.02]"
                  title="Ketuk untuk memperbesar QR & Barcode"
                >
                  <div className="flex size-full items-center justify-center rounded-[14px] bg-white p-1.5">
                    {qrDataUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={qrDataUrl}
                        alt={`QR Voucher ${voucherCode}`}
                        className="size-full object-contain"
                      />
                    ) : (
                      <QrCode className="size-10 text-ink-muted animate-pulse" />
                    )}
                  </div>
                </button>

                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-wider text-brand-purple">
                      DUAL OPTICAL SCANNER READY
                    </span>
                    <span className="text-xs font-bold leading-snug text-ink">
                      Panitia dapat men-scan <strong>QR 2D</strong> di samping atau{" "}
                      <strong>Barcode Garis 1D</strong> di bawah.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowZoomModal(true)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-brand px-3 py-2 text-xs font-black text-white shadow-sm transition hover:brightness-95"
                  >
                    <Maximize2 className="size-3.5" />
                    Perbesar Layar Scan Panitia
                  </button>
                </div>
              </div>

              {/* Baris Bawah: 1D Barcode Code-128B Lebar Penuh Presisi Tinggi */}
              <Barcode128 value={voucherCode} height={62} />
            </div>

            {/* 2 Kartu Status Kupon: Makan (1x) & Photobooth (1x) */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {/* Kartu 1: Kupon Makan */}
              <div
                className={`flex flex-col justify-between gap-2 rounded-2xl border p-3.5 transition ${
                  mealRedeemedAt
                    ? "border-line bg-white/60 opacity-85"
                    : "border-brand-orange/40 bg-white shadow-sm ring-1 ring-brand-orange/15"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex size-8 items-center justify-center rounded-xl ${
                        mealRedeemedAt
                          ? "bg-surface-soft text-ink-muted"
                          : "bg-gradient-warm text-white shadow-2xs"
                      }`}
                    >
                      <Utensils className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-ink">Voucher Makan</span>
                      <span className="text-[10px] font-bold text-ink-muted">Jatah 1x Penukaran</span>
                    </div>
                  </div>
                </div>

                {mealRedeemedAt ? (
                  <div className="flex items-center justify-between rounded-xl bg-surface-soft px-2.5 py-1.5 text-[11px] font-extrabold text-ink-muted">
                    <span>SUDAH DITUKAR</span>
                    <span className="tabular-nums">{formatWib(mealRedeemedAt)}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl bg-success/12 px-2.5 py-1.5 text-[11px] font-black text-success">
                    <span className="flex items-center gap-1">
                      <Sparkles className="size-3" />
                      TERSEDIA (AKTIF)
                    </span>
                    <span>1x SCAN</span>
                  </div>
                )}
              </div>

              {/* Kartu 2: Kupon Photobooth */}
              <div
                className={`flex flex-col justify-between gap-2 rounded-2xl border p-3.5 transition ${
                  photoboothRedeemedAt
                    ? "border-line bg-white/60 opacity-85"
                    : "border-brand-purple/40 bg-white shadow-sm ring-1 ring-brand-purple/15"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex size-8 items-center justify-center rounded-xl ${
                        photoboothRedeemedAt
                          ? "bg-surface-soft text-ink-muted"
                          : "bg-gradient-cool text-white shadow-2xs"
                      }`}
                    >
                      <Camera className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-ink">Photobooth</span>
                      <span className="text-[10px] font-bold text-ink-muted">Jatah 1x Sesi Foto</span>
                    </div>
                  </div>
                </div>

                {photoboothRedeemedAt ? (
                  <div className="flex items-center justify-between rounded-xl bg-surface-soft px-2.5 py-1.5 text-[11px] font-extrabold text-ink-muted">
                    <span>SUDAH DIPAKAI</span>
                    <span className="tabular-nums">{formatWib(photoboothRedeemedAt)}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-xl bg-brand-purple/12 px-2.5 py-1.5 text-[11px] font-black text-brand-purple">
                    <span className="flex items-center gap-1">
                      <Sparkles className="size-3" />
                      TERSEDIA (AKTIF)
                    </span>
                    <span>1x SCAN</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tombol Aksi & Informasi Keamanan Kunci Perangkat */}
      <div className="mt-5 flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-sm font-extrabold text-ink shadow-sm backdrop-blur-md transition hover:bg-surface-soft"
        >
          {copied ? (
            <>
              <CheckCircle2 className="size-4 text-success" />
              Kode Tiket Tersalin!
            </>
          ) : (
            <>
              <Share2 className="size-4 text-brand-blue" />
              Bagikan / Salin Kode Tiket
            </>
          )}
        </button>

        {/* Bila dibuka dari halaman utama (/), sediakan tombol kembali ke beranda */}
        {isHomePreview && onFinish ? (
          <button
            type="button"
            onClick={onFinish}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface/80 px-4 py-2.5 text-xs font-extrabold text-ink transition hover:bg-surface"
          >
            <ArrowLeft className="size-3.5" />
            Kembali ke Menu Utama
          </button>
        ) : null}

        {/* Informasi Kunci Perangkat (1 HP = 1 Tamu) & Tombol Cek Recovery Admin */}
        {deviceLockEnabled ? (
          <div className="flex flex-col gap-2.5 rounded-2xl border border-brand-purple/25 bg-white/85 p-4 text-xs shadow-xs backdrop-blur-md">
            <div className="flex items-start gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-brand-purple/12 text-brand-purple">
                <Lock className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-black text-ink">
                  Keamanan Aktif: Perangkat Terkunci untuk {guestName}
                </span>
                <p className="text-[11px] leading-relaxed text-ink-muted">
                  Perangkat yang sudah memiliki riwayat absen tidak dapat digunakan untuk
                  mengabsenkan nama tamu lain. Jika Anda <strong>salah memilih nama</strong>, minta
                  Panitia/Admin melakukan <strong>Recovery / Reset Absen</strong> di dashboard.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void syncVoucherStatus()}
              disabled={isSyncing}
              className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-brand-purple/25 bg-brand-purple/8 px-3 py-1.5 text-[11px] font-extrabold text-brand-purple transition hover:bg-brand-purple/15"
            >
              <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing
                ? "Memeriksa Status Recovery..."
                : "Salah Pilih Nama? Cek Status Recovery Admin"}
            </button>
          </div>
        ) : onFinish && !isHomePreview ? (
          <button
            type="button"
            onClick={onFinish}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface/70 px-4 py-3 text-xs font-bold text-ink-muted transition hover:bg-surface hover:text-ink"
          >
            Mode Kiosk Panitia: Scan untuk Tamu Berikutnya
          </button>
        ) : null}
      </div>

      {/* Modal Perbesar Barcode & QR (Kecerahan Maksimal untuk Memudahkan Scan Panitia) */}
      {showZoomModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative flex w-full max-w-md flex-col items-center gap-4 overflow-hidden rounded-3xl bg-white p-6 text-center shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-brand" />

            <div className="flex w-full items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <ScanLine className="size-4 text-brand-purple" />
                <span className="text-xs font-black uppercase tracking-wider text-gradient-brand">
                  LAYAR SCAN PANITIA (HIGH CONTRAST)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowZoomModal(false)}
                className="rounded-full bg-surface-soft p-1.5 text-ink hover:bg-line"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <p className="text-xl font-black text-ink">{guestName}</p>
              {category ? (
                <span className="text-xs font-bold text-brand-blue">{category}</span>
              ) : null}
              {allergies ? (
                <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-warning/15 px-3 py-1 text-xs font-black text-warning ring-1 ring-warning/35">
                  <AlertTriangle className="size-3.5" />
                  Alergi Makanan: {allergies}
                </span>
              ) : null}
            </div>

            {qrDataUrl ? (
              <div className="relative flex size-52 items-center justify-center rounded-2xl border-2 border-brand-purple/25 bg-white p-3 shadow-md">
                <span className="pointer-events-none absolute top-2 left-2 size-3 border-t-2 border-l-2 border-brand-blue" />
                <span className="pointer-events-none absolute top-2 right-2 size-3 border-t-2 border-r-2 border-brand-purple" />
                <span className="pointer-events-none absolute bottom-2 left-2 size-3 border-b-2 border-l-2 border-brand-magenta" />
                <span className="pointer-events-none absolute right-2 bottom-2 size-3 border-r-2 border-b-2 border-brand-orange" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`QR ${voucherCode}`}
                  className="size-full object-contain"
                />
              </div>
            ) : null}

            <Barcode128 value={voucherCode} height={76} variant="zoom" />

            <div className="grid w-full grid-cols-2 gap-2 text-xs font-extrabold">
              <div
                className={`rounded-xl p-2.5 ${
                  mealRedeemedAt ? "bg-surface-soft text-ink-muted" : "bg-success/15 text-success"
                }`}
              >
                Makan: {mealRedeemedAt ? "Sudah Ditukar" : "TERSEDIA (1x)"}
              </div>
              <div
                className={`rounded-xl p-2.5 ${
                  photoboothRedeemedAt
                    ? "bg-surface-soft text-ink-muted"
                    : "bg-brand-purple/15 text-brand-purple"
                }`}
              >
                Photobooth: {photoboothRedeemedAt ? "Sudah Dipakai" : "TERSEDIA (1x)"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowZoomModal(false)}
              className="mt-1 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-ink text-sm font-extrabold text-white"
            >
              Tutup Layar Scan
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
