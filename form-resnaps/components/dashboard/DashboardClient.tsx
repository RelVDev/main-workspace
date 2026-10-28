// P10 / P17: Dashboard Panitia dengan panel Kating/Tamu Belum Lunas HTM (Hold Approval),
// Scanner Voucher Makan & Photobooth terintegrasi, serta visual merek RE:SNAPS.
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  LogIn,
  LogOut,
  Clock,
  Radio,
  FileDown,
  ExternalLink,
  Tv,
  RefreshCw,
  Zap,
  Activity,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Wallet,
  Utensils,
  Camera,
  ScanLine,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { QrDisplay } from "@/components/qr/QrDisplay";
import { AttendanceChart } from "./AttendanceChart";
import { VoucherScannerClient } from "./VoucherScannerClient";
import { createClient } from "@/lib/supabase/client";

type DashboardMetrics = {
  total: number;
  checkedIn: number;
  percentCheckedIn: number;
  inside: number;
  checkedOut: number;
  notYet: number;
  onHoldCount: number;
  unpaidCount: number;
  paidCount: number;
  allergyCount?: number;
  mealRedeemedCount: number;
  photoboothRedeemedCount: number;
};

type UnpaidGuestItem = {
  id: string;
  name: string;
  category: string | null;
  allergies?: string | null;
  status: "belum_hadir" | "ditahan" | "di_dalam" | "sudah_pulang";
  paymentStatus: "lunas" | "belum_lunas";
  holdAt: string | null;
  holdAtWib: string | null;
  voucherCode: string;
};

type AllergyGuestItem = {
  id: string;
  name: string;
  category: string | null;
  allergies: string;
  status: "belum_hadir" | "ditahan" | "di_dalam" | "sudah_pulang";
  voucherCode: string;
  mealRedeemedAt: string | null;
  mealRedeemedAtWib: string | null;
};

type ActivityItem = {
  id: string;
  type: "in" | "out";
  source: "qr" | "manual";
  scannedAt: string;
  scannedAtWib: string;
  guestName: string;
  category: string | null;
};

type IntervalChartItem = {
  time: string;
  masuk: number;
  pulang: number;
};

type DashboardData = {
  metrics: DashboardMetrics;
  unpaidGuests: UnpaidGuestItem[];
  allergyGuests?: AllergyGuestItem[];
  activities: ActivityItem[];
  chartData: IntervalChartItem[];
  settings: {
    checkinOpen: boolean;
    checkoutOpen: boolean;
  };
  updatedAtWib: string;
};

type LiveScanEvent = {
  id: string;
  type: "scan" | "attendance";
  name?: string;
  category?: string | null;
  mode: "in" | "out";
  timeWib: string;
  elapsedSec: number;
};

