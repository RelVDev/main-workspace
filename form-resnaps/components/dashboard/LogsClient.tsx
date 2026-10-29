// P11.6: Tampilan log aktivitas kehadiran dan audit operasional panitia (dengan cache memori klien).
"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type AttendanceLogRow = {
  id: string;
  type: "in" | "out";
  source: "qr" | "manual";
  guestName: string;
  category: string | null;
  scannedAt: string;
  scannedAtWib: string;
};

type AuditLogRow = {
  id: string;
  action: string;
  meta: unknown;
  guestName: string | null;
  createdAt: string;
  createdAtWib: string;
};

let cachedAttendance: AttendanceLogRow[] | null = null;
let cachedAudits: AuditLogRow[] | null = null;

export function LogsClient() {
  const [tab, setTab] = useState<"attendance" | "audit">("attendance");
  const [attendance, setAttendance] = useState<AttendanceLogRow[]>(() => cachedAttendance ?? []);
  const [audits, setAudits] = useState<AuditLogRow[]>(() => cachedAudits ?? []);
  const [isLoading, setIsLoading] = useState(() => cachedAttendance === null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/panitia/logs-data");
      if (res.ok) {
        const d = await res.json();
        if (d.ok) {
          cachedAttendance = d.attendance || [];
          cachedAudits = d.audits || [];
          setAttendance(cachedAttendance!);
          setAudits(cachedAudits!);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const res = await fetch("/api/panitia/logs-data");
        if (res.ok) {
          const d = await res.json();
          if (d.ok && mounted) {
            cachedAttendance = d.attendance || [];
            cachedAudits = d.audits || [];
            setAttendance(cachedAttendance!);
            setAudits(cachedAudits!);
          }
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Log Aktivitas & Audit</h1>
          <p className="text-sm text-ink-muted">
            Riwayat 50 pencatatan absensi dan tindakan operasional panitia terakhir.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void fetchLogs()}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-soft disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Segarkan Log
        </button>
      </div>

      {/* Pemilih Tab */}
      <div className="flex gap-2 border-b border-line pb-2">
        <button
          type="button"
          onClick={() => setTab("attendance")}
          className={`rounded-control px-4 py-2 text-sm font-semibold transition ${
            tab === "attendance"
              ? "bg-brand-blue text-white"
              : "text-ink hover:bg-surface-soft"
          }`}
        >
          Log Absensi ({attendance.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("audit")}
          className={`rounded-control px-4 py-2 text-sm font-semibold transition ${
            tab === "audit"
              ? "bg-brand-blue text-white"
              : "text-ink hover:bg-surface-soft"
          }`}
        >
          Log Audit Panitia ({audits.length})
        </button>
      </div>

      {/* Konten Tab 1: Log Absensi */}
      {tab === "attendance" ? (
        <Card className="overflow-x-auto p-0 shadow-sm">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-soft text-xs font-bold uppercase tracking-wider text-ink-muted">
                <th className="px-4 py-3">Waktu (WIB)</th>
                <th className="px-4 py-3">Nama Tamu</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Metode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-xs text-ink-muted">
                    Belum ada riwayat absensi.
                  </td>
                </tr>
              ) : (
                attendance.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-soft/60">
                    <td className="px-4 py-3 tabular-nums font-semibold text-ink">
                      {row.scannedAtWib}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">{row.guestName}</td>
                    <td className="px-4 py-3 text-xs text-ink-muted">{row.category || "-"}</td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={row.type === "in" ? "brand" : "info"}
                        icon={row.type === "in" ? LogIn : LogOut}
                      >
                        {row.type === "in" ? "Masuk" : "Pulang"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs uppercase tracking-wide text-ink-muted">
                      {row.source === "manual" ? "Manual Panitia" : "Scan QR"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      ) : null}

      {/* Konten Tab 2: Log Audit Panitia */}
      {tab === "audit" ? (
        <Card className="overflow-x-auto p-0 shadow-sm">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-soft text-xs font-bold uppercase tracking-wider text-ink-muted">
                <th className="px-4 py-3">Waktu (WIB)</th>
                <th className="px-4 py-3">Tindakan</th>
                <th className="px-4 py-3">Tamu Terkait</th>
                <th className="px-4 py-3">Rincian Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {audits.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-xs text-ink-muted">
                    Belum ada catatan log audit panitia.
                  </td>
                </tr>
              ) : (
                audits.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-soft/60">
                    <td className="px-4 py-3 tabular-nums font-semibold text-ink">
                      {row.createdAtWib}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-brand-purple">
                      {row.action}
                    </td>
                    <td className="px-4 py-3 font-semibold text-ink">
                      {row.guestName || "-"}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 font-mono text-xs text-ink-muted">
                      {JSON.stringify(row.meta)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      ) : null}
    </div>
  );
}
