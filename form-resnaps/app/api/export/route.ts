// P11.4 / P17: Ekspor data kehadiran, status HTM, dan pemakaian Voucher (Makan & Photobooth) ke CSV
// dengan proteksi formula injection dan UTF-8 BOM.
import { NextRequest, NextResponse } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchEnrichedGuests } from "@/lib/guest-extras";
import { formatWib } from "@/lib/time";
import { fail } from "@/lib/api";

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');

  // P11.4: Cegah CSV / formula injection (awali sel berawalan = + - @ dengan ')
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  return `"${str}"`;
}

function calculateDuration(inTime: string | null, outTime: string | null): string {
  if (!inTime || !outTime) return "-";
  try {
    const ms = new Date(outTime).getTime() - new Date(inTime).getTime();
    if (ms <= 0) return "-";
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remMin = minutes % 60;
    if (hours > 0) return `${hours} jam ${remMin} mnt`;
    return `${remMin} mnt`;
  } catch {
    return "-";
  }
}

export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const auth = await getCommitteeAuth(bearer);
  if (!auth) return fail("session_invalid");

  const db = createAdminClient();
  const guests = await fetchEnrichedGuests(db);

  const header = [
    "Nama",
    "Kategori",
    "Status HTM",
    "Status Kehadiran",
    "Kode Voucher",
    "Jam Masuk (WIB)",
    "Jam Pulang (WIB)",
    "Durasi Hadir",
    "Voucher Makan (WIB)",
    "Voucher Photobooth (WIB)",
  ];
  const rows: string[] = [header.map(escapeCsvCell).join(",")];

  for (const g of guests) {
    const statusLabel =
      g.status === "di_dalam"
        ? "Di Dalam"
        : g.status === "sudah_pulang"
          ? "Sudah Pulang"
          : g.status === "ditahan"
            ? "Ditahan (Hold HTM)"
            : "Belum Hadir";

    const htmLabel = g.payment_status === "belum_lunas" ? "Belum Lunas" : "Lunas";
    const inWib = g.checked_in_at ? formatWib(g.checked_in_at) : "-";
    const outWib = g.checked_out_at ? formatWib(g.checked_out_at) : "-";
    const duration = calculateDuration(g.checked_in_at, g.checked_out_at);
    const mealWib = g.meal_redeemed_at ? `Sudah Ditukar (${formatWib(g.meal_redeemed_at)})` : "Belum Ditukar";
    const photoWib = g.photobooth_redeemed_at
      ? `Sudah Dipakai (${formatWib(g.photobooth_redeemed_at)})`
      : "Belum Dipakai";

    rows.push(
      [
        escapeCsvCell(g.full_name),
        escapeCsvCell(g.category || "-"),
        escapeCsvCell(htmLabel),
        escapeCsvCell(statusLabel),
        escapeCsvCell(g.voucher_code),
        escapeCsvCell(inWib),
        escapeCsvCell(outWib),
        escapeCsvCell(duration),
        escapeCsvCell(mealWib),
        escapeCsvCell(photoWib),
      ].join(","),
    );
  }

  // P11.4: UTF-8 BOM (\uFEFF) agar Microsoft Excel membuka aksen & simbol dengan benar
  const csvContent = "\uFEFF" + rows.join("\r\n");
  const todayStr = new Date().toISOString().slice(0, 10);
  const filename = `kehadiran-resnaps-${todayStr}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