export function DashboardClient({ isTvMode = false }: { isTvMode?: boolean }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [liveStream, setLiveStream] = useState<LiveScanEvent | null>(null);
  const [processingGuestId, setProcessingGuestId] = useState<string | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/panitia/dashboard-data");
      if (res.ok) {
        const payload = await res.json();
        if (payload.ok) {
          setData(payload);
        }
      }
    } catch {
      // Abaikan bila fetch gagal sesaat
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Polling live scan activity untuk preview tamu yang sedang scan / baru absen
  const fetchLiveActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/panitia/live-activity");
      if (!res.ok) return;
      const d = await res.json();
      if (!d.ok) return;

      const latestAtt = d.latestAttendance?.[0];
      if (latestAtt && latestAtt.isVeryRecent) {
        setLiveStream({
          id: latestAtt.id,
          type: "attendance",
          name: latestAtt.guestName,
          category: latestAtt.category,
          mode: latestAtt.type,
          timeWib: latestAtt.scannedAtWib,
          elapsedSec: latestAtt.elapsedSec,
        });
        return;
      }

      const scan = d.latestScanInfo;
      if (scan && scan.isVeryRecent) {
        setLiveStream({
          id: scan.id,
          type: "scan",
          mode: scan.mode,
          timeWib: "Barusan",
          elapsedSec: scan.elapsedSec,
        });
      }
    } catch {
      // Abaikan
    }
  }, []);

  // 1. Initial fetch & polling
  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (mounted) {
        await fetchData();
        await fetchLiveActivity();
      }
    })();

    const dataInterval = setInterval(() => {
      if (mounted) void fetchData();
    }, 6000);

    const liveInterval = setInterval(() => {
      if (mounted) void fetchLiveActivity();
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(dataInterval);
      clearInterval(liveInterval);
    };
  }, [fetchData, fetchLiveActivity]);

  // 2. Supabase Realtime channel
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-live-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendance_logs" },
        () => {
          void fetchData();
          void fetchLiveActivity();
        },
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchData, fetchLiveActivity]);

  // Fungsi menyetujui masuk tamu yang ditahan (Hold HTM) atau menandai Lunas
  async function handleApproveOrMarkPaid(
    guest: UnpaidGuestItem,
    action: "approve_checkin" | "set_payment",
  ) {
    setProcessingGuestId(guest.id);
    setActionBanner(null);
    try {
      const res = await fetch("/api/panitia/htm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_id: guest.id,
          action,
          payment_status: "lunas",
        }),
      });
      const d = await res.json();
      if (res.ok && d.ok) {
        setActionBanner(
          action === "approve_checkin"
            ? `✅ HTM ${guest.name} dilunasi & diizinkan masuk! Tiket & Barcode Voucher otomatis aktif di HP tamu.`
            : `✅ Status HTM ${guest.name} berhasil ditandai LUNAS.`,
        );
        await fetchData();
      }
    } finally {
      setProcessingGuestId(null);
    }
  }

  if (isLoading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-center text-sm font-semibold text-ink-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="relative size-14 animate-pulse overflow-hidden rounded-2xl bg-white p-1 shadow-lg">
            <Image
              src="/brand/logo.png"
              alt="RE:SNAPS"
              width={96}
              height={96}
              className="size-full rounded-xl object-cover"
              priority
            />
          </div>
          <span>Memuat dashboard analitik RE:SNAPS...</span>
        </div>
      </div>
    );
  }

  const m: DashboardMetrics = data?.metrics || {
    total: 0,
    checkedIn: 0,
    percentCheckedIn: 0,
    inside: 0,
    checkedOut: 0,
    notYet: 0,
    onHoldCount: 0,
    unpaidCount: 0,
    paidCount: 0,
    mealRedeemedCount: 0,
    photoboothRedeemedCount: 0,
  };

  const unpaidList = data?.unpaidGuests || [];
  const allergyList = data?.allergyGuests || [];
  const heldGuests = unpaidList.filter((g) => g.status === "ditahan");

  // P10.8: Mode Layar Besar (TV Mode)
  if (isTvMode) {
    return (
      <div className="flex min-h-screen flex-col bg-canvas p-6 sm:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
          <div className="flex items-center gap-4">
            <div className="relative size-16 overflow-hidden rounded-2xl bg-white p-1 shadow-md">
              <Image
                src="/brand/logo.png"
                alt="RE:SNAPS"
                width={128}
                height={128}
                className="size-full rounded-xl object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl">
                RE:SNAPS — LIVE MONITOR
              </h1>
              <p className="text-sm font-semibold text-ink-muted">
                Closing Party CHRYSALIS · Pemantauan Kehadiran & Voucher Tamu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge tone={isLive ? "success" : "warning"} icon={Radio}>
              {isLive ? "REALTIME LIVE" : "POLLING (6s)"}
            </Badge>
            <span className="text-sm font-bold text-ink-muted">
              Diperbarui: {data?.updatedAtWib}
            </span>
          </div>
        </header>

        {liveStream ? (
          <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-success/30 bg-surface/90 p-4 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-success text-white shadow-xs">
                <CheckCircle2 className="size-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-wider text-success">
                  {liveStream.type === "attendance" ? "Aktivitas Terkini" : "Pemindaian Baru"}
                </span>
                <span className="text-lg font-black text-ink">
                  {liveStream.name
                    ? `${liveStream.name} (${liveStream.category || "Tamu"})`
                    : "Tamu sedang memindai QR..."}
                </span>
              </div>
            </div>
            <span className="rounded-full bg-surface-soft px-4 py-1 text-xs font-bold text-ink">
              Mode {liveStream.mode === "in" ? "Masuk" : "Pulang"} · {liveStream.timeWib}
            </span>
          </div>
        ) : null}

        <div className="mt-8 grid flex-1 grid-cols-2 gap-6 lg:grid-cols-4">
          <Card className="flex flex-col items-center justify-center gap-2 rounded-2xl border-line p-8 text-center shadow-lg">
            <span className="text-sm font-bold uppercase tracking-wider text-ink-muted">
              Total Undangan
            </span>
            <span className="text-7xl font-black text-ink">{m.total}</span>
          </Card>

          <Card className="flex flex-col items-center justify-center gap-2 rounded-2xl border-brand-blue/30 p-8 text-center shadow-lg ring-1 ring-brand-blue/20">
            <span className="text-sm font-bold uppercase tracking-wider text-brand-blue">
              Sudah Masuk
            </span>
            <span className="text-7xl font-black text-brand-blue">{m.checkedIn}</span>
            <span className="text-xl font-extrabold text-ink-muted">({m.percentCheckedIn}%)</span>
          </Card>

          <Card className="flex flex-col items-center justify-center gap-2 rounded-2xl border-success/30 p-8 text-center shadow-lg ring-1 ring-success/20">
            <span className="text-sm font-bold uppercase tracking-wider text-success">
              Sedang Di Dalam
            </span>
            <span className="text-7xl font-black text-success">{m.inside}</span>
          </Card>

          <Card className="flex flex-col items-center justify-center gap-2 rounded-2xl border-purple-500/30 p-8 text-center shadow-lg ring-1 ring-purple-500/20">
            <span className="text-sm font-bold uppercase tracking-wider text-brand-purple">
              Sudah Pulang
            </span>
            <span className="text-7xl font-black text-brand-purple">{m.checkedOut}</span>
          </Card>
        </div>

        <div className="mt-8 flex flex-col gap-2.5">
          <div className="flex justify-between text-base font-extrabold text-ink">
            <span>Tingkat Kehadiran Acara</span>
            <span>
              {m.percentCheckedIn}% ({m.checkedIn} dari {m.total} tamu)
            </span>
          </div>
          <div className="h-7 w-full overflow-hidden rounded-full bg-surface-soft p-1 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-brand transition-all duration-700 ease-out"
              style={{ width: `${m.percentCheckedIn}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Banner Umpan Balik Persetujuan HTM */}
      {actionBanner ? (
        <div className="flex items-center justify-between rounded-2xl border border-success/40 bg-success/10 px-4 py-3 text-xs font-extrabold text-success shadow-xs">
          <span>{actionBanner}</span>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="rounded-lg p-1 hover:bg-success/15"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      {/* Peringatan Darurat bila Ada Tamu yang Sedang Tertahan (ON HOLD) di Gerbang */}
      {heldGuests.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-3xl border-2 border-warning bg-gradient-to-r from-warning/15 via-surface to-brand-coral/10 p-5 shadow-lg animate-in fade-in">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-warning text-white shadow-sm">
                <AlertTriangle className="size-5 animate-bounce" />
              </div>
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-warning">
                  {heldGuests.length} Tamu / Kating Tertahan di Gerbang (HTM Belum Lunas)
                </h2>
                <p className="text-xs font-semibold text-ink-muted">
                  Tamu di bawah ini baru saja scan QR masuk, namun status absennya di-hold sampai
                  panitia mengizinkan.
                </p>
              </div>
            </div>
            <Badge tone="warning" icon={Clock}>
              Menunggu Persetujuan
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {heldGuests.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-warning/40 bg-white p-3.5 shadow-sm"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-black text-ink">{g.name}</span>
                  <span className="text-xs font-bold text-brand-blue">
                    {g.category || "Tamu"} · Hold pukul {g.holdAtWib || "Barusan"}
                  </span>
                </div>
                <Button
                  onClick={() => void handleApproveOrMarkPaid(g, "approve_checkin")}
                  disabled={processingGuestId === g.id}
                  className="h-9 shrink-0 rounded-xl bg-success px-3 text-xs font-black text-white shadow-xs hover:brightness-95"
                >
                  {processingGuestId === g.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="size-3.5" />
                      Lunasi & Izinkan Masuk
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Banner Live Stream Interaktif + Tombol Cepat Scanner Voucher */}
      <div className="overflow-hidden rounded-2xl border border-line bg-gradient-to-r from-surface via-surface to-surface-soft p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex size-10 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
              <Activity className="size-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex size-3">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-success" />
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-brand-blue">
                  Live Activity Stream
                </span>
                <Badge tone={isLive ? "success" : "neutral"} icon={Radio}>
                  {isLive ? "Realtime" : "Polling"}
                </Badge>
              </div>

              {liveStream ? (
                <div className="flex items-center gap-2 text-sm font-bold text-ink">
                  {liveStream.type === "attendance" ? (
                    <>
                      <CheckCircle2 className="size-4 shrink-0 text-success" />
                      <span>{liveStream.name}</span>
                      <span className="text-xs font-semibold text-ink-muted">
                        absen {liveStream.mode === "in" ? "Masuk" : "Pulang"} ({liveStream.timeWib})
                      </span>
                    </>
                  ) : (
                    <>
                      <Zap className="size-4 shrink-0 animate-bounce text-warning" />
                      <span>
                        Tamu sedang memindai QR {liveStream.mode === "in" ? "Masuk" : "Pulang"}
                      </span>
                      <span className="text-xs font-semibold text-ink-muted">
                        ({liveStream.timeWib})
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <span className="text-xs font-semibold text-ink-muted">
                  Menunggu pemindaian QR atau kehadiran tamu berikutnya...
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowScannerModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-brand px-3.5 py-2 text-xs font-black text-white shadow-sm transition hover:brightness-95"
            >
              <ScanLine className="size-3.5" />
              Buka Scanner Makan & Photobooth
            </button>
            <Link
              href="/panitia?tv=1"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs hover:bg-surface-soft"
            >
              <Tv className="size-3.5" />
              Mode TV
            </Link>
            <a
              href="/api/export"
              download
              className="inline-flex items-center gap-1.5 rounded-xl border border-brand-blue/30 bg-brand-blue/5 px-3 py-1.5 text-xs font-bold text-brand-blue shadow-2xs hover:bg-brand-blue/10"
            >
              <FileDown className="size-3.5" />
              Ekspor CSV
            </a>
            <button
              type="button"
              onClick={() => void fetchData()}
              className="inline-flex items-center rounded-xl border border-line bg-surface p-2 text-ink hover:bg-surface-soft"
              title="Segarkan data sekarang"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Baris Metrik Utama Kehadiran, Status HTM, & Voucher */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="flex flex-col justify-between gap-2 rounded-2xl border-line p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tamu</span>
            <Users className="size-4" />
          </div>
          <div>
            <span className="text-3xl font-black text-ink">{m.total}</span>
            <p className="text-[11px] font-semibold text-ink-muted">Undangan terdaftar</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-2 rounded-2xl border-brand-blue/30 bg-gradient-to-br from-surface to-brand-blue/5 p-4 shadow-sm">
          <div className="flex items-center justify-between text-brand-blue">
            <span className="text-xs font-bold uppercase tracking-wider">Sudah Masuk</span>
            <LogIn className="size-4" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-brand-blue">{m.checkedIn}</span>
              <span className="text-xs font-bold text-ink-muted">({m.percentCheckedIn}%)</span>
            </div>
            <p className="text-[11px] font-semibold text-ink-muted">{m.inside} sedang di dalam</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-2 rounded-2xl border-warning/40 bg-gradient-to-br from-surface to-warning/10 p-4 shadow-sm">
          <div className="flex items-center justify-between text-warning">
            <span className="text-xs font-bold uppercase tracking-wider">Belum Lunas</span>
            <Wallet className="size-4" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-warning">{m.unpaidCount}</span>
              {m.onHoldCount > 0 ? (
                <span className="rounded-full bg-error px-2 py-0.5 text-[10px] font-black text-white">
                  {m.onHoldCount} HOLD
                </span>
              ) : null}
            </div>
            <p className="text-[11px] font-semibold text-ink-muted">Kating / Tamu belum lunas</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-2 rounded-2xl border-brand-orange/35 bg-gradient-to-br from-surface to-brand-orange/10 p-4 shadow-sm">
          <div className="flex items-center justify-between text-brand-orange">
            <span className="text-xs font-bold uppercase tracking-wider">Kupon Makan</span>
            <Utensils className="size-4" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-brand-orange">{m.mealRedeemedCount}</span>
              <span className="text-xs font-bold text-ink-muted">/ {m.checkedIn}</span>
            </div>
            <p className="text-[11px] font-semibold text-ink-muted">Sudah ditukarkan</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-2 rounded-2xl border-brand-purple/35 bg-gradient-to-br from-surface to-brand-purple/10 p-4 shadow-sm">
          <div className="flex items-center justify-between text-brand-purple">
            <span className="text-xs font-bold uppercase tracking-wider">Photobooth</span>
            <Camera className="size-4" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-brand-purple">
                {m.photoboothRedeemedCount}
              </span>
              <span className="text-xs font-bold text-ink-muted">/ {m.checkedIn}</span>
            </div>
            <p className="text-[11px] font-semibold text-ink-muted">Sesi foto dipakai</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-2 rounded-2xl border-line p-4 shadow-sm">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Sudah Pulang</span>
            <LogOut className="size-4" />
          </div>
          <div>
            <span className="text-3xl font-black text-ink">{m.checkedOut}</span>
            <p className="text-[11px] font-semibold text-ink-muted">{m.notYet} belum hadir</p>
          </div>
        </Card>
      </div>

      {/* Progress Bar Kehadiran Bertingkat */}
      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-ink">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-brand-blue" />
            Tingkat Kehadiran Acara
          </span>
          <span className="font-extrabold text-brand-blue">
            {m.percentCheckedIn}% ({m.checkedIn} dari {m.total} tamu)
          </span>
        </div>
        <div className="h-3.5 w-full overflow-hidden rounded-full bg-surface-soft p-0.5">
          <div
            className="h-full rounded-full bg-gradient-brand transition-all duration-700 ease-out"
            style={{ width: `${m.percentCheckedIn}%` }}
          />
        </div>
      </div>

      {/* Seksi Khusus: Daftar Kating / Tamu Belum Lunas HTM & Kontrol Persetujuan Hold */}
      <Card className="flex flex-col gap-4 rounded-3xl border-warning/35 bg-gradient-to-b from-white to-surface-soft/40 p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-warning/15 text-warning">
              <Wallet className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-ink">
                  Data Kating / Tamu Belum Lunas HTM
                </h2>
                <Badge tone={unpaidList.length > 0 ? "warning" : "success"}>
                  {unpaidList.length} Belum Lunas
                </Badge>
              </div>
              <p className="text-xs text-ink-muted">
                Tamu dengan HTM belum lunas akan otomatis tertahan (Hold) saat scan masuk sampai
                Anda mengizinkan di sini.
              </p>
            </div>
          </div>

          <Link
            href="/panitia/tamu?payment=belum_lunas"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-brand-blue hover:underline"
          >
            Kelola di Tabel Tamu <ExternalLink className="size-3" />
          </Link>
        </div>

        {unpaidList.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-6 text-xs font-bold text-success">
            <CheckCircle2 className="size-4" />
            <span>Seluruh Kating dan Tamu sudah tercatat LUNAS HTM!</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {unpaidList.map((g) => {
              const isHeld = g.status === "ditahan";
              return (
                <div
                  key={g.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                    isHeld
                      ? "border-warning bg-warning/10 shadow-sm ring-1 ring-warning/30"
                      : "border-line bg-white hover:border-brand-blue/30"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-ink">{g.name}</span>
                      {isHeld ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2.5 py-0.5 text-[10px] font-black uppercase text-white">
                          <Clock className="size-3" />
                          HOLD DI GERBANG
                        </span>
                      ) : (
                        <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-extrabold text-warning">
                          Belum Lunas
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-muted">
                      <span className="inline-flex items-center gap-1 font-bold text-brand-blue">
                        <ShieldCheck className="size-3" />
                        {g.category || "Tamu / Kating"}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-[11px]">{g.voucherCode}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={processingGuestId === g.id}
                      onClick={() => void handleApproveOrMarkPaid(g, "approve_checkin")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-success px-3 py-2 text-xs font-black text-white shadow-xs transition hover:brightness-95 disabled:opacity-50"
                      title="Lunasi HTM dan langsung catat sukses absen masuk"
                    >
                      {processingGuestId === g.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-3.5" />
                      )}
                      {isHeld ? "Izinkan Masuk (Lunas)" : "Lunasi & Absen Masuk"}
                    </button>

                    {!isHeld ? (
                      <button
                        type="button"
                        disabled={processingGuestId === g.id}
                        onClick={() => void handleApproveOrMarkPaid(g, "set_payment")}
                        className="inline-flex items-center gap-1 rounded-xl border border-line bg-surface px-2.5 py-2 text-xs font-bold text-ink hover:bg-surface-soft disabled:opacity-50"
                        title="Tandai HTM sudah lunas (tamu tetap scan QR saat tiba)"
                      >
                        Tandai Lunas
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Seksi Khusus: Data Alergi Makanan Tamu (Konsumsi) */}
      <Card className="flex flex-col gap-4 rounded-3xl border-brand-orange/35 bg-gradient-to-b from-white to-brand-orange/5 p-5 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3.5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-orange/15 text-brand-orange">
              <Utensils className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-ink">
                  Data Alergi Makanan Tamu (Konsumsi)
                </h2>
                <Badge tone="warning">{allergyList.length} Tamu Memiliki Alergi</Badge>
              </div>
              <p className="text-xs text-ink-muted">
                Catatan alergi makanan tamu untuk persiapan paket konsumsi khusus & otomatis muncul saat scan voucher makan.
              </p>
            </div>
          </div>

          <Link
            href="/panitia/scanner"
            className="inline-flex items-center gap-1 text-xs font-extrabold text-brand-orange hover:underline"
          >
            Buka Scanner Konsumsi <ExternalLink className="size-3" />
          </Link>
        </div>

        {allergyList.length === 0 ? (
          <div className="py-4 text-center text-xs font-semibold text-ink-muted">
            Belum ada catatan alergi makanan tamu.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {allergyList.map((g) => (
              <div
                key={g.id}
                className="flex flex-col justify-between gap-2 rounded-2xl border border-brand-orange/30 bg-white p-3.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-ink">{g.name}</span>
                    <span className="text-[11px] font-bold text-brand-blue">
                      {g.category || "Tamu"} · <span className="font-mono">{g.voucherCode}</span>
                    </span>
                  </div>
                  {g.mealRedeemedAtWib ? (
                    <Badge tone="neutral">Sudah Klaim ({g.mealRedeemedAtWib})</Badge>
                  ) : g.status === "di_dalam" || g.status === "sudah_pulang" ? (
                    <Badge tone="success">Hadir · Belum Klaim</Badge>
                  ) : (
                    <Badge tone="warning">Belum Tiba</Badge>
                  )}
                </div>

                <div className="flex items-center gap-1.5 rounded-xl bg-warning/15 px-2.5 py-1.5 text-xs font-extrabold text-warning">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  <span>Alergi: {g.allergies}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Baris 2: Kartu QR Kompak di Dashboard & Grafik Kehadiran */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-3 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-ink">Layar QR Gerbang</h2>
            <Link
              href="/panitia/qr"
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline"
            >
              Buka Layar Penuh <ExternalLink className="size-3" />
            </Link>
          </div>
          <QrDisplay compact={true} />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-7">
          <Card className="flex flex-col gap-4 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-ink">
                  Grafik Kehadiran (Interval 15 Mnt)
                </h2>
                <p className="text-xs text-ink-muted">
                  Distribusi arus kedatangan dan kepulangan
                </p>
              </div>
              <span className="rounded-full bg-surface-soft px-2.5 py-1 text-[11px] font-bold text-ink-muted">
                WIB
              </span>
            </div>
            <AttendanceChart data={data?.chartData || []} />
          </Card>

          <Card className="flex flex-col gap-3 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div>
                <h2 className="text-base font-extrabold text-ink">Aktivitas Terakhir</h2>
                <p className="text-xs text-ink-muted">Riwayat presensi masuk dan keluar</p>
              </div>
              <Link
                href="/panitia/log"
                className="text-xs font-bold text-brand-blue hover:underline"
              >
                Lihat Semua Log
              </Link>
            </div>

            {data?.activities && data.activities.length > 0 ? (
              <div className="flex flex-col divide-y divide-line text-sm">
                {data.activities.slice(0, 8).map((act) => (
                  <div key={act.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-8 items-center justify-center rounded-xl text-xs font-bold ${
                          act.type === "in"
                            ? "bg-brand-blue/10 text-brand-blue"
                            : "bg-brand-purple/10 text-brand-purple"
                        }`}
                      >
                        {act.type === "in" ? (
                          <LogIn className="size-4" />
                        ) : (
                          <LogOut className="size-4" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-ink">{act.guestName}</span>
                        {act.category ? (
                          <span className="text-[11px] font-semibold text-ink-muted">
                            {act.category}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col items-end text-xs text-ink-muted">
                      <span className="font-bold tabular-nums text-ink">{act.scannedAtWib}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                        {act.source === "manual" ? "Manual Panitia" : "Scan QR"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-ink-muted">
                Belum ada aktivitas absensi yang tercatat.
              </p>
            )}
          </Card>
        </div>
      </div>

      {/* Modal Cepat Scanner Voucher Makan & Photobooth langsung dari Dashboard */}
      {showScannerModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative my-8 flex w-full max-w-4xl flex-col gap-4 rounded-3xl bg-canvas p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <ScanLine className="size-5 text-brand-magenta" />
                <span className="text-base font-black text-ink">
                  Scanner Voucher Makan & Photobooth (1x Pakai)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowScannerModal(false);
                  void fetchData();
                }}
                className="rounded-full bg-surface-soft p-1.5 text-ink hover:bg-line"
              >
                <X className="size-5" />
              </button>
            </div>

            <VoucherScannerClient compact={true} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
