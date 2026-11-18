---
name: pixel-cinema-style
description: Aturan gaya, palet, lighting, kamera, dan konten untuk video animasi pixel art sinematik "Lilin Aromatis dari Minyak Jelantah". Gunakan setiap kali membuat/ mengubah scene, karakter, latar, efek cahaya, transisi, SFX, atau teks kimia di proyek ini.
---

# Pixel Cinema Style

1. Art-space 480×270, scale ×4, `image-rendering: pixelated`. Posisi sprite dibulatkan ke integer. Tanpa rotasi sprite. Tanpa motion blur.
2. Detail tinggi hanya di karakter dan prop utama. Latar sederhana + blur (depth of field). Rack focus untuk fokus naratif.
3. Palet: 32 warna master di `src/data/palette.ts` + 6 per karakter. Warna di luar itu hanya dari efek lighting.
4. Lighting stack wajib (urutan): latar blur → lantai → prop/karakter → rays → point lights → bloom → debu → grade → vignette → grain → letterbox (opsional).
5. Kamera: establishing → push-in pelan; close-up = zoom integer ke sprite biasa; shake hanya di momen impak.
6. Animasi karakter = puppet rig (idle 6 fps stepped, blink acak seeded, mulut dari lipsync/*.json). Tidak ada `Math.random()`; pakai `random(seed)`.
7. Semua timing dalam detik relatif scene dan dijangkarkan ke ID baris dubbing. Tidak hardcode frame.
8. Teks HUD di ruang 1920×1080 memakai font pixel pada kelipatan grid font.
9. Konten kimia: jelantah BUKAN menjadi parafin; pemadatan = fisika; pembakaran = kimia; angka pustaka berlabel DATA PUSTAKA; hasil percobaan berlabel PENGAMATAN KELOMPOK; dilarang mengarang data; pesan keselamatan wajib di S05 dan S09.
10. Audio: tidak ada TTS/suara manusia buatan; SFX non-vokal; ikuti hirarki mix di docs/PLAN.md 8.2; catat lisensi di public/LICENSES.md.
11. Pakai skill remotion-best-practices dan /remotion-docs untuk semua API Remotion; jangan menebak API.
