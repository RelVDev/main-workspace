// Endpoint panitia untuk menyetujui tamu yang tertahan (Hold HTM belum lunas),
// mengubah status pembayaran HTM (lunas / belum_lunas), atau mengatur hak Tiket Makan OTS (kuota 50 slot Tamu Angkatan).
import { NextRequest, NextResponse } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  computeTamuMealQuota,
  fetchEnrichedGuests,
  findEnrichedGuest,
  updateGuestExtra,
} from "@/lib/guest-extras";
import { htmActionInput } from "@/lib/validation/schemas";
import { formatWib } from "@/lib/time";
import { fail, NO_STORE, ok } from "@/lib/api";

export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);
  if (!auth) return fail("session_invalid");

  const body = await req.json().catch(() => null);
  const parsed = htmActionInput.safeParse(body);
  if (!parsed.success) return fail("invalid_input");

  const { guest_id, action, payment_status, allergies, meal_eligible } = parsed.data;
  const db = createAdminClient();

  const existing = await findEnrichedGuest(db, guest_id);
  if (!existing) return fail("not_found");

  // Pengaturan hak Tiket Makan bagi tamu OTS / Tamu Angkatan (batas 50 slot)
  if (action === "set_meal_eligible") {
    const nextMealEligible =
      typeof meal_eligible === "boolean" ? meal_eligible : !existing.meal_eligible;

    if (nextMealEligible && !existing.meal_eligible) {
      const allRows = await fetchEnrichedGuests(db, true);
      const quota = computeTamuMealQuota(allRows);
      if (!quota.canAddOtsMeal) {
        return NextResponse.json(
          {
            ok: false,
            code: "meal_quota_full",
            message: `Kuota 50 slot Tiket Makan Tamu Angkatan sudah penuh (${quota.usedSlots}/${quota.maxSlots}). Tidak dapat menambah tiket makan lagi untuk tamu OTS.`,
          },
          { status: 409, headers: NO_STORE },
        );
      }
    }

    await updateGuestExtra(db, guest_id, {
      mealEligible: nextMealEligible,
      voucherCode: existing.voucher_code,
    });

    await db.from("audit_logs").insert({
      actor: auth.userId,
      action: nextMealEligible ? "grant_ots_meal_ticket" : "revoke_ots_meal_ticket",
      target_guest: guest_id,
      meta: {
        guest_name: existing.full_name,
        category: existing.category,
        meal_eligible: nextMealEligible,
        voucher_code: existing.voucher_code,
        added_by: auth.email,
      },
    });

    const updatedQuota = computeTamuMealQuota(await fetchEnrichedGuests(db, true));

    return ok({
      action: "set_meal_eligible",
      guest: {
        id: existing.guest_id,
        name: existing.full_name,
        category: existing.category,
        mealEligible: nextMealEligible,
        paymentStatus: existing.payment_status,
        status: existing.status,
        voucherCode: existing.voucher_code,
      },
      tamuMealQuota: updatedQuota,
    });
  }

  if (action === "set_allergies") {
    const cleanAllergies = allergies?.trim() || null;
    await updateGuestExtra(db, guest_id, {
      allergies: cleanAllergies,
      voucherCode: existing.voucher_code,
    });
    return ok({
      action: "set_allergies",
      guest: {
        id: existing.guest_id,
        name: existing.full_name,
        category: existing.category,
        allergies: cleanAllergies,
        paymentStatus: existing.payment_status,
        status: existing.status,
        voucherCode: existing.voucher_code,
      },
    });
  }

  // Recovery Salah Absen / Buka Kunci Perangkat Tamu (mengembalikan status ke belum_hadir & me-reset kunci HP)
  if (action === "reset_attendance") {
    if (existing.status === "sudah_pulang") {
      await db.rpc("undo_attendance", {
        p_guest_id: guest_id,
        p_type: "out",
        p_actor: auth.userId,
        p_reason: "Recovery salah absen / reset kunci perangkat oleh panitia",
      });
      await db.rpc("undo_attendance", {
        p_guest_id: guest_id,
        p_type: "in",
        p_actor: auth.userId,
        p_reason: "Recovery salah absen / reset kunci perangkat oleh panitia",
      });
    } else if (existing.status === "di_dalam") {
      await db.rpc("undo_attendance", {
        p_guest_id: guest_id,
        p_type: "in",
        p_actor: auth.userId,
        p_reason: "Recovery salah absen / reset kunci perangkat oleh panitia",
      });
    }

    const resetAt = new Date().toISOString();
    await updateGuestExtra(db, guest_id, {
      holdAt: null,
      mealRedeemedAt: null,
      mealRedeemedBy: null,
      photoboothRedeemedAt: null,
      photoboothRedeemedBy: null,
      deviceResetAt: resetAt,
      voucherCode: existing.voucher_code,
    });

    await db.from("audit_logs").insert({
      actor: auth.userId,
      action: "reset_guest_attendance",
      target_guest: guest_id,
      meta: {
        guest_name: existing.full_name,
        previous_status: existing.status,
        added_by: auth.email,
      },
    });

    return ok({
      action: "reset_attendance",
      guest: {
        id: existing.guest_id,
        name: existing.full_name,
        category: existing.category,
        paymentStatus: existing.payment_status,
        status: "belum_hadir",
        voucherCode: existing.voucher_code,
        deviceResetAt: resetAt,
      },
    });
  }

  // 1. Lunasi HTM & Izinkan Masuk (melepas Hold dan mencatat absen masuk)
  // Catatan: Tamu HTM di tempat / OTS secara default hanya mendapat Tiket Photobooth (mealEligible = false)
  // kecuali panitia memilih memberikan tiket makan dan slot Tamu Angkatan < 50.
  if (
    action === "approve_checkin" ||
    (action === "set_payment" && payment_status === "lunas" && existing.status === "ditahan")
  ) {
    let targetMealEligible = existing.meal_eligible;
    if (typeof meal_eligible === "boolean") {
      if (meal_eligible && !existing.meal_eligible) {
        const quota = computeTamuMealQuota(await fetchEnrichedGuests(db, true));
        if (!quota.canAddOtsMeal) {
          return NextResponse.json(
            {
              ok: false,
              code: "meal_quota_full",
              message: `Kuota 50 slot Tiket Makan Tamu Angkatan sudah penuh (${quota.usedSlots}/${quota.maxSlots}). Tamu hanya bisa masuk dengan Tiket Photobooth.`,
            },
            { status: 409, headers: NO_STORE },
          );
        }
      }
      targetMealEligible = meal_eligible;
    }

    await updateGuestExtra(db, guest_id, {
      paymentStatus: "lunas",
      isOts: existing.is_ots,
      mealEligible: targetMealEligible,
      holdAt: null,
      voucherCode: existing.voucher_code,
    });

    let scannedAt = existing.checked_in_at;
    if (!scannedAt) {
      const { data: rpcData } = await db.rpc("manual_attendance", {
        p_guest_id: guest_id,
        p_type: "in",
        p_actor: auth.userId,
      });
      const payload = rpcData as { code?: string; scanned_at?: string } | null;
      scannedAt = payload?.scanned_at || new Date().toISOString();
    }

    await db.from("audit_logs").insert({
      actor: auth.userId,
      action: "approve_hold_checkin",
      target_guest: guest_id,
      meta: {
        guest_name: existing.full_name,
        payment_status: "lunas",
        meal_eligible: targetMealEligible,
        added_by: auth.email,
      },
    });

    return ok({
      action: "approve_checkin",
      guest: {
        id: existing.guest_id,
        name: existing.full_name,
        category: existing.category,
        paymentStatus: "lunas",
        mealEligible: targetMealEligible,
        status: "di_dalam",
        checkedInAt: scannedAt,
        checkedInAtWib: formatWib(scannedAt),
        voucherCode: existing.voucher_code,
      },
    });
  }

  // 2. Ubah status HTM (lunas / belum_lunas)
  const nextStatus =
    payment_status ?? (existing.payment_status === "lunas" ? "belum_lunas" : "lunas");
  await updateGuestExtra(db, guest_id, {
    paymentStatus: nextStatus,
    holdAt: nextStatus === "lunas" ? null : existing.hold_at,
    voucherCode: existing.voucher_code,
  });

  await db.from("audit_logs").insert({
    actor: auth.userId,
    action: "set_payment_status",
    target_guest: guest_id,
    meta: {
      guest_name: existing.full_name,
      payment_status: nextStatus,
      added_by: auth.email,
    },
  });

  return ok({
    action: "set_payment",
    guest: {
      id: existing.guest_id,
      name: existing.full_name,
      category: existing.category,
      paymentStatus: nextStatus,
      mealEligible: existing.meal_eligible,
      status: nextStatus === "lunas" && existing.status === "ditahan" ? "belum_hadir" : existing.status,
      voucherCode: existing.voucher_code,
    },
  });
}
