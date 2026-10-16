// P05.9: rate limit utama per sesi (ketat) + per IP (longgar, D15). Server only.
import "server-only";
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { createAdminClient } from "./supabase/admin";

const WINDOW_SECONDS = 60;
export const LIMITS = {
  searchPerSession: 60,
  submitPerSession: 20,
  ipPerMinute: 300,
} as const;

/** Hash IP dengan salt (tidak menyimpan IP mentah). */
export function ipKey(req: NextRequest): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const salt = process.env.SESSION_COOKIE_SECRET ?? "";
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex");
}

/** True bila permintaan masih diizinkan untuk kunci dan batas tersebut. */
export async function allow(key: string, limit: number): Promise<boolean> {
  const db = createAdminClient();
  const { data, error } = await db.rpc("rate_limit_hit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: WINDOW_SECONDS,
  });
  // Fail-closed: bila penghitung tidak bisa dibaca, tolak.
  if (error) return false;
  return data === true;
}
