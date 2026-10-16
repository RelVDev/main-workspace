# RE:SNAPS Brand Tokens & Tailwind Design System Skill

## Overview
Panduan implementasi visual RE:SNAPS sesuai dokumen Sistem Warna dan Lampiran A PLANNING.md.

## Token Warna & Semantik
| Token CSS | Hex | Peran | Penggunaan |
|---|---|---|---|
| `--color-brand-blue` | `#1677B8` | Identitas Utama | Tombol primer, ikon, tautan, outline fokus |
| `--color-canvas` | `#FFF9F4` | Latar Utama | Latar belakang seluruh halaman (hangat) |
| `--color-surface` | `#FFFFFF` | Permukaan Kartu | Kartu data, modal, panel |
| `--color-surface-soft` | `#FFF0E7` | Permukaan Lembut | Segmented control, banner info sekunder |
| `--color-ink` | `#252339` | Teks Utama | Judul, isi, teks tombol kontras |
| `--color-ink-muted` | `#666476` | Teks Sekunder | Sub-judul, metadata, pembeda kategori |
| `--color-line` | `#E9E2E4` | Border | Pembatas kartu, pemisah, border input |
| `--color-success` | `#267A57` | Berhasil | Badge masuk, status sukses (ikon + teks) |
| `--color-warning` | `#9A5A00` | Perhatian | Status countdown sisa waktu, peringatan |
| `--color-error` | `#B8323A` | Gagal/Tolak | Status absen ditutup, sesi kedaluwarsa |
| `--color-info` | `#236A9A` | Informasi | Petunjuk operasional, badge kepulangan |

## Aturan Desain & Aksesibilitas (WCAG 2.2 AA)
1. **Ketegasan Non-Warna (Ikon + Label):**
   - Status (`StatusBanner`, `Badge`) dilarang hanya mengandalkan warna. Wajib menyertakan ikon tebal + label teks ("BERHASIL", "PERHATIAN", "GAGAL", "INFO").
2. **Pembatasan Gradien:**
   - Gradien (`bg-gradient-brand`) hanya boleh digunakan pada satu titik fokus per layar: strip tipis tepi atas pada `BrandHeader` dan frame luar Layar QR.
   - Area QR wajib hitam di atas putih polos (tanpa gradien, tanpa logo di tengah) demi keterbacaan kamera.
3. **Kontras Teks:**
   - Teks putih dilarang di atas warna emas/kuning/oranye (kontras < 3:1).
   - Teks `ink` (gelap) digunakan di atas permukaan terang (`canvas`, `surface`, `surface-soft`).
4. **Target Sentuh Mobile:**
   - Seluruh elemen interaktif (tombol, input, opsi radio) wajib memiliki tinggi sentuh minimum 48 px.
   - Font input formulir minimal 16 px untuk mencegah zoom otomatis pada browser Safari iOS.
