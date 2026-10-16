# PROGRESS

## Status saat ini
Phase aktif: P07 selesai. Berikutnya: P08 Halaman Absen Masuk (/masuk).
Terakhir diperbarui: 2026-10-16 (WIB)

## Ringkasan phase
| Phase | Status (todo/doing/done/blocked) | Catatan | Tanggal selesai |
|---|---|---|---|
| P00 | done | Ringkasan dan asumsi di `docs/ASSUMPTIONS.md`. Aset & jawaban §12 masih kosong (lihat Blocker). | 2026-10-16 |
| P01 | blocked | Kode, scripts, struktur, dan verifikasi lokal selesai. Push ke GitHub selesai. Hubungan Vercel belum: butuh akses akun Vercel. | |
| P02 | done | Design system, token Lampiran A, komponen UI, katalog `/_design` (dev only). Kontras di `docs/CONTRAST.md`. Verifikasi 360 px & 1280 px. | 2026-10-16 |
| P03 | done | Migrasi 0001–0006 + seed + tes RPC (15/15) + konkurensi (20 paralel) lulus di Supabase remote (Postgres 17.11). RLS & grant terverifikasi. P03.1 (env ke Vercel) menunggu P01.6. | 2026-10-16 |
| P04 | done | Pipeline `scripts/import-guests.ts`, idempoten, deteksi duplikat intra-CSV & DB, validasi, normalisasi unaccent, audit log, `docs/RUNBOOK.md`. | 2026-10-16 |
| P05 | done | Mesin token QR, sesi cookie, route API search/submit/me, zod, unit test 16/16, e2e remote pass, rate limit DB-backed (`0007_rate_limit.sql` & `lib/rate-limit.ts`). | 2026-10-16 |
| P06 | done | Autentikasi panitia Supabase SSR (`client.ts`, `server.ts`), Next.js 16 `proxy.ts`, `/panitia/login` (Suspense), role matrix (`admin` vs `committee`), logout, `scripts/add-committee.ts`. | 2026-10-16 |
| P07 | done | Layar QR dinamis (`QrDisplay.tsx`), `/panitia/qr`, route `/api/panitia/qr-token`, `/api/panitia/toggle-open`, `/api/panitia/counter`. Fail-closed, hitung mundur 30s, prefetch token, fullscreen & wake lock, kunci kontrol. | 2026-10-16 |
| P08–P16 | todo | Belum dikerjakan. | |

## Log task
- [x] P02.1–P02.7 (tokens, Tailwind map, font, Logo/BrandHeader, komponen UI, /_design, docs/CONTRAST.md) — commit 875fa1e
- [x] P00.1 Baca PLANNING.md penuh — `docs/ASSUMPTIONS.md`
- [x] P00.2 Buat PROGRESS.md
- [x] P00.5 `docs/DATA-TEMPLATE.md` (Lampiran B)
- [x] P01.1 create-next-app (Next.js 16.4.1, App Router, TS, Tailwind, ESLint, tanpa `src`)
- [x] P01.2 Dependensi produksi dan dev terpasang
- [x] P01.3 Scripts: dev, build, start, lint, typecheck, test, test:e2e, format, import:guests
- [x] P01.4 Struktur folder §8, `.env.example`, `.gitignore` (`.env*`, `/data/`)
- [x] P01.5 `robots` (`noindex, nofollow`) di layout + `app/robots.ts` disallow `/`
- [~] P05.1–P05.8, P05.10–P05.12 — lihat `docs/ASSUMPTIONS.md` (A8–A14)
- [ ] P05.9 Rate limit — BELUM (perlu keputusan Upstash vs Vercel Firewall)
- [ ] P01.6 Hubungkan ke Vercel (preview aktif) — BLOCKED: butuh akun/akses Vercel
- [x] P03.1 Project Supabase `beoumgkolvusnscovhab` (region ap-southeast-2 via pooler); kredensial di `.env.local` (gitignored)
- [x] P03.2–P03.8 Migrasi 0001–0006, `supabase/seed.sql` (31 tamu dev)
- [x] P03.9 Tes SQL: `supabase/tests/rpc_scenarios.sql` 15/15 + konkurensi 10×2 paralel (1 ok)
- [x] P03.10 `lib/supabase/types.ts` digenerate dari skema
- [x] P01.7 Halaman `/` placeholder "RE:SNAPS — Sistem Absensi"

## Keputusan & asumsi baru
- 2026-10-16 — Folder `app/_design` diberi nama `%5Fdesign` karena folder `_` diabaikan App Router; URL tetap `/_design`.
- 2026-10-16 — `todo` tool otomatis memulai phase berikutnya saat yang aktif diblokir. Status di repo hanya mencatat yang benar-benar dikerjakan.
- 2026-10-16 — Kode aplikasi ditaruh di `form-resnaps/` (bukan root repo) — root berisi `.git`, `.github`, `.claude`, `.omp`; `form-resnaps/` juga satu folder dengan dokumen plan.
- 2026-10-16 — `pnpm-workspace.yaml` template: `esbuild: true` (postinstall esbuild wajib), `sharp`/`unrs-resolver` tetap `false`.
- 2026-10-16 — `.gitignore`: `.env*` diikuti `!.env.example` agar template env ter-commit.
- 2026-10-16 — Next.js 16 membawa `AGENTS.md` dari template; dibaca dan diikuti.

## Blocker / butuh input manusia
- Rotasi kredensial: password DB, `sb_secret_…`, dan service_role JWT lama sudah tampil di chat. Rotasi lalu perbarui `.env.local`.
- Warning migrasi `no privileges could be revoked` untuk fungsi ekstensi pg_trgm/unaccent di schema public — tidak menggagalkan, belum dirapikan.
- Tes committee-allowed di remote belum dijalankan (butuh user auth nyata); sudah lulus di Postgres lokal dengan stub auth.
- P01.6: akses akun Vercel dan izin menghubungkan repo `RelVDev/main-workspace` (subfolder `form-resnaps/`, root directory perlu diset di Vercel).
- P00.3 / §12: logo SVG RE:SNAPS, spreadsheet tamu, tanggal/jam/venue, email panitia, kredensial Supabase, jumlah layar QR & perangkat, dan jawaban §12 lainnya.

## Aset TODO-ASSET
- [ ] logo.svg — penanggung jawab: <belum ditentukan>
- [ ] Panduan merek resmi (tipografi, bentuk sudut) — penanggung jawab: <belum ditentukan>
