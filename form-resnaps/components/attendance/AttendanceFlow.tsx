// P08 / P09 / P17: Alur absensi tamu dengan dukungan Hold HTM Belum Lunas (auto-polling),
// penyimpanan permanen Tiket & Barcode Voucher (Makan + Photobooth) di localStorage,
// serta branding RE:SNAPS penuh.
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  QrCode,
  RotateCcw,
  Loader2,
  Users,
  LogIn,
  LogOut,
  ArrowRight,
  X,
  Sparkles,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Ticket,
  RefreshCw,
  Utensils,
  Camera,
  Lock,
} from "lucide-react";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScanningOverlay } from "./ScanningOverlay";
import {
  DigitalTicket,
  SAVED_TICKET_STORAGE_KEY,
  clearSavedTicketFromStorage,
  type SavedGuestTicket,
} from "./DigitalTicket";
import { playWarningTone } from "@/lib/sound";
import type { Mode } from "@/lib/qr-token";

type GuestItem = {
  id: string;
  name: string;
  category: string | null;
};

type Stage =
  | "initializing"
  | "no_session"
  | "error"
  | "active"
  | "confirming"
  | "submitting"
  | "on_hold"
  | "success";

export function AttendanceFlow({ expectedMode }: { expectedMode: Mode }) {
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("initializing");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  // Pencarian
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<GuestItem[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<GuestItem | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Tiket tersimpan di localStorage browser tamu & status kunci perangkat
  const [savedTicket, setSavedTicket] = useState<SavedGuestTicket | null>(null);
  const [deviceLockEnabled, setDeviceLockEnabled] = useState(true);
  const [recoveryNotice, setRecoveryNotice] = useState<string | null>(null);

  // Data Hold (ketika pembayaran HTM tamu belum lunas)
  const [holdData, setHoldData] = useState<{
    guestId: string;
    name: string;
    category: string | null;
    holdAt: string;
    voucherCode: string;
  } | null>(null);
  const [isCheckingHold, setIsCheckingHold] = useState(false);

  // Hasil submit sukses
  const [successData, setSuccessData] = useState<{
    guestId: string;
    name: string;
    category: string | null;
    allergies?: string | null;
    scannedAt: string;
    voucherCode?: string;
    mealRedeemedAt?: string | null;
    photoboothRedeemedAt?: string | null;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const isMasuk = expectedMode === "in";
  const title = isMasuk ? "Gerbang Check-In Tamu" : "Gerbang Check-Out Tamu";
  const subtitle = "Closing Party CHRYSALIS · RE:SNAPS Official Gate";

  const displayedResults = query.trim().length >= 2 ? searchResults : [];

  // Baca tiket tersimpan dari localStorage saat komponen dimuat
  const loadSavedTicketFromStorage = useCallback((): SavedGuestTicket | null => {
    try {
      const raw = localStorage.getItem(SAVED_TICKET_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as SavedGuestTicket;
      if (parsed && parsed.guestName && parsed.voucherCode) {
        setSavedTicket(parsed);
        return parsed;
      }
    } catch {
      // Abaikan
    }
    return null;
  }, []);

  // Fungsi memulihkan tampilan Tiket atau Hold dari localStorage
  const restoreFromSavedTicket = useCallback((stored: SavedGuestTicket) => {
    if (stored.status === "on_hold") {
      setHoldData({
        guestId: stored.guestId,
        name: stored.guestName,
        category: stored.category,
        holdAt: stored.holdAt || stored.scannedAt,
        voucherCode: stored.voucherCode,
      });
      setStage("on_hold");
    } else {
      setSuccessData({
        guestId: stored.guestId,
        name: stored.guestName,
        category: stored.category,
        allergies: stored.allergies ?? null,
        scannedAt: stored.scannedAt,
        voucherCode: stored.voucherCode,
        mealRedeemedAt: stored.mealRedeemedAt,
        photoboothRedeemedAt: stored.photoboothRedeemedAt,
      });
      setStage("success");
    }
  }, []);

  // 1. Inisialisasi: verifikasi kunci perangkat (1 HP = 1 Tamu), tukar token `?t=`, atau cek sesi
  useEffect(() => {
    let mounted = true;
    const stored = loadSavedTicketFromStorage();

    async function initSession() {
      let activeStored: SavedGuestTicket | null = stored;
      let lockActive = true;

      // Jika di perangkat ini sudah ada riwayat absen tersimpan, sinkronkan dulu dengan server
      if (stored) {
        try {
          const param = stored.guestId
            ? `guest_id=${encodeURIComponent(stored.guestId)}`
            : `code=${encodeURIComponent(stored.voucherCode)}`;
          const statusRes = await fetch(`/api/attendance/ticket-status?${param}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.ok && statusData.ticket) {
              if (typeof statusData.deviceLockEnabled === "boolean") {
                lockActive = statusData.deviceLockEnabled;
                if (mounted) setDeviceLockEnabled(lockActive);
              }
              const t = statusData.ticket;
              // Bila Admin telah me-recovery / membatalkan absen tamu ini kembali ke belum_hadir -> buka kunci perangkat!
              if (t.status === "belum_hadir") {
                clearSavedTicketFromStorage();
                activeStored = null;
                if (mounted) {
                  setSavedTicket(null);
                  setRecoveryNotice(
                    "Kunci absensi perangkat telah di-reset oleh Admin/Panitia. Silakan pilih nama yang benar.",
                  );
                }
              } else {
                activeStored = {
                  guestId: t.guestId,
                  guestName: t.guestName,
                  category: t.category,
                  allergies: t.allergies ?? null,
                  mode: t.status === "sudah_pulang" ? "out" : "in",
                  status:
                    t.status === "ditahan"
                      ? "on_hold"
                      : t.status === "sudah_pulang"
                        ? "checked_out"
                        : "active",
                  paymentStatus: t.paymentStatus,
                  scannedAt: t.checkedOutAt || t.checkedInAt || stored.scannedAt,
                  holdAt: t.holdAt,
                  voucherCode: t.voucherCode,
                  mealRedeemedAt: t.mealRedeemedAt,
                  photoboothRedeemedAt: t.photoboothRedeemedAt,
                };
                if (mounted) setSavedTicket(activeStored);
                try {
                  localStorage.setItem(SAVED_TICKET_STORAGE_KEY, JSON.stringify(activeStored));
                } catch {
                  // Abaikan
                }
              }
            }
          }
        } catch {
          // Gunakan data localStorage bila offline sesaat
        }
      }

      // KEAMANAN 1 PERANGKAT = 1 TAMU:
      // Bila perangkat sudah memiliki riwayat absen aktif dan fitur kunci perangkat menyala:
      // - Di /masuk: blokir pencarian nama lain (walau scan QR baru) & langsung tampilkan tiket/hold milik perangkat ini!
      // - Di /keluar: bila sudah check-out, langsung tampilkan tiket check-out!
      if (activeStored && lockActive) {
        if (isMasuk) {
          window.history.replaceState({}, "", window.location.pathname);
          if (mounted) restoreFromSavedTicket(activeStored);
          return;
        }
        if (!isMasuk && activeStored.status === "checked_out") {
          window.history.replaceState({}, "", window.location.pathname);
          if (mounted) restoreFromSavedTicket(activeStored);
          return;
        }
      }

      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get("t");

      if (token) {
        try {
          const res = await fetch("/api/session/start", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ t: token }),
          });
          const data = await res.json();

          if (!res.ok || !data.ok) {
            if (mounted) {
              try {
                playWarningTone();
              } catch {
                // Abaikan
              }
              setErrorMessage(
                data.message || "QR tidak valid. Silakan scan ulang di layar panitia.",
              );
              setStage("error");
            }
            return;
          }

          // Bersihkan URL dari token (?t=)
          window.history.replaceState({}, "", window.location.pathname);

          if (data.mode !== expectedMode) {
            router.replace(data.mode === "in" ? "/masuk" : "/keluar");
            return;
          }

          if (mounted) {
            const expMs = new Date(data.expiresAt).getTime();
            setSessionExpiresAt(expMs);
            // Bila mode /keluar dan perangkat sudah terikat ke tamu yang sedang di_dalam, kunci pilihan hanya ke tamu tersebut
            if (!isMasuk && activeStored && lockActive && activeStored.guestId) {
              setSelectedGuest({
                id: activeStored.guestId,
                name: activeStored.guestName,
                category: activeStored.category,
              });
              setStage("confirming");
            } else {
              setStage("active");
            }
          }
        } catch {
          if (mounted) {
            setErrorMessage("Gagal menghubungkan ke server. Periksa koneksi internet Anda.");
            setStage("error");
          }
        }
      } else {
        try {
          const res = await fetch("/api/session/me");
          if (res.ok) {
            const data = await res.json();
            if (data.ok && data.expiresAt) {
              if (data.mode !== expectedMode) {
                router.replace(data.mode === "in" ? "/masuk" : "/keluar");
                return;
              }
              if (mounted) {
                setSessionExpiresAt(new Date(data.expiresAt).getTime());
                if (!isMasuk && activeStored && lockActive && activeStored.guestId) {
                  setSelectedGuest({
                    id: activeStored.guestId,
                    name: activeStored.guestName,
                    category: activeStored.category,
                  });
                  setStage("confirming");
                } else {
                  setStage("active");
                }
              }
              return;
            }
          }

          // Jika tidak ada sesi QR aktif tetapi di browser tamu pada mode /masuk sudah ada tiket/hold tersimpan,
          // langsung pulihkan agar barcode voucher tidak pernah hilang saat browser ditutup!
          if (mounted) {
            if (isMasuk && activeStored) {
              restoreFromSavedTicket(activeStored);
            } else {
              setStage("no_session");
            }
          }
        } catch {
          if (mounted) {
            if (isMasuk && activeStored) {
              restoreFromSavedTicket(activeStored);
            } else {
              setStage("no_session");
            }
          }
        }
      }
    }

    void initSession();

    return () => {
      mounted = false;
    };
  }, [expectedMode, isMasuk, loadSavedTicketFromStorage, restoreFromSavedTicket, router]);

  // 2. Countdown sisa waktu sesi scan
  useEffect(() => {
    if (!sessionExpiresAt || stage === "success" || stage === "on_hold") return;

    const interval = setInterval(() => {
      const remainingSec = Math.max(0, Math.floor((sessionExpiresAt - Date.now()) / 1000));
      setSecondsRemaining(remainingSec);

      if (remainingSec <= 0) {
        try {
          playWarningTone();
        } catch {
          // Abaikan
        }
        setStage("error");
        setErrorMessage("Sesi berakhir. Scan ulang QR terbaru di layar panitia.");
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [sessionExpiresAt, stage]);

  // 3. Polling otomatis saat tamu berada di stage "on_hold" (menunggu panitia melunasi/mengizinkan masuk atau recovery)
  const checkHoldApproval = useCallback(async () => {
    if (!holdData) return;
    setIsCheckingHold(true);
    try {
      const param = holdData.guestId
        ? `guest_id=${encodeURIComponent(holdData.guestId)}`
        : `code=${encodeURIComponent(holdData.voucherCode)}`;
      const res = await fetch(`/api/attendance/ticket-status?${param}`);
      if (!res.ok) return;
      const d = await res.json();
      if (d.ok && d.ticket) {
        if (typeof d.deviceLockEnabled === "boolean") {
          setDeviceLockEnabled(d.deviceLockEnabled);
        }
        const t = d.ticket;

        // Jika Admin/Panitia melakukan Recovery / Reset Salah Absen (status kembali ke belum_hadir)
        if (t.status === "belum_hadir") {
          clearSavedTicketFromStorage();
          setSavedTicket(null);
          setHoldData(null);
          setRecoveryNotice(
            "Status Hold & kunci perangkat telah di-reset oleh Admin/Panitia. Silakan scan QR atau pilih nama yang benar.",
          );
          setStage(sessionExpiresAt && sessionExpiresAt > Date.now() ? "active" : "no_session");
          return;
        }

        // Jika panitia sudah melunasi & mengizinkan masuk -> otomatis buka Tiket Digital & Barcode Voucher!
        if (
          t.paymentStatus === "lunas" &&
          (t.status === "di_dalam" || t.status === "sudah_pulang" || t.checkedInAt)
        ) {
          const scannedAt = t.checkedInAt || new Date().toISOString();
          setSuccessData({
            guestId: t.guestId,
            name: t.guestName,
            category: t.category,
            allergies: t.allergies ?? null,
            scannedAt,
            voucherCode: t.voucherCode,
            mealRedeemedAt: t.mealRedeemedAt,
            photoboothRedeemedAt: t.photoboothRedeemedAt,
          });
          setHoldData(null);
          setStage("success");
        }
      }
    } catch {
      // Abaikan
    } finally {
      setIsCheckingHold(false);
    }
  }, [holdData, sessionExpiresAt]);

  useEffect(() => {
    if (stage !== "on_hold" || !holdData) return;
    const timer = setInterval(() => {
      void checkHoldApproval();
    }, 3000);
    return () => clearInterval(timer);
  }, [stage, holdData, checkHoldApproval]);

  // 4. Pencarian tamu dengan debounce 250ms dan AbortController
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/guests/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setSearchResults(data.items || []);
          setHighlightedIndex(0);
        } else if (data.code === "session_expired" || data.code === "session_invalid") {
          try {
            playWarningTone();
          } catch {
            // Abaikan
          }
          setStage("error");
          setErrorMessage(data.message || "Sesi berakhir. Scan ulang QR di layar panitia.");
        }
      } catch (err: unknown) {
        if ((err as Error).name !== "AbortError") {
          setSearchResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // 5. Submit Absensi
  async function handleSubmitAttendance() {
    if (!selectedGuest) return;

    setStage("submitting");
    try {
      const res = await fetch("/api/attendance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_id: selectedGuest.id,
          locked_guest_id: savedTicket?.guestId || undefined,
        }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        // Kasus 1: Status pembayaran HTM belum lunas -> masuk ke stage ON HOLD
        if (data.status === "on_hold") {
          try {
            playWarningTone();
          } catch {
            // Abaikan
          }
          const holdPayload = {
            guestId: selectedGuest.id,
            name: selectedGuest.name,
            category: selectedGuest.category,
            holdAt: data.holdAt || new Date().toISOString(),
            voucherCode: data.voucherCode || "",
          };
          setHoldData(holdPayload);
          setStage("on_hold");

          try {
            const toStore: SavedGuestTicket = {
              guestId: selectedGuest.id,
              guestName: selectedGuest.name,
              category: selectedGuest.category,
              mode: expectedMode,
              status: "on_hold",
              paymentStatus: "belum_lunas",
              scannedAt: holdPayload.holdAt,
              holdAt: holdPayload.holdAt,
              voucherCode: holdPayload.voucherCode,
              mealRedeemedAt: null,
              photoboothRedeemedAt: null,
            };
            localStorage.setItem(SAVED_TICKET_STORAGE_KEY, JSON.stringify(toStore));
            setSavedTicket(toStore);
          } catch {
            // Abaikan
          }
          return;
        }

        // Kasus 2: Pembayaran HTM lunas -> absen sukses & berikan Tiket Digital + Barcode Voucher
        const scannedAt = data.scannedAt || new Date().toISOString();
        setSuccessData({
          guestId: selectedGuest.id,
          name: selectedGuest.name,
          category: selectedGuest.category,
          allergies: data.allergies ?? null,
          scannedAt,
          voucherCode: data.voucherCode,
          mealRedeemedAt: data.mealRedeemedAt ?? null,
          photoboothRedeemedAt: data.photoboothRedeemedAt ?? null,
        });
        setStage("success");
      } else {
        try {
          playWarningTone();
        } catch {
          // Abaikan
        }
        setStage("error");
        setErrorMessage(data.message || "Gagal mencatat absensi. Silakan coba lagi.");
      }
    } catch {
      try {
        playWarningTone();
      } catch {
        // Abaikan
      }
      setStage("error");
      setErrorMessage("Terjadi kendala jaringan saat mengirim absen. Silakan coba lagi.");
    }
  }

  // Navigasi Keyboard
  function handleKeyDown(e: React.KeyboardEvent) {
    if (displayedResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % displayedResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + displayedResults.length) % displayedResults.length);
    } else if (e.key === "Enter" && displayedResults[highlightedIndex]) {
      e.preventDefault();
      setSelectedGuest(displayedResults[highlightedIndex]);
      setStage("confirming");
    }
  }

  return (
    <main className="relative flex min-h-screen flex-1 flex-col overflow-hidden bg-canvas pb-16">
      {/* Efek Ambient Aurora Orbs Berpalet Logo RE:SNAPS */}
      <div
        aria-hidden="true"
        className="animate-float-slow pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-brand-blue/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-float-slow pointer-events-none absolute top-1/3 -right-24 size-84 rounded-full bg-brand-magenta/12 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="animate-float-slow pointer-events-none absolute -bottom-24 left-1/4 size-80 rounded-full bg-brand-orange/15 blur-3xl"
      />

      <BrandHeader title={title} subtitle={subtitle} />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-5">
        {/* Banner Pemberitahuan bila Kunci Perangkat Baru Saja Di-Recovery oleh Admin */}
        {recoveryNotice ? (
          <div className="mb-4 animate-in fade-in slide-in-from-top-2">
            <StatusBanner kind="info" title="Recovery Perangkat Berhasil">
              {recoveryNotice}
            </StatusBanner>
          </div>
        ) : null}

        {/* Banner Akses Cepat ke Tiket & Barcode Voucher Tersimpan */}
        {savedTicket && stage !== "success" && stage !== "on_hold" ? (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-brand-purple/25 bg-white/90 p-3.5 shadow-md backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-xs">
                <Ticket className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-purple">
                  Tiket Tersimpan di Perangkat Ini
                </span>
                <span className="text-xs font-extrabold text-ink">
                  {savedTicket.guestName} ({savedTicket.voucherCode})
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => restoreFromSavedTicket(savedTicket)}
              className="shrink-0 rounded-xl bg-brand-blue px-3 py-2 text-xs font-extrabold text-white shadow-xs transition hover:brightness-95"
            >
              Buka Barcode
            </button>
          </div>
        ) : null}

        {/* Banner Sisa Waktu Sesi */}
        {secondsRemaining !== null &&
        secondsRemaining > 0 &&
        secondsRemaining < 120 &&
        stage === "active" ? (
          <div className="mb-4 animate-in fade-in slide-in-from-top-2">
            <StatusBanner
              kind="warning"
              title={`Sesi berakhir dalam ${Math.floor(secondsRemaining / 60)}:${(
                secondsRemaining % 60
              )
                .toString()
                .padStart(2, "0")}`}
            >
              Selesaikan pencarian dan konfirmasi nama Anda sebelum waktu habis.
            </StatusBanner>
          </div>
        ) : null}

        {/* STAGE 1: Animasi Pemindai Kaca (Scanning Overlay) */}
        {stage === "initializing" ? <ScanningOverlay mode={expectedMode} /> : null}

        {/* STAGE 2: Tanpa Sesi / Belum Scan QR */}
        {stage === "no_session" ? (
          <div className="flex flex-col items-center gap-5 rounded-3xl border border-white/85 bg-white/85 p-8 text-center shadow-xl backdrop-blur-xl ring-1 ring-brand-purple/10">
            <div className="relative flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-blue/15 via-brand-purple/15 to-brand-coral/15 text-brand-blue shadow-inner">
              <QrCode className="size-10 text-brand-purple" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-2xl font-black text-ink">Scan QR Terlebih Dahulu</h2>
              <p className="max-w-sm text-xs leading-relaxed text-ink-muted">
                Untuk mulai absen {isMasuk ? "masuk" : "pulang"}, silakan arahkan kamera ponsel Anda
                ke layar QR dinamis yang ditampilkan panitia di gerbang acara.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-2.5 pt-2 text-left text-xs">
              <div className="flex items-center gap-2.5 rounded-2xl border border-line/70 bg-surface-soft/60 p-3">
                <Utensils className="size-4 shrink-0 text-brand-orange" />
                <div>
                  <p className="font-extrabold text-ink">Free Voucher Makan</p>
                  <p className="text-[10px] text-ink-muted">Otomatis setelah check-in</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 rounded-2xl border border-line/70 bg-surface-soft/60 p-3">
                <Camera className="size-4 shrink-0 text-brand-purple" />
                <div>
                  <p className="font-extrabold text-ink">Free Photobooth</p>
                  <p className="text-[10px] text-ink-muted">1 Barcode terintegrasi</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* STAGE 3: Error Token / Sesi Habis / Absen Ditutup */}
        {stage === "error" ? (
          <div className="flex flex-col gap-4 animate-in fade-in">
            <StatusBanner kind="error" title="Tidak Dapat Melanjutkan">
              {errorMessage}
            </StatusBanner>
            <Button
              onClick={() => {
                setStage("active");
                setErrorMessage("");
              }}
              variant="secondary"
              className="h-12"
            >
              <RotateCcw className="size-4" />
              Coba Lagi
            </Button>
          </div>
        ) : null}

        {/* STAGE 4: Aktif - Pencarian Nama Tamu */}
        {stage === "active" || stage === "confirming" || stage === "submitting" ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2.5 rounded-3xl border border-white/85 bg-white/85 p-5 shadow-md backdrop-blur-xl ring-1 ring-brand-purple/10">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="search-input"
                  className="text-xs font-black uppercase tracking-wider text-ink"
                >
                  Cari Nama Undanganmu
                </label>
                <span className="flex items-center gap-1 text-[11px] font-extrabold text-brand-purple">
                  <Sparkles className="size-3 text-brand-gold" />
                  Ketik min. 2 huruf
                </span>
              </div>

              <div className="relative">
                <Input
                  id="search-input"
                  type="search"
                  inputMode="search"
                  autoComplete="off"
                  autoFocus
                  placeholder="Ketik namamu di sini..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="h-13 rounded-2xl border-line/80 bg-white pr-11 text-base font-bold shadow-inner focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15"
                />
                <div className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-ink-muted">
                  {isSearching ? (
                    <Loader2 className="size-5 animate-spin text-brand-blue" />
                  ) : (
                    <Search className="size-5" />
                  )}
                </div>
              </div>
            </div>

            {/* Loading Skeleton */}
            {isSearching ? (
              <div className="flex flex-col gap-2.5 pt-1">
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>
            ) : null}

            {/* Hasil Pencarian (role="listbox") */}
            {!isSearching && query.trim().length >= 2 ? (
              displayedResults.length > 0 ? (
                <div
                  role="listbox"
                  aria-label="Daftar nama tamu"
                  className="flex flex-col gap-2.5 pt-1"
                >
                  {displayedResults.map((guest, idx) => {
                    const isHighlighted = idx === highlightedIndex;
                    return (
                      <button
                        key={guest.id}
                        type="button"
                        role="option"
                        aria-selected={isHighlighted}
                        onClick={() => {
                          setSelectedGuest(guest);
                          setStage("confirming");
                        }}
                        className={`flex min-h-15 w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all ${
                          isHighlighted
                            ? "border-brand-purple bg-white shadow-lg ring-2 ring-brand-purple/25 scale-[1.01]"
                            : "border-white/80 bg-white/85 shadow-xs backdrop-blur-md hover:bg-white hover:shadow-md"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-base font-black text-ink">{guest.name}</span>
                          {guest.category ? (
                            <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-brand-blue">
                              <ShieldCheck className="size-3.5" />
                              {guest.category}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue/15 to-brand-purple/15 text-brand-purple">
                          <ArrowRight className="size-4" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={Users} title="Nama tidak ditemukan">
                  Mungkin kamu sudah absen, atau namamu belum terdaftar. Hubungi panitia di meja
                  registrasi.
                </EmptyState>
              )
            ) : null}
          </div>
        ) : null}

        {/* Modal Konfirmasi Pilihan Nama */}
        {(stage === "confirming" || stage === "submitting") && selectedGuest ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
            <Card className="flex w-full max-w-md flex-col gap-6 rounded-3xl border border-white/90 bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-gradient-brand">
                  Konfirmasi Identitas Tamu
                </span>
                <button
                  type="button"
                  onClick={() => setStage("active")}
                  disabled={stage === "submitting"}
                  className="rounded-full p-1 text-ink-muted hover:bg-surface-soft"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex flex-col items-center gap-2.5 py-2 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue/15 via-brand-purple/15 to-brand-magenta/15 text-brand-purple shadow-inner">
                  {isMasuk ? <LogIn className="size-8" /> : <LogOut className="size-8" />}
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Apakah benar ini namamu?
                </p>
                <p className="text-2xl font-black text-ink">{selectedGuest.name}</p>
                {selectedGuest.category ? (
                  <span className="rounded-full bg-brand-blue/10 px-3.5 py-1 text-xs font-extrabold text-brand-blue ring-1 ring-brand-blue/20">
                    {selectedGuest.category}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                <Button
                  onClick={handleSubmitAttendance}
                  disabled={stage === "submitting"}
                  className="h-13 rounded-2xl bg-gradient-brand text-base font-black text-white shadow-lg"
                >
                  {stage === "submitting" ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Memproses Absensi...
                    </>
                  ) : (
                    `Ya, Absen ${isMasuk ? "Masuk & Ambil Voucher" : "Pulang"}`
                  )}
                </Button>

                {!(!isMasuk && savedTicket && deviceLockEnabled) ? (
                  <Button
                    variant="secondary"
                    onClick={() => setStage("active")}
                    disabled={stage === "submitting"}
                    className="h-12 rounded-2xl text-sm"
                  >
                    Bukan Saya (Cari Ulang)
                  </Button>
                ) : (
                  <p className="text-center text-[11px] font-bold text-ink-muted">
                    🔒 Perangkat ini terikat pada identitas kehadiran {selectedGuest.name}.
                  </p>
                )}
              </div>
            </Card>
          </div>
        ) : null}

        {/* STAGE 5: ON HOLD — Pembayaran HTM Belum Lunas (Menunggu Konfirmasi Panitia) */}
        {stage === "on_hold" && holdData ? (
          <div className="flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-full overflow-hidden rounded-[28px] border-2 border-warning/40 bg-white shadow-2xl">
              <div className="h-2 w-full bg-gradient-warm" />
              <div className="flex flex-col items-center gap-4 p-6 text-center sm:p-7">
                <div className="relative flex size-18 items-center justify-center rounded-3xl bg-warning/15 text-warning shadow-inner">
                  <AlertTriangle className="size-9 animate-bounce" />
                </div>

                <div className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-warning ring-1 ring-warning/30">
                  <Clock className="size-3.5 animate-spin" />
                  <span>STATUS ABSEN: DITAHAN (HOLD)</span>
                </div>

                <div className="flex flex-col gap-1">
                  <h2 className="text-2xl font-black text-ink">{holdData.name}</h2>
                  {holdData.category ? (
                    <span className="text-xs font-extrabold text-brand-blue">
                      {holdData.category}
                    </span>
                  ) : null}
                </div>

                <div className="w-full rounded-2xl border border-warning/30 bg-surface-soft/80 p-4 text-left text-xs leading-relaxed text-ink">
                  <p className="font-black text-warning uppercase tracking-wide">
                    Pembayaran HTM Belum Tercatat Lunas
                  </p>
                  <p className="mt-1 font-medium text-ink-muted">
                    Permintaan absen masuk kamu sudah masuk ke antrean layar Panitia. Silakan
                    tunjukkan layar ini ke <strong>Meja Registrasi / Panitia</strong> untuk
                    konfirmasi pelunasan HTM.
                  </p>
                </div>

                <div className="flex w-full items-center justify-between rounded-2xl bg-canvas px-4 py-3 text-xs">
                  <span className="flex items-center gap-2 font-bold text-ink-muted">
                    <Loader2 className="size-4 animate-spin text-brand-blue" />
                    Menunggu persetujuan panitia...
                  </span>
                  <span className="font-mono font-black text-brand-purple">
                    {holdData.voucherCode}
                  </span>
                </div>

                <Button
                  onClick={() => void checkHoldApproval()}
                  disabled={isCheckingHold}
                  className="h-12 w-full rounded-2xl text-sm font-extrabold"
                >
                  <RefreshCw className={`size-4 ${isCheckingHold ? "animate-spin" : ""}`} />
                  {isCheckingHold
                    ? "Memeriksa Status..."
                    : "Cek Status Persetujuan / Recovery Sekarang"}
                </Button>

                {deviceLockEnabled ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-brand-purple/20 bg-brand-purple/5 p-3 text-left text-[11px] leading-relaxed text-ink-muted">
                    <Lock className="mt-0.5 size-4 shrink-0 text-brand-purple" />
                    <span>
                      <strong>Kunci Keamanan Perangkat Aktif:</strong> HP ini terkunci pada antrean{" "}
                      <strong className="text-ink">{holdData.name}</strong>. Jika Anda salah memilih
                      nama, minta Panitia/Admin menekan tombol <strong>Recovery / Reset</strong> di
                      dashboard untuk membuka kunci HP Anda.
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setStage("no_session");
                      setHoldData(null);
                    }}
                    className="text-xs font-bold text-ink-muted underline hover:text-ink"
                  >
                    Mode Kiosk: Ganti Tamu
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* STAGE 6: SUKSES — Tiket Digital VIP & Barcode Voucher (Makan + Photobooth) */}
        {stage === "success" && successData ? (
          <DigitalTicket
            mode={expectedMode}
            guestId={successData.guestId}
            guestName={successData.name}
            category={successData.category}
            allergies={successData.allergies}
            scannedAt={successData.scannedAt}
            voucherCode={successData.voucherCode}
            initialMealRedeemedAt={successData.mealRedeemedAt}
            initialPhotoboothRedeemedAt={successData.photoboothRedeemedAt}
            onDeviceRecovered={() => {
              setSavedTicket(null);
              setSuccessData(null);
              setQuery("");
              setRecoveryNotice(
                "Kunci absensi perangkat telah di-reset oleh Admin/Panitia. Silakan pilih nama yang benar.",
              );
              setStage(sessionExpiresAt && sessionExpiresAt > Date.now() ? "active" : "no_session");
            }}
            onFinish={() => {
              setStage("no_session");
              setSuccessData(null);
              setQuery("");
            }}
          />
        ) : null}
      </div>
    </main>
  );
}
