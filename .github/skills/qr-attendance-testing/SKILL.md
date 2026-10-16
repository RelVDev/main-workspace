# QR Attendance Verification & Testing Skill

## Overview
Panduan pengujian otomatis untuk memverifikasi logika token dinamis, sesi scan, konkurensi database, dan uji responsif visual.

## Strategi Pengujian

### 1. Unit Testing (Vitest)
- Lokasi: `tests/unit/**/*.test.ts`
- Pola Waktu Terinjeksi:
  - Jangan gunakan `Date.now()` mentah di dalam fungsi murni.
  - Berikan parameter `nowMs` eksplisit agar pengujian dapat menguji batas jendela detik ke-29, detik ke-30, masa grace, masa depan, dan token kedaluwarsa.
- Kasus Uji Wajib Token QR:
  - Token valid jendela sekarang ($W=30s$).
  - Token valid masa grace ($W-1$).
  - Penolakan token masa depan ($W+1$).
  - Penolakan manipulasi tanda tangan 1 karakter.
  - Penolakan versi kunci lama (`keyVersion` tidak cocok).
  - Penolakan format malformed (kurang segmen, karakter non-digit).

### 2. Pengujian Konkurensi Database
- Uji race condition pada registrasi kehadiran:
  - Dua panggilan `check_in` paralel pada sesi yang sama -> tepat 1 berhasil (`ok`), 1 ditolak (`session_used`).
  - Dua panggilan `check_in` paralel untuk tamu yang sama dengan dua sesi berbeda -> tepat 1 berhasil (`ok`), 1 mengembalikan (`already_in`), dan tepat 1 sesi yang terkonsumsi.
  - Verifikasi integritas constraint `UNIQUE(guest_id, type)`.

### 3. Pengujian Visual & E2E (Playwright)
- Verifikasi viewport wajib:
  - Mobile: `360 × 780` px (iPhone SE / Android ringkas).
  - Desktop: `1280 × 800` px.
  - Layar QR: `1920 × 1080` px dan resolusi tablet.
- Pemeriksaan Overflow:
  - `document.documentElement.scrollWidth <= document.documentElement.clientWidth` (0px horizontal overflow).
- Keterbacaan QR:
  - Pastikan QR SVG dirender dengan kontras tajam hitam di atas putih dan quiet zone minimum 4 modul.
