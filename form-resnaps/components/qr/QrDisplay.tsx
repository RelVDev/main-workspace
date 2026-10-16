// P07: Komponen Layar QR Dinamis dengan Live Preview Notifikasi Pemindaian & Desain RE:SNAPS.
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
  CheckCircle2,
} from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
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
  // Mode: Masuk | Pulang (inisialisasi lazy dari localStorage, default: in)
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
  const [counter, setCounter] = useState<CounterData | null>(null);
  const [isTogglingOpen, setIsTogglingOpen] = useState(false);

  // Live Toast Notification untuk User yang Scan / Absen
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

  // 1. Mengambil token dari server panitia
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

  // 2. Polling hitungan counter kehadiran
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

  // 3. Polling live preview aktivitas scan & absensi
  const checkLiveActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/panitia/live-activity");
      if (!res.ok) return;
      const d = await res.json();
      if (!d.ok) return;

      // Cek apakah ada absensi terbaru (< 12 detik lalu)
      const latestAtt = d.latestAttendance?.[0];
      if (latestAtt && latestAtt.isVeryRecent && latestAtt.id !== lastKnownAttIdRef.current) {
        lastKnownAttIdRef.current = latestAtt.id;
        setLiveToast({
          id: latestAtt.id,
          type: "attendance",
          title: `${latestAtt.guestName} berhasil absen ${latestAtt.type === "in" ? "MASUK" : "PULANG"}!`,
          subtitle: `${latestAtt.category ? latestAtt.category + " · " : ""}Pukul ${latestAtt.scannedAtWib}`,
          mode: latestAtt.type,
          at: Date.now(),
        });
        return;
      }

      // Cek apakah ada tamu yang baru saja scan QR (< 8 detik lalu)
      const scan = d.latestScanInfo;
      if (scan && scan.isVeryRecent && !scan.isConsumed && scan.id !== lastKnownScanIdRef.current) {
        lastKnownScanIdRef.current = scan.id;
        setLiveToast({
          id: scan.id,
          type: "scan",
          title: "Seseorang baru saja scan QR!",
          subtitle: `Sedang memilih nama pada mode ${scan.mode === "in" ? "Masuk" : "Pulang"}...`,
          mode: scan.mode,
          at: Date.now(),
        });
      }
    } catch {
      // Abaikan
    }
  }, []);

  // 4. Timer rotasi, hitung mundur, dan polling live
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

  // 5. Supabase Realtime channel untuk memicu live toast instan saat ada absensi
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("qr-display-live-attendance")
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

  // Auto-dismiss live toast setelah 6 detik
  useEffect(() => {
    if (!liveToast) return;
    const timer = setTimeout(() => {
      setLiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [liveToast]);

  // 6. Render QR Code (PNG Data URL beresolusi tinggi, tajam & tahan CSS reset)
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

  // 9. Buka / Tutup Absen
  async function handleToggleOpen() {
    if (isLocked) return;
    const confirmMsg = isOpen
      ? `Tutup absen ${mode === "in" ? "MASUK" : "PULANG"}? Tamu tidak akan dapat absen lagi.`
      : `Buka kembali absen ${mode === "in" ? "MASUK" : "PULANG"}?`;

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

  // 10. Kunci Kontrol (tahan 1 detik)
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

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-between gap-5 rounded-2xl border border-line bg-surface p-6 shadow-xl transition-all ${
        compact ? "w-full max-w-md" : "w-full max-w-2xl"
      }`}
    >
      {/* Toast Notifikasi Live Preview (P10 & P07 Live Feedback) */}
      {liveToast ? (
        <div
          role="status"
          aria-live="polite"
          className="absolute -top-4 z-40 flex w-[90%] max-w-md animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div
            className={`flex w-full items-center gap-3 rounded-xl border p-3.5 shadow-2xl backdrop-blur-md ${
              liveToast.type === "attendance"
                ? "border-success/40 bg-surface/95 text-ink ring-2 ring-success/30"
                : "border-brand-blue/40 bg-surface/95 text-ink ring-2 ring-brand-blue/30"
            }`}
          >
            <div
              className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                liveToast.type === "attendance"
                  ? "bg-success text-white"
                  : "bg-brand-blue text-white"
              }`}
            >
              {liveToast.type === "attendance" ? (
                <CheckCircle2 className="size-5" />
              ) : (
                <Zap className="size-5 animate-pulse" />
              )}
            </div>
            <div className="flex flex-col truncate">
              <span className="text-xs font-black uppercase tracking-wider text-brand-blue">
                {liveToast.type === "attendance" ? "Absensi Berhasil!" : "Scan Terdeteksi"}
              </span>
              <span className="truncate text-sm font-bold text-ink">{liveToast.title}</span>
              <span className="text-[11px] font-semibold text-ink-muted">{liveToast.subtitle}</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Baris Atas: Logo Resmi, Pemilih Mode & Status Koneksi */}
      <div className="flex w-full flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative size-8 overflow-hidden rounded-lg shadow-xs">
            <Image
              src="/brand/logo.png"
              alt="RE:SNAPS"
              width={64}
              height={64}
              className="size-full object-cover"
              priority
            />
          </div>
          <div className="w-52">
            <SegmentedControl<Mode>
              name="qr_mode"
              ariaLabel="Pilih mode absen layar"
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
            {isConnected ? "Terhubung" : "Koneksi Terputus"}
          </Badge>
          <Badge tone={isOpen ? "brand" : "error"} icon={isOpen ? Radio : AlertCircle}>
            {isOpen ? "DIBUKA" : "DITUTUP"}
          </Badge>
        </div>
      </div>

      {/* Judul Besar Sesuai Mode */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-blue">
          <Sparkles className="size-3.5" />
          <span>Sistem Absensi Otomatis</span>
        </div>
        <h2 className="mt-0.5 text-2xl font-black uppercase tracking-tight text-ink sm:text-3xl">
          {mode === "in" ? "SCAN UNTUK ABSEN MASUK" : "SCAN UNTUK ABSEN PULANG"}
        </h2>
        <p className="mt-1 text-xs font-semibold text-ink-muted">
          Arahkan kamera ponsel Anda ke kode QR dinamis di bawah ini
        </p>
      </div>

      {/* Area Tampilan QR (Hitam di putih polos, tanpa logo/gradien di dalam) */}
      <div className="relative flex flex-col items-center justify-center">
        {!isOpen ? (
          <div className="flex size-72 flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-error bg-surface-soft p-6 text-center sm:size-84">
            <AlertCircle className="size-12 text-error" />
            <p className="font-bold text-ink">
              Absen {mode === "in" ? "Masuk" : "Pulang"} Sedang Ditutup
            </p>
            <p className="text-xs text-ink-muted">
              QR disembunyikan. Tekan tombol di bawah untuk membuka kembali.
            </p>
            <Button
              onClick={handleToggleOpen}
              disabled={isLocked || isTogglingOpen}
              className="mt-2 text-sm font-bold"
            >
              Buka Absen {mode === "in" ? "Masuk" : "Pulang"}
            </Button>
          </div>
        ) : isPaused ? (
          <div className="flex size-72 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-line bg-surface-soft p-6 text-center sm:size-84">
            <Pause className="size-12 text-ink-muted" />
            <p className="font-bold text-ink">Layar QR Dijeda</p>
            <p className="text-xs text-ink-muted">
              QR disembunyikan sementara pada layar ini.
            </p>
            <Button
              onClick={() => setIsPaused(false)}
              disabled={isLocked}
              variant="secondary"
              className="mt-2 text-sm font-semibold"
            >
              Lanjutkan Layar
            </Button>
          </div>
        ) : !isConnected && !currentUrl ? (
          <div className="flex size-72 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-error bg-surface-soft p-6 text-center sm:size-84">
            <WifiOff className="size-12 text-error" />
            <p className="font-bold text-ink">Koneksi Terputus</p>
            <p className="text-xs text-ink-muted">Mencoba menghubungkan kembali ke server...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Wadah Putih Bersih Khusus QR */}
            <div className="flex size-72 items-center justify-center overflow-hidden rounded-2xl border-2 border-line bg-white p-2 shadow-inner sm:size-84">
              {qrDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrDataUrl}
                  alt="Kode QR Absensi RE:SNAPS"
                  className="size-full object-contain"
                />
              ) : (
                <div className="flex size-full items-center justify-center text-xs font-semibold text-ink-muted">
                  Memuat QR...
                </div>
              )}
            </div>

            {/* Hitung Mundur Sisa Waktu Jendela */}
            <div className="mt-4 flex items-center gap-2.5 text-sm font-semibold text-ink">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-soft">
                <div
                  className="h-full bg-brand-blue transition-all duration-1000 ease-linear"
                  style={{ width: `${(secondsLeft / windowSec) * 100}%` }}
                />
              </div>
              <span className="tabular-nums font-bold">Berganti dalam {secondsLeft} dtk</span>
            </div>
          </div>
        )}
      </div>

      {/* 3 Langkah Instruksi Singkat di Bawah QR */}
      <div className="grid w-full grid-cols-3 gap-2 border-y border-line py-3 text-center text-xs text-ink-muted">
        <div>
          <span className="font-extrabold text-brand-blue">1.</span> Buka kamera HP
        </div>
        <div>
          <span className="font-extrabold text-brand-blue">2.</span> Cari namamu
        </div>
        <div>
          <span className="font-extrabold text-brand-blue">3.</span> Konfirmasi absen
        </div>
      </div>

      {/* Counter Ringkas di Bawah QR */}
      {counter ? (
        <div className="flex w-full items-center justify-center gap-4 rounded-xl bg-surface-soft px-4 py-2.5 text-center text-sm font-semibold text-ink">
          {mode === "in" ? (
            <span>
              Sudah masuk <strong className="text-brand-blue">{counter.checkedIn}</strong> / {counter.total} tamu
            </span>
          ) : (
            <span>
              Sudah pulang <strong className="text-brand-purple">{counter.checkedOut}</strong> · Di dalam{" "}
              <strong className="text-success">{counter.inside}</strong>
            </span>
          )}
        </div>
      ) : null}

      {/* Kontrol Layar & Kunci Tombol */}
      <div className="flex w-full flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {isOpen ? (
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              disabled={isLocked}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-soft disabled:opacity-40"
            >
              {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              {isPaused ? "Lanjutkan" : "Jeda"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleToggleOpen}
            disabled={isLocked || isTogglingOpen}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-40 ${
              isOpen
                ? "border-error text-error hover:bg-error/10"
                : "border-success text-success hover:bg-success/10"
            }`}
          >
            {isOpen ? "Tutup Absen" : "Buka Absen"}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {!compact ? (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-soft"
            >
              {isFullscreen ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
              {isFullscreen ? "Kecilkan" : "Layar Penuh"}
            </button>
          ) : null}

          {/* Tombol Kunci Kontrol */}
          {isLocked ? (
            <button
              type="button"
              onMouseDown={handleUnlockPressStart}
              onMouseUp={handleUnlockPressEnd}
              onTouchStart={handleUnlockPressStart}
              onTouchEnd={handleUnlockPressEnd}
              className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg border border-warning bg-surface px-3 py-2 text-xs font-bold text-warning"
              title="Tahan 1 detik untuk membuka kunci kontrol"
            >
              <div
                className="absolute inset-0 bg-warning/20 transition-all duration-75"
                style={{ width: `${unlockProgress}%` }}
              />
              <Lock className="relative z-10 size-3.5" />
              <span className="relative z-10">Tahan untuk Buka Kunci</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsLocked(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-soft"
              title="Kunci kontrol agar tidak sengaja terpencet"
            >
              <Unlock className="size-3.5" />
              Kunci Kontrol
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
