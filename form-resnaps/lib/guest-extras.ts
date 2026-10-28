// Layer pengelolaan data tambahan tamu: Status Pembayaran HTM (lunas/belum_lunas),
// Status Hold Absensi (hold_at), serta Voucher Makan & Photobooth (1x pakai).
// Mendukung kolom tabel `guests` (migrasi 0008) SEKALIGUS fallback otomatis ke `event_settings`
// ("guest_extras_v1") bila migrasi 0008 belum dijalankan di database remote.
import "server-only";
import { createAdminClient } from "./supabase/admin";
import { generateVoucherCode, normalizeVoucherInput, type PaymentStatus, type VoucherKind } from "./voucher";

export type GuestExtraState = {
  paymentStatus: PaymentStatus;
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
  status: "belum_hadir" | "ditahan" | "di_dalam" | "sudah_pulang";
  checked_in_at: string | null;
  checked_out_at: string | null;
  payment_status: PaymentStatus;
  hold_at: string | null;
  voucher_code: string;
  meal_redeemed_at: string | null;
  photobooth_redeemed_at: string | null;
};

const EXTRAS_SETTING_KEY = "guest_extras_v1";

// Daftar nama Kating/Tamu pada seed data yang secara default memiliki status HTM 'belum_lunas'
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

type StoredExtraRecord = {
  paymentStatus?: PaymentStatus;
  holdAt?: string | null;
  voucherCode?: string;
  mealRedeemedAt?: string | null;
  mealRedeemedBy?: string | null;
  photoboothRedeemedAt?: string | null;
  photoboothRedeemedBy?: string | null;
};

type StoredExtrasMap = Record<string, StoredExtraRecord>;

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
 * Mengambil seluruh baris status tamu yang sudah diperkaya dengan `payment_status`,
 * `hold_at`, `voucher_code`, `meal_redeemed_at`, dan `photobooth_redeemed_at`.
 */
export async function fetchEnrichedGuests(
  db: ReturnType<typeof createAdminClient>,
): Promise<EnrichedGuestRow[]> {
  const store = await readExtrasStore(db);

  // Coba baca dari view guest_status dengan kolom baru (migrasi 0008)
  const fullRes = await db
    .from("guest_status")
    .select(
      "guest_id, full_name, category, status, checked_in_at, checked_out_at, payment_status, hold_at, voucher_code, meal_redeemed_at, photobooth_redeemed_at",
    )
    .order("full_name", { ascending: true });

  if (!fullRes.error && fullRes.data) {
    return fullRes.data.map((r) => {
      const id = r.guest_id ?? "";
      const over = store[id];
      const nameLower = (r.full_name ?? "").trim().toLowerCase();
      const defaultPayment: PaymentStatus = DEFAULT_UNPAID_NAMES.has(nameLower)
        ? "belum_lunas"
        : "lunas";

      const paymentStatus: PaymentStatus =
        over?.paymentStatus ??
        (r.payment_status === "belum_lunas" ? "belum_lunas" : defaultPayment);
      const holdAt = over?.holdAt !== undefined ? over.holdAt : (r.hold_at ?? null);
      const voucherCode = over?.voucherCode || r.voucher_code || generateVoucherCode(id);
      const mealRedeemedAt =
        over?.mealRedeemedAt !== undefined ? over.mealRedeemedAt : (r.meal_redeemed_at ?? null);
      const photoboothRedeemedAt =
        over?.photoboothRedeemedAt !== undefined
          ? over.photoboothRedeemedAt
          : (r.photobooth_redeemed_at ?? null);

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
        status: computedStatus,
        checked_in_at: r.checked_in_at ?? null,
        checked_out_at: r.checked_out_at ?? null,
        payment_status: paymentStatus,
        hold_at: holdAt,
        voucher_code: voucherCode,
        meal_redeemed_at: mealRedeemedAt,
        photobooth_redeemed_at: photoboothRedeemedAt,
      };
    });
  }

  // Fallback apabila migrasi 0008 belum dijalankan di database remote
  const baseRes = await db
    .from("guest_status")
    .select("guest_id, full_name, category, status, checked_in_at, checked_out_at")
    .order("full_name", { ascending: true });

  const baseRows = baseRes.data ?? [];
  return baseRows.map((r) => {
    const id = r.guest_id ?? "";
    const over = store[id];
    const nameLower = (r.full_name ?? "").trim().toLowerCase();
    const defaultPayment: PaymentStatus = DEFAULT_UNPAID_NAMES.has(nameLower)
      ? "belum_lunas"
      : "lunas";

    const paymentStatus: PaymentStatus = over?.paymentStatus ?? defaultPayment;
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
      status: computedStatus,
      checked_in_at: r.checked_in_at ?? null,
      checked_out_at: r.checked_out_at ?? null,
      payment_status: paymentStatus,
      hold_at: holdAt,
      voucher_code: voucherCode,
      meal_redeemed_at: mealRedeemedAt,
      photobooth_redeemed_at: photoboothRedeemedAt,
    };
  });
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
 * Memperbarui state ekstra tamu baik di kolom tabel `guests` (bila ada) maupun di `event_settings`.
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

  // Upayakan update langsung ke kolom tabel guests bila migrasi 0008 sudah aktif
  const dbPatch: Record<string, unknown> = {};
  if (patch.paymentStatus !== undefined) dbPatch.payment_status = patch.paymentStatus;
  if (patch.holdAt !== undefined) dbPatch.hold_at = patch.holdAt;
  if (patch.voucherCode !== undefined) dbPatch.voucher_code = patch.voucherCode;
  if (patch.mealRedeemedAt !== undefined) dbPatch.meal_redeemed_at = patch.mealRedeemedAt;
  if (patch.mealRedeemedBy !== undefined) dbPatch.meal_redeemed_by = patch.mealRedeemedBy;
  if (patch.photoboothRedeemedAt !== undefined)
    dbPatch.photobooth_redeemed_at = patch.photoboothRedeemedAt;
  if (patch.photoboothRedeemedBy !== undefined)
    dbPatch.photobooth_redeemed_by = patch.photoboothRedeemedBy;

  if (Object.keys(dbPatch).length > 0) {
    await db.from("guests").update(dbPatch).eq("id", guestId);
  }
}
