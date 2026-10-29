// Layer pengelolaan data tambahan tamu: Status Pembayaran HTM (lunas/belum_lunas),
// Status OTS & Hak Tiket Makan (meal_eligible dengan kuota 50 slot Tamu Angkatan),
// Data Alergi Makanan (allergies), Status Hold Absensi (hold_at), serta Voucher Makan & Photobooth (1x pakai).
// Dioptimalkan dengan query paralel (Promise.all) & in-memory cache 3 detik yang di-invalidasi otomatis saat mutasi.
import "server-only";
import { createAdminClient } from "./supabase/admin";
import { generateVoucherCode, normalizeVoucherInput, type PaymentStatus } from "./voucher";

export const TAMU_ANGKATAN_MEAL_MAX_SLOTS = 50;

export type GuestExtraState = {
  paymentStatus: PaymentStatus;
  isOts: boolean;
  mealEligible: boolean;
  allergies: string | null;
  holdAt: string | null;
  voucherCode: string;
  mealRedeemedAt: string | null;
  mealRedeemedBy: string | null;
  photoboothRedeemedAt: string | null;
  photoboothRedeemedBy: string | null;
};

export type EnrichedGuestRow = {
  guest_id: string;
  full_name: string;
  category: string | null;
  allergies: string | null;
  status: "belum_hadir" | "ditahan" | "di_dalam" | "sudah_pulang";
  checked_in_at: string | null;
  checked_out_at: string | null;
  payment_status: PaymentStatus;
  is_ots: boolean;
  meal_eligible: boolean;
   is_tamu_role: boolean;
  hold_at: string | null;
  voucher_code: string;
  meal_redeemed_at: string | null;
  photobooth_redeemed_at: string | null;
  device_reset_at: string | null;
};

export type TamuMealQuotaInfo = {
  maxSlots: number;
  usedSlots: number;
  remainingSlots: number;
  totalTamuCount: number;
  canAddOtsMeal: boolean;
};

const EXTRAS_SETTING_KEY = "guest_extras_v1";

// Daftar nama pada data Gladi Bersih Chrysalis 2026 yang disimulasikan memiliki status HTM di tempat ('belum_lunas')
export const DEFAULT_UNPAID_NAMES = new Set([
  "raditiya putra pratama",
  "siti mawardah",
  "muhammad faiq asyraf",
  "brian rayanata surya",
  "devin ogya adhigana",
  "ibnata rasya syarief",
  "michael tinon christiano",
  "muhammad athar reivansyah",
  "mazida an'um ummi hirza",
  "steven kornelius saputra",
]);

// Data alergi makanan simulasi untuk Panitia/Peserta Chrysalis 2026 pada Gladi Bersih
export const DEFAULT_ALLERGY_MAP: Record<string, string> = {
  "athif nasiruddin yusuf": "Seafood (Udang & Kepiting)",
  "shafira fauziatuz zahra": "Susu Sapi / Olahan Dairy (Intoleransi Laktosa)",
  "ayushita ahmad": "Kacang Tanah & Kacang Mede",
  "naurah alya mukhbita": "Telur Ayam & Olahan Mayo",
  "nazwa azzahra ramadhani": "Seafood (Cumi & Kerang)",
  "agatha samantha putri": "Makanan Pedas / Cabai (Maag Kronis)",
  "annisa shafa nuridha": "Gluten / Tepung Terigu",
  "calya annora paramartha": "Seafood (Ikan Laut & Udang)",
  "ghaitsa razqi satyaputri": "Kacang-kacangan & Wijen",
  "dhinda cahyani febrine": "Susu & Keju (Dairy)",
  "rayyan fadli": "Daging Kambing",
  "raditiya putra pratama": "Seafood (Udang & Kepiting)",
  "brian rayanata surya": "Kacang Tanah & Kacang Mede",
  "mazida an'um ummi hirza": "Susu Sapi / Olahan Dairy (Intoleransi Laktosa)",
};

export type StoredExtraRecord = {
  paymentStatus?: PaymentStatus;
  isOts?: boolean;
  mealEligible?: boolean;
  allergies?: string | null;
  holdAt?: string | null;
  voucherCode?: string;
  mealRedeemedAt?: string | null;
  mealRedeemedBy?: string | null;
  photoboothRedeemedAt?: string | null;
  photoboothRedeemedBy?: string | null;
  deviceResetAt?: string | null;
};

