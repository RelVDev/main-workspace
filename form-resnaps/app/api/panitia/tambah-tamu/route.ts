// P11.5 / P17: Input langsung tamu On-The-Spot (OTS) oleh Panitia/Admin,
// lengkap dengan status HTM, alergi makanan, kode voucher, dan opsi langsung Check-In.
import { NextRequest } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeNameJs } from "@/lib/normalize";
import { invalidateGuestsCache, updateGuestExtra } from "@/lib/guest-extras";
import { generateVoucherCode, type PaymentStatus } from "@/lib/voucher";
import { fail, ok } from "@/lib/api";

export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);

  // Seluruh akun Panitia maupun Admin terautentikasi dapat menginput tamu OTS di meja registrasi
  if (!auth) {
    return fail("session_invalid");
  }

  const body = await req.json().catch(() => null);
  const fullName = body?.full_name?.trim();
  const category = body?.category?.trim() || "OTS · Tamu";
  const contact = body?.contact?.trim() || null;
  const allergies = body?.allergies?.trim() || null;
  const paymentStatus: PaymentStatus =
    body?.payment_status === "belum_lunas" ? "belum_lunas" : "lunas";
  const autoCheckin = Boolean(body?.auto_checkin) && paymentStatus === "lunas";

  if (!fullName || fullName.length > 120) {
    return fail("invalid_input");
  }

  const nameSearch = normalizeNameJs(fullName);
  const db = createAdminClient();

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
    action: "add_guest_onthespot",
    target_guest: newGuest.id,
    meta: {
      full_name: fullName,
      category,
      allergies,
      payment_status: paymentStatus,
      auto_checkin: autoCheckin,
      voucher_code: voucherCode,
      created_by: auth.email,
    },
  });

  return ok({
    guest: {
      ...newGuest,
      allergies,
      payment_status: paymentStatus,
      voucher_code: voucherCode,
      checked_in_at: checkedInAt,
    },
  });
}
