// P05.8: simpan absen sesuai mode sesi. Sesi dikonsumsi di RPC (atomik), bukan di sini.
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupSession } from "@/lib/scan-session";
import { clearSessionCookie } from "@/lib/session";
import { guestId } from "@/lib/validation/schemas";
import { fail, ok } from "@/lib/api";
import { allow, ipKey, LIMITS } from "@/lib/rate-limit";


export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = guestId.safeParse(body);
  if (!parsed.success) return fail("invalid_input");

  if (!(await allow(ipKey(req), LIMITS.ipPerMinute))) return fail("rate_limited");

  const s = await lookupSession();
  if (!s.ok) return fail(s.code);
  if (!(await allow(`s:${s.session.id}`, LIMITS.submitPerSession))) return fail("rate_limited");

  const db = createAdminClient();
  const ua = req.headers.get("user-agent")?.slice(0, 300) ?? "";
  const fn = s.session.mode === "in" ? "check_in" : "check_out";
  const { data, error } = await db.rpc(fn, {
    p_session_id: s.session.id,
    p_guest_id: parsed.data.guest_id,
    p_ua: ua,
  });
  if (error || !data) return fail("internal");

  const payload = data as { code: string; scanned_at?: string };
  if (payload.code !== "ok") return fail(payload.code);

  // Sukses: sesi sudah dikonsumsi di DB; hapus cookie agar tidak dipakai ulang.
  await clearSessionCookie();
  return ok({ mode: s.session.mode, scannedAt: payload.scanned_at });
}
