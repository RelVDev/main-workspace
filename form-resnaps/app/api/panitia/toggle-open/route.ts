// P07.6 / P11.3: Buka/Tutup absen masuk atau pulang per mode (panitia only).
import { NextRequest } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import { fail, ok } from "@/lib/api";

export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);
  if (!auth) {
    return fail("session_invalid");
  }

  const body = await req.json().catch(() => null);
  const mode = body?.mode;
  const open = Boolean(body?.open);

  if (mode !== "in" && mode !== "out") {
    return fail("invalid_input");
  }

  const db = createAdminClient();
  const settingKey = mode === "in" ? "checkin_open" : "checkout_open";

  const { error: updateErr } = await db
    .from("event_settings")
    .update({ value: (open ? true : false) as unknown as NonNullable<Json>, updated_at: new Date().toISOString() })
    .eq("key", settingKey);

  if (updateErr) {
    return fail("internal");
  }

  // Catat ke audit_logs (P11.3)
  await db.from("audit_logs").insert({
    actor: auth.userId,
    action: "toggle_open",
    meta: { mode, open, updated_by: auth.email },
  });

  return ok({ mode, open });
}
