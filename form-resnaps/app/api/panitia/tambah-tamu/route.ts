// P11.5: Tambah tamu on-the-spot (khusus Admin).
import { NextRequest } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeNameJs } from "@/lib/normalize";
import { fail, ok } from "@/lib/api";

export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);

  // Hanya admin yang diizinkan menambah tamu on-the-spot (P11.5)
  if (!auth || auth.role !== "admin") {
    return fail("session_invalid");
  }

  const body = await req.json().catch(() => null);
  const fullName = body?.full_name?.trim();
  const category = body?.category?.trim() || null;
  const contact = body?.contact?.trim() || null;

  if (!fullName || fullName.length > 120) {
    return fail("invalid_input");
  }

  const nameSearch = normalizeNameJs(fullName);
  const db = createAdminClient();

  const { data: newGuest, error: insertErr } = await db
    .from("guests")
    .insert({
      full_name: fullName,
      name_search: nameSearch,
      category,
      contact,
      import_batch: "on-the-spot",
    })
    .select("id, full_name, category")
    .single();

  if (insertErr || !newGuest) {
    return fail("internal");
  }

  // Catat ke audit_logs (P11.5)
  await db.from("audit_logs").insert({
    actor: auth.userId,
    action: "add_guest_onthespot",
    target_guest: newGuest.id,
    meta: { full_name: fullName, category, created_by: auth.email },
  });

  return ok({ guest: newGuest });
}
