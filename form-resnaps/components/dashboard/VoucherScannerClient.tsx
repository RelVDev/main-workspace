// Scanner Barcode & QR Voucher Terpadu Panitia (Mode Konsumsi/Makan & Mode Photobooth).
// Setiap voucher tamu hanya dapat di-scan 1 kali untuk Makan dan 1 kali untuk Photobooth.
// Dilengkapi Log Hasil Scanner Real-Time otomatis (tanpa refresh manual) & filter terpisah Makan vs Photobooth.
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  Search,
  ScanLine,
  RefreshCw,
  UserCheck,
  Clock,
  Loader2,
  SwitchCamera,
  FlipHorizontal,
  Radio,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { playSuccessChime, playWarningTone, playScanBlip } from "@/lib/sound";
import { scanImageDataForCode128 } from "@/lib/barcode-scanner";
import { createClient } from "@/lib/supabase/client";
import type { VoucherKind } from "@/lib/voucher";

type VoucherStats = {
  totalGuests: number;
  eligibleCount: number;
  mealRedeemedCount: number;
  mealRemainingCount: number;
  photoboothRedeemedCount: number;
  photoboothRemainingCount: number;
  tamuMealQuota?: {
    maxSlots: number;
    usedSlots: number;
    remainingSlots: number;
    totalTamuCount: number;
    canAddOtsMeal: boolean;
  };
};

type RedemptionHistoryItem = {
  id: string;
  guestId: string;
  guestName: string;
  category: string | null;
  allergies?: string | null;
  voucherCode: string;
  kind: VoucherKind;
  redeemedAt: string;
  redeemedAtWib: string;
};

type EligibleGuestItem = {
  id: string;
  name: string;
  category: string | null;
  allergies: string | null;
  isOts?: boolean;
  mealEligible?: boolean;
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
    allergies?: string | null;
    voucherCode: string;
    redeemedAtWib?: string;
    mealRedeemedAtWib?: string | null;
    photoboothRedeemedAtWib?: string | null;
  };
};

type VideoDeviceOption = {
  deviceId: string;
  label: string;
};

// Deklarasi tipe Web BarcodeDetector API
interface DetectedBarcode {
  rawValue: string;
}
interface BarcodeDetectorInstance {
  detect(source: HTMLVideoElement | HTMLCanvasElement): Promise<DetectedBarcode[]>;
}
interface WindowWithBarcodeDetector extends Window {
  BarcodeDetector?: new (options?: { formats: string[] }) => BarcodeDetectorInstance;
}

