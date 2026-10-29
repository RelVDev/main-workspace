// P11.1: Absensi manual oleh panitia via RPC atomic manual_attendance.
import { NextRequest } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateGuestsCache } from "@/lib/guest-extras";
import { fail, ok } from "@/lib/api";

export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);
  if (!auth) return fail("session_invalid");

  const body = await req.json().catch(() => null);
  const guestId = body?.guest_id;
  const type = body?.type;

  if (!guestId || (type !== "in" && type !== "out")) {
    return fail("invalid_input");
  }

  const db = createAdminClient();
  const { data, error } = await db.rpc("manual_attendance", {
    p_guest_id: guestId,
    p_type: type,
    p_actor: auth.userId,
  });

  if (error || !data) return fail("internal");

  const payload = data as { code: string; scanned_at?: string };
  if (payload.code !== "ok") {
    return fail(payload.code);
  }

  invalidateGuestsCache();
  return ok({ type, scannedAt: payload.scanned_at });
}
