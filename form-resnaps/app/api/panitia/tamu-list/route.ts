// P10.5 / P17: Daftar tamu yang diperkaya dengan status HTM (lunas/belum_lunas),
// status Hold (ditahan), serta kode & status Voucher (Makan & Photobooth).
import { NextRequest } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchEnrichedGuests } from "@/lib/guest-extras";
import { formatWib } from "@/lib/time";
import { fail, ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);
  if (!auth) return fail("session_invalid");

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim().toLowerCase() || "";
  const statusFilter = searchParams.get("status")?.trim() || "";
  const categoryFilter = searchParams.get("category")?.trim() || "";
  const paymentFilter = searchParams.get("payment")?.trim() || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(10, Number(searchParams.get("limit") || "50")));
  const offset = (page - 1) * limit;

  const db = createAdminClient();
  const allGuests = await fetchEnrichedGuests(db);

  const categories = Array.from(
    new Set(allGuests.map((c) => c.category).filter((c): c is string => Boolean(c))),
  ).sort();

  const filtered = allGuests.filter((g) => {
    if (q) {
      const matchName = g.full_name.toLowerCase().includes(q);
      const matchVoucher = g.voucher_code.toLowerCase().includes(q);
      const matchAllergy = g.allergies ? g.allergies.toLowerCase().includes(q) : false;
      if (!matchName && !matchVoucher && !matchAllergy) return false;
    }
    if (statusFilter && g.status !== statusFilter) return false;
    if (categoryFilter && g.category !== categoryFilter) return false;
    if (paymentFilter && g.payment_status !== paymentFilter) return false;
    return true;
  });

  // Urutkan tamu yang sedang ditahan (Hold) di paling atas agar segera terlihat panitia
  filtered.sort((a, b) => {
    if (a.status === "ditahan" && b.status !== "ditahan") return -1;
    if (a.status !== "ditahan" && b.status === "ditahan") return 1;
    return a.full_name.localeCompare(b.full_name);
  });

  const total = filtered.length;
  const paged = filtered.slice(offset, offset + limit);

  const guests = paged.map((g) => ({
    id: g.guest_id,
    name: g.full_name,
    category: g.category,
    allergies: g.allergies,
    status: g.status,
    paymentStatus: g.payment_status,
    holdAt: g.hold_at,
    holdAtWib: g.hold_at ? formatWib(g.hold_at) : "-",
    voucherCode: g.voucher_code,
    mealRedeemedAt: g.meal_redeemed_at,
    mealRedeemedAtWib: g.meal_redeemed_at ? formatWib(g.meal_redeemed_at) : "-",
    photoboothRedeemedAt: g.photobooth_redeemed_at,
    photoboothRedeemedAtWib: g.photobooth_redeemed_at ? formatWib(g.photobooth_redeemed_at) : "-",
    checkedInAt: g.checked_in_at,
    checkedInAtWib: g.checked_in_at ? formatWib(g.checked_in_at) : "-",
    checkedOutAt: g.checked_out_at,
    checkedOutAtWib: g.checked_out_at ? formatWib(g.checked_out_at) : "-",
  }));

  return ok({
    guests,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    categories,
  });
}
