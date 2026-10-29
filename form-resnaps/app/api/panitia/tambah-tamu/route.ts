// P11.5 / P17: Input langsung tamu On-The-Spot (OTS) oleh Panitia/Admin.
// Default OTS: hanya mendapatkan Tiket Photobooth (mealEligible = false).
// Panitia dapat menambahkan Tiket Makan bagi tamu OTS selama kuota 50 slot Tamu Angkatan masih tersedia (< 50).
import { NextRequest, NextResponse } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeNameJs } from "@/lib/normalize";
import {
  computeTamuMealQuota,
  fetchEnrichedGuests,
  invalidateGuestsCache,
  updateGuestExtra,
} from "@/lib/guest-extras";
import { generateVoucherCode, type PaymentStatus } from "@/lib/voucher";
import { fail, NO_STORE, ok } from "@/lib/api";

export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);

  if (!auth) {
    return fail("session_invalid");
  }

  const body = await req.json().catch(() => null);
  const fullName = body?.full_name?.trim();
  const category = body?.category?.trim() || "Angkatan 2025";
  const contact = body?.contact?.trim() || null;
  const allergies = body?.allergies?.trim() || null;
  const paymentStatus: PaymentStatus =
    body?.payment_status === "belum_lunas" ? "belum_lunas" : "lunas";
  const autoCheckin = Boolean(body?.auto_checkin) && paymentStatus === "lunas";
  const wantsMealTicket = Boolean(body?.include_meal);

  if (!fullName || fullName.length > 120) {
    return fail("invalid_input");
  }

  const db = createAdminClient();
  const currentRows = await fetchEnrichedGuests(db, true);
  const quota = computeTamuMealQuota(currentRows);

  // Jika panitia mencentang tambah tiket makan untuk OTS tetapi 50 slot Tamu Angkatan sudah penuh -> tolak!
  if (wantsMealTicket && !quota.canAddOtsMeal) {
    return NextResponse.json(
      {
        ok: false,
        code: "meal_quota_full",
        message: `Slot Tiket Makan Tamu Angkatan sudah penuh (${quota.usedSlots}/${quota.maxSlots}). Tamu OTS hanya mendapatkan Tiket Photobooth.`,
      },
      { status: 409, headers: NO_STORE },
    );
  }

  const mealEligible = wantsMealTicket && quota.canAddOtsMeal;
  const nameSearch = normalizeNameJs(fullName);

  const { data: newGuest, error: insertErr } = await db
    .from("guests")
    .insert({
      full_name: fullName,
      name_search: nameSearch,
      category,
      contact,
      notes: allergies ? `Alergi Makanan: ${allergies}` : null,
      import_batch: "on-the-spot",
    })
    .select("id, full_name, category")
    .single();

  if (insertErr || !newGuest) {
    return fail("internal");
  }

  const voucherCode = generateVoucherCode(newGuest.id);
  await updateGuestExtra(db, newGuest.id, {
    paymentStatus,
    isOts: true,
    mealEligible,
    allergies,
    holdAt: null,
    voucherCode,
  });

  // Bila opsi "Langsung Check-In" dipilih dan HTM lunas, langsung catat kehadiran masuk
  let checkedInAt: string | null = null;
  if (autoCheckin) {
    const nowIso = new Date().toISOString();
    const { error: logErr } = await db.from("attendance_logs").insert({
      guest_id: newGuest.id,
      type: "in",
      scanned_at: nowIso,
      source: "manual",
      actor: auth.userId,
    });
    if (!logErr) {
      checkedInAt = nowIso;
      invalidateGuestsCache();
    }
  }

  // Catat ke audit_logs
  await db.from("audit_logs").insert({
    actor: auth.userId,
    action: "add_guest_ots",
    target_guest: newGuest.id,
    meta: {
      guest_name: fullName,
      category,
      allergies,
      payment_status: paymentStatus,
      meal_eligible: mealEligible,
      auto_checkin: autoCheckin,
      voucher_code: voucherCode,
      added_by: auth.email,
    },
  });

  const updatedQuota = computeTamuMealQuota(await fetchEnrichedGuests(db, true));

  return ok({
    guest: {
      ...newGuest,
      allergies,
      payment_status: paymentStatus,
      is_ots: true,
      meal_eligible: mealEligible,
      voucher_code: voucherCode,
      checked_in_at: checkedInAt,
    },
    tamuMealQuota: updatedQuota,
  });
}
