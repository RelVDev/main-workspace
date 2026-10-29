// Endpoint panitia untuk memindai (scan) & menukarkan Barcode/QR Voucher Tamu
// (Kupon Makan & Kupon Photobooth terintegrasi, masing-masing hanya dapat di-scan 1 kali).
import { NextRequest, NextResponse } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchEnrichedGuests, findEnrichedGuest, updateGuestExtra } from "@/lib/guest-extras";
import { voucherScanInput } from "@/lib/validation/schemas";
import { formatWib } from "@/lib/time";
import { fail, NO_STORE, ok } from "@/lib/api";

export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);
  if (!auth) return fail("session_invalid");

  const db = createAdminClient();
  const guests = await fetchEnrichedGuests(db);

  const eligible = guests.filter(
    (g) => (g.status === "di_dalam" || g.status === "sudah_pulang") && g.payment_status === "lunas",
  );
  const mealRedeemed = guests.filter((g) => Boolean(g.meal_redeemed_at));
  const photoboothRedeemed = guests.filter((g) => Boolean(g.photobooth_redeemed_at));

  // Gabungkan riwayat penukaran terbaru untuk ditampilkan di layar scanner panitia
  type RedemptionHistoryItem = {
    id: string;
    guestId: string;
    guestName: string;
    category: string | null;
    allergies: string | null;
    voucherCode: string;
    kind: "meal" | "photobooth";
    redeemedAt: string;
    redeemedAtWib: string;
  };

  const history: RedemptionHistoryItem[] = [];
  for (const g of guests) {
    if (g.meal_redeemed_at) {
      history.push({
        id: `${g.guest_id}_meal`,
        guestId: g.guest_id,
        guestName: g.full_name,
        category: g.category,
        allergies: g.allergies,
        voucherCode: g.voucher_code,
        kind: "meal",
        redeemedAt: g.meal_redeemed_at,
        redeemedAtWib: formatWib(g.meal_redeemed_at),
      });
    }
    if (g.photobooth_redeemed_at) {
      history.push({
        id: `${g.guest_id}_photobooth`,
        guestId: g.guest_id,
        guestName: g.full_name,
        category: g.category,
        allergies: g.allergies,
        voucherCode: g.voucher_code,
        kind: "photobooth",
        redeemedAt: g.photobooth_redeemed_at,
        redeemedAtWib: formatWib(g.photobooth_redeemed_at),
      });
    }
  }

  history.sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime());

  return ok({
    stats: {
      totalGuests: guests.length,
      eligibleCount: eligible.length,
      mealRedeemedCount: mealRedeemed.length,
      mealRemainingCount: Math.max(0, eligible.length - mealRedeemed.length),
      photoboothRedeemedCount: photoboothRedeemed.length,
      photoboothRemainingCount: Math.max(0, eligible.length - photoboothRedeemed.length),
    },
    recentRedemptions: history.slice(0, 120),
    eligibleGuests: eligible.map((g) => ({
      id: g.guest_id,
      name: g.full_name,
      category: g.category,
      allergies: g.allergies,
      voucherCode: g.voucher_code,
      mealRedeemedAtWib: g.meal_redeemed_at ? formatWib(g.meal_redeemed_at) : null,
      photoboothRedeemedAtWib: g.photobooth_redeemed_at
        ? formatWib(g.photobooth_redeemed_at)
        : null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);
  if (!auth) return fail("session_invalid");

  const body = await req.json().catch(() => null);
  const parsed = voucherScanInput.safeParse(body);
  if (!parsed.success) return fail("invalid_input");

  const { code, kind } = parsed.data;
  const db = createAdminClient();

  const guest = await findEnrichedGuest(db, code);
  if (!guest) {
    return fail("voucher_invalid");
  }

  // Pastikan tamu sudah lunas HTM
  if (guest.payment_status === "belum_lunas") {
    return NextResponse.json(
      {
        ok: false,
        code: "payment_hold",
        message: `HTM ${guest.full_name} belum lunas (masih ditahan). Lunasi HTM terlebih dahulu di Dashboard.`,
        guest: {
          id: guest.guest_id,
          name: guest.full_name,
          category: guest.category,
          voucherCode: guest.voucher_code,
        },
      },
      { status: 403, headers: NO_STORE },
    );
  }

  // Pastikan tamu sudah tercatat check-in masuk
  if (!guest.checked_in_at) {
    return NextResponse.json(
      {
        ok: false,
        code: "not_checked_in",
        message: `${guest.full_name} belum melakukan absen masuk di gerbang.`,
        guest: {
          id: guest.guest_id,
          name: guest.full_name,
          category: guest.category,
          voucherCode: guest.voucher_code,
        },
      },
      { status: 409, headers: NO_STORE },
    );
  }

  const labelKind = kind === "meal" ? "Kupon Makan" : "Kupon Photobooth";
  const alreadyAt = kind === "meal" ? guest.meal_redeemed_at : guest.photobooth_redeemed_at;

  // Proteksi 1x pakai ketat: tolak jika sudah pernah di-scan untuk jenis voucher tersebut
  if (alreadyAt) {
    const usedWib = formatWib(alreadyAt);
    return NextResponse.json(
      {
        ok: false,
        code: "voucher_already_used",
        message: `${labelKind} milik ${guest.full_name} SUDAH PERNAH DITUKARKAN pada pukul ${usedWib} (maksimal 1x scan).`,
        guest: {
          id: guest.guest_id,
          name: guest.full_name,
          category: guest.category,
          allergies: guest.allergies,
          voucherCode: guest.voucher_code,
          redeemedAt: alreadyAt,
          redeemedAtWib: usedWib,
          mealRedeemedAtWib: guest.meal_redeemed_at ? formatWib(guest.meal_redeemed_at) : null,
          photoboothRedeemedAtWib: guest.photobooth_redeemed_at
            ? formatWib(guest.photobooth_redeemed_at)
            : null,
        },
      },
      { status: 409, headers: NO_STORE },
    );
  }

  const nowIso = new Date().toISOString();
  if (kind === "meal") {
    await updateGuestExtra(db, guest.guest_id, {
      mealRedeemedAt: nowIso,
      mealRedeemedBy: auth.userId,
      voucherCode: guest.voucher_code,
    });
  } else {
    await updateGuestExtra(db, guest.guest_id, {
      photoboothRedeemedAt: nowIso,
      photoboothRedeemedBy: auth.userId,
      voucherCode: guest.voucher_code,
    });
  }

  await db.from("audit_logs").insert({
    actor: auth.userId,
    action: kind === "meal" ? "redeem_voucher_meal" : "redeem_voucher_photobooth",
    target_guest: guest.guest_id,
    meta: {
      kind,
      voucher_code: guest.voucher_code,
      guest_name: guest.full_name,
      scanned_by: auth.email,
      redeemed_at: nowIso,
    },
  });

  const nowWib = formatWib(nowIso);
  return ok({
    kind,
    message: `${labelKind} untuk ${guest.full_name} berhasil diverifikasi!`,
    guest: {
      id: guest.guest_id,
      name: guest.full_name,
      category: guest.category,
      allergies: guest.allergies,
      voucherCode: guest.voucher_code,
      redeemedAt: nowIso,
      redeemedAtWib: nowWib,
      mealRedeemedAtWib:
        kind === "meal"
          ? nowWib
          : guest.meal_redeemed_at
            ? formatWib(guest.meal_redeemed_at)
            : null,
      photoboothRedeemedAtWib:
        kind === "photobooth"
          ? nowWib
          : guest.photobooth_redeemed_at
            ? formatWib(guest.photobooth_redeemed_at)
            : null,
    },
  });
}
