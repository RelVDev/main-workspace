// API pemantauan aktivitas langsung (Live Scan & Check-in Feed) untuk Layar QR & Dashboard.
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

  // 1. Ambil 5 absensi terbaru (sukses check-in / check-out)
  const { data: recentAtts } = await db
    .from("attendance_logs")
    .select("id, type, source, scanned_at, guest_id, guests(full_name, category)")
    .order("scanned_at", { ascending: false })
    .limit(5);

  type AttRecord = {
    id: string;
    type: "in" | "out";
    source: "qr" | "manual";
    scanned_at: string;
    guests: { full_name: string; category: string | null } | null;
  };

  const latestAttendance = ((recentAtts as unknown as AttRecord[]) || []).map((a) => {
    const elapsedSec = Math.max(0, Math.floor((Date.now() - new Date(a.scanned_at).getTime()) / 1000));
    return {
      id: a.id,
      type: a.type,
      source: a.source,
      guestName: a.guests?.full_name || "Tamu",
      category: a.guests?.category || null,
      scannedAt: a.scanned_at,
      scannedAtWib: formatWib(a.scanned_at),
      elapsedSec,
      isVeryRecent: elapsedSec < 15, // Dalam 15 detik terakhir
    };
  });

  // 2. Hitung jumlah sesi scan yang baru dibuat dalam 30 detik terakhir (tamu yang sedang scan / memilih nama)
  const thirtySecAgo = new Date(Date.now() - 30_000).toISOString();
  const { count: activeScansCount } = await db
    .from("scan_sessions")
    .select("id", { count: "exact", head: true })
    .gte("issued_at", thirtySecAgo);

  // Ambil sesi scan terbaru
  const { data: latestSession } = await db
    .from("scan_sessions")
    .select("id, mode, issued_at, consumed_at")
    .order("issued_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let latestScanInfo = null;
  if (latestSession) {
    const elapsedSec = Math.max(
      0,
      Math.floor((Date.now() - new Date(latestSession.issued_at).getTime()) / 1000)
    );
    latestScanInfo = {
      id: latestSession.id,
      mode: latestSession.mode,
      elapsedSec,
      isVeryRecent: elapsedSec < 15,
      isConsumed: Boolean(latestSession.consumed_at),
    };
  }

  return ok({
    latestAttendance,
    activeScansCount: activeScansCount || 0,
    latestScanInfo,
    timestamp: Date.now(),
  });
}
