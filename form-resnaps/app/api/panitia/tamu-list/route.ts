// P10.5: Daftar tamu dari view guest_status dengan pencarian, filter status & kategori, serta pagination.
import { NextRequest } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatWib } from "@/lib/time";
import { fail, ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);
  if (!auth) return fail("session_invalid");

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() || "";
  const statusFilter = searchParams.get("status")?.trim() || "";
  const categoryFilter = searchParams.get("category")?.trim() || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit") || "50")));
  const offset = (page - 1) * limit;

  const db = createAdminClient();

  let query = db
    .from("guest_status")
    .select("guest_id, full_name, category, status, checked_in_at, checked_out_at", {
      count: "exact",
    });

  if (q) {
    query = query.ilike("full_name", `%${q}%`);
  }
  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }
  if (categoryFilter) {
    query = query.eq("category", categoryFilter);
  }

  const { data, count, error } = await query
    .order("full_name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) return fail("internal");

  const guests = (data || []).map((g) => ({
    id: g.guest_id,
    name: g.full_name,
    category: g.category,
    status: g.status,
    checkedInAt: g.checked_in_at,
    checkedInAtWib: g.checked_in_at ? formatWib(g.checked_in_at) : "-",
    checkedOutAt: g.checked_out_at,
    checkedOutAtWib: g.checked_out_at ? formatWib(g.checked_out_at) : "-",
  }));

  // Ambil daftar seluruh kategori unik untuk dropdown filter
  const { data: catData } = await db.from("guests").select("category");
  const categories = Array.from(
    new Set((catData || []).map((c) => c.category).filter(Boolean))
  ).sort();

  return ok({
    guests,
    total: count || 0,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
    categories,
  });
}
