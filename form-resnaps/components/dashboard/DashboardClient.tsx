// P10: Dashboard Panitia yang disempurnakan dengan logo resmi RE:SNAPS, live stream scan preview, dan visual interaktif.
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
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { QrDisplay } from "@/components/qr/QrDisplay";
import { AttendanceChart } from "./AttendanceChart";
import { createClient } from "@/lib/supabase/client";

type DashboardMetrics = {
  total: number;
  checkedIn: number;
  percentCheckedIn: number;
  inside: number;
  checkedOut: number;
  notYet: number;
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

  // 1. Initial fetch & 5s live polling
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
    }, 10000);

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
        }
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchData, fetchLiveActivity]);

  if (isLoading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-center text-sm font-semibold text-ink-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="relative size-12 animate-pulse overflow-hidden rounded-xl shadow-md">
            <Image
              src="/brand/logo.png"
              alt="RE:SNAPS"
              width={96}
              height={96}
              className="size-full object-cover"
              priority
            />
          </div>
          <span>Memuat dashboard analitik RE:SNAPS...</span>
        </div>
      </div>
    );
  }

  const m = data?.metrics || {
    total: 0,
    checkedIn: 0,
    percentCheckedIn: 0,
    inside: 0,
    checkedOut: 0,
    notYet: 0,
  };

  // P10.8: Mode Layar Besar (TV Mode) yang disempurnakan dengan logo resmi
  if (isTvMode) {
    return (
      <div className="flex min-h-screen flex-col bg-canvas p-6 sm:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
          <div className="flex items-center gap-4">
            <div className="relative size-16 overflow-hidden rounded-2xl shadow-md">
              <Image
                src="/brand/logo.png"
                alt="RE:SNAPS"
                width={128}
                height={128}
                className="size-full object-cover"
                priority
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl">
                RE:SNAPS — LIVE MONITOR
              </h1>
              <p className="text-sm font-semibold text-ink-muted">
                Closing Party CHRYSALIS · Pemantauan Kehadiran Tamu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge tone={isLive ? "success" : "warning"} icon={Radio}>
              {isLive ? "REALTIME LIVE" : "POLLING (10s)"}
            </Badge>
            <span className="text-sm font-bold text-ink-muted">
              Diperbarui: {data?.updatedAtWib}
            </span>
          </div>
        </header>

        {/* Live Notification Bar di TV Mode */}
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
                  {liveStream.name ? `${liveStream.name} (${liveStream.category || "Tamu"})` : "Tamu sedang memindai QR..."}
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

        {/* Progress Bar Besar */}
        <div className="mt-8 flex flex-col gap-2.5">
          <div className="flex justify-between text-base font-extrabold text-ink">
            <span>Tingkat Kehadiran Acara</span>
            <span>{m.percentCheckedIn}% ({m.checkedIn} dari {m.total} tamu)</span>
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
      {/* Banner Live Stream Interaktif Pemindaian QR & Absensi */}
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
                      <CheckCircle2 className="size-4 text-success shrink-0" />
                      <span>{liveStream.name}</span>
                      <span className="text-xs font-semibold text-ink-muted">
                        absen {liveStream.mode === "in" ? "Masuk" : "Pulang"} ({liveStream.timeWib})
                      </span>
                    </>
                  ) : (
                    <>
                      <Zap className="size-4 text-warning shrink-0 animate-bounce" />
                      <span>Tamu sedang memindai QR {liveStream.mode === "in" ? "Masuk" : "Pulang"}</span>
                      <span className="text-xs font-semibold text-ink-muted">({liveStream.timeWib})</span>
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

          <div className="flex items-center gap-2">
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

      {/* 5 Kartu Metrik Kehadiran Premium */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="flex flex-col justify-between gap-2 rounded-2xl border-line p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Total Tamu</span>
            <Users className="size-4" />
          </div>
          <div>
            <span className="text-3xl font-black text-ink">{m.total}</span>
            <p className="text-[11px] font-semibold text-ink-muted">Undangan terdaftar</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-2 rounded-2xl border-brand-blue/30 bg-gradient-to-br from-surface to-brand-blue/5 p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-brand-blue">
            <span className="text-xs font-bold uppercase tracking-wider">Sudah Masuk</span>
            <LogIn className="size-4" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-brand-blue">{m.checkedIn}</span>
              <span className="text-xs font-bold text-ink-muted">({m.percentCheckedIn}%)</span>
            </div>
            <p className="text-[11px] font-semibold text-ink-muted">Telah hadir di venue</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-2 rounded-2xl border-success/30 bg-gradient-to-br from-surface to-success/5 p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-success">
            <span className="text-xs font-bold uppercase tracking-wider">Di Dalam</span>
            <Radio className="size-4" />
          </div>
          <div>
            <span className="text-3xl font-black text-success">{m.inside}</span>
            <p className="text-[11px] font-semibold text-ink-muted">Tamu di area acara</p>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-2 rounded-2xl border-purple-500/30 bg-gradient-to-br from-surface to-purple-500/5 p-4 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between text-brand-purple">
            <span className="text-xs font-bold uppercase tracking-wider">Sudah Pulang</span>
            <LogOut className="size-4" />
          </div>
          <div>
            <span className="text-3xl font-black text-brand-purple">{m.checkedOut}</span>
            <p className="text-[11px] font-semibold text-ink-muted">Telah check-out</p>
          </div>
        </Card>

        <Card className="col-span-2 flex flex-col justify-between gap-2 rounded-2xl border-line p-4 shadow-sm transition hover:shadow-md sm:col-span-1">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Belum Hadir</span>
            <Clock className="size-4" />
          </div>
          <div>
            <span className="text-3xl font-black text-ink">{m.notYet}</span>
            <p className="text-[11px] font-semibold text-ink-muted">Belum check-in</p>
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

      {/* Baris 2: Kartu QR Kompak di Dashboard & Grafik Kehadiran */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Kartu QR Kompak */}
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

        {/* Kolom Kanan: Grafik 15 Menit & Aktivitas Terbaru */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Grafik 15 Menit */}
          <Card className="flex flex-col gap-4 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-ink">Grafik Kehadiran (Interval 15 Mnt)</h2>
                <p className="text-xs text-ink-muted">Distribusi arus kedatangan dan kepulangan</p>
              </div>
              <span className="rounded-full bg-surface-soft px-2.5 py-1 text-[11px] font-bold text-ink-muted">
                WIB
              </span>
            </div>
            <AttendanceChart data={data?.chartData || []} />
          </Card>

          {/* Aktivitas 20 Absensi Terakhir */}
          <Card className="flex flex-col gap-3 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div>
                <h2 className="text-base font-extrabold text-ink">Aktivitas Terakhir</h2>
                <p className="text-xs text-ink-muted">Riwayat presensi masuk dan keluar</p>
              </div>
              <Link href="/panitia/log" className="text-xs font-bold text-brand-blue hover:underline">
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
                        {act.type === "in" ? <LogIn className="size-4" /> : <LogOut className="size-4" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-ink">{act.guestName}</span>
                        {act.category ? (
                          <span className="text-[11px] font-semibold text-ink-muted">{act.category}</span>
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
    </div>
  );
}
