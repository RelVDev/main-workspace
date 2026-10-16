// P06.1: Server client untuk Supabase menggunakan @supabase/ssr.
import "server-only";
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
            cookieStore.set(name, value, options)
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

/**
 * Memvalidasi sesi user Supabase Auth dan memastikan user terdaftar
 * di tabel `committee_members`.
 */
export async function getCommitteeAuth(): Promise<CommitteeAuth | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) return null;

  // Gunakan admin client untuk membaca role dari committee_members
  const adminDb = createAdminClient();
  const { data: member, error: memberErr } = await adminDb
    .from("committee_members")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberErr || !member) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    role: member.role as "admin" | "committee",
  };
}
