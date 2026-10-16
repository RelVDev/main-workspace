// P11.7: Mengubah pengaturan rotasi QR, grace, dan session TTL (khusus Admin).
import { NextRequest } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import { fail, ok } from "@/lib/api";

export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);

  if (!auth || auth.role !== "admin") {
    return fail("session_invalid");
  }

  const body = await req.json().catch(() => null);
  const windowSec = Number(body?.qr_window_seconds);
  const graceWindows = Number(body?.qr_grace_windows);
  const ttlSec = Number(body?.session_ttl_seconds);
  const verificationMode = Boolean(body?.verification_mode);

  if (
    !Number.isFinite(windowSec) ||
    windowSec < 15 ||
    windowSec > 60 ||
    !Number.isFinite(graceWindows) ||
    graceWindows < 0 ||
    graceWindows > 3 ||
    !Number.isFinite(ttlSec) ||
    ttlSec < 300 ||
    ttlSec > 1800
  ) {
    return fail("invalid_input");
  }

  const db = createAdminClient();
  const updates = [
    { key: "qr_window_seconds", value: windowSec as unknown as Json },
    { key: "qr_grace_windows", value: graceWindows as unknown as Json },
    { key: "session_ttl_seconds", value: ttlSec as unknown as Json },
    { key: "verification_mode", value: verificationMode as unknown as Json },
  ];

  for (const u of updates) {
    await db
      .from("event_settings")
      .update({ value: u.value as NonNullable<Json>, updated_at: new Date().toISOString() })
      .eq("key", u.key);
  }

  await db.from("audit_logs").insert({
    actor: auth.userId,
    action: "change_qr_settings",
    meta: {
      qr_window_seconds: windowSec,
      qr_grace_windows: graceWindows,
      session_ttl_seconds: ttlSec,
      verification_mode: verificationMode,
    },
  });

  return ok({
    qr_window_seconds: windowSec,
    qr_grace_windows: graceWindows,
    session_ttl_seconds: ttlSec,
    verification_mode: verificationMode,
  });
}
