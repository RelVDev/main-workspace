// P10.1–P10.4: Data ringkasan dashboard panitia, aktivitas terbaru, dan grafik interval 15 menit.
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

  // 1. Metrik dari view guest_status
  const { data: guests, error: guestsErr } = await db
    .from("guest_status")
    .select("status, checked_in_at, checked_out_at");

  if (guestsErr) return fail("internal");

  const rows = guests || [];
  const total = rows.length;
  let checkedIn = 0;
  let checkedOut = 0;
  let inside = 0;

  for (const r of rows) {
    if (r.status === "di_dalam") {
      checkedIn++;
      inside++;
    } else if (r.status === "sudah_pulang") {
      checkedIn++;
      checkedOut++;
    }
  }

  const notYet = total - checkedIn;
  const percentCheckedIn = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  // 2. Aktivitas 20 absensi terbaru (P10.4)
  const { data: recentLogs } = await db
    .from("attendance_logs")
    .select("id, type, source, scanned_at, guest_id, guests(full_name, category)")
    .order("scanned_at", { ascending: false })
    .limit(20);

  type LogRecord = {
    id: string;
    type: "in" | "out";
    source: "qr" | "manual";
    scanned_at: string;
    guests: { full_name: string; category: string | null } | null;
  };

  const activities = ((recentLogs as unknown as LogRecord[]) || []).map((l) => ({
    id: l.id,
    type: l.type,
    source: l.source,
    scannedAt: l.scanned_at,
    scannedAtWib: formatWib(l.scanned_at),
    guestName: l.guests?.full_name || "Tamu",
    category: l.guests?.category || null,
  }));

  // 3. Status buka/tutup absen dari event_settings
  const { data: settings } = await db
    .from("event_settings")
    .select("key, value")
    .in("key", ["checkin_open", "checkout_open"]);

  const settingsMap = new Map((settings || []).map((s) => [s.key, s.value]));
  const checkinOpen = settingsMap.get("checkin_open") === true;
  const checkoutOpen = settingsMap.get("checkout_open") === true;

  // 4. Agregasi grafik per interval 15 menit (P10.3)
  const intervalMap: Record<string, { time: string; masuk: number; pulang: number }> = {};

  for (const r of rows) {
    if (r.checked_in_at) {
      const bucket = formatWib(r.checked_in_at, "HH:mm");
      const key = bucket.slice(0, 3) + (Math.floor(Number(bucket.slice(3)) / 15) * 15).toString().padStart(2, "0");
      if (!intervalMap[key]) intervalMap[key] = { time: key, masuk: 0, pulang: 0 };
      intervalMap[key].masuk++;
    }
    if (r.checked_out_at) {
      const bucket = formatWib(r.checked_out_at, "HH:mm");
      const key = bucket.slice(0, 3) + (Math.floor(Number(bucket.slice(3)) / 15) * 15).toString().padStart(2, "0");
      if (!intervalMap[key]) intervalMap[key] = { time: key, masuk: 0, pulang: 0 };
      intervalMap[key].pulang++;
    }
  }

  const chartData = Object.values(intervalMap).sort((a, b) => a.time.localeCompare(b.time));

  return ok({
    metrics: {
      total,
      checkedIn,
      percentCheckedIn,
      inside,
      checkedOut,
      notYet,
    },
    activities,
    chartData,
    settings: {
      checkinOpen,
      checkoutOpen,
    },
    updatedAtWib: formatWib(new Date(), "HH:mm:ss 'WIB'"),
  });
}