type StoredExtrasMap = Record<string, StoredExtraRecord>;

// Cache in-memory singkat (3 detik) agar pembacaan beruntun bebas latensi
let enrichedGuestsCache: { rows: EnrichedGuestRow[]; expiresAt: number } | null = null;
let deviceLockCache: { enabled: boolean; expiresAt: number } | null = null;
const CACHE_TTL_MS = 3000;

export function invalidateGuestsCache(): void {
  enrichedGuestsCache = null;
  deviceLockCache = null;
}

/**
 * Menentukan apakah kategori/role tamu merupakan kelompok "Tamu / Tamu Angkatan / OTS" (bukan Panitia reguler).
 */
export function isCategoryTamuRole(category: string | null, isOts = false): boolean {
  if (isOts) return true;
  const c = (category || "").trim().toLowerCase();
  if (!c) return true;
  if (c.includes("ots")) return true;
  if (c.startsWith("panitia")) return false;
  return true;
}

/**
 * Menghitung pemakaian kuota 50 slot Tiket Makan khusus Tamu Angkatan & OTS.
 * Jika slot yang terpakai < 50, panitia masih bisa menambahkan tiket makan bagi tamu OTS.
 */
export function computeTamuMealQuota(rows: EnrichedGuestRow[]): TamuMealQuotaInfo {
  let usedSlots = 0;
  let totalTamuCount = 0;

  for (const r of rows) {
    if (r.is_tamu_role || r.is_ots) {
      totalTamuCount++;
      if (r.meal_eligible) {
        usedSlots++;
      }
    }
  }

  const remainingSlots = Math.max(0, TAMU_ANGKATAN_MEAL_MAX_SLOTS - usedSlots);
  return {
    maxSlots: TAMU_ANGKATAN_MEAL_MAX_SLOTS,
    usedSlots,
    remainingSlots,
    totalTamuCount,
    canAddOtsMeal: usedSlots < TAMU_ANGKATAN_MEAL_MAX_SLOTS,
  };
}

export async function readExtrasStore(
  db: ReturnType<typeof createAdminClient>,
): Promise<StoredExtrasMap> {
  const { data } = await db
    .from("event_settings")
    .select("value")
    .eq("key", EXTRAS_SETTING_KEY)
    .maybeSingle();

  if (data?.value && typeof data.value === "object" && !Array.isArray(data.value)) {
    return data.value as StoredExtrasMap;
  }
  return {};
}

