// Endpoint publik bagi browser tamu untuk menyinkronkan status Hold HTM, Tiket Digital,
// serta status pemakaian Voucher Makan & Photobooth (1x pakai) secara real-time.
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findEnrichedGuest } from "@/lib/guest-extras";
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
  const guest = await findEnrichedGuest(db, lookupKey);
  if (!guest) {
    return fail("not_found");
  }

  return ok({
    ticket: {
      guestId: guest.guest_id,
      guestName: guest.full_name,
      category: guest.category,
      allergies: guest.allergies,
      status: guest.status, // "belum_hadir" | "ditahan" | "di_dalam" | "sudah_pulang"
      paymentStatus: guest.payment_status, // "lunas" | "belum_lunas"
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
    },
  });
}
