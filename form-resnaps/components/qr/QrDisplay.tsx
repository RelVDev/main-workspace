// P07.2–P07.12: Komponen Layar QR Dinamis (dapat dipakai di /panitia/qr dan dashboard).
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
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
} from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
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
  const [qrSvg, setQrSvg] = useState<string>("");
  const [secondsLeft, setSecondsLeft] = useState<number>(30);
  const [windowSec, setWindowSec] = useState<number>(30);
  const [isPaused, setIsPaused] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [counter, setCounter] = useState<CounterData | null>(null);
  const [isTogglingOpen, setIsTogglingOpen] = useState(false);

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
    setQrSvg("");
  }

  // 2. Mengambil token dari server panitia
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
        setQrSvg("");
        return;
      }

      setIsOpen(true);
      if (data.serverNow) {
        clockSkewMs.current = data.serverNow - Date.now();
      }
      if (data.windowSeconds) {
        setWindowSec(data.windowSeconds);
      }

      // Siapkan antrean token
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

  // 3. Polling hitungan counter kehadiran (P07.9)
  const fetchCounter = useCallback(async () => {
    try {
      const res = await fetch("/api/panitia/counter");
      if (res.ok) {
        const d = await res.json();
        if (d.ok) setCounter(d);
      }
    } catch {
      // Abaikan bila polling gagal
    }
  }, []);

  // 4. Efek siklus hidup: timer hitung mundur & penggantian token
  useEffect(() => {
    let mounted = true;

    // Panggilan awal async (tidak synchronous setState di render body)
    void (async () => {
      await fetchToken(mode);
      if (mounted) await fetchCounter();
    })();

    const tokenInterval = setInterval(() => {
      if (isPaused) return;

      const syncedNow = Date.now() + clockSkewMs.current;
      const currentWindowIdx = Math.floor(Math.floor(syncedNow / 1000) / windowSec);
      const windowEndMs = (currentWindowIdx + 1) * windowSec * 1000;
      const remSec = Math.max(0, Math.ceil((windowEndMs - syncedNow) / 1000));
      setSecondsLeft(remSec);

      // Ambil token baru bila sisa waktu < 8 detik dan antrean menipis
      if (remSec <= 8 && queueRef.current.length <= 2) {
        void fetchToken(mode);
      }

      // Cari token yang tepat untuk waktu sekarang dari antrean
      const candidate = [...queueRef.current]
        .reverse()
        .find((item) => syncedNow >= item.validFromMs);

      if (candidate && candidate.url !== currentUrl) {
        setCurrentUrl(candidate.url);
      }
    }, 1000);

    const counterInterval = setInterval(() => {
      if (mounted) void fetchCounter();
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(tokenInterval);
      clearInterval(counterInterval);
    };
  }, [mode, windowSec, isPaused, fetchToken, fetchCounter, currentUrl]);

  // 5. Render SVG QR Code saat URL berubah (P07.11: koreksi error M, margin 4, hitam di putih)
  useEffect(() => {
    let active = true;
    if (currentUrl) {
      QRCode.toString(currentUrl, {
        type: "svg",
        errorCorrectionLevel: "M",
        margin: 4,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
        .then((svg) => {
          if (active) setQrSvg(svg);
        })
        .catch(() => {
          if (active) setQrSvg("");
        });
    }
    return () => {
      active = false;
    };
  }, [currentUrl]);

  // 6. Screen Wake Lock API agar layar tidak redup / mati (P07.8)
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;
    async function requestWakeLock() {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Izin wake lock ditolak atau tidak didukung
      }
    }
    void requestWakeLock();
    return () => {
      if (wakeLock) void wakeLock.release().catch(() => {});
    };
  }, []);

  // 7. Fullscreen Handler
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }

  // 8. Buka / Tutup Absen
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
          // Buka kembali: langsung ambil token baru
          void fetchToken(mode);
        }
      }
    } finally {
      setIsTogglingOpen(false);
    }
  }

  // 9. Kunci Kontrol: tahan 1 detik untuk membuka kunci (P07.8)
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
      className={`flex flex-col items-center justify-between gap-6 rounded-card border border-line bg-surface p-6 shadow-md transition-all ${
        compact ? "w-full max-w-md" : "w-full max-w-2xl"
      }`}
    >
      {/* Baris Atas: Pemilih Mode & Status Koneksi */}
      <div className="flex w-full flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <div className="w-60">
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

      {/* Judul Besar Sesuai Mode (P07.4) */}
      <div className="text-center">
        <h2 className="text-2xl font-extrabold uppercase tracking-tight text-ink sm:text-3xl">
          {mode === "in" ? "SCAN UNTUK ABSEN MASUK" : "SCAN UNTUK ABSEN PULANG"}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Arahkan kamera ponsel Anda ke kode QR di bawah ini
        </p>
      </div>

      {/* Area Tampilan QR (P07.11: Hitam di putih polos, tanpa logo/gradien di dalam) */}
      <div className="relative flex flex-col items-center justify-center">
        {!isOpen ? (
          <div className="flex size-72 flex-col items-center justify-center gap-4 rounded-card border-2 border-dashed border-error bg-surface-soft p-6 text-center sm:size-84">
            <AlertCircle className="size-12 text-error" />
            <p className="font-bold text-ink">
              Absen {mode === "in" ? "Masuk" : "Pulang"} Sedang Ditutup
            </p>
            <p className="text-xs text-ink-muted">
              QR disembunyikan. Tekan tombol di bawah untuk membuka absen.
            </p>
            <Button
              onClick={handleToggleOpen}
              disabled={isLocked || isTogglingOpen}
              className="mt-2 text-sm"
            >
              Buka Absen {mode === "in" ? "Masuk" : "Pulang"}
            </Button>
          </div>
        ) : isPaused ? (
          <div className="flex size-72 flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-line bg-surface-soft p-6 text-center sm:size-84">
            <Pause className="size-12 text-ink-muted" />
            <p className="font-bold text-ink">Layar QR Dijeda</p>
            <p className="text-xs text-ink-muted">
              QR disembunyikan sementara pada layar ini. Tekan tombol Lanjutkan.
            </p>
            <Button
              onClick={() => setIsPaused(false)}
              disabled={isLocked}
              variant="secondary"
              className="mt-2 text-sm"
            >
              Lanjutkan Layar
            </Button>
          </div>
        ) : !isConnected && !currentUrl ? (
          <div className="flex size-72 flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed border-error bg-surface-soft p-6 text-center sm:size-84">
            <WifiOff className="size-12 text-error" />
            <p className="font-bold text-ink">Koneksi Terputus</p>
            <p className="text-xs text-ink-muted">Mencoba menghubungkan kembali ke server...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* Wadah Putih Bersih Khusus QR */}
            <div
              className="size-72 overflow-hidden rounded-card border-2 border-line bg-white p-3 shadow-inner sm:size-84 [&_svg]:size-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />

            {/* Hitung Mundur Sisa Waktu Jendela (P07.5) */}
            <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-surface-soft">
                <div
                  className="h-full bg-brand-blue transition-all duration-1000 ease-linear"
                  style={{ width: `${(secondsLeft / windowSec) * 100}%` }}
                />
              </div>
              <span className="tabular-nums">Berganti dalam {secondsLeft} dtk</span>
            </div>
          </div>
        )}
      </div>

      {/* 3 Langkah Instruksi Singkat di Bawah QR (P07.4) */}
      <div className="grid w-full grid-cols-3 gap-2 border-y border-line py-3 text-center text-xs text-ink-muted">
        <div>
          <span className="font-bold text-brand-blue">1.</span> Buka kamera HP
        </div>
        <div>
          <span className="font-bold text-brand-blue">2.</span> Cari & pilih nama
        </div>
        <div>
          <span className="font-bold text-brand-blue">3.</span> Konfirmasi absen
        </div>
      </div>

      {/* Counter Ringkas di Bawah QR (P07.9) */}
      {counter ? (
        <div className="flex w-full items-center justify-center gap-4 rounded-control bg-surface-soft px-4 py-2.5 text-center text-sm font-semibold text-ink">
          {mode === "in" ? (
            <span>
              Sudah masuk <strong className="text-brand-blue">{counter.checkedIn}</strong> / {counter.total} tamu
            </span>
          ) : (
            <span>
              Sudah pulang <strong className="text-info">{counter.checkedOut}</strong> · Di dalam{" "}
              <strong className="text-success">{counter.inside}</strong>
            </span>
          )}
        </div>
      ) : null}

      {/* Kontrol Layar & Kunci Tombol (P07.6, P07.7, P07.8) */}
      <div className="flex w-full flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          {isOpen ? (
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              disabled={isLocked}
              className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-soft disabled:opacity-40"
            >
              {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              {isPaused ? "Lanjutkan" : "Jeda"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleToggleOpen}
            disabled={isLocked || isTogglingOpen}
            className={`inline-flex items-center gap-1.5 rounded-control border px-3 py-2 text-xs font-semibold disabled:opacity-40 ${
              isOpen
                ? "border-error text-error hover:bg-surface-soft"
                : "border-success text-success hover:bg-surface-soft"
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
              className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-soft"
            >
              {isFullscreen ? <Minimize className="size-3.5" /> : <Maximize className="size-3.5" />}
              {isFullscreen ? "Kecilkan" : "Layar Penuh"}
            </button>
          ) : null}

          {/* Tombol Kunci Kontrol (P07.8: Tahan 1 detik untuk buka kunci) */}
          {isLocked ? (
            <button
              type="button"
              onMouseDown={handleUnlockPressStart}
              onMouseUp={handleUnlockPressEnd}
              onTouchStart={handleUnlockPressStart}
              onTouchEnd={handleUnlockPressEnd}
              className="relative inline-flex items-center gap-1.5 overflow-hidden rounded-control border border-warning bg-surface px-3 py-2 text-xs font-bold text-warning"
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
              className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-soft"
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
