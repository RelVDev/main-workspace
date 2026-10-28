/**
 * Skrip untuk menyinkronkan pembaruan P17 (Status HTM belum_lunas, Hold Absensi, dan Voucher 2-in-1)
 * langsung ke database Supabase remote.
 *
 * Penggunaan:
 *   npx tsx scripts/apply-update-db.ts
 */
import { createClient } from "@supabase/supabase-js";
import { generateVoucherCode, type PaymentStatus } from "../lib/voucher";

const DEFAULT_UNPAID_NAMES = new Set([
  "citra lestari",
  "eko prasetyo",
  "joko susilo",
  "lukas hartono",
  "nicolas chandra",
  "putu ardana wirawan",
  "vincentius adi nugraha putra hadiwijaya",
  "dimas aditya",
]);

const DEFAULT_ALLERGY_MAP: Record<string, string> = {
  "anindya putri maharani": "Seafood (Udang & Kepiting)",
  "citra lestari": "Kacang Tanah & Kacang Mede",
  "dewi anggraini": "Susu Sapi / Olahan Dairy (Intoleransi Laktosa)",
  "eko prasetyo": "Telur Ayam",
  "gita ayu saraswati": "Seafood (Cumi & Kerang)",
  "joko susilo": "Makanan Pedas / Cabai (Maag Kronis)",
  "maya safitri": "Gluten / Tepung Terigu",
  "nicolas chandra": "Seafood (Ikan Laut & Udang)",
  "qonita azzahra": "Kacang-kacangan & Wijen",
  "vincentius adi nugraha putra hadiwijaya": "Susu & Keju (Dairy)",
  "zahra amelia": "Seafood (Udang)",
  "dimas aditya": "Daging Kambing",
};

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error(
      "Error: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum ada di .env.local.",
    );
    process.exit(1);
  }

  const db = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("=== Menyinkronkan Data HTM & Voucher ke Supabase ===");

  const { data: guests, error } = await db.from("guests").select("id, full_name, category");
  if (error || !guests) {
    console.error("Gagal membaca tabel guests:", error?.message);
    process.exit(1);
  }

  const extrasMap: Record<
    string,
    {
      paymentStatus: PaymentStatus;
      allergies: string | null;
      holdAt: string | null;
      voucherCode: string;
      mealRedeemedAt: string | null;
      photoboothRedeemedAt: string | null;
    }
  > = {};

  let unpaidCount = 0;
  let allergyCount = 0;

  for (const g of guests) {
    const cleanLower = g.full_name.trim().toLowerCase();
    const isUnpaid = DEFAULT_UNPAID_NAMES.has(cleanLower);
    const paymentStatus: PaymentStatus = isUnpaid ? "belum_lunas" : "lunas";
    if (isUnpaid) unpaidCount++;

    const allergies = DEFAULT_ALLERGY_MAP[cleanLower] || null;
    if (allergies) allergyCount++;

    const voucherCode = generateVoucherCode(g.id);
    extrasMap[g.id] = {
      paymentStatus,
      allergies,
      holdAt: null,
      voucherCode,
      mealRedeemedAt: null,
      photoboothRedeemedAt: null,
    };

    // Simpan juga catatan alergi di kolom notes pada tabel guests agar terlihat di SQL murni
    await db
      .from("guests")
      .update({
        notes: allergies ? `Alergi Makanan: ${allergies}` : null,
      })
      .eq("id", g.id);
  }

  const { error: upsertErr } = await db.from("event_settings").upsert(
    {
      key: "guest_extras_v1",
      value: extrasMap,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (upsertErr) {
    console.error("Gagal menyimpan ke event_settings:", upsertErr.message);
    process.exit(1);
  }

  console.log(`✅ Berhasil menyinkronkan ${guests.length} tamu ke Supabase!`);
  console.log(`   - ${unpaidCount} Kating/Tamu ditandai HTM 'belum_lunas'`);
  console.log(`   - ${guests.length - unpaidCount} Tamu ditandai HTM 'lunas'`);
  console.log(`   - ${allergyCount} Tamu tercatat memiliki Data Alergi Makanan`);
  console.log(`   - Seluruh tamu telah memiliki kode Barcode Voucher RSNP-XXXXXXXX.`);
}

main().catch((err) => {
  console.error("Kesalahan fatal:", err);
  process.exit(1);
});
