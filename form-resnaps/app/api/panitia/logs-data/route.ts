// P11.6: Riwayat absensi & audit logs untuk halaman /panitia/log (diparalelkan dengan Promise.all).
import { NextRequest } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatWib } from "@/lib/time";
import { fail, ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);
  if (!auth) return fail("session_invalid");

  const db = createAdminClient();

  // Ambil 50 log kehadiran & 50 log audit secara paralel
  const [{ data: attendanceLogs }, { data: auditLogs }] = await Promise.all([
    db
      .from("attendance_logs")
      .select("id, type, source, scanned_at, guest_id, guests(full_name, category)")
      .order("scanned_at", { ascending: false })
      .limit(50),
    db
      .from("audit_logs")
      .select("id, actor, action, meta, created_at, target_guest, guests(full_name)")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  type AttendanceRow = {
    id: string;
    type: "in" | "out";
    source: "qr" | "manual";
    scanned_at: string;
    guests: { full_name: string; category: string | null } | null;
  };

  const attendance = ((attendanceLogs as unknown as AttendanceRow[]) || []).map((l) => ({
    id: l.id,
    type: l.type,
    source: l.source,
    guestName: l.guests?.full_name || "Tamu",
    category: l.guests?.category || null,
    scannedAt: l.scanned_at,
    scannedAtWib: formatWib(l.scanned_at),
  }));

  type AuditRow = {
    id: string;
    action: string;
    meta: unknown;
    created_at: string;
    guests: { full_name: string } | null;
  };

  const audits = ((auditLogs as unknown as AuditRow[]) || []).map((a) => ({
    id: a.id,
    action: a.action,
    meta: a.meta,
    guestName: a.guests?.full_name || null,
    createdAt: a.created_at,
    createdAtWib: formatWib(a.created_at),
  }));

  return ok({ attendance, audits });
}
