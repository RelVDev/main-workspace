// P08 / P09: Komponen terpadu alur absensi tamu (Masuk / Pulang).
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Search,
  QrCode,
  RotateCcw,
  Loader2,
  Users,
  LogIn,
  LogOut,
  ArrowRight,
  X,
} from "lucide-react";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatWib } from "@/lib/time";
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
  const displayedResults = query.trim().length >= 2 ? searchResults : [];

  // Hasil submit
  const [successData, setSuccessData] = useState<{
    name: string;
    category: string | null;
    scannedAt: string;
  } | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const isMasuk = expectedMode === "in";
  const title = isMasuk ? "Absen Masuk" : "Absen Pulang";
  const subtitle = "Closing Party CHRYSALIS · RE:SNAPS";

  // 1. Inisialisasi: tukar token `?t=` atau cek cookie sesi yang sudah ada
  useEffect(() => {
    let mounted = true;

    async function initSession() {
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
              setErrorMessage(data.message || "QR tidak valid. Silakan scan ulang di layar panitia.");
              setStage("error");
            }
            return;
          }

          // Bersihkan URL dari token (?t=) agar riwayat peramban bersih (D4 / P08.2)
          window.history.replaceState({}, "", window.location.pathname);

          // Jika mode token berbeda dengan halaman saat ini, arahkan otomatis (P08.2 / P09.2)
          if (data.mode !== expectedMode) {
            router.replace(data.mode === "in" ? "/masuk" : "/keluar");
            return;
          }

          if (mounted) {
            const expMs = new Date(data.expiresAt).getTime();
            setSessionExpiresAt(expMs);
            setStage("active");
          }
        } catch {
          if (mounted) {
            setErrorMessage("Gagal menghubungkan ke server. Periksa koneksi internet Anda.");
            setStage("error");
          }
        }
      } else {
        // Tanpa token: periksa apakah sudah punya cookie sesi aktif
        try {
          const res = await fetch("/api/session/me");
          if (!res.ok) {
            if (mounted) setStage("no_session");
            return;
          }
          const data = await res.json();
          if (data.ok && data.expiresAt) {
            if (data.mode !== expectedMode) {
              router.replace(data.mode === "in" ? "/masuk" : "/keluar");
              return;
            }
            if (mounted) {
              setSessionExpiresAt(new Date(data.expiresAt).getTime());
              setStage("active");
            }
          } else {
            if (mounted) setStage("no_session");
          }
        } catch {
          if (mounted) setStage("no_session");
        }
      }
    }

    void initSession();

    return () => {
      mounted = false;
    };
  }, [expectedMode, router]);

  // 2. Countdown sisa waktu sesi scan (P08.9: tampilkan saat < 2 menit)
  useEffect(() => {
    if (!sessionExpiresAt || stage === "success") return;

    const interval = setInterval(() => {
      const remainingSec = Math.max(0, Math.floor((sessionExpiresAt - Date.now()) / 1000));
      setSecondsRemaining(remainingSec);

      if (remainingSec <= 0) {
        setStage("error");
        setErrorMessage("Sesi berakhir. Scan ulang QR terbaru di layar panitia.");
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [sessionExpiresAt, stage]);

  // 3. Pencarian tamu dengan debounce 250ms dan AbortController (P08.3)
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

  // 4. Submit Absensi (P08.7)
  async function handleSubmitAttendance() {
    if (!selectedGuest) return;

    setStage("submitting");
    try {
      const res = await fetch("/api/attendance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_id: selectedGuest.id }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setSuccessData({
          name: selectedGuest.name,
          category: selectedGuest.category,
          scannedAt: data.scannedAt || new Date().toISOString(),
        });
        setStage("success");

        // Simpan tanda UX ringan di localStorage (P08.10)
        try {
          localStorage.setItem(
            "resnaps_last_attended",
            JSON.stringify({
              name: selectedGuest.name,
              mode: expectedMode,
              at: data.scannedAt,
            })
          );
        } catch {
          // Abaikan bila tidak dapat menulis ke localStorage
        }
      } else {
        setStage("error");
        setErrorMessage(data.message || "Gagal mencatat absensi. Silakan coba lagi.");
      }
    } catch {
      setStage("error");
      setErrorMessage("Terjadi kendala jaringan saat mengirim absen. Silakan coba lagi.");
    }
  }

  // Navigasi Keyboard pada daftar tamu (P08.4)
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
    <main className="flex min-h-screen flex-1 flex-col bg-canvas pb-12">
      <BrandHeader title={title} subtitle={subtitle} />

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-4">
        {/* Banner Sisa Waktu Sesi (hanya muncul saat sisa < 2 menit, P08.9) */}
        {secondsRemaining !== null && secondsRemaining > 0 && secondsRemaining < 120 && stage === "active" ? (
          <div className="mb-4">
            <StatusBanner
              kind="warning"
              title={`Sesi berakhir dalam ${Math.floor(secondsRemaining / 60)}:${(secondsRemaining % 60)
                .toString()
                .padStart(2, "0")}`}
            >
              Selesaikan pencarian dan konfirmasi nama Anda sebelum waktu habis.
            </StatusBanner>
          </div>
        ) : null}

        {/* STAGE 1: Memuat Awal */}
        {stage === "initializing" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
            <Loader2 className="size-8 animate-spin text-brand-blue" />
            <p className="text-sm font-semibold text-ink">Menyiapkan sesi absen...</p>
          </div>
        ) : null}

        {/* STAGE 2: Tanpa Sesi / Belum Scan QR (P08.2 point 3) */}
        {stage === "no_session" ? (
          <Card className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-surface-soft text-brand-blue">
              <QrCode className="size-8" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-ink">Scan QR Terlebih Dahulu</h2>
              <p className="max-w-sm text-sm text-ink-muted">
                Untuk mulai absen {isMasuk ? "masuk" : "pulang"}, silakan arahkan kamera ponsel Anda ke
                layar QR yang ditampilkan oleh panitia di gerbang.
              </p>
            </div>
          </Card>
        ) : null}

        {/* STAGE 3: Error Token / Sesi Habis / Absen Ditutup */}
        {stage === "error" ? (
          <div className="flex flex-col gap-4">
            <StatusBanner kind="error" title="Tidak Dapat Melanjutkan">
              {errorMessage}
            </StatusBanner>
            <Button
              onClick={() => {
                setStage("active");
                setErrorMessage("");
              }}
              variant="secondary"
            >
              <RotateCcw className="size-4" />
              Coba Lagi
            </Button>
          </div>
        ) : null}

        {/* STAGE 4: Aktif - Pencarian Nama Tamu (P08.3 & P08.4) */}
        {stage === "active" || stage === "confirming" || stage === "submitting" ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="search-input" className="text-sm font-bold text-ink">
                Cari Namamu
              </label>
              <div className="relative">
                <Input
                  id="search-input"
                  type="search"
                  inputMode="search"
                  autoComplete="off"
                  autoFocus
                  placeholder="Ketik minimal 2 huruf namamu..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pr-10"
                />
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink-muted">
                  {isSearching ? (
                    <Loader2 className="size-5 animate-spin text-brand-blue" />
                  ) : (
                    <Search className="size-5" />
                  )}
                </div>
              </div>
              <p className="text-xs text-ink-muted">
                Hanya tamu terdaftar yang {isMasuk ? "belum masuk" : "sudah masuk dan belum pulang"} yang ditampilkan.
              </p>
            </div>

            {/* Loading Skeleton */}
            {isSearching ? (
              <div className="flex flex-col gap-2 pt-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : null}

            {/* Hasil Pencarian (role="listbox") */}
            {!isSearching && query.trim().length >= 2 ? (
              displayedResults.length > 0 ? (
                <div
                  role="listbox"
                  aria-label="Daftar nama tamu"
                  className="flex flex-col gap-2 pt-2"
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
                        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-control border px-4 py-3 text-left transition ${
                          isHighlighted
                            ? "border-brand-blue bg-surface-soft ring-2 ring-brand-blue/30"
                            : "border-line bg-surface hover:bg-surface-soft"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-base font-bold text-ink">{guest.name}</span>
                          {guest.category ? (
                            <span className="text-xs font-semibold text-ink-muted">
                              {guest.category}
                            </span>
                          ) : null}
                        </div>
                        <ArrowRight className="size-4 shrink-0 text-brand-blue" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Empty state pencarian (P08.5 / §4.4) */
                <EmptyState icon={Users} title="Nama tidak ditemukan">
                  Mungkin kamu sudah absen, atau namamu belum terdaftar. Hubungi panitia di meja
                  registrasi.
                </EmptyState>
              )
            ) : null}
          </div>
        ) : null}

        {/* Modal / Lembar Konfirmasi Pilihan Nama (P08.6) */}
        {(stage === "confirming" || stage === "submitting") && selectedGuest ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 backdrop-blur-xs sm:items-center">
            <Card className="flex w-full max-w-md flex-col gap-6 animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Konfirmasi Kehadiran
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

              <div className="flex flex-col items-center gap-2 py-2 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-surface-soft text-brand-blue">
                  {isMasuk ? <LogIn className="size-7" /> : <LogOut className="size-7" />}
                </div>
                <p className="text-sm text-ink-muted">Apakah benar kamu adalah:</p>
                <p className="text-2xl font-extrabold text-ink">{selectedGuest.name}</p>
                {selectedGuest.category ? (
                  <span className="rounded-full bg-surface-soft px-3 py-1 text-xs font-bold text-ink-muted">
                    {selectedGuest.category}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  onClick={handleSubmitAttendance}
                  disabled={stage === "submitting"}
                  className="font-bold"
                >
                  {stage === "submitting" ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Mencatat Kehadiran...
                    </>
                  ) : (
                    `Ya, Absen ${isMasuk ? "Masuk" : "Pulang"}`
                  )}
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => setStage("active")}
                  disabled={stage === "submitting"}
                >
                  Bukan Saya
                </Button>
              </div>
            </Card>
          </div>
        ) : null}

        {/* STAGE 5: Sukses (P08.8 / P09.5) */}
        {stage === "success" && successData ? (
          <Card className="flex flex-col items-center gap-6 py-8 text-center animate-in fade-in-50">
            <div className="flex size-20 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="size-12" />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-success">
                Absen {isMasuk ? "Masuk" : "Pulang"} Berhasil
              </span>
              <h2 className="text-2xl font-extrabold text-ink">{successData.name}</h2>
              {successData.category ? (
                <span className="text-sm font-semibold text-ink-muted">
                  {successData.category}
                </span>
              ) : null}
              <p className="mt-2 text-base font-semibold text-ink">
                Pukul {formatWib(successData.scannedAt)}
              </p>
            </div>

            <div className="w-full">
              <StatusBanner kind="info">
                {isMasuk
                  ? "Selamat datang di acara! Untuk absen orang lain, scan ulang QR di layar panitia."
                  : "Terima kasih atas kehadiranmu! Hati-hati di perjalanan pulang."}
              </StatusBanner>
            </div>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
