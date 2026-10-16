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
