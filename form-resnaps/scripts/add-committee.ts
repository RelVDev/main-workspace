/**
 * P06.4: Skrip pembuatan / penetapan akun panitia (Admin / Committee).
 *
 * Penggunaan:
 *   npx tsx scripts/add-committee.ts <email> <role: admin|committee> [password]
 *
 * Contoh:
 *   npx tsx scripts/add-committee.ts admin@resnaps.local admin PasswordRahasia123!
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types";

async function main() {
  const [email, role, password] = process.argv.slice(2);

  if (!email || !role || (role !== "admin" && role !== "committee")) {
    console.error("Penggunaan: npx tsx scripts/add-committee.ts <email> <role: admin|committee> [password]");
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diset.");
    process.exit(1);
  }

  const adminClient = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log(`=== RE:SNAPS Manajemen Akun Panitia ===`);
  console.log(`Email : ${email}`);
  console.log(`Role  : ${role}`);

  let userId: string | null = null;

  // 1. Cari apakah user sudah terdaftar di Supabase Auth
  const { data: usersData, error: listErr } = await adminClient.auth.admin.listUsers();
  if (listErr) {
    console.error("Gagal memeriksa daftar user:", listErr.message);
    process.exit(1);
  }

  const existingUser = usersData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    userId = existingUser.id;
    console.log(`User ditemukan di Supabase Auth (ID: ${userId}).`);

    if (password) {
      const { error: updateErr } = await adminClient.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });
      if (updateErr) {
        console.error("Gagal memperbarui password user:", updateErr.message);
      } else {
        console.log("Password user berhasil diperbarui.");
      }
    }
  } else {
    if (!password) {
      console.error("Error: User baru wajib menyertakan password awal.");
      process.exit(1);
    }
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr || !newUser.user) {
      console.error("Gagal membuat user di Supabase Auth:", createErr?.message);
      process.exit(1);
    }
    userId = newUser.user.id;
    console.log(`User baru berhasil dibuat di Supabase Auth (ID: ${userId}).`);
  }

  // 2. Daftarkan / perbarui di tabel committee_members
  const { error: upsertErr } = await adminClient
    .from("committee_members")
    .upsert({ user_id: userId, role }, { onConflict: "user_id" });

  if (upsertErr) {
    console.error("Gagal menetapkan role di committee_members:", upsertErr.message);
    process.exit(1);
  }

  // 3. Catat di audit_logs
  await adminClient.from("audit_logs").insert({
    action: "add_committee",
    meta: { email, role, user_id: userId },
  });

  console.log(`✅ Berhasil menetapkan ${email} sebagai role '${role}'.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
