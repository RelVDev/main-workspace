// P11.8: Cabut semua sesi dan QR aktif (khusus Admin).
import { NextRequest } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/api";

export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);

  // Hanya admin yang diizinkan mencabut seluruh sesi (P11.8)
  if (!auth || auth.role !== "admin") {
    return fail("session_invalid");
  }

  const db = createAdminClient();
  const { data, error } = await db.rpc("revoke_all_sessions", {
    p_actor: auth.userId,
  });

  if (error || !data) {
    return fail("internal");
  }

  const payload = data as { code: string; key_version?: number };
  if (payload.code !== "ok") {
    return fail(payload.code);
  }

  return ok({
    revoked: true,
    newKeyVersion: payload.key_version,
  });
}
