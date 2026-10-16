// Validasi sesi scan dari cookie. Sumber kebenaran status: tabel scan_sessions (service role).
import "server-only";
import { createAdminClient } from "./supabase/admin";
import { readSessionId } from "./session";
import { loadQrConfig } from "./settings";

export type ActiveSession = {
  id: string;
  mode: "in" | "out";
  expiresAt: string;
};

export type SessionLookup =
  | { ok: true; session: ActiveSession }
  | { ok: false; code: "session_invalid" | "session_expired" | "session_used" };

/**
 * Membaca cookie, lalu memeriksa baris sesi di DB: ada, belum dikonsumsi,
 * belum kedaluwarsa, dan key_version masih sama dengan pengaturan saat ini.
 */
export async function lookupSession(): Promise<SessionLookup> {
  const id = await readSessionId();
  if (!id) return { ok: false, code: "session_invalid" };

  const db = createAdminClient();
  const { data, error } = await db
    .from("scan_sessions")
    .select("id, mode, key_version, expires_at, consumed_at")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return { ok: false, code: "session_invalid" };

  const cfg = await loadQrConfig();
  if (!cfg.ok || data.key_version !== cfg.value.keyVersion) {
    return { ok: false, code: "session_invalid" };
  }
  if (data.consumed_at) return { ok: false, code: "session_used" };
  if (new Date(data.expires_at).getTime() <= Date.now()) {
    return { ok: false, code: "session_expired" };
  }
  return {
    ok: true,
    session: { id: data.id, mode: data.mode, expiresAt: data.expires_at },
  };
}
