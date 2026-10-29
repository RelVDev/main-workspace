// Endpoint publik bagi browser tamu untuk menyinkronkan status Hold HTM, Tiket Digital,
// status hak Tiket Makan (mealEligible), serta pemakaian Voucher Makan & Photobooth secara real-time.
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findEnrichedGuest, isDeviceLockEnabled } from "@/lib/guest-extras";
import { clearDeviceGuestCookie } from "@/lib/session";
import { formatWib } from "@/lib/time";
import { fail, ok } from "@/lib/api";
import { allow, ipKey, LIMITS } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  if (!(await allow(ipKey(req), LIMITS.ipPerMinute))) return fail("rate_limited");

  const guestIdParam = req.nextUrl.searchParams.get("guest_id")?.trim() ?? "";
  const voucherParam = req.nextUrl.searchParams.get("code")?.trim() ?? "";
  const lookupKey = guestIdParam || voucherParam;

  if (!lookupKey || lookupKey.length < 4) {
    return fail("invalid_input");
  }

  const db = createAdminClient();
  const [guest, deviceLockEnabled] = await Promise.all([
    findEnrichedGuest(db, lookupKey),
    isDeviceLockEnabled(db),
  ]);
  if (!guest) {
    return fail("not_found");
  }

  // Jika Admin telah membatalkan / me-reset absensi tamu ini kembali ke 'belum_hadir',
  // buka juga kunci cookie perangkat secara otomatis agar tamu dapat memilih nama yang benar.
  if (guest.status === "belum_hadir") {
    await clearDeviceGuestCookie();
  }

  return ok({
    deviceLockEnabled,
    ticket: {
      guestId: guest.guest_id,
      guestName: guest.full_name,
      category: guest.category,
      allergies: guest.allergies,
      status: guest.status, // "belum_hadir" | "ditahan" | "di_dalam" | "sudah_pulang"
      paymentStatus: guest.payment_status, // "lunas" | "belum_lunas"
      isOts: guest.is_ots,
      mealEligible: guest.meal_eligible,
      holdAt: guest.hold_at,
      holdAtWib: guest.hold_at ? formatWib(guest.hold_at) : null,
      checkedInAt: guest.checked_in_at,
      checkedInAtWib: guest.checked_in_at ? formatWib(guest.checked_in_at) : null,
      checkedOutAt: guest.checked_out_at,
      checkedOutAtWib: guest.checked_out_at ? formatWib(guest.checked_out_at) : null,
      voucherCode: guest.voucher_code,
      mealRedeemedAt: guest.meal_redeemed_at,
      mealRedeemedAtWib: guest.meal_redeemed_at ? formatWib(guest.meal_redeemed_at) : null,
      photoboothRedeemedAt: guest.photobooth_redeemed_at,
      photoboothRedeemedAtWib: guest.photobooth_redeemed_at
        ? formatWib(guest.photobooth_redeemed_at)
        : null,
      deviceResetAt: guest.device_reset_at,
    },
  });
}
