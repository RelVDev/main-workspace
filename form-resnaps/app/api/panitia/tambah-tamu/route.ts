// P11.5 / P17: Tambah tamu on-the-spot (khusus Admin) beserta status pembayaran HTM & kode voucher.
import { NextRequest } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeNameJs } from "@/lib/normalize";
import { updateGuestExtra } from "@/lib/guest-extras";
import { generateVoucherCode, type PaymentStatus } from "@/lib/voucher";
import { fail, ok } from "@/lib/api";

export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);

  // Hanya admin yang diizinkan menambah tamu on-the-spot (P11.5)
  if (!auth || auth.role !== "admin") {
    return fail("session_invalid");
  }

  const body = await req.json().catch(() => null);
  const fullName = body?.full_name?.trim();
  const category = body?.category?.trim() || null;
  const contact = body?.contact?.trim() || null;
  const paymentStatus: PaymentStatus =
    body?.payment_status === "belum_lunas" ? "belum_lunas" : "lunas";

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
    holdAt: null,
    voucherCode,
  });

  // Catat ke audit_logs (P11.5)
  await db.from("audit_logs").insert({
    actor: auth.userId,
    action: "add_guest_onthespot",
    target_guest: newGuest.id,
    meta: {
      full_name: fullName,
      category,
      payment_status: paymentStatus,
      voucher_code: voucherCode,
      created_by: auth.email,
    },
  });

  return ok({
    guest: {
      ...newGuest,
      payment_status: paymentStatus,
      voucher_code: voucherCode,
    },
  });
}
