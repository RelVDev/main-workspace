// P11.6: Riwayat absensi (Masuk/Pulang), riwayat scanner voucher (Makan/Photobooth),
// & audit logs panitia secara real-time untuk halaman /panitia/log.
import { NextRequest } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchEnrichedGuests } from "@/lib/guest-extras";
import { formatWib } from "@/lib/time";
import { fail, ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);
  if (!auth) return fail("session_invalid");

  const db = createAdminClient();

  // Ambil 100 log kehadiran, 80 log audit, & data voucher tamu secara paralel
  const [{ data: attendanceLogs }, { data: auditLogs }, enrichedGuests] = await Promise.all([
    db
      .from("attendance_logs")
      .select("id, type, source, scanned_at, guest_id, guests(full_name, category)")
      .order("scanned_at", { ascending: false })
      .limit(100),
    db
      .from("audit_logs")
      .select("id, actor, action, meta, created_at, target_guest, guests(full_name)")
      .order("created_at", { ascending: false })
      .limit(80),
    fetchEnrichedGuests(db),
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

  const vouchers: VoucherLogRow[] = [];
  for (const g of enrichedGuests) {
    if (g.meal_redeemed_at) {
      vouchers.push({
        id: `${g.guest_id}_meal`,
        guestId: g.guest_id,
        guestName: g.full_name,
        category: g.category,
        allergies: g.allergies,
        voucherCode: g.voucher_code,
        kind: "meal",
        redeemedAt: g.meal_redeemed_at,
        redeemedAtWib: formatWib(g.meal_redeemed_at),
      });
    }
    if (g.photobooth_redeemed_at) {
      vouchers.push({
        id: `${g.guest_id}_photobooth`,
        guestId: g.guest_id,
        guestName: g.full_name,
        category: g.category,
        allergies: g.allergies,
        voucherCode: g.voucher_code,
        kind: "photobooth",
        redeemedAt: g.photobooth_redeemed_at,
        redeemedAtWib: formatWib(g.photobooth_redeemed_at),
      });
    }
  }

  vouchers.sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());

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

  return ok({
    attendance,
    vouchers,
    audits,
    updatedAtWib: formatWib(new Date().toISOString()),
  });
}
