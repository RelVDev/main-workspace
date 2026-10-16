# PROGRESS

## Status saat ini
Phase aktif: P01 — Setup Repo, Tooling, dan Vercel (menunggu konfirmasi sebelum P02)
Terakhir diperbarui: 2026-10-16 (WIB)

## Ringkasan phase
| Phase | Status (todo/doing/done/blocked) | Catatan | Tanggal selesai |
|---|---|---|---|
| P00 | done | Ringkasan dan asumsi di `docs/ASSUMPTIONS.md`. Aset & jawaban §12 masih kosong (lihat Blocker). | 2026-10-16 |
| P01 | blocked | Kode, scripts, struktur, dan verifikasi lokal selesai. Push ke GitHub selesai. Hubungan Vercel belum: butuh akses akun Vercel. | |
| P02 | todo | | |
| P03 | todo | Butuh project Supabase (P03.1). | |
| P04–P16 | todo | | |

## Log task
- [x] P00.1 Baca PLANNING.md penuh — `docs/ASSUMPTIONS.md`
- [x] P00.2 Buat PROGRESS.md
- [x] P00.5 `docs/DATA-TEMPLATE.md` (Lampiran B)
- [x] P01.1 create-next-app (Next.js 16.4.1, App Router, TS, Tailwind, ESLint, tanpa `src`)
- [x] P01.2 Dependensi produksi dan dev terpasang
- [x] P01.3 Scripts: dev, build, start, lint, typecheck, test, test:e2e, format, import:guests
- [x] P01.4 Struktur folder §8, `.env.example`, `.gitignore` (`.env*`, `/data/`)
- [x] P01.5 `robots` (`noindex, nofollow`) di layout + `app/robots.ts` disallow `/`
- [ ] P01.6 Hubungkan ke Vercel (preview aktif) — BLOCKED: butuh akun/akses Vercel
- [x] P01.7 Halaman `/` placeholder "RE:SNAPS — Sistem Absensi"

## Keputusan & asumsi baru
- 2026-10-16 — Kode aplikasi ditaruh di `form-resnaps/` (bukan root repo) — root berisi `.git`, `.github`, `.claude`, `.omp`; `form-resnaps/` juga satu folder dengan dokumen plan.
- 2026-10-16 — `pnpm-workspace.yaml` template: `esbuild: true` (postinstall esbuild wajib), `sharp`/`unrs-resolver` tetap `false`.
- 2026-10-16 — `.gitignore`: `.env*` diikuti `!.env.example` agar template env ter-commit.
- 2026-10-16 — Next.js 16 membawa `AGENTS.md` dari template; dibaca dan diikuti.

## Blocker / butuh input manusia
- P01.6: akses akun Vercel dan izin menghubungkan repo `RelVDev/main-workspace` (subfolder `form-resnaps/`, root directory perlu diset di Vercel).
- P00.3 / §12: logo SVG RE:SNAPS, spreadsheet tamu, tanggal/jam/venue, email panitia, kredensial Supabase, jumlah layar QR & perangkat, dan jawaban §12 lainnya.

## Aset TODO-ASSET
- [ ] logo.svg — penanggung jawab: <belum ditentukan>
- [ ] Panduan merek resmi (tipografi, bentuk sudut) — penanggung jawab: <belum ditentukan>
