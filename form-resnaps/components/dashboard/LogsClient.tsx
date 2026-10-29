// P11.6: Halaman Log Real-Time Otomatis (Tanpa Refresh Manual):
// 1. Log Kehadiran Gerbang dengan pembeda visual tegas MASUK (Hijau) vs PULANG (Ungu) + filter instan
// 2. Log Hasil Scanner Voucher dengan filter khusus Penanggung Jawab (PIC) MAKAN vs PHOTOBOOTH agar tidak bercampur
// 3. Log Audit Panitia yang mudah dibaca dan ter-update otomatis
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LogIn,
  LogOut,
  RefreshCw,
  Utensils,
  Camera,
  Radio,
  Search,
  X,
  AlertTriangle,
  ShieldCheck,
  ScanLine,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

type AttendanceLogRow = {
  id: string;
  type: "in" | "out";
  source: "qr" | "manual";
  guestName: string;
  category: string | null;
  scannedAt: string;
  scannedAtWib: string;
};

type VoucherLogRow = {
  id: string;
  guestId: string;
  guestName: string;
  category: string | null;
  allergies: string | null;
  voucherCode: string;
  kind: "meal" | "photobooth";
  redeemedAt: string;
  redeemedAtWib: string;
};

type AuditLogRow = {
  id: string;
  action: string;
  meta: Record<string, unknown> | null;
  guestName: string | null;
  createdAt: string;
  createdAtWib: string;
};

let cachedAttendance: AttendanceLogRow[] | null = null;
let cachedVouchers: VoucherLogRow[] | null = null;
let cachedAudits: AuditLogRow[] | null = null;
let cachedUpdatedAtWib = "";

function formatAuditAction(action: string, meta: Record<string, unknown> | null) {
  switch (action) {
    case "manual_check_in":
    case "manual_in":
      return { label: "MASUK MANUAL", tone: "bg-success text-white" };
    case "manual_check_out":
    case "manual_out":
      return { label: "PULANG MANUAL", tone: "bg-brand-purple text-white" };
    case "redeem_voucher_meal":
      return { label: "SCAN VOUCHER MAKAN", tone: "bg-brand-orange text-white" };
    case "redeem_voucher_photobooth":
      return { label: "SCAN PHOTOBOOTH", tone: "bg-brand-purple text-white" };
    case "approve_hold_checkin":
      return { label: "LUNASI HTM & MASUK", tone: "bg-success text-white" };
    case "set_payment_status":
      return {
        label: meta?.payment_status === "lunas" ? "SET HTM LUNAS" : "SET HTM BELUM LUNAS",
        tone: meta?.payment_status === "lunas" ? "bg-brand-blue text-white" : "bg-warning text-white",
      };
    case "reset_guest_attendance":
    case "undo_in":
    case "undo_out":
      return { label: "RECOVERY / RESET ABSEN", tone: "bg-error text-white" };
    case "add_guest_ots":
      return { label: "INPUT TAMU OTS", tone: "bg-brand-blue text-white" };
    case "update_qr_settings":
      return { label: "UBAH PENGATURAN QR", tone: "bg-ink text-white" };
    case "revoke_all_sessions":
      return { label: "CABUT SEMUA SESI", tone: "bg-error text-white" };
    default: {
      if (action.includes("in") && !action.includes("out")) {
        return { label: action.toUpperCase(), tone: "bg-success text-white" };
      }
      if (action.includes("out")) {
        return { label: action.toUpperCase(), tone: "bg-brand-purple text-white" };
      }
      return { label: action.replace(/_/g, " ").toUpperCase(), tone: "bg-ink text-white" };
    }
  }
}

