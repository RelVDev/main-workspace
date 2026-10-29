// P10 / P17: Dashboard Panitia yang bersih, minimalis, dan berkecepatan tinggi (0ms pencarian cepat):
// - Pencarian Nama & Barcode Instan (0ms) langsung dari Dashboard + Aksi Cepat 1-Klik
// - Ringkasan Kehadiran, HTM, & Voucher
// - Input Tamu On-The-Spot (OTS) langsung dari Dashboard
// - Panel Persetujuan Hold HTM & Recovery HP
// - Panel Ringkas Catatan Alergi Konsumsi
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
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
  AlertTriangle,
  Wallet,
  Utensils,
  Camera,
  ScanLine,
  Loader2,
  X,
  RotateCcw,
  UserPlus,
  Search,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
  isOts?: boolean;
  mealEligible?: boolean;
  holdAt: string | null;
  holdAtWib: string | null;
  voucherCode: string;
};

type QuickGuestItem = {
  id: string;
  name: string;
  category: string | null;
  allergies: string | null;
  status: "belum_hadir" | "ditahan" | "di_dalam" | "sudah_pulang";
  paymentStatus: "lunas" | "belum_lunas";
  isOts?: boolean;
  mealEligible?: boolean;
  voucherCode: string;
  mealRedeemedAtWib: string | null;
  photoboothRedeemedAtWib: string | null;
};

