// Endpoint panitia untuk menyetujui tamu yang tertahan (Hold HTM belum lunas)
// atau mengubah status pembayaran HTM (lunas / belum_lunas).
import { NextRequest } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { findEnrichedGuest, updateGuestExtra } from "@/lib/guest-extras";
import { htmActionInput } from "@/lib/validation/schemas";
import { formatWib } from "@/lib/time";
import { fail, ok } from "@/lib/api";

export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);
  if (!auth) return fail("session_invalid");

  const body = await req.json().catch(() => null);
  const parsed = htmActionInput.safeParse(body);
  if (!parsed.success) return fail("invalid_input");

  const { guest_id, action, payment_status, allergies } = parsed.data;
  const db = createAdminClient();

  const existing = await findEnrichedGuest(db, guest_id);
  if (!existing) return fail("not_found");

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
      action: "recover_wrong_attendance",
      target_guest: guest_id,
      meta: {
        guest_name: existing.full_name,
        previous_status: existing.status,
        recovered_by: auth.email,
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
  if (action === "approve_checkin" || (action === "set_payment" && payment_status === "lunas" && existing.status === "ditahan")) {
    await updateGuestExtra(db, guest_id, {
      paymentStatus: "lunas",
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
        approved_by: auth.email,
      },
    });

    return ok({
      action: "approve_checkin",
      guest: {
        id: existing.guest_id,
        name: existing.full_name,
        category: existing.category,
        paymentStatus: "lunas",
        status: "di_dalam",
        checkedInAt: scannedAt,
        checkedInAtWib: formatWib(scannedAt),
        voucherCode: existing.voucher_code,
      },
    });
  }

  // 2. Ubah status HTM (lunas / belum_lunas)
  const nextStatus = payment_status ?? (existing.payment_status === "lunas" ? "belum_lunas" : "lunas");
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
      updated_by: auth.email,
    },
  });

  return ok({
    action: "set_payment",
    guest: {
      id: existing.guest_id,
      name: existing.full_name,
      category: existing.category,
      paymentStatus: nextStatus,
      status: nextStatus === "lunas" && existing.status === "ditahan" ? "belum_hadir" : existing.status,
      voucherCode: existing.voucher_code,
    },
  });
}