export async function writeExtrasStore(
  db: ReturnType<typeof createAdminClient>,
  store: StoredExtrasMap,
): Promise<void> {
  invalidateGuestsCache();
  await db.from("event_settings").upsert(
    {
      key: EXTRAS_SETTING_KEY,
      value: store,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );
}

/**
 * Mengecek apakah fitur keamanan Kunci 1 Perangkat = 1 Tamu aktif (default: true).
 */
export async function isDeviceLockEnabled(
  db: ReturnType<typeof createAdminClient>,
): Promise<boolean> {
  const now = Date.now();
  if (deviceLockCache && deviceLockCache.expiresAt > now) {
    return deviceLockCache.enabled;
  }

  const { data } = await db
    .from("event_settings")
    .select("value")
    .eq("key", "device_lock_enabled")
    .maybeSingle();

  const enabled = data && typeof data.value === "boolean" ? data.value : true;
  deviceLockCache = { enabled, expiresAt: now + CACHE_TTL_MS };
  return enabled;
}

/**
 * Mengambil seluruh baris status tamu yang sudah diperkaya secara paralel (1 roundtrip paralel).
 */
export async function fetchEnrichedGuests(
  db: ReturnType<typeof createAdminClient>,
  forceFresh = false,
): Promise<EnrichedGuestRow[]> {
  const now = Date.now();
  if (!forceFresh && enrichedGuestsCache && enrichedGuestsCache.expiresAt > now) {
    return enrichedGuestsCache.rows;
  }

  const [store, baseRes] = await Promise.all([
    readExtrasStore(db),
    db
      .from("guest_status")
      .select("guest_id, full_name, category, status, checked_in_at, checked_out_at")
      .order("full_name", { ascending: true }),
  ]);

  const baseRows = baseRes.data ?? [];
  const rows: EnrichedGuestRow[] = baseRows.map((r) => {
    const id = r.guest_id ?? "";
    const over = store[id];
    const nameLower = (r.full_name ?? "").trim().toLowerCase();
    const catLower = (r.category ?? "").trim().toLowerCase();

    const isDefaultUnpaid = DEFAULT_UNPAID_NAMES.has(nameLower);
    const defaultPayment: PaymentStatus = isDefaultUnpaid ? "belum_lunas" : "lunas";
    const defaultAllergy = DEFAULT_ALLERGY_MAP[nameLower] ?? null;

    const paymentStatus: PaymentStatus = over?.paymentStatus ?? defaultPayment;
    // Tamu dikategorikan OTS / HTM di tempat bila ditandai isOts, kategorinya mengandung "ots", atau berasal dari simulasi HTM di tempat
    const isOts =
      over?.isOts !== undefined
        ? over.isOts
        : catLower.includes("ots") || isDefaultUnpaid || paymentStatus === "belum_lunas";
    const isTamuRole = isCategoryTamuRole(r.category ?? null, isOts);

    // Aturan Kuota Makan:
    // - Tamu OTS / HTM di tempat secara default HANYA mendapat tiket Photobooth (mealEligible = false),
    //   kecuali panitia secara eksplisit mengaktifkan mealEligible = true (selama slot Tamu Angkatan < 50).
    // - Panitia reguler & Tamu Angkatan reguler (bukan OTS) secara default mendapat tiket makan (mealEligible = true).
    const mealEligible =
      over?.mealEligible !== undefined ? over.mealEligible : isOts ? false : true;

    const allergies = over?.allergies !== undefined ? over.allergies : defaultAllergy;
    const holdAt = over?.holdAt ?? null;
    const voucherCode = over?.voucherCode || generateVoucherCode(id);
    const mealRedeemedAt = over?.mealRedeemedAt ?? null;
    const photoboothRedeemedAt = over?.photoboothRedeemedAt ?? null;

    let computedStatus: EnrichedGuestRow["status"] = "belum_hadir";
    if (r.checked_out_at) {
      computedStatus = "sudah_pulang";
    } else if (r.checked_in_at) {
      computedStatus = "di_dalam";
    } else if (holdAt && paymentStatus === "belum_lunas") {
      computedStatus = "ditahan";
    }

    return {
      guest_id: id,
      full_name: r.full_name ?? "Tamu",
      category: r.category ?? null,
      allergies: allergies || null,
      status: computedStatus,
      checked_in_at: r.checked_in_at ?? null,
      checked_out_at: r.checked_out_at ?? null,
      payment_status: paymentStatus,
      is_ots: isOts,
      meal_eligible: mealEligible,
      is_tamu_role: isTamuRole,
      hold_at: holdAt,
      voucher_code: voucherCode,
      meal_redeemed_at: mealRedeemedAt,
      photobooth_redeemed_at: photoboothRedeemedAt,
      device_reset_at: over?.deviceResetAt ?? null,
    };
  });

  enrichedGuestsCache = { rows, expiresAt: Date.now() + CACHE_TTL_MS };
  return rows;
}

/**
 * Mengambil 1 data tamu yang sudah diperkaya berdasarkan `guestId` atau `voucherCode`.
 */
export async function findEnrichedGuest(
  db: ReturnType<typeof createAdminClient>,
  idOrVoucher: string,
): Promise<EnrichedGuestRow | null> {
  const all = await fetchEnrichedGuests(db);
  const normalizedVoucher = normalizeVoucherInput(idOrVoucher);
  const clean = idOrVoucher.trim().toLowerCase();

  return (
    all.find(
      (g) =>
        g.guest_id.toLowerCase() === clean ||
        g.voucher_code.toUpperCase() === normalizedVoucher.toUpperCase(),
    ) ?? null
  );
}

/**
 * Memperbarui state ekstra tamu di `event_settings` dan langsung meng-invalidasi cache.
 */
export async function updateGuestExtra(
  db: ReturnType<typeof createAdminClient>,
  guestId: string,
  patch: Partial<StoredExtraRecord>,
): Promise<void> {
  const store = await readExtrasStore(db);
  const current = store[guestId] ?? {};
  store[guestId] = {
    ...current,
    ...patch,
  };
  await writeExtrasStore(db, store);
}
