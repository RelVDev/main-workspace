// P05.8 / P17: Simpan absen sesuai mode sesi, tahan absen (on_hold) bila HTM belum_lunas,
// serta kembalikan kode voucher & status hak kupon (mealEligible) saat absen sukses.
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupSession } from "@/lib/scan-session";
import { clearSessionCookie, readDeviceGuestId, setDeviceGuestCookie } from "@/lib/session";
import { guestId } from "@/lib/validation/schemas";
import { fail, ok } from "@/lib/api";
import { allow, ipKey, LIMITS } from "@/lib/rate-limit";
import { findEnrichedGuest, isDeviceLockEnabled, updateGuestExtra } from "@/lib/guest-extras";
import { generateVoucherCode } from "@/lib/voucher";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = guestId.safeParse(body);
  if (!parsed.success) return fail("invalid_input");

  if (!(await allow(ipKey(req), LIMITS.ipPerMinute))) return fail("rate_limited");

  const s = await lookupSession();
  if (!s.ok) return fail(s.code);
  if (!(await allow(`s:${s.session.id}`, LIMITS.submitPerSession))) return fail("rate_limited");

  const db = createAdminClient();
  const targetId = parsed.data.guest_id;

  // Keamanan Anti-Titip Absen: 1 Perangkat = 1 Tamu (bila fitur device_lock_enabled aktif)
  const lockEnabled = await isDeviceLockEnabled(db);
  if (lockEnabled) {
    const cookieGuestId = await readDeviceGuestId();
    const clientLockedId = parsed.data.locked_guest_id;
    const boundGuestId = cookieGuestId || clientLockedId || null;

    if (boundGuestId && boundGuestId !== targetId) {
      const boundGuest = await findEnrichedGuest(db, boundGuestId);
      if (boundGuest && boundGuest.status !== "belum_hadir") {
        return fail("device_locked");
      }
    }
  }

  const enriched = await findEnrichedGuest(db, targetId);
  if (!enriched) return fail("not_found");

  const voucherCode = enriched.voucher_code || generateVoucherCode(targetId);

  // Jika mode Masuk dan HTM tamu masih belum_lunas -> tahan absensi (Hold) sampai diizinkan panitia
  if (s.session.mode === "in" && enriched.payment_status === "belum_lunas") {
    const holdAt = enriched.hold_at || new Date().toISOString();
    await updateGuestExtra(db, targetId, {
      paymentStatus: "belum_lunas",
      isOts: enriched.is_ots,
      mealEligible: enriched.meal_eligible,
      holdAt,
      voucherCode,
    });

    await db
      .from("scan_sessions")
      .update({ consumed_at: new Date().toISOString(), guest_id: targetId })
      .eq("id", s.session.id);

    await clearSessionCookie();
    await setDeviceGuestCookie(targetId);
    return ok({
      status: "on_hold",
      mode: "in",
      holdAt,
      voucherCode,
      mealEligible: enriched.meal_eligible,
      guest: {
        id: enriched.guest_id,
        name: enriched.full_name,
        category: enriched.category,
        allergies: enriched.allergies,
        paymentStatus: "belum_lunas",
        mealEligible: enriched.meal_eligible,
      },
    });
  }

  const ua = req.headers.get("user-agent")?.slice(0, 300) ?? "";
  const fn = s.session.mode === "in" ? "check_in" : "check_out";
  const { data, error } = await db.rpc(fn, {
    p_session_id: s.session.id,
    p_guest_id: targetId,
    p_ua: ua,
  });
  if (error || !data) return fail("internal");

  const payload = data as {
    code: string;
    scanned_at?: string;
    hold_at?: string;
    voucher_code?: string;
  };

  if (payload.code === "payment_hold") {
    const holdAt = payload.hold_at || new Date().toISOString();
    await updateGuestExtra(db, targetId, {
      paymentStatus: "belum_lunas",
      isOts: enriched.is_ots,
      mealEligible: enriched.meal_eligible,
      holdAt,
      voucherCode: payload.voucher_code || voucherCode,
    });
    await clearSessionCookie();
    await setDeviceGuestCookie(targetId);
    return ok({
      status: "on_hold",
      mode: "in",
      holdAt,
      voucherCode: payload.voucher_code || voucherCode,
      mealEligible: enriched.meal_eligible,
      guest: {
        id: enriched.guest_id,
        name: enriched.full_name,
        category: enriched.category,
        allergies: enriched.allergies,
        paymentStatus: "belum_lunas",
        mealEligible: enriched.meal_eligible,
      },
    });
  }

  if (payload.code !== "ok") return fail(payload.code);

  await updateGuestExtra(db, targetId, {
    holdAt: null,
    voucherCode: payload.voucher_code || voucherCode,
  });

  // Sukses: sesi sudah dikonsumsi di DB; hapus cookie sesi scan & kunci cookie perangkat ke tamu ini.
  await clearSessionCookie();
  await setDeviceGuestCookie(targetId);
  return ok({
    status: "ok",
    mode: s.session.mode,
    scannedAt: payload.scanned_at,
    voucherCode: payload.voucher_code || voucherCode,
    allergies: enriched.allergies,
    mealEligible: enriched.meal_eligible,
    mealRedeemedAt: enriched.meal_redeemed_at,
    photoboothRedeemedAt: enriched.photobooth_redeemed_at,
    guest: {
      id: enriched.guest_id,
      name: enriched.full_name,
      category: enriched.category,
      allergies: enriched.allergies,
      paymentStatus: enriched.payment_status,
      mealEligible: enriched.meal_eligible,
    },
  });
}