export function VoucherScannerClient({ compact = false }: { compact?: boolean }) {
  const [kind, setKind] = useState<VoucherKind>("meal");
  // Filter log hasil scanner otomatis mengikuti mode booth aktif agar tidak tercampur
  const [historyFilter, setHistoryFilter] = useState<"meal" | "photobooth" | "all">("meal");
  const [isLive, setIsLive] = useState(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [streamVersion, setStreamVersion] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [mirrorVideo, setMirrorVideo] = useState(false);
  const [videoDevices, setVideoDevices] = useState<VideoDeviceOption[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [scanPulse, setScanPulse] = useState(false);

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScannedRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

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
      // Abaikan gangguan jaringan sementara
    }
  }, []);

  // Polling otomatis setiap 3 detik tanpa perlu refresh manual
  useEffect(() => {
    void fetchScannerData();
    const interval = setInterval(() => {
      void fetchScannerData();
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchScannerData]);

  // Langganan Supabase Realtime agar log scanner langsung ter-update seketika saat ada scan baru
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("voucher-scanner-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_settings" },
        () => {
          void fetchScannerData();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        () => {
          void fetchScannerData();
        },
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchScannerData]);

  // Filter log hasil scanner agar PIC Makan & PIC Photobooth tidak tercampur
  const filteredHistory = useMemo(() => {
    if (historyFilter === "all") return history;
    return history.filter((item) => item.kind === historyFilter);
  }, [history, historyFilter]);

  const mealHistoryCount = useMemo(
    () => history.filter((item) => item.kind === "meal").length,
    [history],
  );
  const photoHistoryCount = useMemo(
    () => history.filter((item) => item.kind === "photobooth").length,
    [history],
  );

  // Eksekusi verifikasi & klaim 1x pakai ke server
  const submitVoucherScan = useCallback(
    async (rawCode: string, targetKind: VoucherKind) => {
      const cleaned = rawCode.trim();
      if (!cleaned || isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setScanPulse(true);
      setTimeout(() => setScanPulse(false), 500);

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
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }
    },
    [fetchScannerData],
  );

  // Menghentikan stream kamera aktif dengan bersih
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setVideoReady(false);
    setCameraActive(false);
  }, []);

  // Memulai kamera dengan fallback bertingkat untuk HP (Android/iOS), iPad, dan Laptop
  const startCamera = useCallback(
    async (opts?: { preferredFacing?: "environment" | "user"; deviceId?: string }) => {
      setCameraError(null);
      setVideoReady(false);

      const targetFacing = opts?.preferredFacing ?? facingMode;
      const targetDeviceId = opts?.deviceId !== undefined ? opts.deviceId : selectedDeviceId;

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError(
            "Peramban ini tidak mendukung akses kamera langsung (pastikan membuka via HTTPS atau localhost). Gunakan kolom input kode atau pencarian nama di bawah.",
          );
          return;
        }

        // Hentikan stream lama sebelum membuka stream baru
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }

        const constraintCandidates: MediaStreamConstraints[] = [];

        if (targetDeviceId) {
          constraintCandidates.push({
            video: {
              deviceId: { exact: targetDeviceId },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
          constraintCandidates.push({
            video: { deviceId: { exact: targetDeviceId } },
            audio: false,
          });
        }

        constraintCandidates.push(
          {
            video: {
              facingMode: { ideal: targetFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          },
          {
            video: {
              facingMode: targetFacing,
            },
            audio: false,
          },
          {
            video: true,
            audio: false,
          },
        );

        let acquiredStream: MediaStream | null = null;
        let lastErr: unknown = null;

        for (const constraints of constraintCandidates) {
          try {
            acquiredStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (acquiredStream) break;
          } catch (err) {
            lastErr = err;
          }
        }

        if (!acquiredStream) {
          throw lastErr || new Error("Gagal membuka stream kamera");
        }

        streamRef.current = acquiredStream;

        // Deteksi otomatis karakteristik kamera (apakah webcam laptop/depan atau kamera belakang HP/iPad)
        const videoTrack = acquiredStream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings?.() || {};
          const label = (videoTrack.label || "").toLowerCase();
          const isFrontOrWebcam =
            settings.facingMode === "user" ||
            (!settings.facingMode &&
              (label.includes("front") ||
                label.includes("facetime") ||
                label.includes("integrated") ||
                label.includes("webcam") ||
                label.includes("usb") ||
                targetFacing === "user"));
          setMirrorVideo(Boolean(isFrontOrWebcam));
          if (settings.deviceId) {
            setSelectedDeviceId(settings.deviceId);
          }
        }

        // Muat daftar kamera yang tersedia (HP multi-lensa, iPad, atau Laptop + Webcam eksternal)
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cams = devices
            .filter((d) => d.kind === "videoinput")
            .map((d, idx) => ({
              deviceId: d.deviceId,
              label: d.label || `Kamera ${idx + 1}`,
            }));
          setVideoDevices(cams);
        } catch {
          // Abaikan bila tidak didukung
        }

        setCameraActive(true);
        setStreamVersion((v) => v + 1);
      } catch {
        setCameraError(
          "Izin kamera ditolak atau kamera sedang dipakai aplikasi lain. Izinkan akses kamera di pengaturan browser, atau ketik kode RSNP-XXXX di bawah.",
        );
        setCameraActive(false);
      }
    },
    [facingMode, selectedDeviceId],
  );

  // Pastikan stream selalu terpasang ke elemen <video> begitu <video> ter-render (mencegah layar blank hitam di HP & iPad)
  useEffect(() => {
    if (!cameraActive || !streamRef.current || !videoRef.current) return;

    const videoEl = videoRef.current;
    const stream = streamRef.current;

    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.setAttribute("playsinline", "true");
    videoEl.setAttribute("webkit-playsinline", "true");

    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
    }

    const playVideo = async () => {
      try {
        await videoEl.play();
        if (videoEl.readyState >= 2) {
          setVideoReady(true);
        }
      } catch {
        // Akan dipicu ulang saat onLoadedMetadata / onCanPlay
      }
    };

    void playVideo();
  }, [cameraActive, streamVersion]);

  // Bersihkan kamera saat komponen unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Fungsi pemindaian 1 frame secara instan (dipakai oleh loop otomatis & tombol "Pindai Sekarang")
  const scanCurrentVideoFrame = useCallback(
    async (detector: BarcodeDetectorInstance | null) => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || isSubmittingRef.current) return;

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return;

      const handleDetectedCode = (rawVal: string) => {
        const cleaned = rawVal.trim();
        if (!cleaned) return false;
        const now = Date.now();
        if (
          cleaned === lastScannedRef.current.code &&
          now - lastScannedRef.current.at < 3000
        ) {
          return false;
        }
        lastScannedRef.current = { code: cleaned, at: now };
        void submitVoucherScan(cleaned, kind);
        return true;
      };

      // 1. Coba melalui Native BarcodeDetector API terlebih dahulu bila tersedia di perangkat
      if (detector) {
        try {
          const barcodes = await detector.detect(video);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            if (handleDetectedCode(barcodes[0].rawValue)) return;
          }
        } catch {
          // Lanjut ke dekoder optik Canvas Code-128B
        }
      }

      // 2. Dekoder Optik Canvas Code-128B (bekerja di semua Laptop Webcam, iPad, iOS Safari & Android)
      try {
        let canvas = canvasRef.current;
        if (!canvas) {
          canvas = document.createElement("canvas");
          canvasRef.current = canvas;
        }

        const targetW = Math.min(840, vw);
        const targetH = Math.max(120, Math.round((vh / vw) * targetW));
        if (canvas.width !== targetW || canvas.height !== targetH) {
          canvas.width = targetW;
          canvas.height = targetH;
        }

        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        ctx.drawImage(video, 0, 0, targetW, targetH);
        const imageData = ctx.getImageData(0, 0, targetW, targetH);
        const decodedCode128 = scanImageDataForCode128(imageData);

        if (decodedCode128) {
          handleDetectedCode(decodedCode128);
        }
      } catch {
        // Abaikan bila frame belum siap
      }
    },
    [kind, submitVoucherScan],
  );

  // Loop deteksi otomatis (menggabungkan Native BarcodeDetector + Canvas Code-128B Decoder setiap 170ms)
  useEffect(() => {
    if (!cameraActive) return;

    const win = window as unknown as WindowWithBarcodeDetector;
    let detector: BarcodeDetectorInstance | null = null;
    if (win.BarcodeDetector) {
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
    }

    const interval = setInterval(() => {
      void scanCurrentVideoFrame(detector);
    }, 170);

    return () => clearInterval(interval);
  }, [cameraActive, scanCurrentVideoFrame]);

  // Ganti kamera depan <-> belakang (HP & iPad) atau pindah antar webcam (Laptop)
  const handleSwitchCamera = useCallback(() => {
    if (videoDevices.length > 1 && selectedDeviceId) {
      const currentIdx = videoDevices.findIndex((d) => d.deviceId === selectedDeviceId);
      const nextDevice = videoDevices[(currentIdx + 1) % videoDevices.length];
      if (nextDevice) {
        setSelectedDeviceId(nextDevice.deviceId);
        void startCamera({ deviceId: nextDevice.deviceId });
        return;
      }
    }
    const nextFacing = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacing);
    setSelectedDeviceId("");
    void startCamera({ preferredFacing: nextFacing, deviceId: "" });
  }, [facingMode, selectedDeviceId, startCamera, videoDevices]);

  const filteredEligible = useMemo(() => {
    const q = guestSearch.trim().toLowerCase();
    if (!q) return [];
    return eligibleGuests
      .filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.voucherCode.toLowerCase().includes(q) ||
          (g.category || "").toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [eligibleGuests, guestSearch]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header & Pemilih Mode Booth (Makan vs Photobooth) */}
      {!compact ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black text-ink sm:text-2xl">
                Scanner Voucher Makan & Photobooth
              </h1>
              <Badge tone={isLive ? "success" : "brand"} icon={Radio}>
                {isLive ? "LIVE REAL-TIME" : "AUTO-SYNC"}
              </Badge>
            </div>
            <p className="text-xs font-semibold text-ink-muted">
              1 Barcode berlaku untuk 1x Makan & 1x Photobooth · Riwayat scan otomatis menyegarkan tanpa refresh
            </p>
          </div>

          <button
            type="button"
            onClick={() => void fetchScannerData()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-bold text-ink shadow-2xs hover:bg-surface-soft"
          >
            <RefreshCw className="size-3.5" />
            Segarkan
          </button>
        </div>
      ) : null}

      {/* Kartu Ringkasan Kuota Voucher (Responsif HP, iPad, Laptop) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
        <Card className="flex flex-col justify-between gap-1 rounded-2xl border-line p-3 sm:p-4">
          <div className="flex items-center justify-between text-brand-blue">
            <span className="text-[10px] font-black uppercase tracking-wider sm:text-xs">
              Hadir
            </span>
            <UserCheck className="size-3.5 shrink-0 sm:size-4" />
          </div>
          <span className="text-xl font-black text-ink sm:text-3xl">
            {stats.eligibleCount}
          </span>
        </Card>

        <Card className="flex flex-col justify-between gap-1 rounded-2xl border-brand-orange/35 bg-brand-orange/5 p-3 sm:p-4">
          <div className="flex items-center justify-between text-brand-orange">
            <span className="text-[10px] font-black uppercase tracking-wider sm:text-xs">
              Makan
            </span>
            <Utensils className="size-3.5 shrink-0 sm:size-4" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-brand-orange sm:text-3xl">
              {stats.mealRedeemedCount}
            </span>
            <span className="text-[11px] font-bold text-ink-muted">
              / {stats.eligibleCount}
            </span>
          </div>
          {stats.tamuMealQuota ? (
            <span className="text-[10px] font-extrabold text-ink-muted">
              Slot Tamu: {stats.tamuMealQuota.usedSlots}/{stats.tamuMealQuota.maxSlots} (Sisa{" "}
              {stats.tamuMealQuota.remainingSlots})
            </span>
          ) : null}
        </Card>

        <Card className="flex flex-col justify-between gap-1 rounded-2xl border-brand-purple/35 bg-brand-purple/5 p-3 sm:p-4">
          <div className="flex items-center justify-between text-brand-purple">
            <span className="text-[10px] font-black uppercase tracking-wider sm:text-xs">
              Photobooth
            </span>
            <Camera className="size-3.5 shrink-0 sm:size-4" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-brand-purple sm:text-3xl">
              {stats.photoboothRedeemedCount}
            </span>
            <span className="text-[11px] font-bold text-ink-muted">
              / {stats.eligibleCount}
            </span>
          </div>
        </Card>
      </div>

      {/* Area Utama: Responsif di HP (1 kolom), iPad (12 kolom proporsional), dan Laptop */}
      <div className="grid grid-cols-1 items-start gap-4 sm:gap-5 md:grid-cols-12">
        {/* Kolom Kiri: Kontrol Scanner */}
        <div className="flex flex-col gap-4 md:col-span-7">
          <Card className="flex flex-col gap-4 rounded-3xl border-white/80 bg-white/95 p-4 shadow-md sm:p-5">
            {/* Mode Booth */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">
                Mode Booth Penanggung Jawab (PIC)
              </span>
              <SegmentedControl<VoucherKind>
                name="voucher_kind"
                ariaLabel="Pilih jenis voucher yang di-scan"
                value={kind}
                onChange={(next) => {
                  setKind(next);
                  setHistoryFilter(next);
                  setScanResult(null);
                }}
                options={[
                  { value: "meal", label: "MAKAN (KONSUMSI)", icon: Utensils },
                  { value: "photobooth", label: "PHOTOBOOTH", icon: Camera },
                ]}
              />
            </div>

            {/* Hasil Scan Terakhir (Kartu Hijau / Merah Mencolok) */}
            {scanResult ? (
              <div
                role="status"
                aria-live="assertive"
                className={`flex flex-col gap-3 rounded-2xl border-2 p-3.5 shadow-md animate-in fade-in zoom-in-95 duration-200 sm:p-4 ${
                  scanResult.ok
                    ? "border-success bg-success/10 text-ink"
                    : "border-error bg-error/10 text-ink"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm sm:size-11 ${
                        scanResult.ok ? "bg-success" : "bg-error"
                      }`}
                    >
                      {scanResult.ok ? (
                        <CheckCircle2 className="size-5 sm:size-6" />
                      ) : (
                        <AlertTriangle className="size-5 sm:size-6" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-[11px] font-black uppercase tracking-wider sm:text-xs ${
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
                      <span className="text-sm font-black text-ink sm:text-base">
                        {scanResult.guest?.name || scanResult.message}
                      </span>
                      {scanResult.guest?.category ? (
                        <span className="text-xs font-bold text-brand-blue">
                          {scanResult.guest.category} · {scanResult.guest.voucherCode}
                        </span>
                      ) : null}
                      {scanResult.guest?.allergies ? (
                        <span className="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-warning px-2.5 py-0.5 text-[11px] font-black text-white shadow-2xs">
                          <AlertTriangle className="size-3" />
                          ALERGI MAKANAN: {scanResult.guest.allergies}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <p className="text-xs font-bold leading-relaxed text-ink">
                  {scanResult.message}
                </p>

                {scanResult.guest ? (
                  <div className="grid grid-cols-1 gap-1.5 rounded-xl bg-white/85 p-2.5 text-[11px] font-bold sm:grid-cols-2 sm:gap-2">
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

            {/* Kamera Pemindai Otomatis */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">
                  Kamera Scanner
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {cameraActive ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSwitchCamera}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 text-xs font-bold text-ink shadow-2xs transition hover:bg-surface-soft"
                        title="Ganti Kamera Depan / Belakang"
                      >
                        <SwitchCamera className="size-3.5 text-brand-purple" />
                        <span>Balik Kamera</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMirrorVideo((m) => !m)}
                        className={`inline-flex h-9 items-center gap-1 rounded-xl border px-2.5 text-xs font-bold transition ${
                          mirrorVideo
                            ? "border-brand-blue/40 bg-brand-blue/10 text-brand-blue"
                            : "border-line bg-surface text-ink-muted hover:bg-surface-soft"
                        }`}
                        title="Mirror tampilan video (berguna untuk webcam laptop)"
                      >
                        <FlipHorizontal className="size-3.5" />
                        <span className="hidden sm:inline">Mirror</span>
                      </button>
                    </>
                  ) : null}

                  <Button
                    type="button"
                    variant={cameraActive ? "secondary" : "primary"}
                    onClick={() => (cameraActive ? stopCamera() : void startCamera())}
                    className="h-9 px-3 text-xs font-extrabold"
                  >
                    {cameraActive ? (
                      <>
                        <CameraOff className="size-3.5" />
                        Matikan
                      </>
                    ) : (
                      <>
                        <Camera className="size-3.5" />
                        Aktifkan Kamera
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Pilihan Lensa Kamera bila perangkat memiliki >1 kamera */}
              {cameraActive && videoDevices.length > 1 ? (
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="scanner-camera-select"
                    className="shrink-0 text-[11px] font-bold text-ink-muted"
                  >
                    Lensa:
                  </label>
                  <select
                    id="scanner-camera-select"
                    value={selectedDeviceId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      setSelectedDeviceId(nextId);
                      void startCamera({ deviceId: nextId });
                    }}
                    className="h-8 w-full rounded-xl border border-line bg-surface px-2.5 text-xs font-semibold text-ink focus:border-brand-purple focus:outline-none"
                  >
                    {videoDevices.map((dev, idx) => (
                      <option key={dev.deviceId || idx} value={dev.deviceId}>
                        {dev.label || `Kamera ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {cameraError ? (
                <div className="rounded-2xl border border-warning/40 bg-warning/10 p-3 text-xs font-semibold text-warning">
                  {cameraError}
                </div>
              ) : null}

              {cameraActive ? (
                <div
                  className={`relative aspect-[4/3] max-h-[46vh] w-full overflow-hidden rounded-2xl border-2 bg-neutral-950 shadow-inner transition sm:aspect-[16/10] sm:max-h-[360px] lg:aspect-video lg:max-h-[400px] ${
                    scanPulse
                      ? "border-success ring-4 ring-success/30"
                      : "border-brand-purple"
                  }`}
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={(e) => {
                      const el = e.currentTarget;
                      void el.play().catch(() => {});
                      if (el.readyState >= 2) setVideoReady(true);
                    }}
                    onCanPlay={() => setVideoReady(true)}
                    onPlaying={() => setVideoReady(true)}
                    className={`size-full object-cover transition-transform duration-200 ${
                      mirrorVideo ? "-scale-x-100" : ""
                    }`}
                  />

                  {/* Indikator Loading Kamera sebelum frame pertama muncul */}
                  {!videoReady ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-neutral-950/85 p-4 text-center text-white">
                      <Loader2 className="size-7 animate-spin text-brand-gold" />
                      <span className="text-xs font-bold">
                        Menyiapkan lensa kamera...
                      </span>
                    </div>
                  ) : null}

                  {/* Bingkai Viewfinder & Laser Scanline Responsif */}
                  <div className="pointer-events-none absolute inset-x-4 inset-y-6 rounded-2xl border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.28)] sm:inset-x-8 sm:inset-y-8">
                    {/* Sudut Penanda Fokus Barcode */}
                    <div className="absolute -top-0.5 -left-0.5 size-5 rounded-tl-xl border-t-4 border-l-4 border-brand-gold" />
                    <div className="absolute -top-0.5 -right-0.5 size-5 rounded-tr-xl border-t-4 border-r-4 border-brand-gold" />
                    <div className="absolute -bottom-0.5 -left-0.5 size-5 rounded-bl-xl border-b-4 border-l-4 border-brand-gold" />
                    <div className="absolute -bottom-0.5 -right-0.5 size-5 rounded-br-xl border-b-4 border-r-4 border-brand-gold" />

                    <div className="animate-scanline absolute inset-x-2 h-1 rounded-full bg-gradient-brand shadow-[0_0_16px_rgba(242,185,46,0.95)]" />
                  </div>

                  {/* Status Bar Kamera Atas */}
                  <div className="pointer-events-none absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-black/65 px-2.5 py-1 text-[10px] font-extrabold text-white backdrop-blur-xs">
                    <span className="size-2 animate-pulse rounded-full bg-success" />
                    <span>AUTO-SCAN AKTIF (BARCODE & QR)</span>
                  </div>

                  {/* Instruksi Bawah & Tombol Pindai Instan */}
                  <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
                    <span className="truncate rounded-full bg-black/75 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-xs">
                      Arahkan Barcode Tiket ke tengah kotak ({kind === "meal" ? "Makan" : "Photobooth"})
                    </span>
                    <button
                      type="button"
                      onClick={() => void scanCurrentVideoFrame(null)}
                      disabled={isSubmitting}
                      className="shrink-0 rounded-full bg-brand-gold px-3 py-1 text-[11px] font-black text-ink shadow-md transition active:scale-95 disabled:opacity-50"
                    >
                      Pindai Sekarang
                    </button>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Input Kode Barcode / Hardware Barcode Gun */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submitVoucherScan(manualCode, kind);
              }}
              className="flex flex-col gap-2 border-t border-line pt-3.5"
            >
              <label
                htmlFor="manual-voucher-input"
                className="text-[11px] font-extrabold uppercase tracking-wider text-ink-muted"
              >
                Input Kode Manual / Scanner USB
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
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
                  className="h-11 shrink-0 px-4 text-xs font-black"
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

            {/* Pencarian Cepat Nama Tamu yang Sudah Check-In (Instan 0ms) */}
            <div className="flex flex-col gap-2.5 border-t border-line pt-3.5">
              <label
                htmlFor="scanner-guest-search"
                className="text-[11px] font-extrabold uppercase tracking-wider text-ink-muted"
              >
                Cari Nama Tamu Hadir (Instan)
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
                        className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-xs"
                      >
                        <div className="flex flex-col">
                          <span className="font-black text-ink">{g.name}</span>
                          <span className="text-[11px] font-semibold text-ink-muted">
                            {g.category || "Tamu"} ·{" "}
                            <span className="font-mono text-brand-purple">{g.voucherCode}</span>
                          </span>
                          {g.allergies ? (
                            <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded-md bg-warning/15 px-1.5 py-0.5 text-[10px] font-black text-warning">
                              Alergi: {g.allergies}
                            </span>
                          ) : null}
                        </div>

                        {kind === "meal" && g.mealEligible === false ? (
                          <Badge tone="warning">
                            OTS: Hanya Photobooth (Tanpa Makan)
                          </Badge>
                        ) : isUsed ? (
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

        {/* Kolom Kanan: Log Hasil Scanner Real-Time dengan Filter Khusus PIC Makan vs Photobooth */}
        <div className="flex flex-col gap-4 md:col-span-5">
          <Card className="flex flex-col gap-3.5 rounded-3xl p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-ink sm:text-base">
                    Log Hasil Scanner
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-black text-success">
                    <span className="size-1.5 animate-pulse rounded-full bg-success" />
                    REAL-TIME
                  </span>
                </div>
                <p className="text-xs text-ink-muted">
                  Terpisah per booth agar tidak bercampur
                </p>
              </div>
              <Badge tone="brand">{filteredHistory.length}</Badge>
            </div>

            {/* Filter Tab: Khusus Makan, Khusus Photobooth, atau Semua */}
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-surface-soft p-1">
              <button
                type="button"
                onClick={() => setHistoryFilter("meal")}
                className={`flex items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-extrabold transition ${
                  historyFilter === "meal"
                    ? "bg-brand-orange text-white shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <Utensils className="size-3" />
                <span>Makan ({mealHistoryCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter("photobooth")}
                className={`flex items-center justify-center gap-1 rounded-xl py-1.5 text-[11px] font-extrabold transition ${
                  historyFilter === "photobooth"
                    ? "bg-brand-purple text-white shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                <Camera className="size-3" />
                <span>Foto ({photoHistoryCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter("all")}
                className={`flex items-center justify-center rounded-xl py-1.5 text-[11px] font-extrabold transition ${
                  historyFilter === "all"
                    ? "bg-ink text-white shadow-xs"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                Semua ({history.length})
              </button>
            </div>

            {filteredHistory.length === 0 ? (
              <p className="py-8 text-center text-xs font-semibold text-ink-muted">
                {historyFilter === "meal"
                  ? "Belum ada hasil scan Voucher Makan."
                  : historyFilter === "photobooth"
                    ? "Belum ada hasil scan Voucher Photobooth."
                    : "Belum ada voucher yang di-scan."}
              </p>
            ) : (
              <div className="flex max-h-[380px] flex-col divide-y divide-line overflow-y-auto pr-1 text-xs sm:max-h-[460px]">
                {filteredHistory.map((item, idx) => {
                  const isNewest = idx === 0;
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between gap-2 rounded-xl px-2 py-2.5 transition ${
                        isNewest ? "bg-success/8 ring-1 ring-success/25" : ""
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
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
                        <div className="flex min-w-0 flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-black text-ink">{item.guestName}</span>
                            {isNewest ? (
                              <span className="shrink-0 rounded-full bg-success px-1.5 py-0.2 text-[9px] font-black uppercase text-white">
                                Terbaru
                              </span>
                            ) : null}
                          </div>
                          <span className="truncate text-[11px] text-ink-muted">
                            {item.category || "Panitia"} ·{" "}
                            <span className="font-mono font-bold text-brand-purple">
                              {item.voucherCode}
                            </span>
                          </span>
                          {item.kind === "meal" && item.allergies ? (
                            <span className="mt-0.5 inline-flex w-fit items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-extrabold text-warning">
                              <AlertTriangle className="size-2.5" />
                              Alergi: {item.allergies}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase text-white ${
                            item.kind === "meal" ? "bg-brand-orange" : "bg-brand-purple"
                          }`}
                        >
                          {item.kind === "meal" ? "MAKAN" : "FOTO"}
                        </span>
                        <span className="font-bold tabular-nums text-ink">
                          {item.redeemedAtWib}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
