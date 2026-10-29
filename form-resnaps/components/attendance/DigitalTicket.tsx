// Tiket Digital VIP & Voucher 2-in-1 (Makan + Photobooth) RE:SNAPS — Desain Minimalis & Elegan.
"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import {
  CheckCircle2,
  Share2,
  ArrowLeft,
  Utensils,
  Camera,
  Maximize2,
  X,
  RefreshCw,
  QrCode,
  AlertTriangle,
  Lock,
  Barcode,
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
  mealEligible?: boolean;
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
  initialMealEligible?: boolean;
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
  initialMealEligible = true,
  initialMealRedeemedAt = null,
  initialPhotoboothRedeemedAt = null,
  onFinish,
  onDeviceRecovered,
  isHomePreview = false,
}: DigitalTicketProps) {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [codeView, setCodeView] = useState<"barcode" | "qr">("barcode");
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deviceLockEnabled, setDeviceLockEnabled] = useState(true);
  const [allergies, setAllergies] = useState<string | null>(initialAllergies);
  const [mealEligible, setMealEligible] = useState<boolean>(initialMealEligible);
  const [mealRedeemedAt, setMealRedeemedAt] = useState<string | null>(initialMealRedeemedAt);
  const [photoboothRedeemedAt, setPhotoboothRedeemedAt] = useState<string | null>(
    initialPhotoboothRedeemedAt,
  );

  const isMasuk = mode === "in";

  const computedFallbackCode = `RSNP-${Math.abs(
    (guestId || guestName).split("").reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) | 0, 7),
  )
    .toString(16)
    .toUpperCase()
    .padStart(8, "0")
    .slice(0, 8)}`;

  const [voucherCode, setVoucherCode] = useState<string>(propVoucherCode || computedFallbackCode);

  useEffect(() => {
    try {
      playSuccessChime();
    } catch {
      // Abaikan bila audio diblokir browser
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (voucherCode) {
      QRCode.toDataURL(voucherCode, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 340,
        color: {
          dark: "#0F1420",
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

  const persistTicketToStorage = useCallback(
    (
      nextVoucher: string,
      nextMealAt: string | null,
      nextPhotoAt: string | null,
      nextAllergies: string | null,
      nextMealEligible: boolean,
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
          mealEligible: nextMealEligible,
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
        // Abaikan bila storage penuh
      }
    },
    [guestId, guestName, category, mode, isMasuk, scannedAt],
  );

  useEffect(() => {
    persistTicketToStorage(
      voucherCode,
      mealRedeemedAt,
      photoboothRedeemedAt,
      allergies,
      mealEligible,
    );
  }, [
    voucherCode,
    mealRedeemedAt,
    photoboothRedeemedAt,
    allergies,
    mealEligible,
    persistTicketToStorage,
  ]);

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
        const syncedMealEligible =
          typeof d.ticket.mealEligible === "boolean" ? d.ticket.mealEligible : mealEligible;
        setAllergies(syncedAllergies);
        setMealEligible(syncedMealEligible);
        setMealRedeemedAt(d.ticket.mealRedeemedAt ?? null);
        setPhotoboothRedeemedAt(d.ticket.photoboothRedeemedAt ?? null);
        persistTicketToStorage(
          d.ticket.voucherCode || voucherCode,
          d.ticket.mealRedeemedAt ?? null,
          d.ticket.photoboothRedeemedAt ?? null,
          syncedAllergies,
          syncedMealEligible,
        );
      }
    } catch {
      // Abaikan gangguan jaringan sesaat
    } finally {
      setIsSyncing(false);
    }
  }, [
    guestId,
    voucherCode,
    allergies,
    mealEligible,
    persistTicketToStorage,
    onDeviceRecovered,
    onFinish,
  ]);

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
          title: `RE:SNAPS Pass — ${guestName}`,
          text: `Tiket & Voucher RE:SNAPS (${guestName} · ${voucherCode})`,
          url: window.location.origin,
        });
      } catch {
        // Dibatalkan
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${guestName} — ${voucherCode}`);
      } catch {
        // Abaikan
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <div className="relative flex w-full max-w-sm flex-col items-center animate-in fade-in zoom-in-95 duration-500">
      <ConfettiCanvas />

      {/* Kartu Tiket Minimalis & Elegan */}
      <div className="relative w-full overflow-hidden rounded-[32px] bg-gradient-brand p-[2px] shadow-2xl">
        <div className="relative flex w-full flex-col overflow-hidden rounded-[30px] bg-white">
          {/* Pendaran Halus di Latar Kartu */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-20 size-44 rounded-full bg-brand-magenta/8 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -left-20 size-44 rounded-full bg-brand-blue/8 blur-2xl"
          />

          {/* Bagian Atas: Identitas Tamu */}
          <div className="relative z-10 flex flex-col px-6 pt-6 pb-5">
            {/* Baris Brand & Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative size-9 overflow-hidden rounded-xl bg-white p-0.5 shadow-xs ring-1 ring-line">
                  <Image
                    src="/brand/logo.png"
                    alt="RE:SNAPS"
                    width={72}
                    height={72}
                    className="size-full rounded-[10px] object-cover"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-gradient-brand">
                    RE:SNAPS
                  </span>
                  <span className="text-xs font-bold tracking-tight text-ink-muted">
                    Chrysalis Pass
                  </span>
                </div>
              </div>

              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                  isMasuk
                    ? "bg-success/12 text-success"
                    : "bg-brand-purple/12 text-brand-purple"
                }`}
              >
                <CheckCircle2 className="size-3" />
                {isMasuk ? "Checked In" : "Checked Out"}
              </span>
            </div>

            {/* Nama Tamu & Kategori */}
            <div className="mt-6 flex flex-col items-center text-center">
              <h2 className="text-2xl font-black tracking-tight text-ink sm:text-[26px]">
                {guestName}
              </h2>

              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5">
                {category ? (
                  <span className="rounded-full bg-surface-soft px-3 py-0.5 text-xs font-bold text-ink-muted">
                    {category}
                  </span>
                ) : null}

                {allergies ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-[11px] font-extrabold text-warning">
                    <AlertTriangle className="size-3" />
                    Alergi: {allergies}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Info Waktu & Kode */}
            <div className="mt-5 grid grid-cols-2 border-t border-line/60 pt-4 text-center">
              <div className="flex flex-col border-r border-line/60 pr-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                  Waktu
                </span>
                <span className="mt-0.5 text-xs font-extrabold tabular-nums text-ink">
                  {formatWib(scannedAt, "HH:mm 'WIB'")}
                </span>
              </div>
              <div className="flex flex-col pl-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                  ID Pass
                </span>
                <span className="mt-0.5 font-mono text-xs font-extrabold tracking-wider text-brand-purple">
                  {voucherCode}
                </span>
              </div>
            </div>
          </div>

          {/* Garis Perforasi Tiket */}
          <div className="relative flex items-center justify-between">
            <div className="size-5 -translate-x-2.5 rounded-full bg-canvas ring-1 ring-line/60" />
            <div className="h-0 flex-1 border-b border-dashed border-line" />
            <div className="size-5 translate-x-2.5 rounded-full bg-canvas ring-1 ring-line/60" />
          </div>

          {/* Bagian Bawah: Barcode / QR & Kupon */}
          <div className="relative z-10 flex flex-col gap-4 bg-surface-soft/45 px-6 pt-4 pb-6">
            {/* Switcher Minimalis: Barcode vs QR */}
            <div className="flex items-center justify-between">
              <div className="inline-flex rounded-xl bg-surface-soft p-0.5 ring-1 ring-line/80">
                <button
                  type="button"
                  onClick={() => setCodeView("barcode")}
                  className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1 text-[11px] font-extrabold transition ${
                    codeView === "barcode"
                      ? "bg-white text-ink shadow-2xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  <Barcode className="size-3.5" />
                  Barcode
                </button>
                <button
                  type="button"
                  onClick={() => setCodeView("qr")}
                  className={`inline-flex items-center gap-1.5 rounded-[10px] px-3 py-1 text-[11px] font-extrabold transition ${
                    codeView === "qr"
                      ? "bg-white text-ink shadow-2xs"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  <QrCode className="size-3.5" />
                  QR Code
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowZoomModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-extrabold text-brand-purple hover: opacity-80"
              >
                <Maximize2 className="size-3" />
                Perbesar
              </button>
            </div>

            {/* Area Scan Bersih (Ketuk untuk Perbesar) */}
            <button
              type="button"
              onClick={() => setShowZoomModal(true)}
              className="group relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-line/80 bg-white p-2 shadow-xs transition hover:border-brand-purple/40 hover:shadow-md"
              title="Ketuk untuk layar penuh"
            >
              {codeView === "barcode" ? (
                <Barcode128 value={voucherCode} height={64} className="!p-2" />
              ) : (
                <div className="flex flex-col items-center py-2">
                  {qrDataUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={qrDataUrl}
                      alt={`QR ${voucherCode}`}
                      className="size-40 object-contain"
                    />
                  ) : (
                    <QrCode className="size-12 text-ink-muted animate-pulse" />
                  )}
                  <span className="mt-1 font-mono text-[11px] font-bold tracking-[0.24em] text-ink/75">
                    {voucherCode}
                  </span>
                </div>
              )}
            </button>

            {/* Status 2 Voucher (Makan & Photobooth) — Ringkas & Elegan */}
            <div className="grid grid-cols-2 gap-2.5">
              <div
                className={`flex items-center gap-2.5 rounded-2xl border p-3 transition ${
                  !mealEligible || mealRedeemedAt
                    ? "border-line/70 bg-white/60 opacity-75"
                    : "border-line/90 bg-white shadow-2xs"
                }`}
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
                    !mealEligible || mealRedeemedAt
                      ? "bg-surface-soft text-ink-muted"
                      : "bg-brand-orange/12 text-brand-orange"
                  }`}
                >
                  <Utensils className="size-4" />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs font-extrabold text-ink">Makan</span>
                  <span
                    className={`truncate text-[10px] font-bold ${
                      !mealEligible
                        ? "text-ink-muted"
                        : mealRedeemedAt
                          ? "text-ink-muted"
                          : "text-success"
                    }`}
                  >
                    {!mealEligible
                      ? "Tidak Termasuk (OTS)"
                      : mealRedeemedAt
                        ? `Ditukar · ${formatWib(mealRedeemedAt, "HH:mm")}`
                        : "Tersedia"}
                  </span>
                </div>
              </div>

              <div
                className={`flex items-center gap-2.5 rounded-2xl border p-3 transition ${
                  photoboothRedeemedAt
                    ? "border-line/70 bg-white/60 opacity-75"
                    : "border-line/90 bg-white shadow-2xs"
                }`}
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${
                    photoboothRedeemedAt
                      ? "bg-surface-soft text-ink-muted"
                      : "bg-brand-purple/12 text-brand-purple"
                  }`}
                >
                  <Camera className="size-4" />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="text-xs font-extrabold text-ink">Photobooth</span>
                  <span
                    className={`truncate text-[10px] font-bold ${
                      photoboothRedeemedAt ? "text-ink-muted" : "text-brand-purple"
                    }`}
                  >
                    {photoboothRedeemedAt
                      ? `Dipakai · ${formatWib(photoboothRedeemedAt, "HH:mm")}`
                      : "Tersedia"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Baris Tombol Aksi Minimalis */}
      <div className="mt-4 flex w-full items-center gap-2.5">
        {isHomePreview && onFinish ? (
          <button
            type="button"
            onClick={onFinish}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl border border-line bg-white px-4 text-xs font-extrabold text-ink shadow-2xs transition hover:bg-surface-soft"
          >
            <ArrowLeft className="size-3.5" />
            Kembali
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setShowZoomModal(true)}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-ink px-4 text-xs font-extrabold text-white shadow-sm transition hover:opacity-95"
        >
          <Maximize2 className="size-3.5" />
          Layar Penuh
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-line bg-white px-4 text-xs font-extrabold text-ink shadow-2xs transition hover:bg-surface-soft"
          title="Salin atau bagikan tiket"
        >
          {copied ? (
            <CheckCircle2 className="size-4 text-success" />
          ) : (
            <Share2 className="size-4 text-brand-blue" />
          )}
          <span>{copied ? "Tersalin" : "Bagikan"}</span>
        </button>
      </div>

      {/* Baris Status Keamanan & Sinkronisasi Ringkas (1 Baris Halus) */}
      <div className="mt-3 flex items-center justify-center gap-3 text-[11px] font-semibold text-ink-muted">
        {deviceLockEnabled ? (
          <span className="inline-flex items-center gap-1">
            <Lock className="size-3 text-brand-purple" />
            Terkunci di perangkat ini
          </span>
        ) : onFinish && !isHomePreview ? (
          <button
            type="button"
            onClick={onFinish}
            className="underline hover:text-ink"
          >
            Scan Tamu Berikutnya
          </button>
        ) : null}

        <span>·</span>

        <button
          type="button"
          onClick={() => void syncVoucherStatus()}
          disabled={isSyncing}
          className="inline-flex items-center gap-1 text-brand-purple hover:underline disabled:opacity-50"
        >
          <RefreshCw className={`size-3 ${isSyncing ? "animate-spin" : ""}`} />
          {isSyncing ? "Menyinkronkan..." : "Segarkan Status"}
        </button>
      </div>

      {/* Modal Layar Penuh (Barcode + QR Bersih) */}
      {showZoomModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowZoomModal(false)}
        >
          <div
            className="relative flex w-full max-w-sm flex-col items-center gap-5 overflow-hidden rounded-[32px] bg-white p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-brand" />

            <div className="flex w-full items-center justify-between">
              <div className="flex flex-col text-left">
                <span className="text-base font-black text-ink">{guestName}</span>
                {category ? (
                  <span className="text-xs font-semibold text-ink-muted">{category}</span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setShowZoomModal(false)}
                className="rounded-full bg-surface-soft p-2 text-ink hover:bg-line"
              >
                <X className="size-4" />
              </button>
            </div>

            {allergies ? (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1 text-xs font-extrabold text-warning">
                <AlertTriangle className="size-3.5" />
                Alergi: {allergies}
              </div>
            ) : null}

            {qrDataUrl ? (
              <div className="flex size-48 items-center justify-center rounded-2xl border border-line bg-white p-3 shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`QR ${voucherCode}`}
                  className="size-full object-contain"
                />
              </div>
            ) : null}

            <div className="w-full rounded-2xl border border-line bg-white p-2">
              <Barcode128 value={voucherCode} height={74} variant="zoom" />
            </div>

            <div className="grid w-full grid-cols-2 gap-2 text-xs font-bold">
              <div
                className={`rounded-xl py-2 ${
                  !mealEligible || mealRedeemedAt
                    ? "bg-surface-soft text-ink-muted"
                    : "bg-success/12 text-success"
                }`}
              >
                Makan: {!mealEligible ? "Tidak Termasuk" : mealRedeemedAt ? "Ditukar" : "Tersedia"}
              </div>
              <div
                className={`rounded-xl py-2 ${
                  photoboothRedeemedAt
                    ? "bg-surface-soft text-ink-muted"
                    : "bg-brand-purple/12 text-brand-purple"
                }`}
              >
                Photobooth: {photoboothRedeemedAt ? "Dipakai" : "Tersedia"}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
