// P05.7: pencarian nama berkecepatan tinggi (menggunakan in-memory cache fetchEnrichedGuests).
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupSession } from "@/lib/scan-session";
import { searchQuery } from "@/lib/validation/schemas";
import { fail, ok } from "@/lib/api";
import { allow, ipKey, LIMITS } from "@/lib/rate-limit";
import { fetchEnrichedGuests } from "@/lib/guest-extras";

export async function GET(req: NextRequest) {
  const parsed = searchQuery.safeParse({ q: req.nextUrl.searchParams.get("q") ?? "" });
  if (!parsed.success) return fail("invalid_input");

  if (!(await allow(ipKey(req), LIMITS.ipPerMinute))) return fail("rate_limited");

  const s = await lookupSession();
  if (!s.ok) return fail(s.code);
  if (!(await allow(`s:${s.session.id}`, LIMITS.searchPerSession))) return fail("rate_limited");

  const db = createAdminClient();
  const allGuests = await fetchEnrichedGuests(db);
  const q = parsed.data.q.trim().toLowerCase();

  const items = allGuests
    .filter((g) => {
      const eligible =
        s.session.mode === "in"
          ? g.status === "belum_hadir" || g.status === "ditahan"
          : g.status === "di_dalam";
      if (!eligible) return false;
      const hay = `${g.full_name} ${g.category || ""}`.toLowerCase();
      return hay.includes(q);
    })
    .slice(0, 8)
    .map((g) => ({
      id: g.guest_id,
      name: g.full_name,
      category: g.category,
    }));

  return ok({ items });
}
