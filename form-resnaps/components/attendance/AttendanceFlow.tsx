// P08 / P09: Alur absensi tamu disempurnakan dengan animasi scanner, glassmorphism, dan tiket digital perayaan.
"use client";

import { useEffect, useRef, useState } from "react";
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
} from "lucide-react";
import { BrandHeader } from "@/components/brand/BrandHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScanningOverlay } from "./ScanningOverlay";
import { DigitalTicket } from "./DigitalTicket";
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

  const displayedResults = query.trim().length >= 2 ? searchResults : [];

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
              try {
                playWarningTone();
              } catch {
                // Abaikan
              }
              setErrorMessage(data.message || "QR tidak valid. Silakan scan ulang di layar panitia.");
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
            setStage("active");
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

  // 2. Countdown sisa waktu sesi scan
  useEffect(() => {
    if (!sessionExpiresAt || stage === "success") return;

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

  // 3. Pencarian tamu dengan debounce 250ms dan AbortController
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

  // 4. Submit Absensi
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
          // Abaikan
        }
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
      {/* Efek Ambient Glow / Blobs Gradien di Latar Belakang (Glassmorphism) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -left-24 size-72 rounded-full bg-brand-blue/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 -right-24 size-80 rounded-full bg-brand-purple/15 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/4 size-72 rounded-full bg-brand-coral/15 blur-3xl"
      />

      <BrandHeader title={title} subtitle={subtitle} />

      <div className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-5">
        {/* Banner Sisa Waktu Sesi */}
        {secondsRemaining !== null && secondsRemaining > 0 && secondsRemaining < 120 && stage === "active" ? (
          <div className="mb-4 animate-in fade-in slide-in-from-top-2">
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

        {/* STAGE 1: Animasi Pemindai Kaca (Scanning Overlay) */}
        {stage === "initializing" ? (
          <ScanningOverlay mode={expectedMode} />
        ) : null}

        {/* STAGE 2: Tanpa Sesi / Belum Scan QR */}
        {stage === "no_session" ? (
          <div className="flex flex-col items-center gap-5 rounded-3xl border border-white/70 bg-surface/80 p-8 text-center shadow-xl backdrop-blur-xl">
            <div className="flex size-18 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue/15 to-brand-purple/15 text-brand-blue shadow-inner">
              <QrCode className="size-9" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-2xl font-black text-ink">Scan QR Terlebih Dahulu</h2>
              <p className="max-w-sm text-xs leading-relaxed text-ink-muted">
                Untuk mulai absen {isMasuk ? "masuk" : "pulang"}, silakan arahkan kamera ponsel Anda ke
                layar QR dinamis yang ditampilkan panitia di gerbang.
              </p>
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

        {/* STAGE 4: Aktif - Pencarian Nama Tamu (Glassmorphism Input & Card) */}
        {stage === "active" || stage === "confirming" || stage === "submitting" ? (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-2 rounded-2xl border border-white/70 bg-surface/80 p-4 shadow-sm backdrop-blur-lg">
              <div className="flex items-center justify-between">
                <label htmlFor="search-input" className="text-xs font-black uppercase tracking-wider text-ink">
                  Cari Namamu
                </label>
                <span className="flex items-center gap-1 text-[11px] font-bold text-brand-blue">
                  <Sparkles className="size-3" />
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
                  className="h-13 rounded-xl border-line/80 bg-white/95 pr-11 text-base font-semibold shadow-inner focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15"
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
                        className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all ${
                          isHighlighted
                            ? "border-brand-blue bg-white shadow-md ring-2 ring-brand-blue/30 scale-[1.01]"
                            : "border-white/70 bg-surface/85 shadow-xs backdrop-blur-md hover:bg-white hover:shadow-md"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-base font-black text-ink">{guest.name}</span>
                          {guest.category ? (
                            <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-brand-blue">
                              <ShieldCheck className="size-3" />
                              {guest.category}
                            </span>
                          ) : null}
                        </div>
                        <div className="flex size-8 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
                          <ArrowRight className="size-4" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Empty state pencarian */
                <EmptyState icon={Users} title="Nama tidak ditemukan">
                  Mungkin kamu sudah absen, atau namamu belum terdaftar. Hubungi panitia di meja
                  registrasi.
                </EmptyState>
              )
            ) : null}
          </div>
        ) : null}

        {/* Modal / Lembar Konfirmasi Pilihan Nama (Glassmorphism Dialog) */}
        {(stage === "confirming" || stage === "submitting") && selectedGuest ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center">
            <Card className="flex w-full max-w-md flex-col gap-6 rounded-3xl border border-white/80 bg-surface/95 p-6 shadow-2xl backdrop-blur-2xl animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-brand-blue">
                  Konfirmasi Identitas
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
                <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue/15 to-brand-purple/15 text-brand-blue shadow-inner">
                  {isMasuk ? <LogIn className="size-8" /> : <LogOut className="size-8" />}
                </div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                  Apakah benar ini namamu?
                </p>
                <p className="text-2xl font-black text-ink">{selectedGuest.name}</p>
                {selectedGuest.category ? (
                  <span className="rounded-full bg-brand-blue/10 px-3.5 py-1 text-xs font-bold text-brand-blue ring-1 ring-brand-blue/20">
                    {selectedGuest.category}
                  </span>
                ) : null}
              </div>

              <div className="flex flex-col gap-2.5 pt-1">
                <Button
                  onClick={handleSubmitAttendance}
                  disabled={stage === "submitting"}
                  className="h-13 rounded-xl text-base font-black shadow-md"
                >
                  {stage === "submitting" ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Mencatat Absensi...
                    </>
                  ) : (
                    `Ya, Saya Ingin Absen ${isMasuk ? "Masuk" : "Pulang"}`
                  )}
                </Button>

                <Button
                  variant="secondary"
                  onClick={() => setStage("active")}
                  disabled={stage === "submitting"}
                  className="h-12 rounded-xl text-sm"
                >
                  Bukan Saya (Cari Ulang)
                </Button>
              </div>
            </Card>
          </div>
        ) : null}

        {/* STAGE 5: Tiket Digital Perayaan (Digital Pass & Confetti) */}
        {stage === "success" && successData ? (
          <DigitalTicket
            mode={expectedMode}
            guestName={successData.name}
            category={successData.category}
            scannedAt={successData.scannedAt}
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
