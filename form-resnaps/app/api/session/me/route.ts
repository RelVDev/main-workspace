// P05.6: status sesi untuk UI (mode, sisa waktu, status absen buka/tutup).
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupSession } from "@/lib/scan-session";
import { setting } from "@/lib/settings";
import { fail, ok } from "@/lib/api";


export async function GET() {
  const s = await lookupSession();
  if (!s.ok) return fail(s.code);

  const db = createAdminClient();
  const key = s.session.mode === "in" ? "checkin_open" : "checkout_open";
  const open = (await setting(db, key)) === true;

  return ok({
    mode: s.session.mode,
    expiresAt: s.session.expiresAt,
    open,
    consumed: false,
  });
}
