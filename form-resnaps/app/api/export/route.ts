// P11.4: Ekspor data kehadiran tamu ke CSV dengan proteksi formula injection dan UTF-8 BOM.
import { NextRequest, NextResponse } from "next/server";
import { getCommitteeAuth } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // Ambil data status seluruh tamu dari view guest_status
  const { data: guests, error } = await db
    .from("guest_status")
    .select("full_name, category, status, checked_in_at, checked_out_at")
    .order("full_name", { ascending: true });

  if (error || !guests) return fail("internal");

  // Ambil sumber absensi (qr / manual)
  const { data: logSources } = await db
    .from("attendance_logs")
    .select("guest_id, type, source");

  const sourceMap = new Map<string, string>();
  for (const l of logSources || []) {
    sourceMap.set(`${l.guest_id}_${l.type}`, l.source);
  }

  const header = ["Nama", "Kategori", "Status", "Jam Masuk (WIB)", "Jam Pulang (WIB)", "Durasi Hadir"];
  const rows: string[] = [header.map(escapeCsvCell).join(",")];

  for (const g of guests) {
    const statusLabel =
      g.status === "di_dalam"
        ? "Di Dalam"
        : g.status === "sudah_pulang"
          ? "Sudah Pulang"
          : "Belum Hadir";

    const inWib = g.checked_in_at ? formatWib(g.checked_in_at) : "-";
    const outWib = g.checked_out_at ? formatWib(g.checked_out_at) : "-";
    const duration = calculateDuration(g.checked_in_at, g.checked_out_at);

    rows.push(
      [
        escapeCsvCell(g.full_name),
        escapeCsvCell(g.category || "-"),
        escapeCsvCell(statusLabel),
        escapeCsvCell(inWib),
        escapeCsvCell(outWib),
        escapeCsvCell(duration),
      ].join(",")
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