function summarizeAuditMeta(meta: Record<string, unknown> | null): string {
  if (!meta || typeof meta !== "object") return "-";
  const parts: string[] = [];
  if (typeof meta.voucher_code === "string") parts.push(`Kode: ${meta.voucher_code}`);
  if (typeof meta.category === "string") parts.push(`Divisi: ${meta.category}`);
  if (typeof meta.payment_status === "string") {
    parts.push(`HTM: ${meta.payment_status === "lunas" ? "LUNAS" : "BELUM LUNAS"}`);
  }
  if (typeof meta.reason === "string" && meta.reason) parts.push(`Alasan: ${meta.reason}`);
  if (typeof meta.scanned_by === "string") parts.push(`Oleh: ${meta.scanned_by}`);
  if (typeof meta.added_by === "string") parts.push(`Oleh: ${meta.added_by}`);
  if (parts.length > 0) return parts.join(" · ");
  return JSON.stringify(meta);
}

export function LogsClient() {
  const [tab, setTab] = useState<"attendance" | "voucher" | "audit">("attendance");
  const [attendanceFilter, setAttendanceFilter] = useState<"all" | "in" | "out">("all");
  // Default filter voucher ke "meal" agar PIC Makan & PIC Photobooth langsung terpisah dan tidak tercampur
  const [voucherFilter, setVoucherFilter] = useState<"meal" | "photobooth" | "all">("meal");
  const [searchQuery, setSearchQuery] = useState("");

  const [attendance, setAttendance] = useState<AttendanceLogRow[]>(() => cachedAttendance ?? []);
  const [vouchers, setVouchers] = useState<VoucherLogRow[]>(() => cachedVouchers ?? []);
  const [audits, setAudits] = useState<AuditLogRow[]>(() => cachedAudits ?? []);
  const [updatedAtWib, setUpdatedAtWib] = useState<string>(() => cachedUpdatedAtWib);
  const [isLoading, setIsLoading] = useState(() => cachedAttendance === null);
  const [isLive, setIsLive] = useState(false);

  const fetchLogs = useCallback(async (showSpinner = false) => {
    if (showSpinner && !cachedAttendance) {
      setIsLoading(true);
    }
    try {
      const res = await fetch("/api/panitia/logs-data");
      if (res.ok) {
        const d = await res.json();
        if (d.ok) {
          cachedAttendance = d.attendance || [];
          cachedVouchers = d.vouchers || [];
          cachedAudits = d.audits || [];
          cachedUpdatedAtWib = d.updatedAtWib || "";
          setAttendance(cachedAttendance!);
          setVouchers(cachedVouchers!);
          setAudits(cachedAudits!);
          setUpdatedAtWib(cachedUpdatedAtWib);
        }
      }
    } catch {
      // Abaikan gangguan jaringan sesaat
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Polling otomatis setiap 3 detik tanpa perlu refresh manual
  useEffect(() => {
    void fetchLogs(true);
    const interval = setInterval(() => {
      void fetchLogs(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // Langganan Supabase Realtime untuk update instan begitu ada scan masuk/pulang, klaim voucher, atau aksi panitia
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("logs-realtime-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance_logs" },
        () => {
          void fetchLogs(false);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audit_logs" },
        () => {
          void fetchLogs(false);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_settings" },
        () => {
          void fetchLogs(false);
        },
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  // Hitungan ringkas untuk badge filter
  const masukCount = useMemo(
    () => attendance.filter((r) => r.type === "in").length,
    [attendance],
  );
  const pulangCount = useMemo(
    () => attendance.filter((r) => r.type === "out").length,
    [attendance],
  );

  const mealVoucherCount = useMemo(
    () => vouchers.filter((v) => v.kind === "meal").length,
    [vouchers],
  );
  const photoVoucherCount = useMemo(
    () => vouchers.filter((v) => v.kind === "photobooth").length,
    [vouchers],
  );

  // Filter instan 0ms untuk Log Kehadiran (Masuk vs Pulang)
  const filteredAttendance = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return attendance.filter((r) => {
      if (attendanceFilter !== "all" && r.type !== attendanceFilter) return false;
      if (q) {
        const hay = `${r.guestName} ${r.category || ""} ${r.type === "in" ? "masuk" : "pulang"}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [attendance, attendanceFilter, searchQuery]);

  // Filter instan 0ms untuk Log Scanner Voucher (Makan vs Photobooth)
  const filteredVouchers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vouchers.filter((v) => {
      if (voucherFilter !== "all" && v.kind !== voucherFilter) return false;
      if (q) {
        const hay = `${v.guestName} ${v.category || ""} ${v.voucherCode} ${v.allergies || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [vouchers, voucherFilter, searchQuery]);

  // Filter instan 0ms untuk Log Audit Panitia
  const filteredAudits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return audits;
    return audits.filter((a) => {
      const hay = `${a.guestName || ""} ${a.action} ${JSON.stringify(a.meta || {})}`.toLowerCase();
      return hay.includes(q);
    });
  }, [audits, searchQuery]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header Real-Time */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-ink sm:text-2xl">
              Log Real-Time Kehadiran, Voucher & Panitia
            </h1>
            <Badge tone={isLive ? "success" : "brand"} icon={Radio}>
              {isLive ? "LIVE REAL-TIME" : "AUTO-SYNC"}
            </Badge>
          </div>
          <p className="text-xs font-semibold text-ink-muted">
            Otomatis menyegarkan tanpa perlu di-refresh
            {updatedAtWib ? ` · Sinkron terakhir: ${updatedAtWib}` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchLogs(false)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-bold text-ink hover:bg-surface-soft"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Segarkan
        </button>
      </div>

      {/* Pemilih Tab Utama & Kotak Pencarian Cepat 0ms */}
      <Card className="flex flex-col gap-3.5 rounded-2xl p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setTab("attendance")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition sm:text-sm ${
                tab === "attendance"
                  ? "bg-brand-blue text-white shadow-xs"
                  : "bg-surface-soft text-ink hover:bg-line/50"
              }`}
            >
              <Users className="size-4" />
              <span>Log Absensi Gerbang ({attendance.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("voucher")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition sm:text-sm ${
                tab === "voucher"
                  ? "bg-gradient-brand text-white shadow-xs"
                  : "bg-surface-soft text-ink hover:bg-line/50"
              }`}
            >
              <ScanLine className="size-4" />
              <span>Log Scanner Makan & Photobooth ({vouchers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setTab("audit")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-black transition sm:text-sm ${
                tab === "audit"
                  ? "bg-ink text-white shadow-xs"
                  : "bg-surface-soft text-ink hover:bg-line/50"
              }`}
            >
              <ShieldCheck className="size-4" />
              <span>Log Panitia ({audits.length})</span>
            </button>
          </div>

          <div className="relative min-w-56 flex-1 sm:max-w-xs">
            <Input
              placeholder="Cari nama, divisi, atau kode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-xl pr-8 text-xs font-semibold"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-2 my-auto flex size-5 items-center justify-center rounded-full text-ink-muted hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <Search className="pointer-events-none absolute inset-y-0 right-2.5 my-auto size-3.5 text-ink-muted" />
            )}
          </div>
        </div>

        {/* Sub-Filter Khusus Tab 1: Pembeda Tegas MASUK vs PULANG */}
        {tab === "attendance" ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">
              Filter Arah Gerbang:
            </span>
            <button
              type="button"
              onClick={() => setAttendanceFilter("all")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition ${
                attendanceFilter === "all"
                  ? "bg-ink text-white"
                  : "border border-line bg-white text-ink hover:bg-surface-soft"
              }`}
            >
              Semua ({attendance.length})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceFilter("in")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition ${
                attendanceFilter === "in"
                  ? "bg-success text-white shadow-xs ring-2 ring-success/25"
                  : "border border-success/35 bg-success/10 text-success hover:bg-success/15"
              }`}
            >
              <LogIn className="size-3.5" />
              Hanya MASUK ({masukCount})
            </button>
            <button
              type="button"
              onClick={() => setAttendanceFilter("out")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition ${
                attendanceFilter === "out"
                  ? "bg-brand-purple text-white shadow-xs ring-2 ring-brand-purple/25"
                  : "border border-brand-purple/35 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/15"
              }`}
            >
              <LogOut className="size-3.5" />
              Hanya PULANG ({pulangCount})
            </button>
          </div>
        ) : null}

        {/* Sub-Filter Khusus Tab 2: Pemisah Tegas Scanner MAKAN vs Scanner PHOTOBOOTH untuk masing-masing PIC */}
        {tab === "voucher" ? (
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">
              Filter Penanggung Jawab (PIC):
            </span>
            <button
              type="button"
              onClick={() => setVoucherFilter("meal")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black transition ${
                voucherFilter === "meal"
                  ? "bg-brand-orange text-white shadow-xs ring-2 ring-brand-orange/30"
                  : "border border-brand-orange/35 bg-brand-orange/10 text-brand-orange hover:bg-brand-orange/15"
              }`}
            >
              <Utensils className="size-3.5" />
              Scanner MAKAN / Konsumsi ({mealVoucherCount})
            </button>
            <button
              type="button"
              onClick={() => setVoucherFilter("photobooth")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black transition ${
                voucherFilter === "photobooth"
                  ? "bg-brand-purple text-white shadow-xs ring-2 ring-brand-purple/30"
                  : "border border-brand-purple/35 bg-brand-purple/10 text-brand-purple hover:bg-brand-purple/15"
              }`}
            >
              <Camera className="size-3.5" />
              Scanner PHOTOBOOTH ({photoVoucherCount})
            </button>
            <button
              type="button"
              onClick={() => setVoucherFilter("all")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition ${
                voucherFilter === "all"
                  ? "bg-ink text-white"
                  : "border border-line bg-white text-ink hover:bg-surface-soft"
              }`}
            >
              Semua Voucher ({vouchers.length})
            </button>
          </div>
        ) : null}
      </Card>

      {/* KONTEN TAB 1: Log Kehadiran (Label MASUK vs PULANG dibedakan secara tegas) */}
      {tab === "attendance" ? (
        <Card className="overflow-x-auto rounded-2xl p-0 shadow-sm">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-soft text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">
                <th className="px-4 py-3">Status Gerbang</th>
                <th className="px-4 py-3">Waktu (WIB)</th>
                <th className="px-4 py-3">Nama Tamu / Panitia</th>
                <th className="px-4 py-3">Divisi / Kategori</th>
                <th className="px-4 py-3">Metode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs font-semibold text-ink-muted">
                    Belum ada riwayat absensi untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((row, idx) => {
                  const isMasuk = row.type === "in";
                  const isNewest = idx === 0;
                  return (
                    <tr
                      key={row.id}
                      className={`border-l-4 transition ${
                        isMasuk
                          ? "border-l-success bg-success/[0.02] hover:bg-success/[0.06]"
                          : "border-l-brand-purple bg-brand-purple/[0.03] hover:bg-brand-purple/[0.07]"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-2xs ${
                            isMasuk ? "bg-success" : "bg-brand-purple"
                          }`}
                        >
                          {isMasuk ? (
                            <>
                              <LogIn className="size-3.5" />
                              MASUK
                            </>
                          ) : (
                            <>
                              <LogOut className="size-3.5" />
                              PULANG
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums text-ink">
                        <div className="flex items-center gap-1.5">
                          <span>{row.scannedAtWib}</span>
                          {isNewest ? (
                            <span className="rounded-full bg-brand-blue px-2 py-0.5 text-[10px] font-black uppercase text-white">
                              Terbaru
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-black text-ink">{row.guestName}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-ink-muted">
                        {row.category || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                            row.source === "manual"
                              ? "bg-brand-blue/10 text-brand-blue"
                              : "bg-surface-soft text-ink-muted"
                          }`}
                        >
                          {row.source === "manual" ? "Input Panitia" : "Scan QR Gerbang"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Card>
      ) : null}

      {/* KONTEN TAB 2: Log Scanner Voucher (Terpisah antara Makan vs Photobooth agar memudahkan masing-masing PIC) */}
      {tab === "voucher" ? (
        <Card className="overflow-x-auto rounded-2xl p-0 shadow-sm">
          <table className="w-full min-w-[660px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-soft text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">
                <th className="px-4 py-3">Jenis Booth</th>
                <th className="px-4 py-3">Waktu Scan (WIB)</th>
                <th className="px-4 py-3">Nama & Kode Barcode</th>
                <th className="px-4 py-3">Divisi / Kategori</th>
                <th className="px-4 py-3">Catatan Alergi (Konsumsi)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs font-semibold text-ink-muted">
                    {voucherFilter === "meal"
                      ? "Belum ada tamu yang scan Voucher Makan."
                      : voucherFilter === "photobooth"
                        ? "Belum ada tamu yang scan Voucher Photobooth."
                        : "Belum ada riwayat scan voucher."}
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((row, idx) => {
                  const isMeal = row.kind === "meal";
                  const isNewest = idx === 0;
                  return (
                    <tr
                      key={row.id}
                      className={`border-l-4 transition ${
                        isMeal
                          ? "border-l-brand-orange bg-brand-orange/[0.02] hover:bg-brand-orange/[0.06]"
                          : "border-l-brand-purple bg-brand-purple/[0.02] hover:bg-brand-purple/[0.06]"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-2xs ${
                            isMeal ? "bg-brand-orange" : "bg-brand-purple"
                          }`}
                        >
                          {isMeal ? (
                            <>
                              <Utensils className="size-3.5" />
                              MAKAN
                            </>
                          ) : (
                            <>
                              <Camera className="size-3.5" />
                              PHOTOBOOTH
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums text-ink">
                        <div className="flex items-center gap-1.5">
                          <span>{row.redeemedAtWib}</span>
                          {isNewest ? (
                            <span className="rounded-full bg-success px-2 py-0.5 text-[10px] font-black uppercase text-white">
                              Terbaru
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-black text-ink">{row.guestName}</span>
                          <span className="font-mono text-[11px] font-bold text-brand-purple">
                            {row.voucherCode}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-ink-muted">
                        {row.category || "-"}
                      </td>
                      <td className="px-4 py-3">
                        {row.allergies ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-extrabold text-warning">
                            <AlertTriangle className="size-3.5 shrink-0" />
                            {row.allergies}
                          </span>
                        ) : (
                          <span className="text-xs text-ink-muted">Tidak ada alergi</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Card>
      ) : null}

      {/* KONTEN TAB 3: Log Audit Panitia (Otomatis Menyegarkan & Label Jelas) */}
      {tab === "audit" ? (
        <Card className="overflow-x-auto rounded-2xl p-0 shadow-sm">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-soft text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">
                <th className="px-4 py-3">Waktu (WIB)</th>
                <th className="px-4 py-3">Label Tindakan</th>
                <th className="px-4 py-3">Tamu / Panitia Terkait</th>
                <th className="px-4 py-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredAudits.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-xs font-semibold text-ink-muted">
                    Belum ada catatan log audit panitia.
                  </td>
                </tr>
              ) : (
                filteredAudits.map((row, idx) => {
                  const badge = formatAuditAction(row.action, row.meta);
                  const isNewest = idx === 0;
                  return (
                    <tr key={row.id} className="hover:bg-surface-soft/60">
                      <td className="px-4 py-3 font-bold tabular-nums text-ink">
                        <div className="flex items-center gap-1.5">
                          <span>{row.createdAtWib}</span>
                          {isNewest ? (
                            <span className="rounded-full bg-brand-blue px-2 py-0.5 text-[10px] font-black uppercase text-white">
                              Terbaru
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-xl px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${badge.tone}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-black text-ink">
                        {row.guestName || (typeof row.meta?.guest_name === "string" ? row.meta.guest_name : "-")}
                      </td>
                      <td className="max-w-sm truncate px-4 py-3 text-xs font-semibold text-ink-muted">
                        {summarizeAuditMeta(row.meta)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </Card>
      ) : null}
    </div>
  );
}
