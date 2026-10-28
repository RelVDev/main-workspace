/**
 * P04: Pipeline Import Spreadsheet → Supabase.
 *
 * Penggunaan:
 *   npx tsx scripts/import-guests.ts [data/file.csv] [--commit] [--batch=NAMA_BATCH]
 *
 * Default: --dry-run (tidak menulis ke database).
 * Gunakan --commit untuk benar-benar menulis ke Supabase.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/types";

// Fungsi normalisasi JS yang identik dengan normalize_name() di PostgreSQL.
import { normalizeNameJs } from "../lib/normalize";
export { normalizeNameJs };

export function cleanField(val: unknown): string {
  if (val === null || val === undefined) return "";
  return String(val)
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type RawRow = {
  nama?: string;
  kategori?: string;
  kontak?: string;
  catatan?: string;
  alergi?: string;
  alergi_makanan?: string;
  htm?: string;
  status_htm?: string;
};

type ValidGuest = {
  line: number;
  full_name: string;
  name_search: string;
  category: string | null;
  contact: string | null;
  allergies: string | null;
  notes: string | null;
  payment_status: "lunas" | "belum_lunas";
};

type RowIssue = {
  line: number;
  reason: string;
  raw: string;
};

async function main() {
  const args = process.argv.slice(2);
  const isCommit = args.includes("--commit");
  const batchArg = args.find((a) => a.startsWith("--batch="))?.split("=")[1];
  const fileArg = args.find((a) => !a.startsWith("--"));

  const defaultCsv = resolve("data/guests.csv");
  const targetFile = fileArg ? resolve(fileArg) : defaultCsv;

  if (!existsSync(targetFile)) {
    console.error(`Error: Berkas CSV tidak ditemukan di "${targetFile}".`);
    console.error(`Letakkan berkas CSV di folder data/ atau berikan path berkas sebagai argumen.`);
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const batchName = batchArg || `${today}-import-${Date.now().toString().slice(-4)}`;

  console.log(`=== RE:SNAPS Guest Import Pipeline ===`);
  console.log(`Berkas : ${targetFile}`);
  console.log(`Mode   : ${isCommit ? "COMMIT (menulis ke database)" : "DRY-RUN (hanya simulasi)"}`);
  console.log(`Batch  : ${batchName}\n`);

  const fileContent = readFileSync(targetFile, "utf-8");
  const records = parse(fileContent, {
    columns: (header: string[]) =>
      header.map((col) => col.trim().toLowerCase().replace(/^["']|["']$/g, "")),
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  }) as RawRow[];

  const validGuests: ValidGuest[] = [];
  const invalidRows: RowIssue[] = [];
  const conflictRows: RowIssue[] = [];
  const twinWarnings: string[] = [];

  // Peta untuk mendeteksi duplikat intra-CSV
  const seenKeyToLine = new Map<string, number>();

  records.forEach((row, idx) => {
    const lineNum = idx + 2; // Baris 1 adalah header
    const name = cleanField(row.nama);
    const category = cleanField(row.kategori) || null;
    const contact = cleanField(row.kontak) || null;
    const allergies = cleanField(row.alergi_makanan || row.alergi) || null;
    const rawNotes = cleanField(row.catatan) || null;
    const notes = allergies
      ? rawNotes
        ? `${rawNotes} | Alergi Makanan: ${allergies}`
        : `Alergi Makanan: ${allergies}`
      : rawNotes;
    const htmRaw = cleanField(row.status_htm || row.htm).toLowerCase();
    const paymentStatus: "lunas" | "belum_lunas" =
      htmRaw.includes("belum") || htmRaw === "unpaid" || htmRaw === "hold"
        ? "belum_lunas"
        : "lunas";

    if (!name) {
      invalidRows.push({ line: lineNum, reason: "Nama wajib diisi", raw: JSON.stringify(row) });
      return;
    }
    if (name.length > 120) {
      invalidRows.push({
        line: lineNum,
        reason: `Nama terlalu panjang (maks 120 karakter, terhitung ${name.length})`,
        raw: name,
      });
      return;
    }

    const nameSearch = normalizeNameJs(name);
    const dedupeKey = `${nameSearch}__${category ? normalizeNameJs(category) : ""}`;

    if (seenKeyToLine.has(dedupeKey)) {
      conflictRows.push({
        line: lineNum,
        reason: `Duplikat persis dengan baris ${seenKeyToLine.get(dedupeKey)} (nama & kategori sama)`,
        raw: `${name} [${category ?? "tanpa kategori"}]`,
      });
      return;
    }

    seenKeyToLine.set(dedupeKey, lineNum);
    validGuests.push({
      line: lineNum,
      full_name: name,
      name_search: nameSearch,
      category,
      contact,
      allergies,
      notes,
      payment_status: paymentStatus,
    });
  });

  // Hubungkan ke database untuk cek data eksisting dan eksekusi
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    console.error("Error: NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diset di environment.");
    process.exit(1);
  }

  const db = createClient<Database>(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Ambil tamu yang sudah ada di database untuk deteksi duplikat / idempoten
  const { data: existingGuests, error: fetchErr } = await db
    .from("guests")
    .select("id, full_name, name_search, category");

  if (fetchErr) {
    console.error("Error mengambil data tamu yang sudah ada:", fetchErr.message);
    process.exit(1);
  }

  const dbSeenKeys = new Set(
    (existingGuests || []).map((g) => `${g.name_search}__${g.category ? normalizeNameJs(g.category) : ""}`)
  );

  const toInsert: ValidGuest[] = [];
  const alreadyExist: ValidGuest[] = [];

  for (const guest of validGuests) {
    const key = `${guest.name_search}__${guest.category ? normalizeNameJs(guest.category) : ""}`;
    if (dbSeenKeys.has(key)) {
      alreadyExist.push(guest);
    } else {
      toInsert.push(guest);
      dbSeenKeys.add(key); // Mencegah duplikasi ganda dalam batch
    }

    // Deteksi nama kembar beda kategori (diizinkan, beri info)
    const sameNameDiffCat = (existingGuests || []).some(
      (g) =>
        g.name_search === guest.name_search &&
        (g.category ? normalizeNameJs(g.category) : "") !== (guest.category ? normalizeNameJs(guest.category) : "")
    );
    if (sameNameDiffCat) {
      twinWarnings.push(
        `Baris ${guest.line}: "${guest.full_name}" (${guest.category ?? "tanpa kategori"}) memiliki nama kembar di database dengan kategori berbeda.`
      );
    }
  }

  // Ringkasan
  const reportLines: string[] = [
    `=== LAPORAN IMPORT TAMU RE:SNAPS ===`,
    `Waktu Pelaksanaan : ${new Date().toISOString()}`,
    `Berkas Sumber     : ${targetFile}`,
    `Batch             : ${batchName}`,
    `Status Eksekusi   : ${isCommit ? "COMMITTED" : "DRY-RUN (Simulasi)"}`,
    `----------------------------------------`,
    `Total baris CSV dibaca  : ${records.length}`,
    `Baris tidak valid       : ${invalidRows.length}`,
    `Konflik duplikat di CSV : ${conflictRows.length}`,
    `Sudah ada di database   : ${alreadyExist.length} (dilewati)`,
    `Siap / Berhasil diimpor : ${toInsert.length}`,
    `Peringatan nama kembar  : ${twinWarnings.length}`,
    `----------------------------------------`,
  ];

  if (invalidRows.length > 0) {
    reportLines.push("\n[BARIS TIDAK VALID]");
    invalidRows.forEach((r) => reportLines.push(`- Baris ${r.line}: ${r.reason} -> ${r.raw}`));
  }

  if (conflictRows.length > 0) {
    reportLines.push("\n[KONFLIK DUPLIKAT DI DALAM CSV]");
    conflictRows.forEach((r) => reportLines.push(`- Baris ${r.line}: ${r.reason} -> ${r.raw}`));
  }

  if (twinWarnings.length > 0) {
    reportLines.push("\n[CATATAN NAMA KEMBAR (DIIZINKAN)]");
    twinWarnings.forEach((w) => reportLines.push(`- ${w}`));
  }

  if (toInsert.length > 0) {
    reportLines.push("\n[TAMU YANG DIIMPOR]");
    toInsert.slice(0, 20).forEach((g) => reportLines.push(`+ [Baris ${g.line}] ${g.full_name} (${g.category ?? "-"})`));
    if (toInsert.length > 20) {
      reportLines.push(`... dan ${toInsert.length - 20} tamu lainnya.`);
    }
  }

  const reportText = reportLines.join("\n");
  console.log(reportText);

  // Jika COMMIT, lakukan penulisan DB dan audit log
  if (isCommit && toInsert.length > 0) {
    const payload = toInsert.map((g) => ({
      full_name: g.full_name,
      name_search: g.name_search,
      category: g.category,
      contact: g.contact,
      notes: g.notes,
      import_batch: batchName,
    }));

    const { error: insertErr } = await db.from("guests").insert(payload);
    if (insertErr) {
      console.error("\n❌ Gagal menyimpan tamu ke database:", insertErr.message);
      process.exit(1);
    }

    // Catat ke audit_logs (P04.9)
    await db.from("audit_logs").insert({
      action: "import",
      meta: {
        batch: batchName,
        total_read: records.length,
        inserted: toInsert.length,
        skipped_existing: alreadyExist.length,
        invalid: invalidRows.length,
        conflicts: conflictRows.length,
      },
    });

    console.log(`\n✅ Berhasil menyimpan ${toInsert.length} tamu ke Supabase dan mencatat audit log.`);
  } else if (!isCommit) {
    console.log(`\nℹ️ Ini adalah simulasi (--dry-run). Tidak ada perubahan data di database.`);
    console.log(`Untuk melakukan import, jalankan ulang perintah dengan menambahkan bendera '--commit'.`);
  }

  // Tulis laporan ke file di folder data/
  mkdirSync("data", { recursive: true });
  const reportPath = resolve(`data/import-report-${batchName}.txt`);
  writeFileSync(reportPath, reportText, "utf-8");
  console.log(`Laporan disimpan di: ${reportPath}`);
}

main().catch((err) => {
  console.error("Terjadi kesalahan fatal:", err);
  process.exit(1);
});
