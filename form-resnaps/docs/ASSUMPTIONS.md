# ASSUMPTIONS

Catatan keputusan dan asumsi (§0.1 butir 6). Setiap asumsi dicatat di sini lalu pekerjaan dilanjutkan.

## Ringkasan pemahaman (P00.1)
- Sistem absensi web mobile-first untuk Closing Party CHRYSALIS (brand RE:SNAPS).
- QR **dinamis** ditampilkan dari dashboard panitia; token berganti tiap 30 dtk; mode Masuk/Pulang dipilih per layar.
- Satu scan = satu sesi (cookie `rs_session`, TTL 10 menit, sekali pakai) = satu absen.
- Hanya tamu terdaftar; nama dipilih dari daftar hasil pencarian via API server; konfirmasi sebelum simpan.
- Absen dijalankan lewat RPC atomik Postgres + `UNIQUE(guest_id, type)`.
- Panitia login via Supabase Auth + allowlist `committee_members`; role `admin` dan `committee`.
- Stack: Next.js App Router + TS, Tailwind, Supabase, zod, qrcode, vitest, playwright, pnpm, Vercel.
- Fail-closed pada semua kondisi ragu.

## Asumsi operasional
| # | Asumsi | Alasan | Status |
|---|---|---|---|
| A1 | Kode berada di `form-resnaps/` di root repo | Root berisi config repo dan skill agent | Berlaku |
| A2 | Next.js 16 (template terbaru); mengikuti `AGENTS.md` | `create-next-app@latest` | Berlaku |
| A3 | Logo belum ada: pakai placeholder `TODO-ASSET` | §0.1 butir 5 | Berlaku |
| A4 | Tipografi: Plus Jakarta Sans (default §7) | Belum ada panduan resmi | Belum dipasang (P02.3) |
| A5 | Verifikasi tambahan (4 digit) nonaktif, flag `verification_mode=false` | D14 | Rencana |
| A6 | Mode QR dibawa di token (ditandatangani) **atau** dicoba dua kali — pilihan dibuat di P05.2, dicatat di sini | §5.5 memberi kebebasan | Belum diputuskan |
| A7 | Rate limit: Upstash atau Vercel Firewall — dicatat saat P05.9 | §P05.9 | Belum diputuskan |

## Pertanyaan terbuka (§12) — belum dijawab
Jawaban manusia belum ada. Sampai dijawab, asumsi default di atas dipakai. Lihat `PROGRESS.md` > Blocker.

## Keputusan P05 (2026-10-16)
| # | Keputusan | Alasan |
|---|---|---|
| A8 | Mode QR **tidak** ditulis di token. Server mencoba `in` lalu `out` pada HMAC yang sama (§5.5 opsi default). | Lebih sedikit bentuk token; mode tetap ditandatangani. |
| A9 | `start_scan_session` menerima `key_version` dari token (divalidasi terhadap `qr_key_version` di `loadQrConfig`). | Token lama dari versi kunci sebelumnya ditolak sebagai `token_revoked` sebelum sesi dibuat. |
| A10 | Cookie `rs_session` berisi `{sessionId}.{hmac}`. Status sesi (konsumsi, kedaluwarsa, key_version) selalu diperiksa di DB (`lookupSession`). | Cookie tidak bisa dipalsukan; tidak bergantung pada isi cookie untuk status. |
| A11 | Cookie dihapus server-side setelah absen sukses. Tes ulang dengan cookie yang sama mengembalikan `session_used` (bukan `session_invalid`). | Keduanya menolak; `session_used` lebih informatif. Tidak mengubah kontrak RPC. |
| A12 | `export const dynamic` dihapus dari route handler karena `cacheComponents: true` di `next.config.ts` menolaknya. Route tetap dinamis (`ƒ`). | Build production gagal jika dipertahankan. |
| A13 | Secret dev `QR_SIGNING_SECRET` dan `SESSION_COOKIE_SECRET` dibuat acak 32 byte di `.env.local`. Production wajib nilai berbeda (P14.3). | §0.1 butir 7 dan §3.1. |
| A14 | **P05.9 rate limit belum diimplementasikan.** Pilihan Upstash vs Vercel Firewall perlu keputusan user dan akun Vercel (P01.6). | Rate limit in-memory tidak andal di Vercel serverless. |

## Verifikasi P05 (lokal → Supabase remote)
- 16 unit test `lib/qr-token` lulus (jendela, grace, masa depan, tanda tangan rusak, indeks digeser, versi kunci lama, secret lain, format salah).
- Server production + Supabase remote: session start valid (200, `no-store`, cookie HttpOnly/Secure/SameSite=lax, Max-Age=600); token rusak → `token_invalid`; versi salah → `token_revoked`; indeks masa depan → `token_invalid`; indeks lama → `token_expired`; search tanpa cookie → 401; q<2 → 400; search valid → maks 8 `{id,name,category}`; submit → 200; reuse → 409 `session_used`; absen kedua → 409 `already_in`.
- Bundle client `.next/static` tidak mengandung `QR_SIGNING_SECRET`, `SESSION_COOKIE_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, atau password DB.
- Data uji dibersihkan; `checkin_open` dikembalikan ke `false`.
