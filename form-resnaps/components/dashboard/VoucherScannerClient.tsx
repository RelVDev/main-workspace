// Scanner Barcode & QR Voucher Terpadu Panitia (Mode Konsumsi/Makan & Mode Photobooth).
// Setiap voucher tamu hanya dapat di-scan 1 kali untuk Makan dan 1 kali untuk Photobooth.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  Search,
  ScanLine,
  RefreshCw,
  Sparkles,
  UserCheck,
  Clock,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { playSuccessChime, playWarningTone, playScanBlip } from "@/lib/sound";
import type { VoucherKind } from "@/lib/voucher";

type VoucherStats = {
  totalGuests: number;
  eligibleCount: number;
  mealRedeemedCount: number;
  mealRemainingCount: number;
  photoboothRedeemedCount: number;
  photoboothRemainingCount: number;
};

type RedemptionHistoryItem = {
  id: string;
  guestId: string;
  guestName: string;
  category: string | null;
  voucherCode: string;
  kind: VoucherKind;
  redeemedAt: string;
  redeemedAtWib: string;
};

type EligibleGuestItem = {
  id: string;
  name: string;
  category: string | null;
  voucherCode: string;
  mealRedeemedAtWib: string | null;
  photoboothRedeemedAtWib: string | null;
};

type ScanResultState = {
  ok: boolean;
  code?: string;
  kind: VoucherKind;
  message: string;
  guest?: {
    id: string;
    name: string;
    category: string | null;
    voucherCode: string;
    redeemedAtWib?: string;
    mealRedeemedAtWib?: string | null;
    photoboothRedeemedAtWib?: string | null;
  };
};

// Deklarasi tipe Web BarcodeDetector API
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorInstance {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}
interface WindowWithBarcodeDetector extends Window {
  BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorInstance;
}

