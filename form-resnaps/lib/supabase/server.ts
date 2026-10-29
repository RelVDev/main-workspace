// P06.1: Server client untuk Supabase menggunakan @supabase/ssr dengan cache autentikasi panitia 60 detik.
import "server-only";
import { createHash } from "crypto";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";
import { createAdminClient } from "./admin";

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Dipanggil dari Server Component; set cookie diabaikan
        }
      },
    },
  });
}

export type CommitteeAuth = {
  userId: string;
  email: string;
  role: "admin" | "committee";
};

// Cache sesi panitia terverifikasi selama 60 detik agar perpindahan antar menu & API call instan (0ms)
const authCache = new Map<string, { auth: CommitteeAuth; expiresAt: number }>();
const AUTH_CACHE_TTL_MS = 60_000;

/**
 * Memvalidasi sesi user Supabase Auth dan memastikan user terdaftar
 * di tabel `committee_members`. Mendukung sesi cookie dan Bearer token.
 */
export async function getCommitteeAuth(bearerToken?: string): Promise<CommitteeAuth | null> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const sbCookieRaw = allCookies
    .filter((c) => c.name.includes("auth-token"))
    .map((c) => `${c.name}=${c.value}`)
    .join(";");

  const tokenSignature = bearerToken || sbCookieRaw;
  if (!tokenSignature) return null;

  const cacheKey = createHash("sha256").update(tokenSignature).digest("hex");
  const now = Date.now();
  const cached = authCache.get(cacheKey);
  if (cached && cached.expiresAt > now) {
    return cached.auth;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();

  if (authErr || !user) {
    authCache.delete(cacheKey);
    return null;
  }

  const adminDb = createAdminClient();
  const { data: member, error: memberErr } = await adminDb
    .from("committee_members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberErr || !member) {
    authCache.delete(cacheKey);
    return null;
  }

  const authResult: CommitteeAuth = {
    userId: user.id,
    email: user.email ?? "",
    role: member.role as "admin" | "committee",
  };

  authCache.set(cacheKey, { auth: authResult, expiresAt: now + AUTH_CACHE_TTL_MS });
  return authResult;
}
