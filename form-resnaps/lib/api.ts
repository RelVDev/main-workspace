// P05.10: format error seragam { ok:false, code, message }. Tidak pernah membocorkan detail internal.
import { NextResponse } from "next/server";

export const NO_STORE = { "Cache-Control": "no-store" } as const;

const MESSAGES: Record<string, { status: number; message: string }> = {
  token_expired: { status: 410, message: "QR sudah kedaluwarsa. Scan ulang QR terbaru di layar." },
  token_invalid: { status: 400, message: "QR tidak dikenali. Scan ulang QR di layar panitia." },
  token_revoked: { status: 410, message: "QR sudah tidak berlaku. Scan ulang QR terbaru di layar." },
  closed: { status: 409, message: "Absen sedang ditutup." },
  session_invalid: { status: 401, message: "Sesi tidak valid. Scan ulang QR di layar panitia." },
  session_expired: { status: 401, message: "Sesi berakhir. Scan ulang QR terbaru di layar panitia." },
  session_used: { status: 409, message: "Sesi ini sudah dipakai. Scan ulang QR untuk absen berikutnya." },
  already_in: { status: 409, message: "Kamu sudah absen masuk." },
  already_out: { status: 409, message: "Kamu sudah absen pulang." },
  not_checked_in: { status: 409, message: "Kamu belum tercatat absen masuk. Hubungi panitia." },
  payment_hold: {
    status: 403,
    message: "Status pembayaran HTM belum lunas. Absensi ditahan menunggu konfirmasi panitia.",
  },
  voucher_invalid: {
    status: 404,
    message: "Kode barcode / QR voucher tidak dikenali dalam sistem.",
  },
  voucher_already_used: {
    status: 409,
    message: "Voucher ini sudah pernah di-scan dan ditukarkan sebelumnya (maksimal 1x pakai).",
  },
  not_found: { status: 404, message: "Data tidak ditemukan." },
  invalid_input: { status: 400, message: "Permintaan tidak valid." },
  rate_limited: { status: 429, message: "Terlalu banyak permintaan. Coba lagi sebentar." },
  internal: { status: 500, message: "Terjadi kendala. Coba lagi." },
};

export function fail(code: keyof typeof MESSAGES | string) {
  const m = MESSAGES[code] ?? MESSAGES.internal;
  return NextResponse.json(
    { ok: false, code: MESSAGES[code] ? code : "internal", message: m.message },
    { status: m.status, headers: NO_STORE },
  );
}

export function ok<T extends object>(body: T, init?: { status?: number }) {
  return NextResponse.json({ ok: true, ...body }, { status: init?.status ?? 200, headers: NO_STORE });
}
