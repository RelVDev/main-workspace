// P05.7: pencarian nama. Wajib sesi valid & belum dikonsumsi. Mode diambil dari sesi, bukan URL.
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupSession } from "@/lib/scan-session";
import { searchQuery } from "@/lib/validation/schemas";
import { fail, ok } from "@/lib/api";


export async function GET(req: NextRequest) {
  const parsed = searchQuery.safeParse({ q: req.nextUrl.searchParams.get("q") ?? "" });
  if (!parsed.success) return fail("invalid_input");

  const s = await lookupSession();
  if (!s.ok) return fail(s.code);

  const db = createAdminClient();
  const { data, error } = await db.rpc("search_guests", {
    p_query: parsed.data.q,
    p_mode: s.session.mode,
    p_limit: 8,
  });
  if (error) return fail("internal");

  // Hanya field yang diizinkan; tidak pernah mengirim contact/notes.
  const items = (data ?? []).slice(0, 8).map((g) => ({
    id: g.id,
    name: g.full_name,
    category: g.category,
  }));
  return ok({ items });
}
