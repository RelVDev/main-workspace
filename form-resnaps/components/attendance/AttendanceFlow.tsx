// P08 / P09 / P17: Alur absensi tamu dengan pencarian nama instan 0ms (in-memory preload),
// dukungan Hold HTM Belum Lunas (auto-polling), penyimpanan permanen Tiket & Barcode Voucher
// (Makan + Photobooth) di localStorage, serta branding RE:SNAPS penuh.
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Clock,
  Ticket,
  RefreshCw,
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

function normalizeSearchText(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function AttendanceFlow({ expectedMode }: { expectedMode: Mode }) {
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("initializing");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  // Daftar tamu preload untuk pencarian instan 0ms
  const [preloadedGuests, setPreloadedGuests] = useState<GuestItem[]>([]);

  // Pencarian
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [remoteResults, setRemoteResults] = useState<GuestItem[]>([]);
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
    mealEligible?: boolean;
    mealRedeemedAt?: string | null;
    photoboothRedeemedAt?: string | null;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const isMasuk = expectedMode === "in";
  const title = isMasuk ? "Check-In" : "Check-Out";
  const subtitle = isMasuk ? "Gerbang Masuk" : "Gerbang Pulang";

  // Pencarian Instan 0ms di Memori Klien (dimulai sejak 1 huruf)
  const localMatches = useMemo(() => {
    const q = normalizeSearchText(query.trim());
    if (!q || preloadedGuests.length === 0) return [];
    const startsWith: GuestItem[] = [];
    const contains: GuestItem[] = [];
    for (const g of preloadedGuests) {
      const nameNorm = normalizeSearchText(g.name);
      const catNorm = g.category ? normalizeSearchText(g.category) : "";
      if (nameNorm.startsWith(q) || nameNorm.split(/\s+/).some((w) => w.startsWith(q))) {
        startsWith.push(g);
      } else if (nameNorm.includes(q) || catNorm.includes(q)) {
        contains.push(g);
      }
      if (startsWith.length + contains.length >= 16) break;
    }
    return [...startsWith, ...contains].slice(0, 8);
  }, [query, preloadedGuests]);

  const displayedResults = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return [];
    if (localMatches.length > 0) return localMatches;
    return trimmed.length >= 2 ? remoteResults : [];
  }, [query, localMatches, remoteResults]);

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
        mealEligible: stored.mealEligible ?? true,
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
                  mealEligible: typeof t.mealEligible === "boolean" ? t.mealEligible : true,
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
            if (Array.isArray(data.guests)) {
              setPreloadedGuests(data.guests);
            }
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
                if (Array.isArray(data.guests)) {
                  setPreloadedGuests(data.guests);
                }
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
            mealEligible: typeof t.mealEligible === "boolean" ? t.mealEligible : true,
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

  // 4. Fallback pencarian jaringan hanya bila daftar preload belum ada atau tidak menemukan hasil lokal (mis. tamu OTS baru)
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setRemoteResults([]);
      setIsSearching(false);
      return;
    }

    // Jika hasil lokal sudah ditemukan, langsung tampilkan 0ms tanpa perlu panggil API!
    if (localMatches.length > 0) {
      setIsSearching(false);
      return;
    }

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
          setRemoteResults(data.items || []);
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
          setRemoteResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, localMatches.length]);

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
          mealEligible: typeof data.mealEligible === "boolean" ? data.mealEligible : true,
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

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center px-4 pt-6">
        {/* Banner Pemberitahuan bila Kunci Perangkat Baru Saja Di-Recovery oleh Admin */}
        {recoveryNotice ? (
          <div className="mb-4 w-full animate-in fade-in slide-in-from-top-2">
            <StatusBanner kind="info" title="Recovery Berhasil">
              {recoveryNotice}
            </StatusBanner>
          </div>
        ) : null}

        {/* Banner Akses Cepat ke Tiket & Barcode Voucher Tersimpan */}
        {savedTicket && stage !== "success" && stage !== "on_hold" ? (
          <div className="mb-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-line bg-white/95 p-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-purple/10 text-brand-purple">
                <Ticket className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-purple">
                  Pass Aktif
                </span>
                <span className="text-xs font-extrabold text-ink">{savedTicket.guestName}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => restoreFromSavedTicket(savedTicket)}
              className="shrink-0 rounded-xl bg-ink px-3 py-1.5 text-xs font-bold text-white"
            >
              Lihat Pass
            </button>
          </div>
        ) : null}

        {/* Banner Sisa Waktu Sesi */}
        {secondsRemaining !== null &&
        secondsRemaining > 0 &&
        secondsRemaining < 120 &&
        stage === "active" ? (
          <div className="mb-4 w-full animate-in fade-in slide-in-from-top-2">
            <StatusBanner
              kind="warning"
              title={`Sesi berakhir dalam ${Math.floor(secondsRemaining / 60)}:${(
                secondsRemaining % 60
              )
                .toString()
                .padStart(2, "0")}`}
            >
              Segera pilih dan konfirmasi nama Anda.
            </StatusBanner>
          </div>
        ) : null}

        {/* STAGE 1: Animasi Pemindai Kaca (Scanning Overlay) */}
        {stage === "initializing" ? <ScanningOverlay mode={expectedMode} /> : null}

        {/* STAGE 2: Tanpa Sesi / Belum Scan QR */}
        {stage === "no_session" ? (
          <div className="flex w-full flex-col items-center gap-4 rounded-[28px] border border-white/90 bg-white/95 p-8 text-center shadow-xl backdrop-blur-xl">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
              <QrCode className="size-8" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-black text-ink">Scan QR Gerbang</h2>
              <p className="max-w-xs text-xs leading-relaxed text-ink-muted">
                Arahkan kamera ponsel Anda ke layar QR di meja registrasi untuk{" "}
                {isMasuk ? "check-in masuk" : "check-out pulang"}.
              </p>
            </div>
          </div>
        ) : null}

        {/* STAGE 3: Error Token / Sesi Habis / Absen Ditutup */}
        {stage === "error" ? (
          <div className="flex w-full flex-col gap-4 animate-in fade-in">
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

        {/* STAGE 4: Aktif - Pencarian Nama Tamu (Instan 0ms) */}
        {stage === "active" || stage === "confirming" || stage === "submitting" ? (
          <div className="flex w-full flex-col gap-4">
            <div className="flex flex-col gap-2.5 rounded-[26px] border border-white/90 bg-white/95 p-5 shadow-md backdrop-blur-xl">
              <label
                htmlFor="search-input"
                className="text-xs font-extrabold uppercase tracking-wider text-ink-muted"
              >
                Cari Nama Undangan
              </label>

              <div className="relative">
                <Input
                  id="search-input"
                  type="search"
                  inputMode="search"
                  autoComplete="off"
                  autoFocus
                  placeholder="Ketik nama lengkap..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setHighlightedIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  className="h-12 rounded-2xl border-line bg-white pr-11 text-base font-bold focus:border-brand-blue"
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

            {/* Loading Skeleton (hanya bila mencari tamu OTS baru via jaringan) */}
            {isSearching && displayedResults.length === 0 ? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-15 w-full rounded-2xl" />
                <Skeleton className="h-15 w-full rounded-2xl" />
              </div>
            ) : null}

            {/* Hasil Pencarian Instan (role="listbox") */}
            {query.trim().length >= 1 && !isSearching ? (
              displayedResults.length > 0 ? (
                <div
                  role="listbox"
                  aria-label="Daftar nama tamu"
                  className="flex flex-col gap-2"
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
                        className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all ${
                          isHighlighted
                            ? "border-brand-purple bg-white shadow-md ring-2 ring-brand-purple/20"
                            : "border-line/80 bg-white/95 shadow-2xs hover:bg-white"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-ink sm:text-base">
                            {guest.name}
                          </span>
                          {guest.category ? (
                            <span className="text-xs font-semibold text-ink-muted">
                              {guest.category}
                            </span>
                          ) : null}
                        </div>
                        <ArrowRight className="size-4 text-brand-purple" />
                      </button>
                    );
                  })}
                </div>
              ) : query.trim().length >= 2 ? (
                <EmptyState icon={Users} title="Nama tidak ditemukan">
                  Periksa ejaan nama atau hubungi panitia di meja registrasi.
                </EmptyState>
              ) : null
            ) : null}
          </div>
        ) : null}

        {/* Modal Konfirmasi Pilihan Nama */}
        {(stage === "confirming" || stage === "submitting") && selectedGuest ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
            <Card className="flex w-full max-w-sm flex-col gap-5 rounded-[28px] border border-white/90 bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-ink-muted">
                  Konfirmasi Kehadiran
                </span>
                <button
                  type="button"
                  onClick={() => setStage("active")}
                  disabled={stage === "submitting"}
                  className="rounded-full p-1 text-ink-muted hover:bg-surface-soft"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
                  {isMasuk ? <LogIn className="size-6" /> : <LogOut className="size-6" />}
                </div>
                <p className="mt-1 text-xl font-black text-ink">{selectedGuest.name}</p>
                {selectedGuest.category ? (
                  <span className="rounded-full bg-surface-soft px-3 py-0.5 text-xs font-semibold text-ink-muted">
                    {selectedGuest.category}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleSubmitAttendance}
                  disabled={stage === "submitting"}
                  className="h-12 rounded-2xl bg-gradient-brand text-sm font-black text-white shadow-md"
                >
                  {stage === "submitting" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    `Konfirmasi ${isMasuk ? "Check-In" : "Check-Out"}`
                  )}
                </Button>

                {!(!isMasuk && savedTicket && deviceLockEnabled) ? (
                  <Button
                    variant="secondary"
                    onClick={() => setStage("active")}
                    disabled={stage === "submitting"}
                    className="h-11 rounded-2xl text-xs"
                  >
                    Cari Nama Lain
                  </Button>
                ) : (
                  <p className="pt-1 text-center text-[11px] font-medium text-ink-muted">
                    🔒 Terkunci untuk {selectedGuest.name}
                  </p>
                )}
              </div>
            </Card>
          </div>
        ) : null}

        {/* STAGE 5: ON HOLD — Pembayaran HTM Belum Lunas (Minimalis & Jelas) */}
        {stage === "on_hold" && holdData ? (
          <div className="flex w-full max-w-sm flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-full overflow-hidden rounded-[30px] border border-warning/40 bg-white shadow-xl">
              <div className="h-1.5 w-full bg-gradient-warm" />
              <div className="flex flex-col items-center gap-4 p-6 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-warning/15 text-warning">
                  <Clock className="size-7 animate-pulse" />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-warning">
                    Menunggu Konfirmasi Panitia
                  </span>
                  <h2 className="text-xl font-black text-ink">{holdData.name}</h2>
                  {holdData.category ? (
                    <span className="text-xs font-semibold text-ink-muted">
                      {holdData.category}
                    </span>
                  ) : null}
                </div>

                <p className="rounded-2xl bg-surface-soft/80 p-3.5 text-xs leading-relaxed text-ink-muted">
                  Tunjukkan layar ini ke <strong className="text-ink">Meja Registrasi</strong>{" "}
                  untuk verifikasi HTM. Pass akan terbuka otomatis setelah disetujui.
                </p>

                <Button
                  onClick={() => void checkHoldApproval()}
                  disabled={isCheckingHold}
                  className="h-11 w-full rounded-2xl text-xs font-extrabold"
                >
                  <RefreshCw className={`size-3.5 ${isCheckingHold ? "animate-spin" : ""}`} />
                  {isCheckingHold ? "Memeriksa..." : "Segarkan Status"}
                </Button>

                {deviceLockEnabled ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-muted">
                    <Lock className="size-3 text-brand-purple" />
                    Terkunci di perangkat ini · Hubungi panitia bila salah nama
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setStage("no_session");
                      setHoldData(null);
                    }}
                    className="text-xs font-bold text-ink-muted underline hover:text-ink"
                  >
                    Ganti Tamu
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
            initialMealEligible={successData.mealEligible}
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