export function VoucherScannerClient({ compact = false }: { compact?: boolean }) {
  const [kind, setKind] = useState<VoucherKind>("meal");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [guestSearch, setGuestSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultState | null>(null);

  const [stats, setStats] = useState<VoucherStats>({
    totalGuests: 0,
    eligibleCount: 0,
    mealRedeemedCount: 0,
    mealRemainingCount: 0,
    photoboothRedeemedCount: 0,
    photoboothRemainingCount: 0,
  });
  const [history, setHistory] = useState<RedemptionHistoryItem[]>([]);
  const [eligibleGuests, setEligibleGuests] = useState<EligibleGuestItem[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScannedRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });

  const fetchScannerData = useCallback(async () => {
    try {
      const res = await fetch("/api/panitia/voucher-scan");
      if (!res.ok) return;
      const d = await res.json();
      if (d.ok) {
        setStats(d.stats);
        setHistory(d.recentRedemptions || []);
        setEligibleGuests(d.eligibleGuests || []);
      }
    } catch {
      // Abaikan
    }
  }, []);

  useEffect(() => {
    void fetchScannerData();
    const interval = setInterval(() => {
      void fetchScannerData();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchScannerData]);

  // Eksekusi verifikasi & klaim 1x pakai ke server
  const submitVoucherScan = useCallback(
    async (rawCode: string, targetKind: VoucherKind) => {
      const cleaned = rawCode.trim();
      if (!cleaned || isSubmitting) return;

      setIsSubmitting(true);
      try {
        playScanBlip();
      } catch {
        // Abaikan
      }

      try {
        const res = await fetch("/api/panitia/voucher-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: cleaned, kind: targetKind }),
        });
        const data = await res.json();

        if (res.ok && data.ok) {
          try {
            playSuccessChime();
          } catch {
            // Abaikan
          }
          setScanResult({
            ok: true,
            kind: targetKind,
            message: data.message || "Voucher valid & berhasil ditukarkan!",
            guest: data.guest,
          });
          setManualCode("");
          void fetchScannerData();
        } else {
          try {
            playWarningTone();
          } catch {
            // Abaikan
          }
          setScanResult({
            ok: false,
            code: data.code,
            kind: targetKind,
            message: data.message || "Voucher tidak dapat digunakan.",
            guest: data.guest,
          });
        }
      } catch {
        try {
          playWarningTone();
        } catch {
          // Abaikan
        }
        setScanResult({
          ok: false,
          kind: targetKind,
          message: "Gagal menghubungi server. Periksa koneksi internet.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, fetchScannerData],
  );

  // Mengelola kamera pemindai barcode / QR
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          "Peramban ini tidak mendukung akses kamera langsung. Gunakan kolom input kode atau pencarian nama di bawah.",
        );
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch {
      setCameraError(
        "Izin kamera ditolak atau perangkat tidak memiliki kamera. Anda tetap dapat mengetik kode RSNP-XXXX atau memilih nama tamu di bawah.",
      );
      setCameraActive(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Loop deteksi Barcode 1D (Code-128) & QR Code menggunakan BarcodeDetector API
  useEffect(() => {
    if (!cameraActive) return;

    const win = window as unknown as WindowWithBarcodeDetector;
    if (!win.BarcodeDetector) return;

    let detector: BarcodeDetectorInstance | null = null;
    try {
      detector = new win.BarcodeDetector({
        formats: ["qr_code", "code_128", "code_39", "ean_13"],
      });
    } catch {
      try {
        detector = new win.BarcodeDetector();
      } catch {
        detector = null;
      }
    }

    if (!detector) return;

    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2 || isSubmitting) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0 && barcodes[0].rawValue) {
          const rawVal = barcodes[0].rawValue.trim();
          const now = Date.now();
          // Cegah scan berulang pada kode yang sama dalam 3 detik
          if (
            rawVal === lastScannedRef.current.code &&
            now - lastScannedRef.current.at < 3000
          ) {
            return;
          }
          lastScannedRef.current = { code: rawVal, at: now };
          void submitVoucherScan(rawVal, kind);
        }
      } catch {
        // Abaikan frame gagal deteksi
      }
    }, 350);

    return () => clearInterval(interval);
  }, [cameraActive, isSubmitting, kind, submitVoucherScan]);

  const filteredEligible = guestSearch.trim()
    ? eligibleGuests
        .filter(
          (g) =>
            g.name.toLowerCase().includes(guestSearch.trim().toLowerCase()) ||
            g.voucherCode.toLowerCase().includes(guestSearch.trim().toLowerCase()),
        )
        .slice(0, 8)
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Pemilih Mode Booth (Makan vs Photobooth) */}
      {!compact ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-purple/10 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-brand-purple">
              <Sparkles className="size-3 text-brand-gold" />
              <span>Scanner Voucher Terpadu 2-in-1</span>
            </div>
            <h1 className="mt-1 text-2xl font-black text-ink sm:text-3xl">
              Scanner Barcode Makan & Photobooth
            </h1>
            <p className="text-sm text-ink-muted">
              1 Barcode tamu berlaku untuk <strong>1x Makan</strong> dan{" "}
              <strong>1x Photobooth</strong> secara terpisah.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchScannerData()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-bold text-ink shadow-2xs hover:bg-surface-soft"
          >
            <RefreshCw className="size-3.5" />
            Segarkan Kuota
          </button>
        </div>
      ) : null}

      {/* Kartu Ringkasan Kuota Voucher */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3">
        <Card className="flex flex-col justify-between gap-1.5 rounded-2xl border-line p-4">
          <div className="flex items-center justify-between text-brand-blue">
            <span className="text-xs font-black uppercase tracking-wider">Tamu Check-In</span>
            <UserCheck className="size-4" />
          </div>
          <div>
            <span className="text-3xl font-black text-ink">{stats.eligibleCount}</span>
            <p className="text-[11px] font-semibold text-ink-muted">Berhak klaim voucher</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-1.5 rounded-2xl border-brand-orange/35 bg-gradient-to-br from-white to-brand-orange/10 p-4">
          <div className="flex items-center justify-between text-brand-orange">
            <span className="text-xs font-black uppercase tracking-wider">Kupon Makan</span>
            <Utensils className="size-4" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-brand-orange">
                {stats.mealRedeemedCount}
              </span>
              <span className="text-xs font-bold text-ink-muted">
                / {stats.eligibleCount} ditukar
              </span>
            </div>
            <p className="text-[11px] font-semibold text-ink-muted">
              Sisa {stats.mealRemainingCount} belum klaim makan
            </p>
          </div>
        </Card>

        <Card className="col-span-2 flex flex-col justify-between gap-1.5 rounded-2xl border-brand-purple/35 bg-gradient-to-br from-white to-brand-purple/10 p-4 sm:col-span-1">
          <div className="flex items-center justify-between text-brand-purple">
            <span className="text-xs font-black uppercase tracking-wider">Photobooth</span>
            <Camera className="size-4" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-brand-purple">
                {stats.photoboothRedeemedCount}
              </span>
              <span className="text-xs font-bold text-ink-muted">
                / {stats.eligibleCount} dipakai
              </span>
            </div>
            <p className="text-[11px] font-semibold text-ink-muted">
              Sisa {stats.photoboothRemainingCount} belum sesi foto
            </p>
          </div>
        </Card>
      </div>

      {/* Area Utama: Pemilih Booth + Kamera / Input Manual + Kartu Hasil */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Kontrol Scanner */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          <Card className="flex flex-col gap-5 rounded-3xl border-white/80 bg-white/95 p-5 shadow-lg sm:p-6">
            {/* Langkah 1: Pilih Mode Booth */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-ink-muted">
                1. Pilih Mode Booth Saat Ini
              </span>
              <SegmentedControl<VoucherKind>
                name="voucher_kind"
                ariaLabel="Pilih jenis voucher yang di-scan"
                value={kind}
                onChange={(next) => {
                  setKind(next);
                  setScanResult(null);
                }}
                options={[
                  { value: "meal", label: "BOOTH MAKAN (1x)", icon: Utensils },
                  { value: "photobooth", label: "PHOTOBOOTH (1x)", icon: Camera },
                ]}
              />
            </div>

            {/* Hasil Scan Terakhir (Kartu Hijau / Merah Mencolok) */}
            {scanResult ? (
              <div
                role="status"
                aria-live="assertive"
                className={`flex flex-col gap-3 rounded-2xl border-2 p-4 shadow-md animate-in fade-in zoom-in-95 duration-200 ${
                  scanResult.ok
                    ? "border-success bg-success/10 text-ink"
                    : "border-error bg-error/10 text-ink"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${
                        scanResult.ok ? "bg-success" : "bg-error"
                      }`}
                    >
                      {scanResult.ok ? (
                        <CheckCircle2 className="size-6" />
                      ) : (
                        <AlertTriangle className="size-6" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-xs font-black uppercase tracking-wider ${
                          scanResult.ok ? "text-success" : "text-error"
                        }`}
                      >
                        {scanResult.ok
                          ? `BERHASIL · ${
                              scanResult.kind === "meal"
                                ? "VOUCHER MAKAN SAH"
                                : "VOUCHER PHOTOBOOTH SAH"
                            }`
                          : "DITOLAK · VOUCHER TIDAK DAPAT DIGUNAKAN"}
                      </span>
                      <span className="text-base font-black text-ink">
                        {scanResult.guest?.name || scanResult.message}
                      </span>
                      {scanResult.guest?.category ? (
                        <span className="text-xs font-bold text-brand-blue">
                          {scanResult.guest.category} · {scanResult.guest.voucherCode}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <p className="text-xs font-bold leading-relaxed text-ink">
                  {scanResult.message}
                </p>

                {scanResult.guest ? (
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-white/85 p-2.5 text-[11px] font-bold">
                    <div>
                      Makan:{" "}
                      <strong className="text-ink">
                        {scanResult.guest.mealRedeemedAtWib
                          ? `Ditukar (${scanResult.guest.mealRedeemedAtWib})`
                          : "Belum Ditukar"}
                      </strong>
                    </div>
                    <div>
                      Photobooth:{" "}
                      <strong className="text-ink">
                        {scanResult.guest.photoboothRedeemedAtWib
                          ? `Dipakai (${scanResult.guest.photoboothRedeemedAtWib})`
                          : "Belum Dipakai"}
                      </strong>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Langkah 2: Kamera Pemindai Otomatis */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-ink-muted">
                  2. Kamera Pemindai Barcode / QR
                </span>
                <Button
                  type="button"
                  variant={cameraActive ? "secondary" : "primary"}
                  onClick={() => (cameraActive ? stopCamera() : void startCamera())}
                  className="h-9 px-3 text-xs font-extrabold"
                >
                  {cameraActive ? (
                    <>
                      <CameraOff className="size-3.5" />
                      Matikan Kamera
                    </>
                  ) : (
                    <>
                      <Camera className="size-3.5" />
                      Aktifkan Kamera Scanner
                    </>
                  )}
                </Button>
              </div>

              {cameraError ? (
                <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3 text-xs font-semibold text-warning">
                  {cameraError}
                </div>
              ) : null}

              {cameraActive ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border-2 border-brand-purple bg-black shadow-inner">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="size-full object-cover"
                  />
                  {/* Bingkai Viewfinder & Laser Scanline */}
                  <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-white/60">
                    <div className="animate-scanline absolute inset-x-2 h-1 rounded-full bg-gradient-brand shadow-[0_0_16px_rgba(242,185,46,0.9)]" />
                  </div>
                  <div className="absolute inset-x-0 bottom-2 text-center">
                    <span className="rounded-full bg-black/70 px-3 py-1 text-[11px] font-bold text-white">
                      Arahkan kamera ke Barcode / QR Tiket Tamu (Mode:{" "}
                      {kind === "meal" ? "Makan" : "Photobooth"})
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Langkah 3: Input Kode Barcode / Hardware Barcode Gun */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submitVoucherScan(manualCode, kind);
              }}
              className="flex flex-col gap-2 border-t border-line pt-4"
            >
              <label
                htmlFor="manual-voucher-input"
                className="text-xs font-black uppercase tracking-wider text-ink"
              >
                3. Ketik Kode Barcode / Gunakan Alat Scanner USB
              </label>
              <div className="flex gap-2">
                <Input
                  id="manual-voucher-input"
                  placeholder="Contoh: RSNP-8F3A92C1 atau 8F3A92C1"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="h-11 flex-1 font-mono text-sm font-bold uppercase"
                />
                <Button
                  type="submit"
                  disabled={!manualCode.trim() || isSubmitting}
                  className="h-11 px-4 text-xs font-black"
                >
                  {isSubmitting ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <ScanLine className="size-4" />
                      Scan {kind === "meal" ? "Makan" : "Photobooth"}
                    </>
                  )}
                </Button>
              </div>
            </form>

            {/* Langkah 4: Pencarian Cepat Nama Tamu yang Sudah Check-In */}
            <div className="flex flex-col gap-2.5 border-t border-line pt-4">
              <label
                htmlFor="scanner-guest-search"
                className="text-xs font-black uppercase tracking-wider text-ink"
              >
                4. Atau Cari Nama Tamu yang Sudah Check-In
              </label>
              <div className="relative">
                <Input
                  id="scanner-guest-search"
                  placeholder="Ketik nama tamu untuk klaim manual..."
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  className="h-10 pr-9 text-xs font-semibold"
                />
                <Search className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-ink-muted" />
              </div>

              {filteredEligible.length > 0 ? (
                <div className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-surface-soft/50">
                  {filteredEligible.map((g) => {
                    const isUsed =
                      kind === "meal"
                        ? Boolean(g.mealRedeemedAtWib)
                        : Boolean(g.photoboothRedeemedAtWib);
                    const usedTime =
                      kind === "meal" ? g.mealRedeemedAtWib : g.photoboothRedeemedAtWib;

                    return (
                      <div
                        key={g.id}
                        className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs"
                      >
                        <div className="flex flex-col">
                          <span className="font-black text-ink">{g.name}</span>
                          <span className="text-[11px] font-semibold text-ink-muted">
                            {g.category || "Tamu"} ·{" "}
                            <span className="font-mono text-brand-purple">{g.voucherCode}</span>
                          </span>
                        </div>

                        {isUsed ? (
                          <Badge tone="neutral" icon={Clock}>
                            Sudah Dipakai ({usedTime})
                          </Badge>
                        ) : (
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => void submitVoucherScan(g.voucherCode, kind)}
                            className="inline-flex items-center gap-1 rounded-xl bg-gradient-brand px-3 py-1.5 text-xs font-black text-white shadow-xs hover:brightness-95"
                          >
                            <ScanLine className="size-3.5" />
                            Klaim {kind === "meal" ? "Makan" : "Photobooth"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        {/* Kolom Kanan: Riwayat Penukaran Voucher Terbaru */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <Card className="flex flex-col gap-3.5 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h2 className="text-base font-extrabold text-ink">
                  Riwayat Scan Voucher Terakhir
                </h2>
                <p className="text-xs text-ink-muted">
                  Catatan klaim Makan & Photobooth secara real-time
                </p>
              </div>
              <Badge tone="brand">{history.length}</Badge>
            </div>

            {history.length === 0 ? (
              <p className="py-8 text-center text-xs font-semibold text-ink-muted">
                Belum ada voucher makan atau photobooth yang di-scan.
              </p>
            ) : (
              <div className="flex max-h-[460px] flex-col divide-y divide-line overflow-y-auto pr-1 text-xs">
                {history.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-white ${
                          item.kind === "meal" ? "bg-brand-orange" : "bg-brand-purple"
                        }`}
                      >
                        {item.kind === "meal" ? (
                          <Utensils className="size-4" />
                        ) : (
                          <Camera className="size-4" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-ink">{item.guestName}</span>
                        <span className="text-[11px] text-ink-muted">
                          {item.kind === "meal" ? "Voucher Makan" : "Photobooth"} ·{" "}
                          <span className="font-mono">{item.voucherCode}</span>
                        </span>
                      </div>
                    </div>
                    <span className="font-bold tabular-nums text-ink">{item.redeemedAtWib}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
