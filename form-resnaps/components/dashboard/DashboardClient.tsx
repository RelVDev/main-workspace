// P10: Komponen utama Dashboard Panitia (Realtime + Fallback Polling 10s + Metrik + TV Mode).
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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

export function DashboardClient({ isTvMode = false }: { isTvMode?: boolean }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // 1. Initial fetch & 10s Polling fallback (P10.6)
  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (mounted) await fetchData();
    })();

    const pollInterval = setInterval(() => {
      if (mounted) void fetchData();
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [fetchData]);

  // 2. Supabase Realtime channel pada attendance_logs (P10.6)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("public:attendance_logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "attendance_logs" },
        () => {
          void fetchData();
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "attendance_logs" },
        () => {
          void fetchData();
        }
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchData]);

  if (isLoading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-center text-sm font-semibold text-ink-muted">
        Memuat data dashboard...
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

  // P10.8: Mode Layar Besar (TV Mode)
  if (isTvMode) {
    return (
      <div className="flex min-h-screen flex-col bg-canvas p-6">
        <header className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-ink">
              Pantauan Kehadiran RE:SNAPS
            </h1>
            <Badge tone={isLive ? "success" : "warning"} icon={Radio}>
              {isLive ? "REALTIME LIVE" : "POLLING (10s)"}
            </Badge>
          </div>
          <span className="text-base font-semibold text-ink-muted">
            Diperbarui: {data?.updatedAtWib}
          </span>
        </header>

        <div className="mt-8 grid flex-1 grid-cols-2 gap-6 lg:grid-cols-4">
          <Card className="flex flex-col items-center justify-center gap-2 p-8 text-center shadow-lg">
            <span className="text-sm font-bold uppercase tracking-wider text-ink-muted">
              Total Undangan
            </span>
            <span className="text-6xl font-black text-ink">{m.total}</span>
          </Card>

          <Card className="flex flex-col items-center justify-center gap-2 border-brand-blue/30 p-8 text-center shadow-lg">
            <span className="text-sm font-bold uppercase tracking-wider text-brand-blue">
              Sudah Masuk
            </span>
            <span className="text-6xl font-black text-brand-blue">{m.checkedIn}</span>
            <span className="text-lg font-bold text-ink-muted">({m.percentCheckedIn}%)</span>
          </Card>

          <Card className="flex flex-col items-center justify-center gap-2 border-success/30 p-8 text-center shadow-lg">
            <span className="text-sm font-bold uppercase tracking-wider text-success">
              Sedang Di Dalam
            </span>
            <span className="text-6xl font-black text-success">{m.inside}</span>
          </Card>

          <Card className="flex flex-col items-center justify-center gap-2 border-purple-500/30 p-8 text-center shadow-lg">
            <span className="text-sm font-bold uppercase tracking-wider text-brand-purple">
              Sudah Pulang
            </span>
            <span className="text-6xl font-black text-brand-purple">{m.checkedOut}</span>
          </Card>
        </div>

        {/* Progress Bar Besar */}
        <div className="mt-8 flex flex-col gap-2">
          <div className="flex justify-between text-sm font-bold text-ink">
            <span>Tingkat Kehadiran Acara</span>
            <span>{m.percentCheckedIn}%</span>
          </div>
          <div className="h-6 w-full overflow-hidden rounded-full bg-surface-soft">
            <div
              className="h-full bg-gradient-brand transition-all duration-700 ease-out"
              style={{ width: `${m.percentCheckedIn}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Baris Status Atas & Tombol Aksi Cepat */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Badge tone={isLive ? "success" : "warning"} icon={Radio}>
            {isLive ? "Realtime Live" : "Polling (10s)"}
          </Badge>
          <span className="text-xs text-ink-muted">Terakhir: {data?.updatedAtWib}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/panitia?tv=1"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-soft"
          >
            <Tv className="size-3.5" />
            Mode TV
          </Link>
          <a
            href="/api/export"
            download
            className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-brand-blue hover:bg-surface-soft"
          >
            <FileDown className="size-3.5" />
            Ekspor CSV
          </a>
          <button
            type="button"
            onClick={() => void fetchData()}
            className="inline-flex items-center gap-1 rounded-control border border-line bg-surface p-1.5 text-ink hover:bg-surface-soft"
            title="Segarkan data sekarang"
          >
            <RefreshCw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* 5 Kartu Metrik Kehadiran (P10.1) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="flex flex-col gap-1 p-4">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Total</span>
            <Users className="size-4" />
          </div>
          <span className="text-3xl font-extrabold text-ink">{m.total}</span>
          <span className="text-xs text-ink-muted">Tamu terdaftar</span>
        </Card>

        <Card className="flex flex-col gap-1 border-l-4 border-l-brand-blue p-4">
          <div className="flex items-center justify-between text-brand-blue">
            <span className="text-xs font-bold uppercase tracking-wider">Masuk</span>
            <LogIn className="size-4" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-brand-blue">{m.checkedIn}</span>
            <span className="text-xs font-bold text-ink-muted">({m.percentCheckedIn}%)</span>
          </div>
          <span className="text-xs text-ink-muted">Telah hadir</span>
        </Card>

        <Card className="flex flex-col gap-1 border-l-4 border-l-success p-4">
          <div className="flex items-center justify-between text-success">
            <span className="text-xs font-bold uppercase tracking-wider">Di Dalam</span>
            <Radio className="size-4" />
          </div>
          <span className="text-3xl font-extrabold text-success">{m.inside}</span>
          <span className="text-xs text-ink-muted">Sedang di venue</span>
        </Card>

        <Card className="flex flex-col gap-1 border-l-4 border-l-brand-purple p-4">
          <div className="flex items-center justify-between text-brand-purple">
            <span className="text-xs font-bold uppercase tracking-wider">Pulang</span>
            <LogOut className="size-4" />
          </div>
          <span className="text-3xl font-extrabold text-brand-purple">{m.checkedOut}</span>
          <span className="text-xs text-ink-muted">Sudah keluar</span>
        </Card>

        <Card className="col-span-2 flex flex-col gap-1 p-4 sm:col-span-1">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-bold uppercase tracking-wider">Belum Hadir</span>
            <Clock className="size-4" />
          </div>
          <span className="text-3xl font-extrabold text-ink">{m.notYet}</span>
          <span className="text-xs text-ink-muted">Menunggu kedatangan</span>
        </Card>
      </div>

      {/* Progress Bar Kehadiran (P10.2) */}
      <div className="flex flex-col gap-1.5 rounded-card border border-line bg-surface p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs font-bold text-ink">
          <span>Progres Kehadiran Acara</span>
          <span>{m.percentCheckedIn}% ({m.checkedIn} dari {m.total} tamu)</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-surface-soft">
          <div
            className="h-full bg-brand-blue transition-all duration-500 ease-out"
            style={{ width: `${m.percentCheckedIn}%` }}
          />
        </div>
      </div>

      {/* Baris 2: Kartu QR Kompak di Dashboard (P10.10) & Grafik Kehadiran (P10.3) */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Kolom Kiri: Kartu QR Kompak */}
        <div className="flex flex-col gap-3 lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">Tampilan QR Layar</h2>
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
          <Card className="flex flex-col gap-4 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-ink">Grafik Kehadiran (Interval 15 Mnt)</h2>
              <span className="text-xs text-ink-muted">Zona Waktu WIB</span>
            </div>
            <AttendanceChart data={data?.chartData || []} />
          </Card>

          {/* Aktivitas 20 Absensi Terakhir (P10.4) */}
          <Card className="flex flex-col gap-3 p-5">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <h2 className="text-base font-bold text-ink">Aktivitas Terakhir</h2>
              <Link href="/panitia/log" className="text-xs font-bold text-brand-blue hover:underline">
                Lihat Semua Log
              </Link>
            </div>

            {data?.activities && data.activities.length > 0 ? (
              <div className="flex flex-col divide-y divide-line text-sm">
                {data.activities.slice(0, 10).map((act) => (
                  <div key={act.id} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                          act.type === "in"
                            ? "bg-brand-blue/10 text-brand-blue"
                            : "bg-brand-purple/10 text-brand-purple"
                        }`}
                      >
                        {act.type === "in" ? <LogIn className="size-3.5" /> : <LogOut className="size-3.5" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-ink">{act.guestName}</span>
                        {act.category ? (
                          <span className="text-xs text-ink-muted">{act.category}</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-col items-end text-xs text-ink-muted">
                      <span className="font-semibold tabular-nums text-ink">{act.scannedAtWib}</span>
                      <span className="text-[10px] uppercase tracking-wide">
                        {act.source === "manual" ? "Manual" : "QR"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-xs text-ink-muted">
                Belum ada aktivitas absensi yang tercatat.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
