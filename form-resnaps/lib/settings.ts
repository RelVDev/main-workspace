// Pembacaan pengaturan QR dari event_settings (server only). Dipakai route handler P05.
import "server-only";
import { createAdminClient } from "./supabase/admin";
import type { TokenConfig } from "./qr-token";

export async function loadQrConfig(): Promise<{ ok: true; value: TokenConfig } | { ok: false }> {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret || secret.length < 32) return { ok: false };

  const db = createAdminClient();
  const { data, error } = await db
    .from("event_settings")
    .select("key, value")
    .in("key", ["qr_key_version", "qr_window_seconds", "qr_grace_windows"]);
  if (error || !data) return { ok: false };

  const map = new Map(data.map((r) => [r.key, r.value]));
  const num = (k: string, d: number) => {
    const v = Number(map.get(k));
    return Number.isFinite(v) && v > 0 ? v : d;
  };
  return {
    ok: true,
    value: {
      secret,
      keyVersion: num("qr_key_version", 1),
      windowSeconds: num("qr_window_seconds", 30),
      graceWindows: num("qr_grace_windows", 1),
    },
  };
}

/** Membaca satu nilai event_settings (jsonb). Mengembalikan null bila tidak ada. */
export async function setting(
  db: ReturnType<typeof createAdminClient>,
  key: string,
): Promise<unknown> {
  const { data } = await db.from("event_settings").select("value").eq("key", key).maybeSingle();
  return data?.value ?? null;
}
