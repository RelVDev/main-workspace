# RE:SNAPS Attendance Architecture & Security Skill

## Overview
Panduan arsitektur sistem absensi QR dinamis RE:SNAPS untuk Closing Party CHRYSALIS. Sumber kebenaran tunggal adalah `form-resnaps/PLANNING-RESNAPS-ATTENDANCE.md`.

## Prinsip Inti Arsitektur

### 1. Prinsip Keamanan & Fail-Closed
- **Fail-Closed:** Bila ragu (token kedaluwarsa, sesi habis, koneksi terputus, absen ditutup), sistem menolak dan menampilkan pesan ramah berbahasa Indonesia. Tidak pernah mencatat absen "untuk jaga-jaga".
- **Rahasia Server-Only:** `SUPABASE_SERVICE_ROLE_KEY`, `QR_SIGNING_SECRET`, dan `SESSION_COOKIE_SECRET` wajib berada di server (`import 'server-only'`). Tidak boleh bocor ke bundle client (`.next/static`).
- **Zona Waktu:** Simpan selalu dalam `timestamptz` (UTC di Postgres); tampilkan selalu dalam **WIB (Asia/Jakarta)** di seluruh UI dan laporan ekspor.
- **Anti-Scraping Data Tamu:** Kolom `contact` dan `notes` tidak pernah dikirim ke browser tamu. Pencarian dibatasi minimal 2 huruf dan maksimal 8 hasil.

### 2. Mesin Token QR & Siklus Hidup Sesi
- **Token QR Dinamis:** Format stateless `{keyVersion}.{idx}.{sig}`.
  - Berganti tiap $W$ detik (default 30s), grace 1 window.
  - Tanda tangan HMAC-SHA256 dipotong 16 byte (`base64url`).
  - Mode (`in` / `out`) tidak ditulis di token melainkan ditandatangani; verifikasi mencoba kedua mode.
- **Sesi Scan (`rs_session`):**
  - Cookie HttpOnly, Secure, SameSite=Lax, Path=/, TTL 10 menit (600s).
  - Berisi `{sessionId}.{hmac}` ditandatangani `SESSION_COOKIE_SECRET`.
  - Satu scan = satu sesi = satu absen. Sesi dikonsumsi atomik di database RPC saat absen sukses.
  - Setelah sukses, cookie dibersihkan; pemakaian ulang ditolak sebagai `session_used`.

### 3. Database & Concurrency
- `UNIQUE(guest_id, type)` mencegah duplikasi masuk/pulang ganda.
- Transaksi atomik via RPC PostgreSQL (`check_in`, `check_out`, `manual_attendance`, `undo_attendance`, `revoke_all_sessions`).
- RLS aktif di seluruh tabel: role `anon` tidak memiliki akses langsung. Role `authenticated` hanya membaca jika terdaftar di `committee_members`.

### 4. Definisi Selesai (DoD Global)
- `pnpm lint`, `pnpm typecheck`, `pnpm test` lulus 100%.
- `pnpm build` sukses tanpa error Turbopack.
- Verifikasi visual di mobile (360px) dan desktop (1280px) tanpa overflow horizontal.
- Tidak ada secret di commit git (`.env*` gitignored kecuali `!.env.example`).
