// P11.2 / P17: Batalkan absensi (undo_attendance) sekaligus me-recovery / membuka kunci perangkat tamu bila salah absen.
import { NextRequest } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateGuestsCache, updateGuestExtra } from "@/lib/guest-extras";
import { fail, ok } from "@/lib/api";

export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);
  if (!auth) return fail("session_invalid");

  const body = await req.json().catch(() => null);
  const guestId = body?.guest_id;
  const type = body?.type;
  const reason = body?.reason?.trim();

  if (!guestId || (type !== "in" && type !== "out") || !reason) {
    return fail("invalid_input");
  }

  const db = createAdminClient();
  const { data, error } = await db.rpc("undo_attendance", {
    p_guest_id: guestId,
    p_type: type,
    p_actor: auth.userId,
    p_reason: reason,
  });

  if (error || !data) return fail("internal");

  const payload = data as { code: string };
  if (payload.code !== "ok") {
    return fail(payload.code);
  }

  // Bila absen masuk dibatalkan (mis. karena salah pilih nama), buka kunci perangkat tamu & reset hold/voucher
  if (type === "in") {
    await updateGuestExtra(db, guestId, {
      holdAt: null,
      mealRedeemedAt: null,
      mealRedeemedBy: null,
      photoboothRedeemedAt: null,
      photoboothRedeemedBy: null,
      deviceResetAt: new Date().toISOString(),
    });
  } else {
    invalidateGuestsCache();
  }

  return ok({ undone: true, type, guestId, deviceRecovered: type === "in" });
}
