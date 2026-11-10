# Budi & Rumah Pintar (IoT) — animasi 9:16 (Remotion)

Animasi kartun 2D vektor datar (SVG murni), 1080x1920, 30 fps. Narasi, musik lembut, dan SFX
sudah masuk komposisi, jadi satu perintah render menghasilkan MP4 bersuara + subtitle.

## Cara pakai

```bash
npm install
npm run render        # hasil: out/budi-iot.mp4
```

Opsional: `npm run dev` (Remotion Studio), `npm run typecheck` (`tsc --noEmit`).

## Isi penting

- `public/narasi.mp3` — suara final (hanya dibaca untuk durasi + diputar). Durasi video = durasi MP3 + 1 detik, dihitung otomatis.
- `public/timing.json` — timing adegan (detik). **Satu kalimat = satu adegan, wajib 30 entri.**
  Adegan i berjalan dari `start` entri i sampai `start` entri berikutnya. Subtitle tampil dari `start` sampai `end`.
- `public/music.wav`, `public/sfx/*.wav` — disintesis oleh `scripts/synth-audio.mjs` (`npm run audio` untuk membuat ulang). Musik 120 dtk (cukup untuk narasi sampai ±118 dtk).
- `data/naskah.txt` — naskah.
- `src/camera.ts` — pan/zoom kamera per adegan. `src/cues.ts` — penempatan SFX (relatif terhadap adegan, ikut timing.json). `src/choreo.ts` — gerak Budi.

## Mengisi timing dari SRT

```bash
node scripts/srt-to-timing.mjs path/narasi.srt
```

PENTING: `narasi.srt` tidak ikut terlampir saat project ini dibuat, jadi `public/timing.json` yang ada
adalah PERKIRAAN (dihitung dari penanda jeda `<#x#>` di naskah + durasi MP3, bisa meleset ±0,5 dtk).
Jalankan perintah di atas dengan SRT aslimu supaya adegan & subtitle pas dengan suara.
Boleh juga edit angka di `timing.json` langsung.
