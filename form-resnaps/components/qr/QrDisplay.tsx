// P07: Layar QR Dinamis Closing Party CHRYSALIS — Gerbang Pencatatan Kehadiran Guest.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import Image from "next/image";
import {
  LogIn,
  LogOut,
  Maximize,
  Minimize,
  Lock,
  Unlock,
  Pause,
  Play,
  Wifi,
  WifiOff,
  Radio,
  AlertCircle,
  Zap,
  Sparkles,
  Volume2,
  VolumeX,
  PartyPopper,
  Ticket,
} from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { playSuccessChime, playScanBlip } from "@/lib/sound";
import type { Mode } from "@/lib/qr-token";

type QrApiResponse = {
  ok: boolean;
  open: boolean;
  mode: Mode;
  url?: string;
  windowSeconds?: number;
  expiresAt?: string;
  serverNow?: number;
  ahead?: { url: string; validFrom: string }[];
  code?: string;
};

type CounterData = {
  total: number;
  checkedIn: number;
  checkedOut: number;
  inside: number;
  notYet: number;
};

type LiveNotification = {
  id: string;
  type: "scan" | "attendance";
  title: string;
  subtitle: string;
  mode: Mode;
  at: number;
};

export function QrDisplay({ compact = false }: { compact?: boolean }) {
  // Mode: Masuk (Check-in) | Pulang (Check-out) (default: in)
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return "in";
    try {
      const saved = localStorage.getItem("resnaps_qr_mode") as Mode | null;
      return saved === "in" || saved === "out" ? saved : "in";
    } catch {
      return "in";
    }
  });

  const [isOpen, setIsOpen] = useState(true);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const [windowSec, setWindowSec] = useState<number>(30);
  const [isPaused, setIsPaused] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [counter, setCounter] = useState<CounterData | null>(null);
  const [isTogglingOpen, setIsTogglingOpen] = useState(false);

  // Live Toast Notification saat Tamu Scan / Berhasil Check-in
  const [liveToast, setLiveToast] = useState<LiveNotification | null>(null);
  const lastKnownAttIdRef = useRef<string | null>(null);
  const lastKnownScanIdRef = useRef<string | null>(null);

  // Ref untuk sinkronisasi jam & antrean prefetch token
  const clockSkewMs = useRef<number>(0);
  const queueRef = useRef<{ url: string; validFromMs: number }[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const unlockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [unlockProgress, setUnlockProgress] = useState(0);

  function handleModeChange(newMode: Mode) {
    if (isLocked) return;
    setMode(newMode);
    try {
      localStorage.setItem("resnaps_qr_mode", newMode);
    } catch {
      // Abaikan bila localStorage tidak tersedia
    }
    queueRef.current = [];
    setCurrentUrl(null);
    setQrDataUrl("");
  }

  // 1. Mengambil token QR dari server
  const fetchToken = useCallback(async (targetMode: Mode) => {
    try {
      const res = await fetch(`/api/panitia/qr-token?mode=${targetMode}&ahead=4`);
      if (!res.ok) {
        setIsConnected(false);
        return;
      }
      const data: QrApiResponse = await res.json();
      setIsConnected(true);

      if (!data.open) {
        setIsOpen(false);
        setCurrentUrl(null);
        setQrDataUrl("");
        return;
      }

      setIsOpen(true);
      if (data.serverNow) {
        clockSkewMs.current = data.serverNow - Date.now();
      }
      if (data.windowSeconds) {
        setWindowSec(data.windowSeconds);
      }

      const newQueue: { url: string; validFromMs: number }[] = [];
      if (data.url && data.expiresAt) {
        newQueue.push({
          url: data.url,
          validFromMs: new Date(data.expiresAt).getTime() - (data.windowSeconds ?? 30) * 1000,
        });
      }
      if (data.ahead) {
        for (const item of data.ahead) {
          newQueue.push({ url: item.url, validFromMs: new Date(item.validFrom).getTime() });
        }
      }
      queueRef.current = newQueue;

      if (data.url) {
        setCurrentUrl(data.url);
      }
    } catch {
      setIsConnected(false);
    }
  }, []);

  // 2. Polling hitungan kehadiran tamu
  const fetchCounter = useCallback(async () => {
    try {
      const res = await fetch("/api/panitia/counter");
      if (res.ok) {
        const d = await res.json();
        if (d.ok) setCounter(d);
      }
    } catch {
      // Abaikan
    }
  }, []);

  // 3. Polling live preview aktivitas scan & kehadiran tamu
  const checkLiveActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/panitia/live-activity");
      if (!res.ok) return;
      const d = await res.json();
      if (!d.ok) return;

      const latestAtt = d.latestAttendance?.[0];
      if (latestAtt && latestAtt.isVeryRecent && latestAtt.id !== lastKnownAttIdRef.current) {
        lastKnownAttIdRef.current = latestAtt.id;
        if (soundEnabled) {
          try {
            playSuccessChime();
          } catch {
            // Audio diblokir
          }
        }
        setLiveToast({
          id: latestAtt.id,
          type: "attendance",
          title: `${latestAtt.guestName} berhasil check-in!`,
          subtitle: `${latestAtt.category ? latestAtt.category + " · " : ""}Pukul ${latestAtt.scannedAtWib}`,
          mode: latestAtt.type,
          at: Date.now(),
        });
        return;
      }

      const scan = d.latestScanInfo;
      if (scan && scan.isVeryRecent && !scan.isConsumed && scan.id !== lastKnownScanIdRef.current) {
        lastKnownScanIdRef.current = scan.id;
        if (soundEnabled) {
          try {
            playScanBlip();
          } catch {
            // Audio diblokir
          }
        }
        setLiveToast({
          id: scan.id,
          type: "scan",
          title: "Guest sedang memindai QR...",
          subtitle: `Menghubungkan ke gerbang ${scan.mode === "in" ? "Masuk" : "Pulang"}`,
          mode: scan.mode,
          at: Date.now(),
        });
      }
    } catch {
      // Abaikan
    }
  }, [soundEnabled]);

  // 4. Timer rotasi token dan polling live stream
  useEffect(() => {
    let mounted = true;

    void (async () => {
      await fetchToken(mode);
      if (mounted) {
        await fetchCounter();
        await checkLiveActivity();
      }
    })();

    const tokenInterval = setInterval(() => {
      if (isPaused) return;

      const syncedNow = Date.now() + clockSkewMs.current;
      const currentWindowIdx = Math.floor(Math.floor(syncedNow / 1000) / windowSec);
      const windowEndMs = (currentWindowIdx + 1) * windowSec * 1000;
      const remSec = Math.max(0, Math.ceil((windowEndMs - syncedNow) / 1000));
      setSecondsLeft(remSec);

      if (remSec <= 8 && queueRef.current.length <= 2) {
        void fetchToken(mode);
      }

      const candidate = [...queueRef.current]
        .reverse()
        .find((item) => syncedNow >= item.validFromMs);

      if (candidate && candidate.url !== currentUrl) {
        setCurrentUrl(candidate.url);
      }
    }, 1000);

    const counterInterval = setInterval(() => {
      if (mounted) {
        void fetchCounter();
        void checkLiveActivity();
      }
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(tokenInterval);
      clearInterval(counterInterval);
    };
  }, [mode, windowSec, isPaused, fetchToken, fetchCounter, checkLiveActivity, currentUrl]);

  // 5. Supabase Realtime channel
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("qr-closing-party-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendance_logs" },
        () => {
          void checkLiveActivity();
          void fetchCounter();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [checkLiveActivity, fetchCounter]);

  // Auto-dismiss live toast setelah 5 detik
  useEffect(() => {
    if (!liveToast) return;
    const timer = setTimeout(() => {
      setLiveToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [liveToast]);

  // 6. Render QR Code (PNG Data URL beresolusi tinggi, hitam di putih tajam)
  useEffect(() => {
    let active = true;
    if (currentUrl) {
      QRCode.toDataURL(currentUrl, {
        errorCorrectionLevel: "M",
        margin: 4,
        width: 440,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
        .then((dataUrl) => {
          if (active) setQrDataUrl(dataUrl);
        })
        .catch(() => {
          if (active) setQrDataUrl("");
        });
    }
    return () => {
      active = false;
    };
  }, [currentUrl]);

  // 7. Screen Wake Lock API
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Abaikan
      }
    }
    void requestWakeLock();
    return () => {
      if (wakeLock) void wakeLock.release().catch(() => {});
    };
  }, []);

  // 8. Fullscreen Handler
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  // 9. Buka / Tutup Gerbang Kehadiran
  async function handleToggleOpen() {
    if (isLocked) return;
    const confirmMsg = isOpen
      ? `Tutup gerbang check-in ${mode === "in" ? "KEDATANGAN" : "KEPULANGAN"}? Tamu tidak akan dapat memindai lagi.`
      : `Buka kembali gerbang check-in ${mode === "in" ? "KEDATANGAN" : "KEPULANGAN"}?`;

    if (!window.confirm(confirmMsg)) return;

    setIsTogglingOpen(true);
    try {
      const res = await fetch("/api/panitia/toggle-open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, open: !isOpen }),
      });
      if (res.ok) {
        setIsOpen(!isOpen);
        if (!isOpen) {
          void fetchToken(mode);
        }
      }
    } finally {
      setIsTogglingOpen(false);
    }
  }

  // 10. Kunci Kontrol (tahan 1 detik untuk buka kunci)
  function handleUnlockPressStart() {
    if (!isLocked) return;
    setUnlockProgress(0);
    const start = Date.now();
    unlockTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.floor((elapsed / 1000) * 100));
      setUnlockProgress(pct);
      if (pct >= 100) {
        clearInterval(unlockTimerRef.current!);
        setIsLocked(false);
        setUnlockProgress(0);
      }
    }, 50);
  }

  function handleUnlockPressEnd() {
    clearInterval(unlockTimerRef.current!);
    setUnlockProgress(0);
  }

  const isMasuk = mode === "in";

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-between gap-5 rounded-3xl border border-white/70 bg-gradient-to-b from-white/95 via-surface/90 to-surface-soft/90 p-6 shadow-2xl backdrop-blur-2xl transition-all sm:p-7 ${
        compact ? "w-full max-w-md" : "w-full max-w-2xl"
      }`}
    >
      {/* Toast Notifikasi Live Preview Mengambang */}
      {liveToast ? (
        <div
          role="status"
          aria-live="polite"
          className="absolute -top-5 z-40 flex w-[92%] max-w-md animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div
            className={`flex w-full items-center gap-3.5 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl ${
              liveToast.type === "attendance"
                ? "border-success/50 bg-white/95 text-ink ring-4 ring-success/20"
                : "border-brand-blue/50 bg-white/95 text-ink ring-4 ring-brand-blue/20"
            }`}
          >
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl shadow-xs ${
                liveToast.type === "attendance"
                  ? "bg-gradient-to-br from-success to-emerald-600 text-white"
                  : "bg-gradient-to-br from-brand-blue to-brand-purple text-white"
              }`}
            >
              {liveToast.type === "attendance" ? (
                <PartyPopper className="size-5 animate-bounce" />
              ) : (
                <Zap className="size-5 animate-pulse text-brand-gold" />
              )}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[10px] font-black uppercase tracking-wider text-brand-blue">
                {liveToast.type === "attendance" ? "Check-in Berhasil!" : "Kamera Terhubung"}
              </span>
              <span className="truncate text-sm font-black text-ink">{liveToast.title}</span>
              <span className="text-xs font-semibold text-ink-muted">{liveToast.subtitle}</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Baris Atas: Logo Resmi & Pemilih Mode Kedatangan / Kepulangan */}
      <div className="flex w-full flex-wrap items-center justify-between gap-3 border-b border-line/70 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative size-10 overflow-hidden rounded-xl shadow-xs ring-1 ring-black/5">
            <Image
              src="/brand/logo.png"
              alt="RE:SNAPS"
              width={80}
              height={80}
              className="size-full object-cover"
              priority
            />
          </div>
          <div className="w-56">
            <SegmentedControl<Mode>
              name="qr_mode"
              ariaLabel="Pilih mode check-in"
              value={mode}
              onChange={handleModeChange}
              options={[
                { value: "in", label: "MASUK", icon: LogIn },
                { value: "out", label: "PULANG", icon: LogOut },
              ]}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            tone={isConnected ? "success" : "error"}
            icon={isConnected ? Wifi : WifiOff}
          >
            {isConnected ? "Live Gate" : "Offline"}
          </Badge>
          <Badge tone={isOpen ? "brand" : "error"} icon={isOpen ? Radio : AlertCircle}>
            {isOpen ? "PINTU BUKA" : "DITUTUP"}
          </Badge>
        </div>
      </div>

      {/* Judul Besar Closing Party & Penegasan Kehadiran Tamu */}
      <div className="flex flex-col items-center text-center">
        {/* Lencana Identitas Closing Party (Bukan absensi kantor/sekolah) */}
        <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-purple/20 bg-gradient-to-r from-brand-blue/10 via-brand-purple/10 to-brand-gold/10 px-4 py-1 text-xs font-black uppercase tracking-wider text-brand-purple shadow-2xs">
          <Sparkles className="size-3.5 text-brand-gold" />
          <span>CHECK-IN GUEST · CLOSING PARTY CHRYSALIS</span>
        </div>

        <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-ink sm:text-3xl">
          {isMasuk ? "SCAN UNTUK CHECK-IN TAMU" : "SCAN UNTUK CHECK-OUT TAMU"}
        </h1>
        <p className="mt-1 text-xs font-bold text-ink-muted">
          {isMasuk
            ? "Arahkan kamera ponsel Anda ke kode QR untuk mengambil Tiket Masuk"
            : "Arahkan kamera ponsel Anda sebelum meninggalkan venue"}
        </p>
      </div>

      {/* Area Tampilan QR dengan Frame Gradien Perayaan & Kontras Hitam-Putih Maksimal */}
      <div className="relative flex flex-col items-center justify-center">
        {/* Efek Pendaran Halus di Belakang QR (Closing Party Glow) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-3 rounded-full bg-gradient-brand opacity-25 blur-2xl"
        />

        {!isOpen ? (
          <div className="relative z-10 flex size-72 flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-error bg-surface-soft/90 p-6 text-center shadow-lg sm:size-84">
            <AlertCircle className="size-12 text-error animate-pulse" />
            <div className="flex flex-col gap-1">
              <p className="text-base font-black text-ink">
                Gerbang {isMasuk ? "Check-in Masuk" : "Check-out Pulang"} Ditutup
              </p>
              <p className="text-xs text-ink-muted">
                Kode QR disembunyikan. Tekan tombol di bawah untuk membuka kembali.
              </p>
            </div>
            <Button
              onClick={handleToggleOpen}
              disabled={isLocked || isTogglingOpen}
              className="mt-1 text-xs font-extrabold"
            >
              Buka Gerbang {isMasuk ? "Masuk" : "Pulang"}
            </Button>
          </div>
        ) : isPaused ? (
          <div className="relative z-10 flex size-72 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-line bg-surface-soft/90 p-6 text-center shadow-lg sm:size-84">
            <Pause className="size-12 text-ink-muted" />
            <p className="font-bold text-ink">Layar QR Dijeda</p>
            <p className="text-xs text-ink-muted">Kode QR disembunyikan sementara.</p>
            <Button
              onClick={() => setIsPaused(false)}
              disabled={isLocked}
              variant="secondary"
              className="mt-2 text-xs font-semibold"
            >
              Lanjutkan Tampilan
            </Button>
          </div>
        ) : !isConnected && !currentUrl ? (
          <div className="relative z-10 flex size-72 flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-error bg-surface-soft/90 p-6 text-center sm:size-84">
            <WifiOff className="size-12 text-error animate-bounce" />
            <p className="font-bold text-ink">Koneksi Terputus</p>
            <p className="text-xs text-ink-muted">Menghubungkan kembali ke server acara...</p>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center">
            {/* Bingkai Mewah Gradien RE:SNAPS yang Membungkus QR Box */}
            <div className="rounded-3xl bg-gradient-brand p-1.5 shadow-2xl ring-4 ring-brand-blue/10">
              {/* Wadah Putih Bersih Khusus Modul QR */}
              <div className="flex size-72 items-center justify-center overflow-hidden rounded-[22px] bg-white p-2.5 shadow-inner sm:size-84">
                {qrDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrDataUrl}
                    alt="Kode QR Check-in RE:SNAPS"
                    className="size-full object-contain"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-xs font-bold text-ink-muted">
                    Memuat Kode QR...
                  </div>
                )}
              </div>
            </div>

            {/* Hitung Mundur Sisa Waktu Jendela */}
            <div className="mt-4 flex items-center gap-2.5 text-xs font-bold text-ink">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-soft p-0.5 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-blue via-brand-purple to-brand-coral transition-all duration-1000 ease-linear"
                  style={{ width: `${(secondsLeft / windowSec) * 100}%` }}
                />
              </div>
              <span className="tabular-nums">Berganti dalam {secondsLeft} detik</span>
            </div>
          </div>
        )}
      </div>

      {/* 3 Langkah Petunjuk Tamu Bergaya Festival */}
      <div className="grid w-full grid-cols-3 gap-2 border-y border-line/70 py-3 text-center text-xs text-ink-muted">
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-black text-brand-blue">1. Buka Kamera HP</span>
          <span className="text-[10px]">Arahkan ke kode QR</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 border-x border-line/70 px-1">
          <span className="font-black text-brand-purple">2. Cari Namamu</span>
          <span className="text-[10px]">Pilih dari daftar tamu</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-black text-success">3. Ambil Gala Pass</span>
          <span className="text-[10px]">Nikmati acaranya!</span>
        </div>
      </div>

      {/* Counter Ringkas di Bawah QR */}
      {counter ? (
        <div className="flex w-full items-center justify-center gap-3 rounded-2xl bg-surface-soft/80 px-4 py-2.5 text-center text-xs font-bold text-ink shadow-inner">
          <Ticket className="size-4 text-brand-blue shrink-0" />
          {isMasuk ? (
            <span>
              Tamu Hadir: <strong className="text-brand-blue">{counter.checkedIn}</strong> / {counter.total} Orang · Di Dalam Venue: <strong className="text-success">{counter.inside}</strong>
            </span>
          ) : (
            <span>
              Tamu Pulang: <strong className="text-brand-purple">{counter.checkedOut}</strong> · Masih di Venue: <strong className="text-success">{counter.inside}</strong>
            </span>
          )}
        </div>
      ) : null}

      {/* Kontrol Layar & Fitur Panitia */}
      <div className="flex w-full flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex items-center gap-2">
          {isOpen ? (
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              disabled={isLocked}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-bold text-ink hover:bg-surface-soft disabled:opacity-40"
            >
              {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              {isPaused ? "Lanjutkan" : "Jeda"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleToggleOpen}
            disabled={isLocked || isTogglingOpen}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold disabled:opacity-40 ${
              isOpen
                ? "border-error text-error hover:bg-error/10"
                : "border-success text-success hover:bg-success/10"
            }`}
          >
            {isOpen ? "Tutup Pintu" : "Buka Pintu"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Suara Panitia */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-bold text-ink hover:bg-surface-soft"
            title={soundEnabled ? "Matikan suara notifikasi lonceng" : "Nyalakan suara notifikasi"}
          >
            {soundEnabled ? (
              <Volume2 className="size-3.5 text-brand-blue" />
            ) : (
              <VolumeX className="size-3.5 text-ink-muted" />
            )}
            <span className="hidden sm:inline">{soundEnabled ? "Suara On" : "Bisu"}</span>
          </button>

          {!compact ? (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-bold text-ink hover:bg-surface-soft"
            >
              {isFullscreen ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? "Kecilkan" : "Layar Penuh"}</span>
            </button>
          ) : null}

          {/* Tombol Kunci Kontrol (tahan 1 detik untuk buka) */}
          {isLocked ? (
            <button
              type="button"
              onMouseDown={handleUnlockPressStart}
              onMouseUp={handleUnlockPressEnd}
              onTouchStart={handleUnlockPressStart}
              onTouchEnd={handleUnlockPressEnd}
              className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-xl border border-warning bg-surface px-3 py-2 text-xs font-black text-warning"
              title="Tahan 1 detik untuk membuka kunci kontrol"
            >
              <div
                className="absolute inset-0 bg-warning/20 transition-all duration-75"
                style={{ width: `${unlockProgress}%` }}
              />
              <Lock className="relative z-10 size-3.5" />
              <span className="relative z-10">Tahan untuk Buka</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsLocked(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-bold text-ink hover:bg-surface-soft"
              title="Kunci kontrol agar tidak sengaja terpencet"
            >
              <Unlock className="size-3.5" />
              Kunci
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
