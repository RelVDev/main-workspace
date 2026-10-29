// P05.5: tukar token QR → sesi scan (set cookie) + preload daftar nama tamu instan (0ms).
import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyToken, type Mode } from "@/lib/qr-token";
import { setSessionCookie } from "@/lib/session";
import { tokenInput } from "@/lib/validation/schemas";
import { fail, ok } from "@/lib/api";
import { loadQrConfig } from "@/lib/settings";
import { allow, ipKey, LIMITS } from "@/lib/rate-limit";
import { fetchEnrichedGuests } from "@/lib/guest-extras";

export async function POST(req: NextRequest) {
  if (!(await allow(ipKey(req), LIMITS.ipPerMinute))) return fail("rate_limited");

  const body = await req.json().catch(() => null);
  const parsed = tokenInput.safeParse(body);
  if (!parsed.success) return fail("invalid_input");

  const cfg = await loadQrConfig();
  if (!cfg.ok) return fail("internal");

  const now = Date.now();
  const result = verifyToken(parsed.data.t, cfg.value, now);
  if (!result.ok) {
    const code =
      result.reason === "expired"
        ? "token_expired"
        : result.reason === "revoked"
          ? "token_revoked"
          : "token_invalid";
    return fail(code);
  }

  const mode: Mode = result.mode;
  const db = createAdminClient();

  // Jalankan pembuatan sesi & pengambilan daftar tamu dari cache secara paralel
  const [rpcRes, allGuests] = await Promise.all([
    db.rpc("start_scan_session", {
      p_mode: mode,
      p_key_version: cfg.value.keyVersion,
      p_ip_hash: ipKey(req),
      p_ua: req.headers.get("user-agent")?.slice(0, 300) ?? "",
    }),
    fetchEnrichedGuests(db),
  ]);

  if (rpcRes.error || !rpcRes.data) return fail("internal");

  const payload = rpcRes.data as { code: string; id?: string; expires_at?: string };
  if (payload.code !== "ok" || !payload.id || !payload.expires_at) {
    return fail(
      payload.code === "closed"
        ? "closed"
        : payload.code === "token_revoked"
          ? "token_revoked"
          : "internal",
    );
  }

  const expiresAt = new Date(payload.expires_at).getTime();
  const maxAge = Math.max(1, Math.floor((expiresAt - now) / 1000));
  await setSessionCookie(payload.id, maxAge);

  const guests = allGuests
    .filter((g) =>
      mode === "in"
        ? g.status === "belum_hadir" || g.status === "ditahan"
        : g.status === "di_dalam",
    )
    .map((g) => ({
      id: g.guest_id,
      name: g.full_name,
      category: g.category,
    }));

  return ok({ mode, expiresAt: payload.expires_at, guests });
}
