// P05.6: status sesi untuk UI (mode, sisa waktu, status absen buka/tutup, + daftar tamu instan).
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupSession } from "@/lib/scan-session";
import { setting } from "@/lib/settings";
import { fail, ok } from "@/lib/api";
import { fetchEnrichedGuests } from "@/lib/guest-extras";

export async function GET() {
  const s = await lookupSession();
  if (!s.ok) return fail(s.code);

  const db = createAdminClient();
  const key = s.session.mode === "in" ? "checkin_open" : "checkout_open";

  const [openVal, allGuests] = await Promise.all([
    setting(db, key),
    fetchEnrichedGuests(db),
  ]);

  const open = openVal === true;
  const guests = allGuests
    .filter((g) =>
      s.session.mode === "in"
        ? g.status === "belum_hadir" || g.status === "ditahan"
        : g.status === "di_dalam",
    )
    .map((g) => ({
      id: g.guest_id,
      name: g.full_name,
      category: g.category,
    }));

  return ok({
    mode: s.session.mode,
    expiresAt: s.session.expiresAt,
    open,
    consumed: false,
    guests,
  });
}
