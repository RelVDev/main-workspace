// P10.1–P10.4 / P17: Data ringkasan dashboard panitia, metrik HTM belum lunas & Hold,
// metrik voucher Makan & Photobooth, aktivitas terbaru, dan grafik interval 15 menit.
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

  // 1. Metrik dari daftar tamu yang telah diperkaya (HTM, Hold, Voucher)
  const rows = await fetchEnrichedGuests(db);
  const total = rows.length;
  let checkedIn = 0;
  let checkedOut = 0;
  let inside = 0;
  let onHoldCount = 0;
  let unpaidCount = 0;
  let mealRedeemedCount = 0;
  let photoboothRedeemedCount = 0;

  for (const r of rows) {
    if (r.status === "di_dalam") {
      checkedIn++;
      inside++;
    } else if (r.status === "sudah_pulang") {
      checkedIn++;
      checkedOut++;
    } else if (r.status === "ditahan") {
      onHoldCount++;
    }

    if (r.payment_status === "belum_lunas") {
      unpaidCount++;
    }
    if (r.meal_redeemed_at) {
      mealRedeemedCount++;
    }
    if (r.photobooth_redeemed_at) {
      photoboothRedeemedCount++;
    }
  }

  const notYet = Math.max(0, total - checkedIn);
  const percentCheckedIn = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

  // Daftar Kating / Tamu yang belum lunas HTM (prioritaskan yang sedang tertahan/Hold di gerbang paling atas)
  const unpaidGuests = rows
    .filter((r) => r.payment_status === "belum_lunas")
    .sort((a, b) => {
      if (a.status === "ditahan" && b.status !== "ditahan") return -1;
      if (a.status !== "ditahan" && b.status === "ditahan") return 1;
      return a.full_name.localeCompare(b.full_name);
    })
    .map((r) => ({
      id: r.guest_id,
      name: r.full_name,
      category: r.category,
      status: r.status,
      paymentStatus: r.payment_status,
      holdAt: r.hold_at,
      holdAtWib: r.hold_at ? formatWib(r.hold_at) : null,
      voucherCode: r.voucher_code,
    }));

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
      const key =
        bucket.slice(0, 3) +
        (Math.floor(Number(bucket.slice(3)) / 15) * 15).toString().padStart(2, "0");
      if (!intervalMap[key]) intervalMap[key] = { time: key, masuk: 0, pulang: 0 };
      intervalMap[key].masuk++;
    }
    if (r.checked_out_at) {
      const bucket = formatWib(r.checked_out_at, "HH:mm");
      const key =
        bucket.slice(0, 3) +
        (Math.floor(Number(bucket.slice(3)) / 15) * 15).toString().padStart(2, "0");
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
      onHoldCount,
      unpaidCount,
      paidCount: Math.max(0, total - unpaidCount),
      mealRedeemedCount,
      photoboothRedeemedCount,
    },
    unpaidGuests,
    activities,
    chartData,
    settings: {
      checkinOpen,
      checkoutOpen,
    },
    updatedAtWib: formatWib(new Date(), "HH:mm:ss 'WIB'"),
  });
}
