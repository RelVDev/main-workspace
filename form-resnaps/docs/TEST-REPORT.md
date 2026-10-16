# LAPORAN PENGUJIAN SISTEM — RE:SNAPS (P13)

Hasil pengujian otomatis, uji integrasi, konkurensi, dan pengujian beban ringan untuk sistem absensi RE:SNAPS Closing Party CHRYSALIS.

---

## 1. Ringkasan Hasil Pengujian

| Lapisan Uji | Sasaran | Jumlah Kasus | Status | Bukti |
|---|---|---|---|---|
| **Unit Testing (Vitest)** | Mesin token QR, rotasi jendela, masa grace, penolakan token manipulasi / versi lama, normalisasi nama, format waktu WIB, skema Zod | 30 pengujian | ✅ 100% Lulus | `pnpm test` (0 failures) |
| **Integrasi RPC (PostgreSQL)** | Skenario atomik `check_in`, `check_out`, `manual_attendance`, `undo_attendance`, `revoke_all_sessions`, penolakan tanpa izin | 15 skenario | ✅ 100% Lulus | `supabase/tests/rpc_scenarios.sql` (ALL SCENARIOS PASSED) |
| **Konkurensi Database** | 20 panggilan paralel submit untuk satu tamu | 20 permintaan paralel | ✅ Lulus | Tepat 1 `ok`, 10 `already_in`, 9 `session_used`, tepat 1 baris absen tercipta |
| **Akses RLS** | Verifikasi isolasi role `anon` dan `authenticated` | 7 tabel/view & 4 RPC | ✅ Lulus | `anon` ditolak total (permission denied); non-panitia membaca 0 baris |
| **Rate Limiter (PostgreSQL)** | Uji konkurensi 12 permintaan paralel dengan batas 5 | 12 permintaan paralel | ✅ Lulus | Tepat 5 `true`, 7 `false` (atomik di jendela 60s) |
| **Pipeline Import** | Ekspor CSV Google Sheets, normalisasi, deteksi duplikat intra-CSV & database, idempoten | 3 kali eksekusi | ✅ Lulus | Run 1 dry-run benar; Run 2 insert 3; Run 3 (rerun) insert 0 (dilewati) |
| **E2E Visual (Playwright)** | Responsif pada resolusi 360 px (mobile) dan 1280 px (desktop) | 4 halaman (`/`, `/masuk`, `/keluar`, `/_design`) | ✅ Lulus | Status 200, 0 px horizontal overflow, font Plus Jakarta Sans aktif |
| **Continuous Integration** | Lint, Typecheck, Unit Test, Build | GitHub Actions CI | ✅ Siap | `.github/workflows/ci.yml` |

---

## 2. Rincian Unit Testing (Vitest)
```
 ✓ tests/unit/qr-token.test.ts (16 tests)
   - windowIndex: memotong ke jendela W detik
   - verifyToken: menerima token jendela sekarang (in & out)
   - verifyToken: menerima token jendela sebelumnya (grace 1) dan menolak lebih lama
   - verifyToken: menolak token jendela masa depan
   - verifyToken: menolak manipulasi tanda tangan 1 karakter
   - verifyToken: menolak pergeseran indeks jendela
   - verifyToken: menolak versi kunci lama sebagai revoked
   - verifyToken: menolak secret berbeda
   - verifyToken: menolak format malformed (kosong, kurang bagian, bukan angka, terlalu pendek, terlalu panjang)
   - mintAhead: menghasilkan n+1 token berurutan yang valid pada waktunya
 ✓ tests/unit/time.test.ts (3 tests)
   - formatWib: memformat UTC ke Asia/Jakarta (WIB, UTC+7)
   - formatWib: menerima format custom
   - formatWib: mengembalikan '-' untuk tanggal tidak valid tanpa crash
 ✓ tests/unit/normalize.test.ts (4 tests)
   - normalizeNameJs: lowercase dan collapse whitespace
   - normalizeNameJs: unaccent (Ádhitya -> adhitya, Ñoel -> noel)
   - normalizeNameJs: membersihkan karakter kontrol tersembunyi
   - normalizeNameJs: mengembalikan string kosong untuk input kosong
 ✓ tests/unit/schemas.test.ts (7 tests)
   - searchQuery: minimal 2 karakter, auto-trim, maksimal 60 karakter
   - guestId: validasi format UUID v4
   - tokenInput & mode: validasi input token dan enum mode (in/out)
```

---

## 3. Hasil Uji Konkurensi & Integritas Data
Pada pengujian 20 panggilan submit simultan terhadap satu tamu dengan dua sesi aktif:
- Status hasil: tepat 1 `ok`, 10 `already_in`, dan 9 `session_used`.
- Baris di tabel `attendance_logs`: tepat 1 baris.
- Sesi terkonsumsi di tabel `scan_sessions`: tepat 1 sesi.
- **Kesimpulan:** Integritas relasional aman dari *race condition* dan klik ganda.
