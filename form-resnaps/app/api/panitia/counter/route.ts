// P07.9: Hitungan ringkas kehadiran tamu untuk layar QR dan dashboard.
import { NextRequest } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fail, ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);
  if (!auth) {
    return fail("session_invalid");
  }

  const db = createAdminClient();

  // Ambil data status seluruh tamu dari view guest_status
  const { data, error } = await db
    .from("guest_status")
    .select("status");

  if (error) {
    return fail("internal");
  }

  const rows = data || [];
  const total = rows.length;
  let checkedIn = 0;
  let checkedOut = 0;
  let inside = 0;

  for (const r of rows) {
    if (r.status === "di_dalam") {
      checkedIn++;
      inside++;
    } else if (r.status === "sudah_pulang") {
      checkedIn++;
      checkedOut++;
    }
  }

  return ok({
    total,
    checkedIn,
    checkedOut,
    inside,
    notYet: total - checkedIn,
  });
}
