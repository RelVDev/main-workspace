// P10.1–P10.4 / P17: Data ringkasan dashboard panitia yang dieksekusi secara paralel (Promise.all),
// lengkap dengan informasi kuota 50 slot Tiket Makan Tamu Angkatan & status OTS.
import { NextRequest } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { computeTamuMealQuota, fetchEnrichedGuests } from "@/lib/guest-extras";
import { formatWib } from "@/lib/time";
import { fail, ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);
  if (!auth) return fail("session_invalid");

  const db = createAdminClient();

  // Eksekusi seluruh pembacaan secara paralel (Promise.all)
  const [rows, recentLogsRes, settingsRes] = await Promise.all([
    fetchEnrichedGuests(db),
    db
      .from("attendance_logs")
      .select("id, type, source, scanned_at, guest_id, guests(full_name, category)")
      .order("scanned_at", { ascending: false })
      .limit(25),
    db
      .from("event_settings")
      .select("key, value")
      .in("key", ["checkin_open", "checkout_open", "device_lock_enabled", "verification_mode"]),
  ]);

  const tamuMealQuota = computeTamuMealQuota(rows);

  const total = rows.length;
  let checkedIn = 0;
  let checkedOut = 0;
  let inside = 0;
  let onHoldCount = 0;
  let unpaidCount = 0;
  let allergyCount = 0;
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
    if (r.allergies && r.allergies.trim().length > 0) {
      allergyCount++;
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
      allergies: r.allergies,
      status: r.status,
      paymentStatus: r.payment_status,
      isOts: r.is_ots,
      mealEligible: r.meal_eligible,
      holdAt: r.hold_at,
      holdAtWib: r.hold_at ? formatWib(r.hold_at) : null,
      voucherCode: r.voucher_code,
    }));

  const allergyGuests = rows
    .filter((r) => Boolean(r.allergies && r.allergies.trim().length > 0))
    .sort((a, b) => a.full_name.localeCompare(b.full_name))
    .map((r) => ({
      id: r.guest_id,
      name: r.full_name,
      category: r.category,
      allergies: r.allergies as string,
      status: r.status,
      voucherCode: r.voucher_code,
      mealRedeemedAt: r.meal_redeemed_at,
      mealRedeemedAtWib: r.meal_redeemed_at ? formatWib(r.meal_redeemed_at) : null,
    }));

  // Daftar ringkas seluruh tamu untuk fitur Pencarian Instan (0ms) langsung di Dashboard
  const quickGuests = rows.map((r) => ({
    id: r.guest_id,
    name: r.full_name,
    category: r.category,
    allergies: r.allergies,
    status: r.status,
    paymentStatus: r.payment_status,
    isOts: r.is_ots,
    mealEligible: r.meal_eligible,
    isTamuRole: r.is_tamu_role,
    voucherCode: r.voucher_code,
  }));

  type LogRecord = {
    id: string;
    type: "in" | "out";
    source: "qr" | "manual";
    scanned_at: string;
    guests: { full_name: string; category: string | null } | null;
  };

  const activities = ((recentLogsRes.data as unknown as LogRecord[]) || []).map((l) => ({
    id: l.id,
    type: l.type,
    source: l.source,
    scannedAt: l.scanned_at,
    scannedAtWib: formatWib(l.scanned_at),
    guestName: l.guests?.full_name || "Tamu",
    category: l.guests?.category || null,
  }));

  const settingsMap = new Map((settingsRes.data || []).map((s) => [s.key, s.value]));
  const checkinOpen = settingsMap.get("checkin_open") === true;
  const checkoutOpen = settingsMap.get("checkout_open") === true;
  const deviceLockEnabled =
    settingsMap.has("device_lock_enabled") ? settingsMap.get("device_lock_enabled") === true : true;
  const verificationMode = settingsMap.get("verification_mode") === true;

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
      allergyCount,
      mealRedeemedCount,
      photoboothRedeemedCount,
    },
    tamuMealQuota,
    unpaidGuests,
    allergyGuests,
    quickGuests,
    activities,
    chartData,
    settings: {
      checkinOpen,
      checkoutOpen,
      deviceLockEnabled,
      verificationMode,
    },
    updatedAtWib: formatWib(new Date(), "HH:mm:ss 'WIB'"),
  });
}