type TamuMealQuota = {
  maxSlots: number;
  usedSlots: number;
  remainingSlots: number;
  totalTamuCount: number;
  canAddOtsMeal: boolean;
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
  tamuMealQuota?: TamuMealQuota;
  unpaidGuests: UnpaidGuestItem[];
  quickGuests?: QuickGuestItem[];
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

// Cache memori sisi klien agar perpindahan kembali ke tab Dashboard langsung tampil 0ms
let cachedDashboardData: DashboardData | null = null;

export function DashboardClient({ isTvMode: propTvMode }: { isTvMode?: boolean }) {
  const searchParams = useSearchParams();
  const isTvMode = propTvMode ?? searchParams.get("tv") === "1";

  const [data, setData] = useState<DashboardData | null>(() => cachedDashboardData);
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(() => cachedDashboardData === null);
  const [liveStream, setLiveStream] = useState<LiveScanEvent | null>(null);
  const [processingGuestId, setProcessingGuestId] = useState<string | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  // Pencarian Cepat 0ms di Dashboard & Filter Aktivitas
  const [quickQuery, setQuickQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState<"all" | "in" | "out">("all");

  // Modal Cepat Input Tamu OTS dari Dashboard
  const [showOtsModal, setShowOtsModal] = useState(false);
  const [otsName, setOtsName] = useState("");
  const [otsCategory, setOtsCategory] = useState("");
  const [otsContact, setOtsContact] = useState("");
  const [otsAllergies, setOtsAllergies] = useState("");
  const [otsPayment, setOtsPayment] = useState<"lunas" | "belum_lunas">("lunas");
  const [otsIncludeMeal, setOtsIncludeMeal] = useState(false);
  const [otsAutoCheckin, setOtsAutoCheckin] = useState(true);
  const [isAddingOts, setIsAddingOts] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/panitia/dashboard-data");
      if (res.ok) {
        const payload = await res.json();
        if (payload.ok) {
          cachedDashboardData = payload;
          setData(payload);
        }
      }
    } catch {
      // Abaikan
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (mounted) {
        await Promise.all([fetchData(), fetchLiveActivity()]);
      }
    })();

    const dataInterval = setInterval(() => {
      if (mounted) void fetchData();
    }, 3000);

    const liveInterval = setInterval(() => {
      if (mounted) void fetchLiveActivity();
    }, 3000);

    return () => {
      mounted = false;
      clearInterval(dataInterval);
      clearInterval(liveInterval);
    };
  }, [fetchData, fetchLiveActivity]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-live-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance_logs" },
        () => {
          void fetchData();
          void fetchLiveActivity();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_settings" },
        () => {
          void fetchData();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "audit_logs" },
        () => {
          void fetchData();
        },
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchData, fetchLiveActivity]);

  // Hasil Pencarian Cepat 0ms di Memori Klien
  const quickSearchResults = useMemo(() => {
    const q = quickQuery.trim().toLowerCase();
    if (!q || !data?.quickGuests) return [];
    return data.quickGuests
      .filter((g) => {
        const hay = `${g.name} ${g.voucherCode} ${g.category || ""} ${g.allergies || ""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 6);
  }, [quickQuery, data?.quickGuests]);

  async function handleApproveOrMarkPaid(
    guest: { id: string; name: string },
    action: "approve_checkin" | "set_payment" | "reset_attendance",
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
          payment_status: action === "reset_attendance" ? undefined : "lunas",
        }),
      });
      const d = await res.json();
      if (res.ok && d.ok) {
        setActionBanner(
          action === "approve_checkin"
            ? `HTM ${guest.name} dilunasi & diizinkan masuk. Tiket otomatis aktif di HP tamu.`
            : action === "reset_attendance"
              ? `Recovery berhasil: Status ${guest.name} di-reset & kunci HP dibuka.`
              : `Status HTM ${guest.name} ditandai LUNAS.`,
        );
        await fetchData();
      }
    } finally {
      setProcessingGuestId(null);
    }
  }

  async function handleQuickManualAttendance(
    guest: { id: string; name: string },
    type: "in" | "out",
  ) {
    setProcessingGuestId(guest.id);
    setActionBanner(null);
    try {
      const res = await fetch("/api/panitia/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_id: guest.id, type }),
      });
      const d = await res.json();
      if (res.ok && d.ok) {
        setActionBanner(
          `Absen ${type === "in" ? "MASUK" : "PULANG"} untuk ${guest.name} berhasil dicatat.`,
        );
        await fetchData();
      }
    } finally {
      setProcessingGuestId(null);
    }
  }

  async function handleToggleMealEligible(
    guest: { id: string; name: string },
    mealEligible: boolean,
  ) {
    setProcessingGuestId(guest.id);
    setActionBanner(null);
    try {
      const res = await fetch("/api/panitia/htm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_id: guest.id,
          action: "set_meal_eligible",
          meal_eligible: mealEligible,
        }),
      });
      const d = await res.json();
      if (res.ok && d.ok) {
        setActionBanner(
          mealEligible
            ? `Tiket Makan ditambahkan untuk ${guest.name} (Slot Tamu: ${d.tamuMealQuota?.usedSlots ?? 0}/${d.tamuMealQuota?.maxSlots ?? 50}).`
            : `Tiket Makan dicabut dari ${guest.name} (Hanya Photobooth).`,
        );
        await fetchData();
      } else if (d.error) {
        setActionBanner(d.error);
      }
    } finally {
      setProcessingGuestId(null);
    }
  }

  async function handleAddOtsGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!otsName.trim()) return;

    setIsAddingOts(true);
    setActionBanner(null);
    try {
      const res = await fetch("/api/panitia/tambah-tamu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: otsName.trim(),
          category: otsCategory.trim() || "OTS · Tamu",
          contact: otsContact.trim() || null,
          allergies: otsAllergies.trim() || null,
          payment_status: otsPayment,
          include_meal: otsIncludeMeal,
          auto_checkin: otsPayment === "lunas" && otsAutoCheckin,
        }),
      });
      const d = await res.json();
      if (res.ok && d.ok) {
        const vCode = d.guest?.voucher_code ? ` (${d.guest.voucher_code})` : "";
        const checkinNote = d.guest?.checked_in_at ? " & langsung Check-In" : "";
        const mealNote = d.guest?.meal_eligible
          ? " · +Tiket Makan & Photobooth"
          : " · Hanya Tiket Photobooth";
        setActionBanner(
          `Tamu OTS "${otsName.trim()}" ditambahkan${checkinNote}${vCode}${mealNote}.`,
        );
        setShowOtsModal(false);
        setOtsName("");
        setOtsCategory("");
        setOtsContact("");
        setOtsAllergies("");
        setOtsPayment("lunas");
        setOtsIncludeMeal(false);
        setOtsAutoCheckin(true);
        await fetchData();
      } else if (d.error) {
        setActionBanner(d.error);
      }
    } finally {
      setIsAddingOts(false);
    }
  }

  if (isLoading && !data) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-center text-sm font-semibold text-ink-muted">
        <Loader2 className="size-6 animate-spin text-brand-blue" />
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
  const tamuMealQuota: TamuMealQuota = data?.tamuMealQuota || {
    maxSlots: 50,
    usedSlots: 0,
    remainingSlots: 50,
    totalTamuCount: 0,
    canAddOtsMeal: true,
  };

  // Mode Layar Besar (TV Mode)
  if (isTvMode) {
    return (
      <div className="flex min-h-screen flex-col bg-canvas p-6 sm:p-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
          <div className="flex items-center gap-4">
            <div className="relative size-14 overflow-hidden rounded-2xl bg-white p-1 shadow-md">
              <Image
                src="/brand/logo.png"
                alt="RE:SNAPS"
                width={128}
                height={128}
                className="size-full rounded-xl object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-ink sm:text-4xl">
                RE:SNAPS — LIVE MONITOR
              </h1>
              <p className="text-xs font-semibold text-ink-muted sm:text-sm">
                Closing Party CHRYSALIS 2026
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge tone={isLive ? "success" : "warning"} icon={Radio}>
              {isLive ? "LIVE" : "SYNC"}
            </Badge>
            <span className="text-sm font-bold text-ink-muted">{data?.updatedAtWib}</span>
          </div>
        </header>

        <div className="mt-8 grid flex-1 grid-cols-2 gap-6 lg:grid-cols-4">
          <Card className="flex flex-col items-center justify-center gap-2 rounded-2xl p-8 text-center shadow-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Total Terdaftar
            </span>
            <span className="text-6xl font-black text-ink sm:text-7xl">{m.total}</span>
          </Card>

          <Card className="flex flex-col items-center justify-center gap-2 rounded-2xl border-brand-blue/30 p-8 text-center shadow-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-blue">
              Sudah Masuk
            </span>
            <span className="text-6xl font-black text-brand-blue sm:text-7xl">{m.checkedIn}</span>
            <span className="text-base font-extrabold text-ink-muted">({m.percentCheckedIn}%)</span>
          </Card>

          <Card className="flex flex-col items-center justify-center gap-2 rounded-2xl border-success/30 p-8 text-center shadow-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-success">
              Di Dalam Venue
            </span>
            <span className="text-6xl font-black text-success sm:text-7xl">{m.inside}</span>
          </Card>

          <Card className="flex flex-col items-center justify-center gap-2 rounded-2xl border-brand-purple/30 p-8 text-center shadow-lg">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-purple">
              Sudah Pulang
            </span>
            <span className="text-6xl font-black text-brand-purple sm:text-7xl">
              {m.checkedOut}
            </span>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Notifikasi Ringkas */}
      {actionBanner ? (
        <div className="flex items-center justify-between rounded-2xl border border-success/40 bg-success/10 px-4 py-2.5 text-xs font-bold text-success">
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

      {/* Baris Aksi Utama & Status Live */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3.5 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
            <Activity className="size-4" />
            <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-success ring-2 ring-white" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-ink">Closing Party CHRYSALIS</span>
              <Badge tone={isLive ? "success" : "neutral"}>{isLive ? "Live" : "Sync"}</Badge>
            </div>
            {liveStream ? (
              <span className="text-xs font-semibold text-ink-muted">
                {liveStream.type === "attendance" ? (
                  <>
                    <strong className="text-ink">{liveStream.name}</strong> absen{" "}
                    {liveStream.mode === "in" ? "Masuk" : "Pulang"} ({liveStream.timeWib})
                  </>
                ) : (
                  <>
                    <Zap className="mr-1 inline size-3 text-warning" />
                    Tamu sedang scan QR {liveStream.mode === "in" ? "Masuk" : "Pulang"}
                  </>
                )}
              </span>
            ) : (
              <span className="text-xs text-ink-muted">
                {m.checkedIn} dari {m.total} hadir ({m.percentCheckedIn}%)
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOtsModal(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand-blue px-3 text-xs font-black text-white shadow-2xs transition hover:brightness-95"
          >
            <UserPlus className="size-3.5" />
            + Input OTS
          </button>
          <button
            type="button"
            onClick={() => setShowScannerModal(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-brand px-3.5 text-xs font-black text-white shadow-2xs transition hover:brightness-95"
          >
            <ScanLine className="size-3.5" />
            Scanner Voucher
          </button>
          <Link
            href="/panitia?tv=1"
            target="_blank"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 text-xs font-bold text-ink hover:bg-surface-soft"
          >
            <Tv className="size-3.5" />
            <span className="hidden sm:inline">TV</span>
          </Link>
          <a
            href="/api/export"
            download
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 text-xs font-bold text-brand-blue hover:bg-surface-soft"
          >
            <FileDown className="size-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </a>
          <button
            type="button"
            onClick={() => void fetchData()}
            className="inline-flex size-9 items-center justify-center rounded-xl border border-line bg-surface text-ink hover:bg-surface-soft"
            title="Segarkan"
          >
            <RefreshCw className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Kotak Pencarian Cepat Instan (0ms) langsung dari Dashboard */}
      <Card className="flex flex-col gap-3 rounded-2xl p-3.5 shadow-2xs">
        <div className="relative">
          <Input
            id="dashboard-quick-search"
            placeholder="Cari cepat nama panitia / tamu / kode RSNP-XXXX untuk aksi instan..."
            value={quickQuery}
            onChange={(e) => setQuickQuery(e.target.value)}
            className="h-10 rounded-xl pr-9 text-sm"
          />
          {quickQuery ? (
            <button
              type="button"
              onClick={() => setQuickQuery("")}
              className="absolute inset-y-0 right-2.5 my-auto flex size-6 items-center justify-center rounded-full text-ink-muted hover:bg-surface-soft hover:text-ink"
              title="Hapus pencarian"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <Search className="pointer-events-none absolute inset-y-0 right-3 my-auto size-4 text-ink-muted" />
          )}
        </div>

        {quickQuery.trim() ? (
          quickSearchResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {quickSearchResults.map((g) => {
                const isHeld = g.status === "ditahan";
                const isUnpaid = g.paymentStatus === "belum_lunas";
                return (
                  <div
                    key={g.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-white p-2.5"
                  >
                    <div className="flex min-w-0 flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-black text-ink sm:text-sm">
                          {g.name}
                        </span>
                        <span className="font-mono text-[11px] font-bold text-brand-purple">
                          {g.voucherCode}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 text-[11px] text-ink-muted">
                        <span>{g.category || "Panitia"}</span>
                        {g.mealEligible === false ? (
                          <span className="rounded bg-neutral-200 px-1.5 py-0.2 font-bold text-ink-muted">
                            OTS: Hanya Foto
                          </span>
                        ) : null}
                        {g.allergies ? (
                          <span className="rounded bg-warning/15 px-1.5 py-0.2 font-extrabold text-warning">
                            Alergi: {g.allergies}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {g.mealEligible === false ? (
                        <button
                          type="button"
                          disabled={processingGuestId === g.id || !tamuMealQuota.canAddOtsMeal}
                          onClick={() => void handleToggleMealEligible(g, true)}
                          className="inline-flex h-7 items-center gap-1 rounded-lg bg-brand-orange px-2 text-[11px] font-black text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                          title={
                            tamuMealQuota.canAddOtsMeal
                              ? `Berikan tiket makan (Sisa slot Tamu: ${tamuMealQuota.remainingSlots}/50)`
                              : "Slot makan Tamu Angkatan (50/50) sudah penuh"
                          }
                        >
                          <Utensils className="size-3" />
                          + Makan
                        </button>
                      ) : null}

                      {isHeld || (isUnpaid && g.status === "belum_hadir") ? (
                        <button
                          type="button"
                          disabled={processingGuestId === g.id}
                          onClick={() => void handleApproveOrMarkPaid(g, "approve_checkin")}
                          className="inline-flex h-7 items-center gap-1 rounded-lg bg-success px-2 text-[11px] font-black text-white hover:brightness-95 disabled:opacity-50"
                        >
                          <CheckCircle2 className="size-3" />
                          {isHeld ? "Izinkan" : "Lunasi & Masuk"}
                        </button>
                      ) : null}

                      {g.status === "belum_hadir" && !isUnpaid ? (
                        <button
                          type="button"
                          disabled={processingGuestId === g.id}
                          onClick={() => void handleQuickManualAttendance(g, "in")}
                          className="inline-flex h-7 items-center gap-1 rounded-lg bg-brand-blue px-2.5 text-[11px] font-bold text-white hover:brightness-95 disabled:opacity-50"
                        >
                          <LogIn className="size-3" />
                          Masuk
                        </button>
                      ) : null}

                      {g.status === "di_dalam" ? (
                        <button
                          type="button"
                          disabled={processingGuestId === g.id}
                          onClick={() => void handleQuickManualAttendance(g, "out")}
                          className="inline-flex h-7 items-center gap-1 rounded-lg bg-brand-purple px-2.5 text-[11px] font-bold text-white hover:brightness-95 disabled:opacity-50"
                        >
                          <LogOut className="size-3" />
                          Pulang
                        </button>
                      ) : null}

                      {g.status !== "belum_hadir" ? (
                        <button
                          type="button"
                          disabled={processingGuestId === g.id}
                          onClick={() => void handleApproveOrMarkPaid(g, "reset_attendance")}
                          className="inline-flex h-7 items-center gap-1 rounded-lg border border-error/40 px-2 text-[11px] font-bold text-error hover:bg-error/10 disabled:opacity-50"
                          title="Reset & buka kunci HP"
                        >
                          <RotateCcw className="size-3" />
                          Recovery
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="px-1 text-xs font-semibold text-ink-muted">
              Tidak ditemukan nama/kode untuk &ldquo;{quickQuery}&rdquo;.
            </p>
          )
        ) : null}
      </Card>

      {/* 6 Kartu Metrik Bersih & Ringkas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="flex flex-col justify-between gap-1 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Terdaftar</span>
            <Users className="size-3.5" />
          </div>
          <span className="text-2xl font-black text-ink sm:text-3xl">{m.total}</span>
        </Card>

        <Card className="flex flex-col justify-between gap-1 rounded-2xl border-brand-blue/30 bg-brand-blue/5 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-brand-blue">
            <span className="text-[11px] font-bold uppercase tracking-wider">Hadir</span>
            <LogIn className="size-3.5" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-brand-blue sm:text-3xl">{m.checkedIn}</span>
            <span className="text-xs font-bold text-ink-muted">{m.percentCheckedIn}%</span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-1 rounded-2xl border-warning/35 bg-warning/5 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-warning">
            <span className="text-[11px] font-bold uppercase tracking-wider">Belum Lunas</span>
            <Wallet className="size-3.5" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-warning sm:text-3xl">{m.unpaidCount}</span>
            {m.onHoldCount > 0 ? (
              <span className="rounded-full bg-error px-1.5 py-0.5 text-[10px] font-black text-white">
                {m.onHoldCount} Hold
              </span>
            ) : null}
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-1 rounded-2xl border-brand-orange/30 bg-brand-orange/5 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-brand-orange">
            <span className="text-[11px] font-bold uppercase tracking-wider">Makan</span>
            <Utensils className="size-3.5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-brand-orange sm:text-3xl">
              {m.mealRedeemedCount}
            </span>
            <span className="text-xs font-bold text-ink-muted">/ {m.checkedIn}</span>
          </div>
          <span className="text-[10px] font-extrabold text-ink-muted">
            Slot Tamu: {tamuMealQuota.usedSlots}/{tamuMealQuota.maxSlots} (Sisa {tamuMealQuota.remainingSlots})
          </span>
        </Card>

        <Card className="flex flex-col justify-between gap-1 rounded-2xl border-brand-purple/30 bg-brand-purple/5 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-brand-purple">
            <span className="text-[11px] font-bold uppercase tracking-wider">Photobooth</span>
            <Camera className="size-3.5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-brand-purple sm:text-3xl">
              {m.photoboothRedeemedCount}
            </span>
            <span className="text-xs font-bold text-ink-muted">/ {m.checkedIn}</span>
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-1 rounded-2xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pulang</span>
            <LogOut className="size-3.5" />
          </div>
          <span className="text-2xl font-black text-ink sm:text-3xl">{m.checkedOut}</span>
        </Card>
      </div>

      {/* Panel Terpadu: Belum Lunas HTM & Persetujuan Hold */}
      {unpaidList.length > 0 ? (
        <Card className="flex flex-col gap-3.5 rounded-3xl border-warning/35 p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-warning/15 text-warning">
                <Wallet className="size-4" />
              </div>
              <h2 className="text-sm font-black text-ink sm:text-base">
                Belum Lunas HTM & Hold Gerbang
              </h2>
              <Badge tone="warning">{unpaidList.length}</Badge>
            </div>

            <Link
              href="/panitia/tamu?payment=belum_lunas"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline"
            >
              Lihat Semua <ExternalLink className="size-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {unpaidList.map((g) => {
              const isHeld = g.status === "ditahan";
              return (
                <div
                  key={g.id}
                  className={`flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border p-3 transition ${
                    isHeld
                      ? "border-warning bg-warning/10 ring-1 ring-warning/30"
                      : "border-line bg-white"
                  }`}
                >
                  <div className="flex min-w-0 flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-black text-ink">{g.name}</span>
                      {isHeld ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-[10px] font-black text-white">
                          <Clock className="size-2.5" />
                          HOLD
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 text-xs font-semibold text-ink-muted">
                      <span className="truncate">
                        {g.category || "Panitia"} · <span className="font-mono">{g.voucherCode}</span>
                      </span>
                      {g.mealEligible === false ? (
                        <span className="rounded bg-neutral-200 px-1.5 py-0.2 text-[10px] font-black text-ink-muted">
                          OTS: Hanya Foto
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {g.mealEligible === false ? (
                      <button
                        type="button"
                        disabled={processingGuestId === g.id || !tamuMealQuota.canAddOtsMeal}
                        onClick={() => void handleToggleMealEligible(g, true)}
                        className="inline-flex h-8 items-center gap-1 rounded-xl bg-brand-orange px-2 text-xs font-black text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                        title={
                          tamuMealQuota.canAddOtsMeal
                            ? `Tambahkan Tiket Makan (Sisa slot Tamu: ${tamuMealQuota.remainingSlots}/50)`
                            : "Slot makan Tamu Angkatan (50/50) sudah penuh"
                        }
                      >
                        <Utensils className="size-3" />
                        + Makan
                      </button>
                    ) : null}

                    <button
                      type="button"
                      disabled={processingGuestId === g.id}
                      onClick={() => void handleApproveOrMarkPaid(g, "approve_checkin")}
                      className="inline-flex h-8 items-center gap-1 rounded-xl bg-success px-2.5 text-xs font-black text-white hover:brightness-95 disabled:opacity-50"
                    >
                      {processingGuestId === g.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-3.5" />
                      )}
                      {isHeld ? "Izinkan Masuk" : "Lunasi & Masuk"}
                    </button>

                    {!isHeld ? (
                      <button
                        type="button"
                        disabled={processingGuestId === g.id}
                        onClick={() => void handleApproveOrMarkPaid(g, "set_payment")}
                        className="inline-flex h-8 items-center rounded-xl border border-line bg-surface px-2.5 text-xs font-bold text-ink hover:bg-surface-soft disabled:opacity-50"
                      >
                        Lunas
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={processingGuestId === g.id}
                        onClick={() => void handleApproveOrMarkPaid(g, "reset_attendance")}
                        className="inline-flex h-8 items-center gap-1 rounded-xl border border-error/40 bg-error/10 px-2 text-xs font-bold text-error hover:bg-error/15 disabled:opacity-50"
                        title="Recovery bila salah klik nama"
                      >
                        <RotateCcw className="size-3" />
                        Recovery
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {/* Panel Ringkas: Catatan Alergi Makanan (Konsumsi) */}
      {allergyList.length > 0 ? (
        <Card className="flex flex-col gap-3.5 rounded-3xl border-brand-orange/30 p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-brand-orange/15 text-brand-orange">
                <Utensils className="size-4" />
              </div>
              <h2 className="text-sm font-black text-ink sm:text-base">
                Catatan Alergi Makanan
              </h2>
              <Badge tone="warning">{allergyList.length}</Badge>
            </div>

            <Link
              href="/panitia/scanner"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange hover:underline"
            >
              Scanner Konsumsi <ExternalLink className="size-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {allergyList.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-2 rounded-2xl border border-line bg-white p-3"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-xs font-black text-ink sm:text-sm">{g.name}</span>
                  <span className="inline-flex w-fit items-center gap-1 rounded-md bg-warning/15 px-2 py-0.5 text-[11px] font-extrabold text-warning">
                    <AlertTriangle className="size-3 shrink-0" />
                    <span className="truncate">{g.allergies}</span>
                  </span>
                </div>
                <div className="shrink-0">
                  {g.mealRedeemedAtWib ? (
                    <Badge tone="neutral">Sudah Klaim</Badge>
                  ) : g.status === "di_dalam" || g.status === "sudah_pulang" ? (
                    <Badge tone="success">Hadir</Badge>
                  ) : (
                    <Badge tone="warning">Belum Tiba</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Layar QR Ringkas & Grafik / Aktivitas */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <div className="flex flex-col gap-2.5 lg:col-span-5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-ink">Layar QR Gerbang</h2>
            <Link
              href="/panitia/qr"
              target="_blank"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-blue hover:underline"
            >
              Layar Penuh <ExternalLink className="size-3" />
            </Link>
          </div>
          <QrDisplay compact={true} />
        </div>

        <div className="flex flex-col gap-5 lg:col-span-7">
          <Card className="flex flex-col gap-3 rounded-2xl p-4 shadow-2xs sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-ink sm:text-base">
                Grafik Arus Kehadiran
              </h2>
              <span className="rounded-full bg-surface-soft px-2.5 py-0.5 text-[11px] font-bold text-ink-muted">
                WIB
              </span>
            </div>
            <AttendanceChart data={data?.chartData || []} />
          </Card>

          <Card className="flex flex-col gap-3 rounded-2xl p-4 shadow-2xs sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-ink sm:text-base">
                  Log Aktivitas Gerbang
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-black text-success">
                  <span className="size-1.5 animate-pulse rounded-full bg-success" />
                  REAL-TIME
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActivityFilter("all")}
                  className={`rounded-lg px-2 py-1 text-[11px] font-black transition ${
                    activityFilter === "all"
                      ? "bg-ink text-white"
                      : "bg-surface-soft text-ink-muted hover:text-ink"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter("in")}
                  className={`rounded-lg px-2 py-1 text-[11px] font-black transition ${
                    activityFilter === "in"
                      ? "bg-success text-white"
                      : "bg-success/10 text-success hover:bg-success/15"
                  }`}
                >
                  Masuk
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter("out")}
                  className={`rounded-lg px-2 py-1 text-[11px] font-black transition ${
                    activityFilter === "out"
                      ? "bg-brand-purple text-white"
                      : "bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/15"
                  }`}
                >
                  Pulang
                </button>
                <Link
                  href="/panitia/log"
                  className="ml-1 text-xs font-bold text-brand-blue hover:underline"
                >
                  Semua Log
                </Link>
              </div>
            </div>

            {data?.activities && data.activities.length > 0 ? (
              <div className="flex flex-col divide-y divide-line text-sm">
                {data.activities
                  .filter((act) => (activityFilter === "all" ? true : act.type === activityFilter))
                  .slice(0, 7)
                  .map((act) => {
                    const isMasuk = act.type === "in";
                    return (
                      <div key={act.id} className="flex items-center justify-between gap-2 py-2.5">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={`inline-flex shrink-0 items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-2xs ${
                              isMasuk ? "bg-success" : "bg-brand-purple"
                            }`}
                          >
                            {isMasuk ? (
                              <>
                                <LogIn className="size-3" />
                                MASUK
                              </>
                            ) : (
                              <>
                                <LogOut className="size-3" />
                                PULANG
                              </>
                            )}
                          </span>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-xs font-black text-ink sm:text-sm">
                              {act.guestName}
                            </span>
                            {act.category ? (
                              <span className="truncate text-[11px] font-semibold text-ink-muted">
                                {act.category}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <span className="shrink-0 text-xs font-bold tabular-nums text-ink">
                          {act.scannedAtWib}
                        </span>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-ink-muted">Belum ada aktivitas.</p>
            )}
          </Card>
        </div>
      </div>

      {/* Modal Cepat Input Tamu On-The-Spot (OTS) dari Dashboard */}
      {showOtsModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <Card className="flex w-full max-w-md flex-col gap-4 rounded-3xl p-5 sm:p-6">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="size-4 text-brand-blue" />
                <span className="text-sm font-black text-ink">Input Tamu On-The-Spot (OTS)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowOtsModal(false)}
                className="text-ink-muted hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddOtsGuest} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label htmlFor="dash-ots-name" className="text-xs font-bold text-ink">
                  Nama Lengkap *
                </label>
                <Input
                  id="dash-ots-name"
                  placeholder="Ketik nama lengkap tamu OTS..."
                  value={otsName}
                  onChange={(e) => setOtsName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="dash-ots-cat" className="text-xs font-bold text-ink">
                    Kategori / Divisi
                  </label>
                  <Input
                    id="dash-ots-cat"
                    placeholder="OTS · Tamu / Kating"
                    value={otsCategory}
                    onChange={(e) => setOtsCategory(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="dash-ots-htm" className="text-xs font-bold text-ink">
                    Status HTM
                  </label>
                  <select
                    id="dash-ots-htm"
                    value={otsPayment}
                    onChange={(e) => setOtsPayment(e.target.value as "lunas" | "belum_lunas")}
                    className="h-11 rounded-control border border-line bg-surface px-3 text-xs font-bold text-ink focus:outline-none"
                  >
                    <option value="lunas">Sudah Lunas</option>
                    <option value="belum_lunas">Belum Lunas (Hold)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="dash-ots-allergies" className="text-xs font-bold text-ink">
                    Alergi Makanan (Opsional)
                  </label>
                  <Input
                    id="dash-ots-allergies"
                    placeholder="Mis. Seafood / Kacang"
                    value={otsAllergies}
                    onChange={(e) => setOtsAllergies(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="dash-ots-contact" className="text-xs font-bold text-ink">
                    No. WhatsApp (Opsional)
                  </label>
                  <Input
                    id="dash-ots-contact"
                    placeholder="08xxxxxxxxxx"
                    value={otsContact}
                    onChange={(e) => setOtsContact(e.target.value)}
                  />
                </div>
              </div>

              {/* Pengaturan Tiket Makan OTS (Sesuai Kuota 50 Slot Tamu Angkatan) */}
              <div className="flex flex-col gap-2 rounded-2xl border border-brand-orange/30 bg-brand-orange/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-ink">
                    Hak Voucher OTS (Default: Hanya Photobooth)
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                      tamuMealQuota.canAddOtsMeal
                        ? "bg-brand-orange/15 text-brand-orange"
                        : "bg-error/15 text-error"
                    }`}
                  >
                    Slot Tamu: {tamuMealQuota.usedSlots}/{tamuMealQuota.maxSlots} (Sisa{" "}
                    {tamuMealQuota.remainingSlots})
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-ink-muted">
                  Tamu OTS / HTM di tempat normalnya hanya mendapat <strong>Tiket Photobooth</strong>.
                  Panitia dapat menambahkan Tiket Makan selama slot Tamu Angkatan (&lt; 50) masih tersedia.
                </p>
                <label
                  className={`mt-0.5 flex items-center justify-between gap-3 rounded-xl border bg-white p-2.5 ${
                    tamuMealQuota.canAddOtsMeal
                      ? "cursor-pointer border-brand-orange/40"
                      : "cursor-not-allowed border-line opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Utensils className="size-4 text-brand-orange" />
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-ink">
                        + Tambahkan Tiket Makan untuk Tamu OTS Ini
                      </span>
                      <span className="text-[10px] font-semibold text-ink-muted">
                        {tamuMealQuota.canAddOtsMeal
                          ? `Menggunakan 1 dari sisa ${tamuMealQuota.remainingSlots} slot makan Tamu Angkatan`
                          : "Slot makan Tamu Angkatan (50/50) sudah penuh — hanya dapat Tiket Photobooth"}
                      </span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={otsIncludeMeal && tamuMealQuota.canAddOtsMeal}
                    disabled={!tamuMealQuota.canAddOtsMeal}
                    onChange={(e) => setOtsIncludeMeal(e.target.checked)}
                    className="size-4 rounded accent-brand-orange"
                  />
                </label>
              </div>

              {otsPayment === "lunas" ? (
                <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-brand-blue/25 bg-brand-blue/5 p-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-ink">
                      Langsung Check-In (Hadir) Sekarang
                    </span>
                    <span className="text-[11px] text-ink-muted">
                      Matikan bila tamu ingin scan QR gerbang dari HP sendiri
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={otsAutoCheckin}
                    onChange={(e) => setOtsAutoCheckin(e.target.checked)}
                    className="size-4 rounded accent-brand-blue"
                  />
                </label>
              ) : null}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowOtsModal(false)}
                  className="h-10 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={!otsName.trim() || isAddingOts}
                  className="h-10 px-4 text-xs font-black"
                >
                  {isAddingOts ? "Menyimpan..." : "Simpan Tamu OTS"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}

      {/* Modal Cepat Scanner Voucher Makan & Photobooth langsung dari Dashboard */}
      {showScannerModal ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-2.5 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="relative my-auto flex max-h-[92dvh] w-full max-w-5xl flex-col gap-4 overflow-y-auto rounded-3xl bg-canvas p-4 shadow-2xl sm:p-6">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-canvas/95 pb-3 backdrop-blur-xs">
              <div className="flex items-center gap-2">
                <ScanLine className="size-5 shrink-0 text-brand-magenta" />
                <span className="text-sm font-black text-ink sm:text-base">
                  Scanner Voucher Makan & Photobooth
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
