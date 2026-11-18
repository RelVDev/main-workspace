# PLAN & SYSTEM DESIGN — Video Animasi Pixel Art Sinematik

## "Kimia dalam Kehidupan Sehari-hari: Lilin Aromatis dari Minyak Jelantah"

Praktikum Kimia Dasar · dibuat dengan **Remotion** · dikerjakan oleh **AI coding agent** (Claude Code / Google Antigravity)

> **Dokumen ini adalah single source of truth untuk AI agent.** Baca seluruhnya sebelum menulis kode. Jika ada konflik antara dokumen ini dan asumsi bawaanmu, dokumen ini menang. Jika ada hal yang belum jelas, ikuti aturan "Default & kapan harus bertanya" di Bagian 1.3.

| Item | Nilai |
|---|---|
| Versi dokumen | 1.0 (disusun 18 November 2026) |
| Format | 1920×1080 (16:9), 30 fps, H.264 |
| Durasi target | **±10:06 (18.180 frame)**. **Batas minimum mutlak: 8:00 (14.400 frame)** |
| Gaya | Pixel art sinematik: karakter tajam, latar blur/bokeh, bloom hangat oranye–teal, vignette, grain |
| Suara | Dubbing **manual** (direkam sendiri, **jangan** buat TTS/suara karakter). Agent hanya mengurus SFX, BGM, mixing |
| Karakter | 9 anggota = 9 karakter pixel (Malika, Noya, Marsha, Ayuya, Lovyta, Farel, Sofi, Disa, Ais) |
| Konsep unik | Video dibuka **footage asli**, Malika **menutup kamera dengan tangan**, tangan terbuka → **masuk dunia animasi**. Karakter juga **menonton video praktikum asli** di TV pixel |

---

## 0. Cara pakai dokumen ini (untuk kamu, bukan untuk agent)

1. Buat folder proyek, taruh file ini di `docs/PLAN.md`.
2. Taruh screenshot referensi gaya di `reference/style-frame.png`.
3. Jalankan agent (Claude Code: `claude` di root proyek; Antigravity: buka folder proyek).
4. Tempel **Kickoff Prompt** di bawah.
5. Agent bekerja per fase (Bagian 14). Di setiap **CHECKPOINT** agent akan berhenti dan minta persetujuanmu. Jangan lewati checkpoint karakter dan style frame, karena itu yang paling mahal kalau salah.

### Kickoff Prompt (tempel apa adanya)

```text
Baca docs/PLAN.md sampai habis. Kamu adalah produser teknis + animator kode untuk video
animasi pixel art ini. Kerjakan Fase 0 lalu Fase 1 saja, lalu berhenti di CHECKPOINT-1 dan
tampilkan hasilnya (still PNG) kepadaku. Aturan: pakai skill remotion-best-practices dan
remotion-docs setiap menulis kode Remotion; jangan buat TTS/suara dubbing; jangan mengarang
data, angka, atau hasil percobaan; semua placeholder harus ditandai TODO(user). Commit git
setiap akhir fase.
```

### Yang harus kamu siapkan (checklist user)

- [ ] **Footage asli** (spesifikasi di Bagian 7): intro live-action + klip praktikum + foto produk.
- [ ] **Character sheet 9 anggota** (template di Bagian 5.1). Foto referensi boleh, wajah tidak harus mirip persis.
- [ ] **Bahan lilin & resep sebenarnya** untuk diisi di `src/data/recipe.ts` (naskah awal hanya menulis "bahan pemadat/bahan lilin").
- [ ] **Hasil pengamatan nyata** (tekstur, aroma, kestabilan nyala). Tanpa data nyata, agent hanya boleh menampilkan *kriteria*, bukan angka.
- [ ] **Tugas tiap anggota** untuk `contributions.json` (Bagian 10, S08).
- [ ] **Rekaman dubbing** per baris (Bagian 8.1 dan naskah v2 di Bagian 11).
- [ ] API key (opsional): `PIXELLAB_TOKEN`, `ELEVENLABS_API_KEY`.

---

## 1. Ringkasan proyek & keputusan desain

### 1.1 Alur besar

```text
[S01A Footage asli: kita memperkenalkan diri]
      │  Malika menutup lensa dengan telapak tangan
      ▼  (pixelate ramp → telapak pixel raksasa)
[S01B Tangan "dibuka" → cahaya di sela jari → Dunia Kimia Pixel (panggung tirai hangat)]
      ▼
[S02 Masalah · Malika] → [S03 Konsep Kimia · Noya] → [S04 Penerapan & Analisis · Marsha
   (karakter menonton video praktikum asli di TV pixel)] → [S05 Produk · Ayuya & Lovyta]
→ [S06 Inovasi, Data & Bukti · Farel & Sofi] → [S07 Referensi · Disa]
→ [S08 Kontribusi · Ais] → [S09 Penutup · Semua + kredit]
```

### 1.2 Keputusan desain (agent tidak boleh mengubah tanpa persetujuan user)

| Keputusan | Pilihan | Alasan |
|---|---|---|
| Rasio | 16:9, 1920×1080 | Untuk presentasi/kelas dan upload kelas. Versi vertikal 9:16 bisa jadi komposisi kedua nanti |
| Resolusi seni (art-space) | **480×270, di-scale ×4** (`PX = 4`) | Pixel besar dan tegas seperti referensi, render murah, mudah dikontrol |
| Detail seni | Detail tinggi **hanya** di karakter & prop utama. Latar sengaja sederhana lalu di-blur (depth of field) | Meniru screenshot referensi dan mengurangi beban gambar |
| Animasi karakter | **Puppet rig berlapis** (layer PNG + kode), bukan frame-by-frame penuh | 9 karakter × 8 menit tidak realistis jika digambar per frame |
| Lip-sync | Dianalisis dari WAV dubbing, hasilnya JSON mulut per frame | Deterministik, render cepat |
| Durasi scene | Diturunkan dari panjang audio dubbing, dengan **lantai** durasi rencana | Menjamin ≥ 8 menit walau dubbing dibaca cepat |
| Footage asli | Disisipkan via `<Video>` dari `@remotion/media`, ada mode diegetik (di TV) dan mode bukti (layar penuh tanpa filter) | Bukti praktikum harus tetap terlihat asli |

### 1.3 Default & kapan harus bertanya

Agent **bertanya ke user (dan berhenti)** hanya untuk: (a) persetujuan CHECKPOINT, (b) data hasil percobaan yang belum ada, (c) bahan/takaran resep, (d) memilih jalur pembuatan karakter jika API key tidak tersedia. Untuk semua hal lain, pakai default di dokumen ini dan tandai asumsi dengan komentar `// ASSUMPTION:`.

### 1.4 Aturan konten (WAJIB, ini tugas kimia, akurasi nilai tinggi)

1. **Minyak jelantah tidak berubah menjadi parafin.** Visualisasi tidak boleh menunjukkan jelantah "berubah" jadi lilin/parafin.
2. Pemadatan = **perubahan fisika**. Pembakaran = **perubahan kimia**. Penyaringan/pencampuran = pemisahan/pencampuran fisika.
3. Angka dari pustaka: **898 ribu ton/tahun** (IPOSS, prosiding ICMCER 2024), **64,3%** dari **140 rumah tangga** (Katadata Insight Center, 2020). Selalu diberi label **"data pustaka"**, bukan hasil eksperimen kelompok.
4. **Dilarang mengarang** hasil uji (angka tekstur, kekuatan aroma, durasi nyala, dsb). Tanpa data user, tampilkan kriteria + placeholder `TODO(user)`.
5. Pesan keselamatan wajib tampil di S05 dan S09: lilin **bukan untuk dikonsumsi**, jelantah **tidak dipakai memasak lagi**, uji nyala **dengan pengawasan, di tempat aman, jauh dari benda mudah terbakar**.
6. Jangan menampilkan merek dagang, karakter berhak cipta, atau musik/SFX tanpa lisensi jelas. Catat semuanya di `public/LICENSES.md`.
7. Fakta tambahan di luar naskah/referensi (mis. hasil pembakaran CO₂ + H₂O) hanya boleh muncul bila diberi tanda `[OPSIONAL]` dan user setuju.

---

## 2. Toolchain lengkap (tools, skill, MCP)

### 2.1 Software di mesin user

| Tool | Fungsi | Wajib? |
|---|---|---|
| Node.js LTS + npm | Menjalankan Remotion | Wajib |
| **FFmpeg + ffprobe** | Normalisasi footage, pixelate ramp, loudness, analisis audio | Wajib |
| Python 3.10+ dengan `Pillow`, `numpy` | Pembuat sprite, pixelize, noise/grain, palette | Wajib |
| Git | Commit per fase | Wajib |
| Aseprite / LibreSprite / Piskel / Pixelorama | Poles manual sprite | Disarankan (salah satu) |
| Claude Code **atau** Google Antigravity | Agent pelaksana | Wajib (salah satu) |
| Editor video (CapCut/Premiere/DaVinci) | Menghasilkan footage asli yang sudah diedit | Wajib (punyamu) |

### 2.2 Agent Skills

| Skill | Sumber | Dipakai untuk | Cara pasang |
|---|---|---|---|
| **Remotion Agent Skills** (berisi `remotion-best-practices`, `remotion-docs`, dan skill lain seperti captions/render) | Resmi Remotion (`remotion-dev/skills`) | Semua kode Remotion: audio, video, transisi, timing, font, caption, efek | Di root proyek: `npx remotion skills add`  (alternatif: `npx skills add remotion-dev/skills`) |
| `remotion-docs` | Bagian dari skill resmi di atas | Mengambil dokumentasi Remotion terbaru, **menggantikan MCP Remotion** | Ikut terpasang |
| **`pixel-cinema-style`** (skill kustom, isi lengkap di Lampiran A) | Dibuat di proyek ini | Menjaga konsistensi gaya, palet, lighting, aturan konten | Salin ke `.claude/skills/pixel-cinema-style/SKILL.md` (Claude Code) atau `.agents/skills/pixel-cinema-style/SKILL.md` (Antigravity) |
| `frontend-design` (opsional) | Anthropic | Hanya jika agent membuat UI overlay yang rumit | Skill bawaan Claude |

Verifikasi: `npx skills list --agent claude-code` (untuk Claude Code). **Mulai sesi agent baru dari root proyek** setelah memasang skill.

> **Catatan penting:** MCP Remotion resmi **sudah dimatikan (26 Oktober 2026)**. Jangan memasangnya. Pakai skill `/remotion-docs`. MCP Remotion pihak ketiga (mis. `remotion-mcp`, `chuk-mcp-remotion`) **tidak dipakai** dalam rencana ini supaya tidak ada ketergantungan pada proyek yang belum tentu terawat.

### 2.3 MCP server

| MCP | Dipakai untuk | Biaya | Wajib? |
|---|---|---|---|
| **ElevenLabs MCP** (tool `text_to_sound_effects`: durasi 0,5–5 dtk; `compose_music` untuk BGM, jika tersedia di versi yang kamu pasang) | Generate SFX & BGM sesuai prompt per scene (Bagian 12) | Memakai kredit API | Opsional, ada fallback gratis |
| **PixelLab MCP** (`create_character`, `animate_character`, tileset) | Karakter full-body 4/8 arah, siklus jalan, tileset latar | Butuh token PixelLab | Opsional (Jalur B, Bagian 6) |
| (tanpa MCP) **Script lokal** | Sintesis SFX 8-bit, sprite builder, analisis lip-sync | Gratis | Fallback utama |

**Peringatan ElevenLabs:** repositori MCP resmi lamanya ditandai tidak lagi aktif dirawat dan mengarahkan ke *hosted MCP server*. Saat setup, cek dokumentasi ElevenLabs terbaru dan pakai opsi yang tersedia. **Jangan pernah memakai tool TTS/voice-nya untuk dubbing.** Semua generate wajib *idempotent*: jangan panggil API jika file SFX sudah ada di `public/sfx/` (hemat kredit).

#### Konfigurasi Claude Code (`.mcp.json` di root proyek)

```json
{
  "mcpServers": {
    "pixellab": {
      "type": "http",
      "url": "https://api.pixellab.ai/mcp",
      "headers": { "Authorization": "Bearer ${PIXELLAB_TOKEN}" }
    },
    "elevenlabs": {
      "command": "uvx",
      "args": ["elevenlabs-mcp"],
      "env": {
        "ELEVENLABS_API_KEY": "${ELEVENLABS_API_KEY}",
        "ELEVENLABS_MCP_BASE_PATH": "./public/sfx/_raw"
      }
    }
  }
}
```

#### Konfigurasi Antigravity

Pindahkan isi `mcpServers` di atas ke `.agents/mcp_config.json` (proyek) atau `~/.gemini/config/mcp_config.json` (global). Skill ditaruh di `.agents/skills/<nama>/SKILL.md`. (Lokasi ini pernah berubah antar versi: jika agent tidak menemukannya, cek dokumentasi Antigravity, dan fallback lama `.agent/`.)

> Agent: jika MCP/API key tidak tersedia, **jangan berhenti**. Pakai fallback: `scripts/synth-sfx.mjs` (SFX 8-bit lokal), sprite builder Python (Jalur A), dan SFX bawaan `@remotion/sfx` + sumber CC0.

### 2.4 Library Remotion (pin versi yang sama untuk semua paket `@remotion/*`)

```bash
npx create-video@latest --yes --blank lilin-jelantah-video
cd lilin-jelantah-video && npm install
npx remotion skills add
npx remotion add @remotion/media @remotion/transitions @remotion/sfx \
  @remotion/google-fonts @remotion/layout-utils @remotion/noise \
  @remotion/captions @remotion/install-whisper-cpp @remotion/media-utils
npm i -D pngjs tsx
npm run dev    # Remotion Studio
```

| Paket | Fungsi di proyek ini |
|---|---|
| `@remotion/media` | `<Video>` footage asli, `<Audio>` dubbing/SFX/BGM |
| `@remotion/transitions` | `TransitionSeries` + presentasi kustom (pixel-dissolve, tirai, iris, light-flash) |
| `@remotion/sfx` | SFX siap pakai (mis. `whoosh`, `whip`; cek daftar lengkap via `/remotion-docs`) |
| `@remotion/google-fonts` | Font pixel (Press Start 2P, Pixelify Sans, Silkscreen/VT323) |
| `@remotion/noise` | Camera shake halus, flicker api |
| `@remotion/captions` + `@remotion/install-whisper-cpp` | Subtitle otomatis dari rekaman dubbing (bahasa `id`) |
| `@remotion/media-utils` | Util audio bila diperlukan |
| `pngjs`, `tsx` | Script Node untuk aset/analisis |

Cek syarat lisensi Remotion di situs resminya sebelum merilis (tugas kuliah umumnya aman).

---

## 3. Arsitektur proyek & konvensi

```text
lilin-jelantah-video/
├─ AGENTS.md              # aturan ringkas untuk agent (isi di Lampiran B); CLAUDE.md = symlink/salinan
├─ .mcp.json              # Claude Code MCP
├─ .claude/skills/pixel-cinema-style/SKILL.md
├─ docs/PLAN.md           # dokumen ini
├─ reference/style-frame.png
├─ public/
│  ├─ footage/            # F00_*.mp4 ... hasil normalisasi (CFR 30 fps)
│  ├─ footage/pix/        # varian pixel (ffmpeg)
│  ├─ photos/             # P01_*.jpg (foto produk, BTS)
│  ├─ dub/                # S02_L01_malika.wav ...
│  ├─ sfx/                # *.wav / *.mp3 + sfx-manifest.json
│  ├─ music/              # bgm_*.mp3
│  ├─ sprites/
│  │   ├─ characters/<id>/ # layer PNG (Bagian 5)
│  │   ├─ props/  ├─ bg/  ├─ fx/  └─ ui/
│  └─ LICENSES.md
├─ src/
│  ├─ index.ts  Root.tsx  Main.tsx
│  ├─ engine/     PixelStage · Camera · Parallax · Lighting · Bloom · Dust · Vignette · Grain · Letterbox · Grade
│  ├─ characters/ Character.tsx · rig.ts · registry.ts · useMouth.ts · Emote.tsx
│  ├─ ui/         DialogueBox · NamePlate · Tag (FISIKA/KIMIA) · Callout · Counter · Subtitles
│  ├─ footage/    RealFootage.tsx · TvScreen.tsx · EvidenceFrame.tsx
│  ├─ transitions/ pixelDissolve · curtain · iris · lightFlash · handReveal
│  ├─ audio/      SfxLayer.tsx · Bgm.tsx · ducking.ts
│  ├─ scenes/     S01A_LiveIntro · S01B_WorldReveal · S02_Masalah · S03_Konsep · S04_Penerapan
│  │              S05_Produk · S06_DataBukti · S07_Referensi · S08_Kontribusi · S09_Penutup
│  ├─ data/       meta.ts · recipe.ts · palette.ts · characters.json · timeline.ts · dub-map.json
│  │              footage.json · footage-light.json · references.json · contributions.json
│  │              cues/S02.cues.ts ... S09.cues.ts · lipsync/*.json · durations.json
│  └─ lib/        pixel.ts · easing.ts · seconds.ts (sec→frame)
├─ scripts/        (Bagian 6–8) normalize-footage.sh · make-pixel-variants.sh · make-pixel-ramp.sh
│                  probe-media.ts · analyze-dub.ts · footage-avg-color.mjs · gen-sfx.ts · synth-sfx.mjs
│                  sprite_builder/ (Python) · pixelize.py · make-grain.py · validate.ts
└─ out/
```

### Konvensi wajib

- **Waktu:** semua cue ditulis dalam **detik relatif ke awal scene**, dikonversi dengan `sec(s) = Math.round(s * fps)`. Jangan hardcode frame mentah.
- **Koordinat art-space** (480×270) untuk semua yang ada di panggung. Posisi/gerak **dibulatkan ke integer** (`Math.round`) agar piksel tidak bergetar. Zoom kamera pelan boleh non-integer; sprite **tidak boleh dirotasi**.
- **Semua `<Img>` sprite** memakai `imageRendering: 'pixelated'`.
- **Teks HUD/subtitle** dirender di ruang 1920×1080 (di atas stage), dengan ukuran font kelipatan grid font pixel (mis. Press Start 2P: 16/24/32 px).
- **Tidak ada `Math.random()`**; pakai `random(seed)` dari `remotion` agar render deterministik.
- **Data terpisah dari komponen:** teks, timing, dan cue ada di `src/data/`, bukan di JSX.
- **Satu scene = satu file + satu `*.cues.ts`.** Scene tidak saling impor kecuali dari `engine/`, `characters/`, `ui/`, `footage/`, `audio/`.
- Commit git setiap akhir fase dengan pesan `phase-N: ...`.

---

## 4. Visual Bible (gaya sinematik pixel art)

### 4.1 Bedah screenshot referensi (`reference/style-frame.png`)

Agent: **buka gambar itu** (view) sebelum mengerjakan apa pun. Ciri yang harus ditiru:

| Elemen di referensi | Terjemahan ke implementasi |
|---|---|
| Karakter chibi kepala besar, rambut gelap berponi, kacamata, pipi merona pink, hoodie marun dengan tali kuning | Proporsi kepala ≈ 50–55% tinggi tubuh; blush + aksesori khas per karakter |
| Outline putih/krem tipis di tepi bawah-kanan karakter (rim-light) | Layer `rim` per karakter: 1 px krem di sisi yang menghadap sumber cahaya |
| Latar **sangat blur**: tirai/panggung hangat, bokeh oranye | Latar disusun 3–5 layer parallax; layer jauh diberi `filter: blur()`; detail latar minimal |
| Orb cahaya teal dengan flare oranye bintang-4 di atas karakter | Komponen `<Sparkle>` (silang piksel + glow radial `plus-lighter`) |
| Vignette gelap, bagian bawah keunguan, bayangan di lantai | Vignette + gradient lantai plum + shadow ellipse di bawah karakter |
| Pixel kasar besar (kamera dekat ke sprite kecil) | Close-up = **zoom kamera integer ke sprite biasa**, bukan sprite kedua |
| Maskot/sprite pelengkap melayang di pojok | Maskot **Jeli** (tetes minyak) `[OPSIONAL]` |

### 4.2 Palet (turunkan nilai persis dari screenshot, jangan menebak)

Jalankan ekstraksi warna dari `reference/style-frame.png` (mis. median-cut via Pillow `quantize(32)`), lalu **kunci 32 warna master** di `src/data/palette.ts` dan `tools/palette.gpl`. Titik awal (verifikasi & koreksi dengan gambar):

| Peran | Hex awal |
|---|---|
| Ink/outline | `#1B1020` |
| Bayangan plum | `#2A1530` |
| Magenta gelap / hoodie | `#6B1F4A`, `#8A2A4A`, `#B23A5A` |
| Cahaya amber / oranye | `#FFB25A`, `#F08A3C`, `#C46A2C` |
| Kayu/tirai coklat | `#5A3418`, `#7A4A22` |
| Aksen teal (orb, sains) | `#4FD1C5`, `#9FF3EE` |
| Kulit & blush | `#F6D9C4`, `#F4A3B0` |
| Highlight krem | `#FFF3DC` |

Aturan: maksimum **32 warna master + 6 warna khusus per karakter**. Warna di luar palet (mis. hasil blur/bloom) hanya boleh lahir dari efek lighting, bukan dari sprite.

### 4.3 Lighting stack (urutan layer dari bawah ke atas, di setiap scene)

| # | Layer | Implementasi | Catatan |
|---|---|---|---|
| 1 | Latar jauh (blur 6–10 px art) | `<Parallax depth=0.2>` | Rack focus: animasikan blur |
| 2 | Latar tengah (blur 2–4) | depth 0.5 | |
| 3 | Lantai + bayangan | gradient plum + ellipse shadow | |
| 4 | Prop & karakter (tajam) | `<Character>`, `<Prop>` | Selalu paling tajam |
| 5 | **Light rays (god rays)** | gradient miring, opacity 0.08–0.18, drift pelan | `mix-blend-mode: screen` |
| 6 | **Point lights** (lampu, layar TV, api) | radial gradient `plus-lighter`, opsi *banded* 4–5 step untuk nuansa pixel | Api: flicker dari `noise2D` |
| 7 | **Bloom** | duplikat area terang di-blur lalu `screen` | Intensitas dikontrol per scene |
| 8 | Debu/partikel | kotak 1 px, posisi dari `random(seed)`, kelap-kelip | 20–60 partikel |
| 9 | **Color grade** | overlay `soft-light`/`multiply` per scene (tabel 4.4) | |
| 10 | Vignette | radial gradient gelap | 25–45% |
| 11 | Film grain | 4 PNG noise 480×270 digilir tiap 2 frame, `overlay`, opacity 0.06–0.10 | `scripts/make-grain.py` |
| 12 | Letterbox (opsional) | bar atas-bawah ±6% | Hanya untuk momen dramatis (S01B, S09) |

### 4.4 Color grade per scene

| Scene | Grade | Suasana |
|---|---|---|
| S01B Panggung | Amber hangat + plum bayangan + orb teal | Magis, hangat (mirip referensi) |
| S02 Masalah | Dapur pagi hangat → sungai desaturasi teal gelap | Prihatin, lalu harapan |
| S03 Lab | Teal-krem bersih, kontras sedang | Rasa ingin tahu |
| S04 Workshop & Ruang Nonton | Oranye hangat; Ruang Nonton lebih redup (cahaya TV) | Santai, fokus |
| S05 Showroom | Spotlight amber di atas latar plum | Bangga, bersih |
| S06 Observatorium Data | Navy-teal, aksen oranye untuk data | Serius, terpercaya |
| S07 Perpustakaan | Kuning kayu hangat, debu emas | Tenang |
| S08 Meja Kerja | Krem-oranye hangat | Kebersamaan |
| S09 Atap senja → malam | Oranye senja → biru malam, cahaya utama = api lilin | Emosional, penutup |

### 4.5 Kamera sinematik (`<Camera>`)

Props: `x, y` (pusat, art-space), `zoom` (1–4), `shake` (0–1), `focus` (0–1 untuk DoF). Aturan:

- Setiap scene mulai dengan **establishing** (lebar, 1,5–3 dtk) lalu **push-in** pelan (zoom 1→1,15 dalam 6–10 dtk).
- Close-up wajah saat karakter berbicara penting: zoom **2× atau 3× integer**, rack focus dari latar blur ke tajam.
- Pan memakai easing `easeInOutCubic`; posisi dibulatkan ke integer art-px.
- Shake halus (0–1 px) hanya di momen impak (tangan menutup kamera, tag FISIKA/KIMIA muncul).
- Hindari motion blur (merusak pixel art).

### 4.6 Tipografi & UI

| Pakai | Font | Ukuran HUD (1920 space) |
|---|---|---|
| Judul besar | **Press Start 2P** | 48/64 px |
| Teks isi, subtitle | **Pixelify Sans** (alt: Silkscreen/VT323) | 32/40 px |
| Angka data | Press Start 2P | 64/96 px |

Subtitle gaya JRPG: kotak gelap semi-transparan bertepi pixel, **nameplate berwarna sesuai warna khas karakter**, teks "diketik" mengikuti durasi baris dubbing. Tag **FISIKA** (teal) dan **KIMIA** (oranye) berbentuk pill pixel dengan animasi *pop* + shake kecil. Badge **DATA PUSTAKA** (amber) vs **PENGAMATAN KELOMPOK** (teal) selalu dipakai konsisten di S05–S07.

### 4.7 Dunia & lokasi

| Scene | Lokasi | Props kunci |
|---|---|---|
| S01B | **Panggung Pintu Dunia** (tirai beludru, spotlight, orb teal) | Tirai, kursi bayangan, orb |
| S02 | Dapur → bawah air sungai → tanah | Wajan, botol minyak, wastafel, ikan, lapisan minyak |
| S03 | **Lab Papan Tulis** | Papan tulis/holo, gelas ukur, kompor listrik, corong saring, cawan lilin |
| S04 | **Workshop Praktikum** + **Ruang Nonton** | 4 stasiun bernomor, TV CRT retro, sofa, popcorn |
| S05 | **Showroom/Pameran** | Podium lilin, bingkai foto, rambu keselamatan |
| S06 | **Observatorium Data** | Peta Indonesia pixel, drum ikon, grid 140 titik, tiga panel bukti |
| S07 | **Perpustakaan** | Rak tinggi, tangga, kartu referensi melayang, dua ember "pustaka vs pengamatan" |
| S08 | **Meja Kerja Tim** | Papan gabus + polaroid, tali penghubung, tiga TV mini |
| S09 | **Atap senja** | Lilin menyala di tengah, kota kecil berkedip |

Maskot **Jeli** `[OPSIONAL]`: tetes minyak amber bermata besar. Kameo di S02 (korban pembuangan), S03 (penunjuk), S05 (jadi api kecil), S09 (roh api). Jika waktu mepet, hapus maskot dan tidak ada yang rusak.

---

## 5. Sistem karakter (9 karakter, puppet rig)

### 5.1 Character sheet (user isi per anggota, simpan di `docs/characters/<id>.md`)

```yaml
id: malika            # huruf kecil, tanpa spasi
nama_tampil: Malika
warna_khas: "#F08A3C" # dipakai nameplate, rim-light, sorotan
rambut: "panjang lurus hitam, poni"   # warna + gaya
kacamata: tidak
hijab: tidak          # ya/tidak (isi sesuai penampilan asli)
outfit: "hoodie krem, rok coklat"
aksesori_khas: "jepit rambut kuning"
ekspresi_khas: "senyum lebar"
gestur_khas: "mengangkat jempol"
tinggi_relatif: 1.0   # 0.9–1.1 supaya ada variasi
foto_referensi: reference/characters/malika.jpg   # opsional
```

### 5.2 Spesifikasi sprite

- Kanvas per layer: **64×80 px** (tinggi karakter ±64 px, kepala ±34 px). Semua layer **selaras pada kanvas yang sama** sehingga bisa ditumpuk tanpa offset.
- Palet: master 32 + 6 warna karakter. Outline 1 px warna ink (selective outline: boleh melunak ke warna gelap area).
- Layer per karakter (`public/sprites/characters/<id>/`):

| Layer | Varian |
|---|---|
| `shadow.png` | 1 |
| `body.png` (+ `legs_idle`, `legs_walk_a`, `legs_walk_b`, `legs_sit`) | per pose kaki |
| `arm_l_*.png`, `arm_r_*.png` | `down, wave_a, wave_b, point, hold, up, think` |
| `head.png` | 1 |
| `hair_back.png`, `hair_front.png` | 1 |
| `eyes_*.png` | `open, blink, happy, surprised, worried, determined, sad` |
| `mouth_*.png` | `closed, half, open, smile, o` |
| `glasses.png`, `blush.png`, `accessory.png` | opsional |
| `rim.png` | rim-light krem (dibuat otomatis dari alpha, lihat 6.3) |

### 5.3 Rig & animasi (komponen `<Character>`)

```ts
type Pose = 'idle'|'talk'|'wave'|'point'|'think'|'cheer'|'walk'|'sit'|'hold';
type Expr = 'neutral'|'happy'|'surprised'|'worried'|'determined'|'sad';
interface CharacterProps {
  id: CharId; x: number; y: number;        // art-space, integer
  flip?: boolean; pose?: Pose; expr?: Expr;
  mouth?: 'closed'|'half'|'open'|'auto';   // 'auto' membaca lipsync/<lineId>.json
  lineId?: string; scale?: 1|2; z?: number; dim?: number;  // dim: redup saat bukan pembicara
}
```

| Animasi | Aturan implementasi |
|---|---|
| Idle bob | Naik-turun 1 px, siklus 1,2 dtk, **stepped 6 fps** (bukan halus) |
| Blink | Interval acak 3–5 dtk (seed per karakter), 3 frame |
| Talk | Mulut dari `useMouth(lineId)`; kepala bob 1 px seiring ucapan |
| Wave/Point/Cheer | Ganti sprite lengan 3-pose + gerak badan 1–2 px |
| Walk | Ganti `legs_walk_a/b` tiap 4 frame + geser x |
| Jump | Parabola, bayangan mengecil di tanah, SFX `JUMP`/`LAND` |
| Emote bubble | `!` `?` `♥` `✨` `💡` (sprite 16×16) muncul di atas kepala 20 frame |
| Pembicara aktif | Karakter lain `dim=0.35` + saturasi turun; pembicara dapat rim-light kuat |

Semua gerak karakter ditulis sebagai **cue**: `{ at: 12.4, who: 'noya', do: 'point', until: 15 }` di `cues/S03.cues.ts`.

### 5.4 Lip-sync (offline, deterministik)

`scripts/analyze-dub.ts`: untuk tiap `public/dub/*.wav` → `ffmpeg -i x.wav -f f32le -ac 1 -ar 16000 -` → RMS per jendela 1/15 dtk → ambang relatif terhadap persentil-90 baris tsb → `closed | half | open` dengan penahan minimal 2 frame dan smoothing → tulis `src/data/lipsync/<lineId>.json`:

```json
{ "lineId": "S02_L01", "fps": 15, "speechStart": 0.42, "speechEnd": 6.18, "mouth": [0,1,2,2,1,0] }
```

Sebelum dubbing ada, agent memakai **mode placeholder**: durasi baris = `jumlahKata / 2.4` dtk, mulut dibuka-tutup dengan pola seed. Begitu WAV ada, jalankan ulang analisis dan semua scene otomatis sinkron.

---

## 6. Pipeline aset visual

### 6.1 Tiga jalur pembuatan karakter (pilih lewat CHECKPOINT-2)

| Jalur | Cara | Kelebihan | Kekurangan | Kapan |
|---|---|---|---|---|
| **A. Sprite builder (default, gratis)** | Python membaca `characters.json` + pustaka bagian (grid ASCII + kunci palet) → layer PNG. Agent menulis bagian (rambut, badan, kacamata, hoodie) lalu mengombinasikan per karakter | Konsisten, bisa diulang, tanpa biaya | Butuh iterasi + user review | Default |
| **B. PixelLab MCP (berbayar)** | `create_character` (4/8 arah) + `animate_character` (walk, dll) untuk full-body; tileset untuk latar | Kualitas animasi walk bagus | Gaya bisa kurang "chibi bust", perlu dirapikan ke palet master | Jika punya token |
| **C. Dari foto/konsep AI** | Foto/gambar konsep → `pixelize.py` (downscale nearest, kuantisasi ke palet master, outline) → poles manual di Aseprite → pecah jadi layer | Mirip wajah asli | Pemecahan layer manual | Jika user ingin mirip |

Rekomendasi: **A untuk badan/kepala/mulut (rig bicara)** + **B opsional untuk siklus jalan** + **C hanya sebagai referensi bentuk**.

### 6.2 `pixelize.py` (alat umum untuk karakter, latar, prop)

Langkah: buka gambar → resize ke ukuran target dengan `NEAREST` (atau `BOX` lalu kuantisasi) → petakan tiap piksel ke warna terdekat di palet master → opsional dither Bayer 4×4 → tambahkan outline ink 1 px di alpha → simpan PNG transparan. Argumen: `--size 64x80 --palette tools/palette.gpl --dither none|bayer --outline`.

### 6.3 Aset otomatis

- **Rim-light:** dari alpha sprite, ambil tepi sisi cahaya (geser 1 px, kurangi alpha asli) → warna krem.
- **Shadow:** ellipse gelap semi-transparan 28×6 px.
- **Grain:** 4 frame noise (`make-grain.py`).
- **Props:** wajan, botol, gelas ukur, corong saring, kompor, cawan, sumbu, lilin (3 frame api), TV CRT, sofa, popcorn, podium, rambu, kartu referensi, drum, rak, tangga, polaroid, papan gabus, kota malam.
- **Latar:** 3–5 layer PNG 480×270 (atau lebih lebar untuk pan), dibuat prosedural/gradient + siluet; detail minimal karena akan di-blur.
- **FX:** `sparkle_star` (3 ukuran), `bubble`, `droplet`, `steam`, `heat_shimmer`, `dust`, `flame_a/b/c`, `light_ray`.

### 6.4 Kontrol kualitas aset (agent wajib jalankan)

1. **Lineup sheet:** satu PNG besar berisi 9 karakter berjajar (idle, 7 ekspresi, 5 mulut, 4 pose) di atas latar netral.
2. **Contact sheet latar:** tiap scene satu still (frame awal, tengah, akhir).
3. **Cek palet:** script menghitung jumlah warna unik per sprite; gagal jika di luar palet.
4. **Cek kontras nameplate:** teks vs latar minimal 4,5:1.

---

## 7. Integrasi footage asli (yang kamu tanyakan: cara menggabungkan video hasil editing dengan Remotion)

### 7.1 Daftar footage & di mana dipakai

| ID | Isi | Durasi saran | Scene | Mode |
|---|---|---|---|---|
| **F00** | Intro live-action: sapaan, perkenalan 9 anggota, Malika menutup lensa dengan telapak tangan | 35–40 dtk | S01A | Layar penuh, **audio asli dipertahankan** |
| F01 | Penyaringan minyak jelantah | 10–14 dtk | S04 | Di TV |
| F02 | Pemanasan/peleburan bahan lilin | 8–12 dtk | S04 | Di TV |
| F03 | Pencampuran minyak + bahan lilin + pewangi | 8–12 dtk | S04 | Di TV |
| F04 | Penuangan ke wadah bersumbu | 6–10 dtk | S04 | Di TV |
| F05 | Pendinginan/pemadatan (boleh timelapse) | 8–12 dtk | S04 | Di TV (`playbackRate` 2–4) |
| F06 | Produk jadi (putar 360° atau close-up) | 6–10 dtk | S05, S06 | Bingkai pameran / mode bukti |
| F07 | Uji nyala (dengan pengawasan, aman) | 8–14 dtk | S04, S06 | Di TV lalu mode bukti |
| F08 | Behind-the-scenes tim | 10–20 dtk | S08 | 3 TV mini |
| F09 | (Opsional) bloopers | 8–15 dtk | S09 kredit | Layar kecil |
| P01–P0n | Foto: tekstur lilin, aroma/pewangi, tim | — | S05–S08 | Bingkai/polaroid |

Tidak ada video? Agent tetap membangun semuanya dengan **slot placeholder** (kotak "FOOTAGE F02 AKAN MASUK DI SINI" + timer) sehingga timeline sudah benar.

### 7.2 Aturan syuting F00 (video hand-transition)

1. Kamera **stabil** (tripod/tumpukan buku). Cahaya sama dari awal sampai akhir.
2. Urutan: sapaan grup → tiap anggota menyebut nama (±2 dtk) → **Malika** menatap kamera, mengucapkan ajakan masuk ke dunia lain → ia **mendekatkan telapak tangan dan menutup lensa penuh**, tahan **≥ 1,5 dtk** sampai layar didominasi warna tangan/gelap → **potong di sini**. (Tangan "dibuka" nanti dibuat animasi di Remotion.)
3. Telapak harus benar-benar **menutup penuh** (tanpa celah terang), jari rapat, gerakan tidak menyentak.
4. Rekam suara jernih. Audio F00 adalah audio asli dan tidak di-dubbing ulang.

### 7.3 Normalisasi footage (WAJIB, mencegah desync di Remotion)

Footage dari HP/editor sering **VFR** (frame rate variabel). Ubah ke **CFR 30 fps**, 1920×1080, GOP pendek:

```bash
# scripts/normalize-footage.sh  (usage: ./normalize-footage.sh in.mp4 F02_melting)
ffmpeg -y -i "$1" \
  -vf "fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,format=yuv420p" \
  -c:v libx264 -crf 17 -preset medium -g 30 -keyint_min 30 \
  -c:a aac -b:a 192k -ar 48000 \
  "public/footage/$2.mp4"
```

Ekspor dari editor: H.264/MP4, 1080p, **tanpa efek transisi di ujung** (Remotion yang mengatur transisi). Footage vertikal (HP portrait) → tetap dinormalisasi tapi di-*fit* di dalam TV/bingkai (jangan di-crop paksa).

### 7.4 Manifest footage (`src/data/footage.json`, diisi otomatis oleh `scripts/probe-media.ts` memakai ffprobe)

```json
{
  "F02": {
    "file": "footage/F02_melting.mp4",
    "pix": "footage/pix/F02_melting_soft.mp4",
    "durationSec": 10.4, "fps": 30, "hasAudio": false,
    "use": { "from": 0.5, "to": 9.5, "audio": "mute" },
    "annotations": [
      { "t0": 1.0, "t1": 4.0, "x": 0.62, "y": 0.35, "text": "Bahan lilin meleleh", "arrow": "left" }
    ]
  }
}
```

`audio`: `mute` (default untuk klip praktikum, karena dubbing menjelaskan), `duck` (turunkan saat dubbing), atau `full`. `annotations` memakai koordinat **relatif 0–1 pada layar footage**, sehingga callout tetap tepat walau footage diganti.

### 7.5 Komponen footage

```tsx
// src/footage/RealFootage.tsx
import {Video} from '@remotion/media';
import {staticFile, useVideoConfig} from 'remotion';

export const RealFootage: React.FC<{id: string; style?: React.CSSProperties}> = ({id, style}) => {
  const {fps} = useVideoConfig();
  const f = footage[id];                       // dari footage.json
  return (
    <Video
      src={staticFile(f.file)}
      trimBefore={Math.round(f.use.from * fps)}
      trimAfter={Math.round(f.use.to * fps)}
      muted={f.use.audio === 'mute'}
      style={{width: '100%', height: '100%', objectFit: 'contain', ...style}}
    />
  );
};
```

(Agent: cek prop terbaru `<Video>` lewat `/remotion-docs`; jika `@remotion/media` bermasalah pada klip tertentu, fallback ke `<OffthreadVideo>`.)

| Komponen | Fungsi |
|---|---|
| `RealFootage` | Memutar klip (trim, mute/duck/full, `playbackRate`) |
| `TvScreen` | Menaruh footage di layar TV CRT pixel: bezel, scanline, RGB-split halus, rounded corner, **cahaya layar** jatuh ke karakter (warna dari `footage-light.json`) |
| `EvidenceFrame` | Mode bukti: footage **natural tanpa filter** dalam bingkai pixel + badge **PENGAMATAN KELOMPOK** |
| `FootageSlot` | Placeholder bila file belum ada |

### 7.6 Cahaya dari layar (detail sinematik)

`scripts/footage-avg-color.mjs`: untuk tiap klip, ambil warna rata-rata 2× per detik (`ffmpeg -i clip -vf "fps=2,scale=1:1:flags=area" -f rawvideo -pix_fmt rgb24 -`) → `footage-light.json`. `TvScreen` memakai ini untuk mewarnai rim-light karakter dan cahaya di dinding sehingga terasa bahwa TV benar-benar menyinari ruangan.

### 7.7 Dua tampilan footage

| Tampilan | Dipakai | Cara |
|---|---|---|
| **Natural** | Mode bukti (S06), bingkai produk (S05), frame akhir F00 | File asli |
| **Pixel-Soft** | Di TV diegetik (S04, S08) agar menyatu dengan dunia | Varian ffmpeg di bawah |
| **Pixel-Hard** | Efek dramatis/transisi | Varian ffmpeg di bawah |

```bash
# scripts/make-pixel-variants.sh  (usage: ./make-pixel-variants.sh F02_melting)
# Soft: turun ke 320x180 lalu naik nearest-neighbor
ffmpeg -y -i public/footage/$1.mp4 \
  -vf "scale=320:180:flags=area,scale=1920:1080:flags=neighbor,eq=saturation=1.15:contrast=1.05" \
  -c:v libx264 -crf 16 -pix_fmt yuv420p -an public/footage/pix/${1}_soft.mp4
# Hard: 240x135 + palet 32 warna + dither Bayer
ffmpeg -y -i public/footage/$1.mp4 \
  -vf "fps=30,scale=240:135:flags=area,split[a][b];[a]palettegen=max_colors=32[p];[b][p]paletteuse=dither=bayer:bayer_scale=3,scale=1920:1080:flags=neighbor" \
  -c:v libx264 -crf 14 -pix_fmt yuv420p -an public/footage/pix/${1}_hard.mp4
```

Alasan memakai ffmpeg: `image-rendering: pixelated` di CSS **tidak** mem-pixelate video (hanya memperbesar tanpa menurunkan resolusi), sehingga pixelasi harus diproduksi lewat pra-proses.

### 7.8 Transisi tangan: Footage asli → Dunia animasi (momen paling penting video ini)

Terdiri dari 3 tahap. **Tidak memakai TransitionSeries**; ini potongan terkontrol antar S01A dan S01B.

**Tahap 1: Pixelate ramp (di ujung S01A, 1 dtk terakhir F00)**
`scripts/make-pixel-ramp.sh` membuat `footage/F00_ramp.mp4` dari 30 frame terakhir F00: lima segmen @6 frame dengan blok piksel membesar (×2, ×4, ×8, ×16, ×32) lewat `scale=trunc(iw/N/2)*2:trunc(ih/N/2)*2:flags=neighbor,scale=1920:1080:flags=neighbor`, lalu `concat`. Alternatif (jika lebih nyaman): canvas kecil + `onVideoFrame` dari `<Video>`; cek `/remotion-docs`.

**Tahap 2: Warna tangan dicocokkan**
`ffmpeg -sseof -0.1 -i F00.mp4 -frames:v 1 -vf "scale=1:1:flags=area" last.png` → baca 1 piksel → `HAND_FILL` di `meta.ts`. Telapak pixel raksasa (`giant_palm.png`, 480×270 art-px, 2 lapis: *palm* + *fingers*) dibuat memakai warna itu, sehingga **hard cut** dari frame ramp terakhir ke S01B tidak terlihat.

**Tahap 3: Tangan "dibuka" (awal S01B, ±2 dtk)**

| t (dtk) | Aksi |
|---|---|
| 0,00 | Layar penuh telapak pixel (warna cocok). Hening, hanya dengung rendah |
| 0,30 | **Cahaya hangat bocor di sela jari**: garis vertikal terang (screen, bloom) |
| 0,60 | Lapisan *fingers* bergeser ke kiri-kanan seperti tirai, lapisan *palm* turun + membesar (parallax) |
| 0,60–1,60 | Dunia terungkap dengan blur 100%→0% (**rack focus**), cahaya membanjir, debu bersinar |
| 1,40 | Malika (sprite) berdiri tengah, pose tangan baru diturunkan (match cut) |
| 2,00 | Orb teal muncul + sparkle; musik masuk |

SFX: `HAND_COVER_THUMP` (di akhir S01A) → `PORTAL_SUB_RUMBLE` → `HAND_UNCOVER_RUSTLE` → `PORTAL_SHIMMER_SWELL` → `UI_DING_SPARKLE` (ID di Bagian 12).

**Opsional (stretch):** *hand-chain*, yaitu tiap anggota menutup kamera dengan tangan lalu anggota berikutnya muncul. Hanya dikerjakan jika semua syuting tambahan sudah ada.

### 7.9 Adegan "karakter menonton video praktikum" (Ruang Nonton, S04)

1. **Establishing:** semua karakter di sofa/berdiri menghadap TV CRT, Marsha di samping TV dengan penunjuk.
2. **Channel change:** CRT static (`CRT_STATIC_POP`), klip masuk di `TvScreen` (Pixel-Soft).
3. **Dolly-in:** kamera mendekat sampai layar TV ±80% frame; callout `annotations` muncul dengan panah pixel; tag FISIKA/KIMIA sesuai langkah.
4. **Reaction cutaway:** kembali ke karakter (emote `!`, `✨`, anggukan, Ais mencatat) selama 1–2 dtk per klip.
5. **Mode bukti** (S06): layar TV meluas menjadi `EvidenceFrame` natural.

Klip yang lebih panjang dari jatah dipotong lewat `use.from/to`; klip lebih pendek diperpanjang dengan `playbackRate` (≤0,75×) atau freeze frame 0,5 dtk (jangan loop yang kentara).

---

## 8. Sistem audio (dubbing manual, SFX, BGM, mixing)

> **Aturan emas:** tidak ada suara manusia yang dibuat AI. Dubbing = rekamanmu. SFX **tidak boleh** berisi suara manusia (tawa, sorak, "wow") agar tidak bentrok dengan dubbing; gunakan SFX non-vokal (sparkle, clap tangan, dentingan).

### 8.1 Alur dubbing manual

**Rekam per baris** (bukan per scene) supaya mudah diganti. Penamaan: `S02_L01_malika.wav` (`<scene>_L<nn>_<pembicara>`). ID baris ada di naskah v2 (Bagian 11).

| Spesifikasi | Nilai |
|---|---|
| Format | WAV 48 kHz, 16/24-bit, mono |
| Level rekam | Puncak sekitar −6 dB, tidak clipping |
| Jeda | ±0,3 dtk hening di awal dan akhir tiap file |
| Lingkungan | Ruang senyap + 1 file `roomtone.wav` (5 dtk hening) untuk pembersihan |
| Pembersihan (opsional) | `ffmpeg -i in.wav -af "highpass=f=80,loudnorm=I=-16:TP=-1.5:LRA=11" out.wav` |

**Sinkronisasi otomatis** (`npm run sync` = `probe-media.ts` → `analyze-dub.ts` → `validate.ts`):

1. Memindai `public/dub/*.wav`, mencocokkan ke ID baris di `src/data/script.ts`.
2. Menulis `dub-map.json` (durasi tiap baris), `lipsync/*.json`, dan `durations.json`.
3. Menjadwalkan baris berurutan: jeda antar-baris default **0,35 dtk**, jeda paragraf (`[jeda]`) **0,8 dtk**.
4. Durasi scene = `max(rencana, akhirBarisTerakhir + 1,0 dtk)`.
5. Mengganti rekaman → timpa file → `npm run sync` → seluruh timeline, mulut, subtitle, dan ducking ikut berubah.

Belum ada rekaman? Mode placeholder (Bagian 5.4) dipakai, dan video tetap bisa dirender utuh untuk review ritme.

### 8.2 Hirarki mix

| Elemen | Level (volume Remotion) | Catatan |
|---|---|---|
| Dubbing | 1,0 | Target ±−16 LUFS terintegrasi, puncak ≤ −1,5 dBTP |
| BGM (bed) | 0,20 → **ducked 0,08** saat ada dubbing | Ducking turun 8 frame, naik 24 frame |
| Ambience (loop) | 0,10–0,14 | Satu per scene |
| SFX UI/pop | 0,35–0,50 | Jangan menutupi konsonan dubbing |
| SFX foley | 0,50–0,70 | |
| SFX impak (thump, tag, ledakan sparkle) | 0,70–0,90 | Pendek, dengan ruang di sekitar dubbing |
| Audio footage | `mute` / `duck` 0,25 / `full` | Lihat `footage.json` |

```ts
// src/audio/ducking.ts : rentang aktif dubbing → kurva volume BGM
export const bgmVolume = (f: number, dubRanges: [number, number][], base = 0.2, ducked = 0.08) => {
  const active = dubRanges.some(([a, b]) => f >= a - 8 && f <= b + 24);
  const near = dubRanges.reduce((m, [a, b]) => {
    const d = f < a ? a - f : f > b ? f - b : 0;
    return Math.min(m, d);
  }, 1e9);
  if (!active) return base;
  const t = Math.min(1, near / 24);               // 0 di dalam ucapan → 1 di jauh
  return ducked + (base - ducked) * t * t;        // easing kuadrat
};
```

```tsx
// src/audio/SfxLayer.tsx : render semua cue SFX satu scene
import {Sequence, staticFile, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
export const SfxLayer: React.FC<{cues: SfxCue[]}> = ({cues}) => {
  const {fps} = useVideoConfig();
  return <>{cues.map((c, i) => (
    <Sequence key={i} from={Math.round(c.t * fps)} durationInFrames={Math.ceil(c.dur * fps)} layout="none">
      <Audio src={resolveSfx(c.id)} volume={c.vol ?? 0.5} loop={c.loop} />
    </Sequence>))}</>;
};
// resolveSfx: id → import dari @remotion/sfx (whoosh, whip, dst) ATAU staticFile(`sfx/${id}.wav`) dari manifest
```

### 8.3 Pipeline SFX (urutan prioritas, agent harus mengikuti)

1. **`@remotion/sfx`**: pakai dulu untuk `whoosh`, `whip`, dan bunyi lain yang cocok dari daftar resmi (cek via `/remotion-docs`). Lisensi CC0.
2. **ElevenLabs MCP `text_to_sound_effects`** (durasi 0,5–5 dtk) memakai prompt di Bagian 12. Hasil masuk `public/sfx/_raw/`, lalu `gen-sfx.ts` memangkas hening, menormalkan puncak ke −3 dB, mengubah ke `public/sfx/<ID>.wav`, dan mencatat di `sfx-manifest.json`.
3. **`scripts/synth-sfx.mjs`**: sintesis 8-bit lokal (gratis, tanpa jaringan) untuk bunyi UI/karakter/pixel: square/triangle/noise + envelope + sweep. Resep awal: `UI_BLIP` square 880 Hz 60 ms; `UI_CONFIRM` arpeggio 1047→1319→1568 Hz @50 ms; `UI_TAG_KIMIA` sweep triangle 400→1600 Hz + noise sparkle; `UI_ERROR` square 140 Hz 2×80 ms; `JUMP` sweep 300→700 Hz; `LAND` noise 40 ms low-pass; `EMOTE_EXCLAIM` dua nada 1200/1500 Hz; `STEP_WOOD` noise 30 ms high-pass.
4. **Sumber CC0 manual** (freesound.org, kenney.nl, dll.): tiap file dicatat di `public/LICENSES.md` (judul, pembuat, URL, lisensi).

Aturan: **idempotent** (jangan generate ulang jika ada), **simpan prompt** di manifest, **ambience** dibuat 5 dtk lalu di-loop dengan crossfade 0,3 dtk (`ffmpeg` `acrossfade`) atau `loop` di `<Audio>`.

```json
// public/sfx/sfx-manifest.json (contoh satu entri)
{ "id": "OIL_POUR", "file": "sfx/OIL_POUR.wav", "source": "elevenlabs",
  "prompt": "thick golden cooking oil pouring from a bottle into a sink drain, viscous glug, no voice",
  "durationSec": 3.2, "loop": false, "license": "generated (ElevenLabs terms)", "peakDb": -3 }
```

### 8.4 BGM per scene

| Scene | Mood | Prompt generate / kata kunci cari (CC0 / lisensi bebas) |
|---|---|---|
| S01A | Hampir hening, pad hangat naik di 6 dtk terakhir | "warm ambient pad rising, soft, no melody" |
| S01B | Magis, chiptune lembut + orkestra mini | "cinematic chiptune fantasy intro, warm, wonder, 8-bit harp, 90 bpm" |
| S02 | Mellow, sedikit sedih → harapan | "mellow lo-fi piano with soft chip bell, melancholic then hopeful" |
| S03 | Ingin tahu, marimba/pluck | "curious playful marimba and pizzicato, science lab, light" |
| S04 | Santai produktif | "upbeat lo-fi chillhop with 8-bit accents, workshop, 95 bpm" |
| S05 | Bangga, cerah | "bright proud chiptune showcase theme, glockenspiel" |
| S06 | Fokus, data, tegang halus → mantap | "minimal pulsing synth, data analysis, subtle tension resolving" |
| S07 | Tenang, piano akustik | "calm solo piano, library, warm" |
| S08 | Hangat, kebersamaan | "warm acoustic guitar and soft chip arpeggio, togetherness" |
| S09 | Emosional naik → penutup | "emotional uplifting chiptune orchestral finale, sunset, hopeful" |

Semua BGM: 60–120 dtk, **loopable**, tanpa vokal. Antar-scene crossfade 1 dtk. Simpan sebagai `public/music/bgm_<scene>.mp3`. Jika tidak ada kredit generate, pakai musik CC0/bebas-royalti dan **catat lisensi**.

---

## 9. Timeline master

FPS 30. Durasi di bawah = **rencana (gross)**. Durasi final dihitung dari audio dubbing (Bagian 8.1) dengan lantai rencana.

| Scene | Bagian rubrik | Pembicara | Mulai | Durasi | Frame mulai | Frame durasi | Transisi keluar (15 frame) |
|---|---|---|---|---|---|---|---|
| S01A | 1. Opening (live) | Semua (audio asli) | 0:00 | 40 dtk | 0 | 1.200 | **Hard cut** (tangan) |
| S01B | 1. Opening (dunia) | Semua | 0:40 | 30 dtk | 1.200 | 900 | Iris |
| S02 | 2. Identifikasi masalah | Malika | 1:10 | 65 dtk | 2.100 | 1.950 | Pixel-dissolve + flash |
| S03 | 3. Ketepatan konsep kimia | Noya | 2:15 | 80 dtk | 4.050 | 2.400 | Whip-slide (pintu) |
| S04 | 4. Penerapan & analisis | Marsha | 3:35 | 100 dtk | 6.450 | 3.000 | Tirai |
| S05 | 5. Produk/solusi | Ayuya & Lovyta | 5:15 | 60 dtk | 9.450 | 1.800 | Light-flash |
| S06 | 6. Kreativitas, data & bukti | Farel & Sofi | 6:15 | 95 dtk | 11.250 | 2.850 | Page-slide |
| S07 | 7. Referensi & komunikasi ilmiah | Disa | 7:50 | 60 dtk | 14.100 | 1.800 | Pixel-dissolve |
| S08 | 8. Kontribusi anggota | Ais | 8:50 | 40 dtk | 15.900 | 1.200 | Light-flash (ke senja) |
| S09 | 9. Penutup | Semua | 9:30 | 40 dtk | 17.100 | 1.200 | Fade ke hitam |
| | | | | **Gross 610 dtk (18.300 f)** | | | **Net ±606 dtk = 10:06 (18.180 f)** setelah 8 transisi × 15 f |

**Jaminan ≥ 8 menit:** `validate.ts` gagal bila total < 14.400 frame. Jika kurang, aktifkan *extender beats* di `timeline.ts` (urutan prioritas): (1) S02 montase pengumpulan jelantah +6 dtk; (2) S03 mini-kuis Jeli "fisika atau kimia?" +8 dtk; (3) S04 replay lambat klip uji nyala +10 dtk; (4) S09 kredit + bloopers +15 dtk.

---

## 10. Spesifikasi scene (beat sheet, kamera, lighting, SFX)

Format waktu: `m:ss` atau detik relatif ke awal scene. **ID SFX didefinisikan di Bagian 12.** Kolom *Dub* mengacu ke ID baris di naskah v2 (Bagian 11).

### S01A. Opening live-action (0:00–0:40) · Semua

**Lokasi:** dunia nyata (F00). **Audio:** asli. **BGM:** pad sangat pelan mulai di 0:32.

| t | Visual / aksi | Overlay (Remotion) |
|---|---|---|
| 0:00 | Fade-in dari hitam 6 frame | Vignette halus + grain tipis agar menyatu dengan gaya |
| 0:02 | "Halo, teman-teman!" | Judul kecil pixel di pojok: "PRAKTIKUM KIMIA DASAR" |
| 0:04–0:30 | Tiap anggota menyebut nama (±2,5 dtk) | **NamePlate** pixel berwarna khas + **avatar pixel mini** melompat di pojok kiri bawah (preview karakter) |
| 0:30–0:35 | Malika mengajak masuk ke dunia lain | Garis cahaya hangat tipis di tepi frame, kian kuat |
| 0:35–0:37 | Malika mendekatkan tangan ke lensa; **telapak menutup penuh** | Shake 1 px; `coverAt` terdeteksi otomatis (`scripts/detect-cover.sh`: ffmpeg `signalstats`, YAVG turun tajam) |
| 0:37–0:40 | Tahan telapak; **pixelate ramp** (7.8) → warna telapak | Layar menjadi blok besar berwarna kulit/jingga gelap |

| SFX (t) | ID | Vol | Catatan |
|---|---|---|---|
| tiap nama | `UI_BLIP` | 0,30 | Nada naik sedikit per anggota |
| `coverAt` | `HAND_COVER_THUMP` | 0,85 | Sinkron frame telapak menutup |
| `coverAt`+0,2 → akhir | `PORTAL_SUB_RUMBLE` | 0,5 | Fade-in 1,5 dtk, berlanjut ke S01B |
| selama ramp | `TR_PIXEL_DISSOLVE` | 0,4 | Glitch sweep 1 dtk |

### S01B. Masuk Dunia Kimia Pixel (0:40–1:10) · Semua · Panggung Pintu Dunia

**Grade:** amber + plum + orb teal (replika screenshot). **BGM:** `bgm_S01B` masuk di 0:42. **Letterbox:** ya.

| t (rel) | Visual / aksi | Kamera | Dub |
|---|---|---|---|
| 0–2 | **Tangan dibuka** (7.8 tahap 3) | Static → rack focus | (hening) |
| 2–6 | Malika medium close-up (zoom 3×), tirai blur di belakang, orb teal + sparkle di atas bahu | Push-in pelan | `S01B_L01` Malika; ia melambai |
| 6–10 | Tirai terangkat, kamera mundur ke wide; 8 karakter muncul bergantian kiri-kanan (pop + nameplate) | Pull-back zoom 3→1 | (lanjut) |
| 10–14 | Judul jatuh per huruf: **KIMIA DALAM KEHIDUPAN SEHARI-HARI** / *Lilin Aromatis dari Minyak Jelantah*; semua melompat; burst sparkle; Jeli kameo | Slight orbit | `S01B_L02` Semua |
| 14–22 | Karakter berbaris setengah lingkaran, tiap lampu sorot menyala; Noya maju | Parallax pelan | `S01B_L03` Noya |
| 22–28 | Malika menunjuk ke pintu kayu bercahaya ke kiri | Pan ke pintu | `S01B_L04` Malika |
| 28–30 | Orb teal terbang ke pintu → iris menutup | — | — |

| SFX (t rel) | ID | Vol |
|---|---|---|
| 0.0 | `PORTAL_SUB_RUMBLE` (lanjutan, fade-out) | 0,5 |
| 0.3 | `HAND_UNCOVER_RUSTLE` | 0,6 |
| 0.6 | `PORTAL_SHIMMER_SWELL` | 0,7 |
| 1.8 | `UI_DING_SPARKLE` | 0,5 |
| 0–30 | `AMB_STAGE` (loop) | 0,12 |
| 6.0 | `TR_CURTAIN` | 0,6 |
| 6.4–9.6 (8×) | `UI_POP` | 0,35 |
| 10.2 | `UI_ACHIEVE` | 0,5 |
| 10.2 | `JUMP` ×9 (tersebar 0,05 dtk) | 0,25 |
| 28.0 | `TR_IRIS` | 0,5 |

### S02. Identifikasi masalah (1:10–2:15) · Malika · Dapur → Sungai → Tanah

**Grade:** dapur hangat → sungai desaturasi teal gelap → kembali hangat. **BGM:** `bgm_S02` (mellow → harapan di 0:54).

| t | Visual / aksi | Kamera | Dub |
|---|---|---|---|
| 0–6 | Dapur pagi, cahaya jendela jatuh miring. Malika menatap botol minyak keruh di meja | Push-in pelan + DoF | `S02_L01` |
| 6–14 | Wajan berdesis; minyak berubah emas → coklat tua (palette-swap bertahap). Teks pop: *minyak goreng → dipakai berulang → JELANTAH* | Pan ke wajan | `S02_L02` |
| 14–24 | Malika membawa botol ke wastafel, menuang ke saluran; ✕ merah besar; Jeli meringis | Tracking | `S02_L03` |
| 24–38 | **Penampang sungai:** lapisan minyak di permukaan, ikan, gelembung O₂ terhalang lapisan (panah + ✕ "pertukaran oksigen") | Pan horizontal, caustic air | `S02_L04` |
| 38–46 | Petak tanah dengan noda minyak; label *(kajian: kualitas air & tanah)* | Zoom keluar | `S02_L05` |
| 46–54 | Termometer di wajan, ikon ✕ "digoreng lagi"; molekul bergoyang → bergeser (hasil degradasi) | Close-up | `S02_L06` |
| 54–65 | Kembali ke dapur terang; Jeli menatap atas, balon pikir ikon lilin; tanda tanya besar **"Bagaimana jelantah jadi lilin yang berguna?"**; Malika menunjuk, Noya masuk | Rack focus ke Noya | `S02_L07` |

| SFX (t) | ID | Vol |
|---|---|---|
| 0–65 | `AMB_KITCHEN` (loop, fade ke `AMB_WATER_UNDER` di 24 s, kembali di 54 s) | 0,12 |
| 6.0–14 | `SIZZLE` | 0,45 |
| 9.0 | `UI_POP` (teks) ×3 | 0,35 |
| 14.5 | `STEP_WOOD` ×3 | 0,3 |
| 17.0–21.0 | `OIL_POUR` + `OIL_DRAIN_GLUG` | 0,6 |
| 21.2 | `UI_ERROR` | 0,5 |
| 24.0 | `TR_WHOOSH` (pindah ke bawah air) | 0,4 |
| 28–37 | `BUBBLES_LOOP` | 0,2 |
| 33.0 | `WARNING_BEEP` (✕ oksigen) | 0,35 |
| 46.0 | `HEAT_SHIMMER` | 0,3 |
| 56.0 | `EMOTE_QUESTION` | 0,5 |
| 58.0 | `EMOTE_IDEA` | 0,5 |
| 61.0 | `STEP_WOOD` ×2 (Noya masuk) | 0,3 |
| 64.0 | `TR_LIGHT_FLASH` | 0,6 |

### S03. Ketepatan konsep kimia (2:15–3:35) · Noya · Lab Papan Tulis

**Grade:** teal-krem bersih. **BGM:** `bgm_S03` marimba. **Wajib akurat** (Bagian 1.4).

| t | Visual / aksi | Kamera | Dub |
|---|---|---|---|
| 0–8 | Noya di depan papan tulis, judul **KONSEP KIMIA**; gelas ukur berisi minyak emas | Dolly-in lewat pintu | `S03_L01` |
| 8–22 | **Trigliserida:** satu gliserol (rantai 3 C) + tiga ekor asam lemak "snap" satu per satu. Label: *trigliserida = gliserol + asam lemak* | Close-up papan | `S03_L02` |
| 22–32 | Minyak menggelap (palette-swap), molekul bergoyang karena panas; corong saring memisahkan remah, tapi minyak tetap gelap → teks **"disaring ≠ kembali baru"** | Pan ke corong | `S03_L03` |
| 32–44 | Dua rak: **MINYAK JELANTAH (tersaring)** vs **BAHAN LILIN/PEMADAT (`recipe.bahanLilin`)**. Panah "jelantah → parafin" dicoret ✕ besar, tulisan **BUKAN PARAFIN**. Noya menggoyangkan jari | Static + shake saat ✕ | `S03_L04` |
| 44–56 | Cawan di atas kompor: bahan lilin meleleh (wipe dither), campur dengan minyak (swirl); lalu pendinginan (tint biru), dituang ke wadah, cair→padat wipe dari bawah. Pill **FISIKA** | Close-up cawan | `S03_L05` |
| 56–72 | **Lilin dinyalakan:** sumbu, cairan merambat naik (panah kapiler), sebagian menguap, titik biru **O₂** berputar dan bertemu uap → api; bloom besar. Pill **KIMIA**. `[OPSIONAL]` chip: *umumnya menghasilkan CO₂ + H₂O* | Push-in ke api, lighting utama = api | `S03_L06` |
| 72–80 | Empat ikon menyala berurutan: **pemisahan · pencampuran · perubahan wujud · pembakaran**; Noya menoleh ke pintu workshop | Pull-back | `S03_L07` |

| SFX (t) | ID | Vol |
|---|---|---|
| 0–80 | `AMB_LAB` (loop) | 0,12 |
| 0.5 | `UI_POP` (judul) | 0,35 |
| 10 / 14 / 18 | `MOLECULE_SNAP` ×3 | 0,5 |
| 8.5 | `CHALK_SCRIBBLE` | 0,3 |
| 24.0–30 | `MOLECULE_JIGGLE` (loop) | 0,2 |
| 28.0 | `STRAINER_DRIP` | 0,4 |
| 38.5 | `UI_ERROR` + shake | 0,6 |
| 46.0 | `WAX_MELT` | 0,4 |
| 49.0 | `SPOON_STIR` | 0,3 |
| 51.0 | `JAR_POUR` | 0,5 |
| 52.5 | `COOL_CRYSTAL` | 0,4 |
| 53.5 | `UI_TAG_FISIKA` | 0,6 |
| 59.0 | `MATCH_STRIKE` → `FLAME_IGNITE` | 0,6 |
| 61–72 | `FLAME_LOOP` | 0,2 |
| 64.0 | `O2_SWIRL` | 0,35 |
| 66.0 | `UI_TAG_KIMIA` | 0,6 |
| 74–78 | `UI_CONFIRM` ×4 | 0,4 |
| 79.0 | `TR_WHIP` | 0,5 |

### S04. Penerapan & analisis kimia (3:35–5:15) · Marsha · Workshop → Ruang Nonton

**Grade:** oranye hangat; Ruang Nonton redup dengan cahaya TV. **BGM:** `bgm_S04` lo-fi. Memakai **footage F01–F05, F07**. Jatah klip di TV mengikuti `footage.json` (durasi sebenarnya menentukan, bukan angka di bawah).

| t | Visual / aksi | Kamera | Dub |
|---|---|---|---|
| 0–10 | Marsha masuk Workshop; **4 stasiun bernomor** menyala satu per satu (Saring · Panaskan & campur · Cetak · Uji) | Dolly sepanjang stasiun | `S04_L01` |
| 10–20 | "Kita nonton langsung!" Semua duduk di sofa; Marsha menyalakan TV | Establishing Ruang Nonton | `S04_L01` (akhir) |
| 20–36 | **F01 Penyaringan** di TV. Callout. Pill **FISIKA** | Dolly-in ke TV | `S04_L02` |
| 36–52 | **F02 + F03 Pemanasan & pencampuran**; callout takaran dari `recipe.ts` (jika diisi) | Cutaway reaksi 1,5 dtk | `S04_L03` |
| 52–66 | **F04 Penuangan → F05 Pendinginan** (timelapse). Pill **FISIKA — pemadatan** | Dolly-in | `S04_L04` |
| 66–78 | **F07 Uji nyala** (singkat, aman). Pill **KIMIA — pembakaran**; ruangan ikut diterangi api | Close-up TV + rim-light api | `S04_L05` |
| 78–92 | **Analisis:** tiga kartu *Tekstur · Aroma · Kestabilan nyala* terbalik satu per satu. Isi = `TODO(user)` (kriteria saja bila belum ada data). Ais mencatat, Farel mengangguk | Static, cutaway wajah | `S04_L06` |
| 92–100 | Marsha menyerahkan "tongkat estafet" ke Ayuya & Lovyta; tirai merah | Pan ke panggung | `S04_L07` |

| SFX (t) | ID | Vol |
|---|---|---|
| 0–10 | `AMB_WORKSHOP` → 10–100 `AMB_CINEMA_ROOM` | 0,12 |
| 1.5 / 3.5 / 5.5 / 7.5 | `UI_CONFIRM` (stasiun menyala) | 0,4 |
| 11.0 | `SOFA_SIT` ×3 | 0,35 |
| 17.0 | `TV_ON` | 0,5 |
| 20.0 / 36.0 / 52.0 / 66.0 | `CRT_STATIC_POP` | 0,5 |
| tiap callout | `UI_POP` | 0,3 |
| 21.0 | `UI_TAG_FISIKA` | 0,6 |
| 53.0 | `COOL_CRYSTAL` (halus) | 0,3 |
| 54.5 | `UI_TAG_FISIKA` | 0,6 |
| 68.0 | `UI_TAG_KIMIA` | 0,6 |
| tiap reaksi | `EMOTE_EXCLAIM` / `EMOTE_HEART` | 0,4 |
| 80 / 83 / 86 | `UI_CARD_FLIP` ×3 | 0,45 |
| 90.0 | `CAMERA_SHUTTER` (Ais mencatat/foto) | 0,3 |
| 93.0 | `TR_CURTAIN` | 0,6 |

Audio footage: klip praktikum **mute** (dubbing menjelaskan), kecuali F07 `duck` agar bunyi api terdengar pelan.

### S05. Produk / solusi proyek (5:15–6:15) · Ayuya & Lovyta · Showroom

**Grade:** spotlight amber di atas plum. **BGM:** `bgm_S05` cerah. **Footage:** F06 (bingkai pameran) + foto P01.

| t | Visual / aksi | Kamera | Dub |
|---|---|---|---|
| 0–6 | Tirai terbuka ke Showroom; podium dengan lilin (belum menyala); Ayuya kiri, Lovyta kanan, pose "taraa" | Establishing → push-in | `S05_L01` Ayuya |
| 6–14 | **Persamaan visual (bukan "berubah jadi")**: `minyak jelantah (tersaring)` **+** `bahan lilin` **+** `pewangi` **+** `sumbu & wadah` **=** `lilin aromatis`. Tiap kotak ikon masuk satu per satu | Static, tilt-up | `S05_L02` Lovyta |
| 14–26 | Alur 5 ikon: saring → siapkan bahan & wadah bersumbu → campur → tuang → dinginkan. Mereka bergantian menunjuk; di dinding, bingkai memutar **F06** (natural) | Pan halus | `S05_L03`, `S05_L04` |
| 26–34 | Close-up produk nyata (foto/F06 dalam bingkai); emote ♥ dan ✨; label "nilai guna" | Zoom 2× | `S05_L05` Ayuya |
| 34–50 | **Panel keselamatan** muncul tiga kali (garis kuning-hitam): 🚫🍴 **BUKAN UNTUK DIKONSUMSI** · **JELANTAH ≠ UNTUK MEMASAK LAGI** · **UJI DENGAN PENGAWASAN · TEMPAT AMAN · JAUH DARI BENDA MUDAH TERBAKAR** | Static + shake kecil tiap panel | `S05_L06`, `S05_L07` |
| 50–60 | Lilin menyala sebentar (sparkle), Jeli berubah jadi api kecil di sumbu; keduanya menoleh ke pintu observatorium | Rack focus ke pintu | `S05_L08` |

| SFX (t) | ID | Vol |
|---|---|---|
| 0–60 | `AMB_SHOWROOM` (loop) | 0,10 |
| 0.5 | `TR_CURTAIN` | 0,6 |
| 1.0 | `UI_ACHIEVE` | 0,5 |
| 7 / 9 / 11 / 12.5 / 13.5 | `UI_POP` | 0,35 |
| 13.8 | `UI_CONFIRM` | 0,5 |
| 15–25 (5×) | `UI_BLIP` | 0,3 |
| 28.0 | `EMOTE_HEART` | 0,4 |
| 35 / 41 / 46 | `WARNING_BEEP` + `STAMP` | 0,5 / 0,6 |
| 51.0 | `MATCH_STRIKE` → `FLAME_IGNITE` | 0,5 |
| 52–58 | `FLAME_LOOP` | 0,15 |
| 59.0 | `TR_LIGHT_FLASH` | 0,6 |

### S06. Kreativitas, inovasi, data & bukti (6:15–7:50) · Farel & Sofi · Observatorium Data

**Grade:** navy-teal, aksen oranye. **BGM:** `bgm_S06`. **Footage/foto:** F06, F07 (mode bukti natural), P02–P03.

| t | Visual / aksi | Kamera | Dub |
|---|---|---|---|
| 0–12 | Observatorium; peta Indonesia pixel; badge **DATA PUSTAKA**. Penghitung naik bertahap sampai **898.000 ton/tahun**; sumber kecil: *IPOSS · ICMCER 2024* | Wide → push-in ke counter | `S06_L01` Farel |
| 12–22 | Tumpukan drum ikon (ilustrasi, diberi label *ilustrasi*), lampu kota meredup, kamera tilt-up | Tilt-up | `S06_L02` Sofi |
| 22–40 | **Grid 140 titik**; sebagian titik menyala oranye sampai proporsi **64,3%** ("langsung membuang"); sumber: *Katadata Insight Center · 2020 · 140 rumah tangga*. Catatan kecil: *visualisasi proporsi* | Static, DoF | `S06_L03` Sofi |
| 40–52 | Diagram inovasi: **Saring → Campur → Panaskan → Padatkan** → ikon lilin | Pan | `S06_L04` Farel |
| 52–72 | **Evidence Wall:** tiga panel *Tekstur · Aroma · Kestabilan nyala* berbadge teal **PENGAMATAN KELOMPOK**. Isi dari foto/F07 natural. Tanpa data → kriteria + `TODO(user)` | Dolly lintas panel | `S06_L05` Sofi |
| 72–82 | Layar terbelah: amber **DATA PUSTAKA = konteks masalah** vs teal **PENGAMATAN = bukti percobaan**; timbangan seimbang | Static | `S06_L06` Farel |
| 82–90 | Montase "nilai guna baru": jelantah → produk; Farel & Sofi tos (tepuk tangan, bukan suara) | Zoom keluar | `S06_L07`, `S06_L08` |
| 90–95 | Mereka menunjuk ke rak buku di kanan; kamera pan | Pan | `S06_L09` |

| SFX (t) | ID | Vol |
|---|---|---|
| 0–95 | `AMB_OBSERVATORY` (loop) | 0,10 |
| 1–10 | `COUNTER_ROLL` (loop, naik pitch) lalu `UI_CONFIRM` | 0,35 |
| 13–20 (7×) | `BARREL_THUD` | 0,5 |
| 23–38 | `DOT_POP` (80+ pop kecil, acak halus) | 0,25 |
| 39.0 | `UI_ACHIEVE` (64,3% selesai) | 0,5 |
| 42 / 44 / 46 / 48 | `UI_BLIP` (panah diagram) | 0,3 |
| 53 / 60 / 66 | `UI_CARD_FLIP` | 0,45 |
| 62–70 | `FLAME_LOOP` (pelan, saat F07 natural) | 0,12 |
| 73.0 | `UI_TAG_FISIKA` (badge amber) → 75.0 `UI_TAG_KIMIA` (badge teal) | 0,5 |
| 83.0 | `HIGH_FIVE_CLAP` | 0,5 |
| 91.0 | `TR_WHOOSH` | 0,4 |

### S07. Referensi & komunikasi ilmiah (7:50–8:50) · Disa · Perpustakaan

**Grade:** kuning kayu, debu emas. **BGM:** `bgm_S07` piano. Data kartu dari `references.json` (9 referensi, Lampiran C).

| t | Visual / aksi | Kamera | Dub |
|---|---|---|---|
| 0–8 | Perpustakaan tinggi, Disa di tangga geser; papan **REFERENSI** menyala | Tilt-down | `S07_L01` |
| 8–22 | Kartu 1–2 melayang keluar dari buku dan menyala: Pamungkas dkk. 2024 · Katadata 2020 | Follow kartu | `S07_L02` |
| 22–36 | Kartu 3–5: Puruhita 2022 · Karunia 2023 · Prosiding SNP2M 2024 | Parallax | `S07_L03` |
| 36–42 | Kartu 6–7: Gusti & Surtikanti 2024 · Naemah dkk. 2025 | Static | `S07_L04` |
| 42–50 | Kartu 8–9: OpenStax (trigliserida) · PubChem (parafin) | Zoom 2× | `S07_L05` |
| 50–60 | Dua ember: **amber = DATA PUSTAKA**, **teal = PENGAMATAN KELOMPOK**. Kartu referensi masuk amber, foto kelompok masuk teal | Static + sparkle | `S07_L06`, `S07_L07` |

| SFX (t) | ID | Vol |
|---|---|---|
| 0–60 | `AMB_LIBRARY` (loop) | 0,10 |
| 0.5 | `LADDER_CREAK` | 0,35 |
| 1.0 | `UI_CONFIRM` (papan menyala) | 0,4 |
| tiap kartu (9×) | `PAGE_TURN` + `UI_BLIP` | 0,35 / 0,25 |
| 36.5 | `BOOK_THUD` | 0,4 |
| 52 / 55 | `PAPER_SLIDE` | 0,35 |
| 57.0 | `UI_ACHIEVE` | 0,4 |

### S08. Kontribusi seluruh anggota (8:50–9:30) · Ais · Meja Kerja Tim

**Grade:** krem-oranye hangat. **BGM:** `bgm_S08`. **Footage/foto:** F08 (3 TV mini) + polaroid dari P0n. Data per anggota dari `contributions.json` (user isi).

| t | Visual / aksi | Kamera | Dub |
|---|---|---|---|
| 0–8 | Papan gabus + polaroid tim, tali merah menghubungkan | Zoom keluar | `S08_L01` |
| 8–28 | 9 karakter mengelilingi meja, masing-masing memegang prop tugas (saringan, panci, sumbu, wadah, kamera, laptop). Ikon tugas mengambang di atas kepala; F08 di tiga TV mini | Orbit pelan | `S08_L02` |
| 28–40 | **Lini perakitan estafet:** saring → campur → cetak → pasang sumbu → dekor → dokumentasi; semua tos; kemudian Ais menutup buku catatan | Pull-back | `S08_L03` |

| SFX (t) | ID | Vol |
|---|---|---|
| 0–40 | `AMB_OFFICE` (loop) | 0,10 |
| tiap polaroid | `PAPER_SLIDE` | 0,35 |
| 9–18 (9×) | `UI_POP` | 0,3 |
| 30–36 | `STEP_WOOD`, `JAR_PLACE`, `WICK_PLACE`, `CAMERA_SHUTTER` bergantian | 0,4 |
| 37.0 | `HIGH_FIVE_CLAP` | 0,5 |
| 39.0 | `TR_LIGHT_FLASH` | 0,6 |

### S09. Penutup (9:30–10:10) · Semua · Atap senja

**Grade:** senja → malam, **lilin = sumber cahaya utama**. **BGM:** `bgm_S09`. Letterbox: ya.

| t | Visual / aksi | Kamera | Dub |
|---|---|---|---|
| 0–3 | Atap senja, kota kecil berkedip; 9 karakter berjajar; lilin di meja tengah | Establishing | — |
| 3–24 | Tiap karakter maju dan berbicara; sorotan pindah ke pembicara, yang lain redup. Saat `S09_L05` (keselamatan) lilin dinyalakan **dengan hati-hati** (pose aman) | Close-up bergantian (zoom 2×) | `S09_L01`–`S09_L09` |
| 24–32 | Semua berkumpul, melompat; burst sparkle; teks besar **"Pilah, kumpulkan, dan manfaatkan limbah dengan bijak"** | Pull-back | `S09_L10` Semua |
| 32–40 | End card: *Terima kasih* + nama kelompok (`meta.ts`) + daftar mata kuliah/dosen; api lilin mengecil → **fade ke hitam** | Static | — |

| SFX (t) | ID | Vol |
|---|---|---|
| 0–40 | `AMB_NIGHT_ROOFTOP` (loop, fade-in) | 0,12 |
| tiap pembicara | `UI_BLIP` | 0,25 |
| `S09_L05` + 1.0 | `MATCH_STRIKE` → `FLAME_IGNITE` | 0,5 |
| setelah itu | `FLAME_LOOP` | 0,15 |
| 24.5 | `JUMP` ×9 + `UI_ACHIEVE` | 0,25 / 0,6 |
| 25.0 | `PORTAL_SHIMMER_SWELL` (versi singkat) | 0,5 |
| 36–40 | Fade semua SFX; BGM habis dengan ritard | — |

---

## 11. Naskah dubbing v2 (revisi dari naskah kasar)

### 11.1 Apa yang diubah dari naskah awal

| Perubahan | Alasan |
|---|---|
| Menambah *hook* (S02: "Coba bayangkan…") dan **kalimat penyambung antar pembicara** ("kita lihat bersama Noya!") | Alur terasa seperti estafet, bukan pembacaan terpisah |
| Opening dipecah: **S01A live** (audio asli) + **S01B dubbing di dunia pixel** | Mendukung konsep tangan menutup kamera |
| Perkenalan tiap anggota diberi **label bagian** ("yang bakal jelasin konsep kimianya") | Penonton tahu agenda sejak awal |
| S04 ditulis sebagai **narasi sambil menonton** klip praktikum, dipecah per langkah | Sinkron dengan klip di TV |
| Kalimat panjang dipecah menjadi kalimat lisan 12–20 kata | Lebih mudah dibaca dan dimimikkan |
| **Semua fakta dan angka tetap** (898 ribu ton, 64,3%, 140 RT, IPOSS/ICMCER 2024, Katadata 2020). Tidak ada klaim baru | Akurasi dan jejak referensi |
| Disa menyebut kategori kajian tambahan (analisis limbah jelantah, sabun) karena ada di daftar referensi | Konsisten dengan daftar pustaka |
| Penutup dipertahankan, ditambah pesan visual | Pesan inti tetap |

**Panduan baca:** santai tapi jelas, tempo ±2,4 kata/dtk, ambil napas di `[jeda]`. Teks dalam `[ ]` adalah arahan, **tidak dibaca**. Boleh ad-lib kecil asal fakta tidak berubah.

> **Penting:** waktu beat di Bagian 10 adalah estimasi awal. Sistem menjangkarkan cue ke **ID baris** (`{ line: 'S03_L02', offset: 1.2 }`), sehingga beat otomatis ikut memanjang/memendek mengikuti rekaman. Kolom *Dub* di Bagian 10 hanya menunjuk baris pembuka beat. Baris berurutan berikutnya tetap berada di beat yang sama sampai beat berikut dimulai.

### 11.2 S01A. Opening live (audio asli, bukan dubbing)

Saran isi (boleh diubah sesuai gaya kalian):

- **Semua:** "Halo, teman-teman!"
- **Malika:** "Aku Malika, yang bakal cerita soal masalahnya."
- **Noya:** "Aku Noya, yang jelasin konsep kimianya."
- **Marsha:** "Aku Marsha, yang bahas penerapannya."
- **Ayuya:** "Aku Ayuya, bagian produk." · **Lovyta:** "Aku Lovyta, bagian produk juga."
- **Farel:** "Aku Farel, bagian data dan bukti." · **Sofi:** "Aku Sofi, bagian data dan bukti juga."
- **Disa:** "Aku Disa, penjaga referensi." · **Ais:** "Dan aku Ais, yang cerita soal kerja sama tim."
- **Malika (menatap kamera):** "Hari ini kami mau ajak kalian lihat kimia di kehidupan sehari-hari lewat lilin aromatis dari minyak jelantah. Tapi untuk itu, kalian harus ikut kami masuk ke dunia yang beda dulu. Siap? [tangan menutup kamera]"

### 11.3 S01B. Masuk dunia (dubbing)

| ID | Pembicara | Teks |
|---|---|---|
| S01B_L01 | Malika | Selamat datang di Dunia Kimia Pixel! |
| S01B_L02 | **Semua** | Di video ini, kami akan mengajak kalian melihat bagaimana konsep kimia bisa kita temukan dalam kehidupan sehari-hari, lewat pembuatan lilin aromatis dari minyak jelantah. |
| S01B_L03 | Noya | Kedengarannya sederhana, ya? Tapi di balik satu lilin kecil, ada banyak konsep kimia yang bisa kita amati. |
| S01B_L04 | Malika | Yuk, kita mulai dari masalahnya dulu. |

### 11.4 S02. Identifikasi masalah (Malika)

| ID | Teks |
|---|---|
| S02_L01 | Coba bayangkan sisa minyak goreng di dapur rumahmu. |
| S02_L02 | Minyak yang sudah dipakai menggoreng berkali-kali itu kita sebut minyak jelantah. |
| S02_L03 | Sayangnya, minyak jelantah sering langsung dibuang ke tanah, selokan, atau saluran air. `[jeda]` |
| S02_L04 | Padahal, kalau dibuang sembarangan, minyak bisa mengganggu lingkungan. Di perairan, lapisan minyak dapat menghambat pertukaran oksigen dan mengganggu kehidupan organisme. |
| S02_L05 | Beberapa kajian juga membahas dampaknya terhadap kualitas air dan tanah. `[jeda]` |
| S02_L06 | Dipakai memasak lagi juga bukan ide bagus. Minyak yang sudah berulang kali dipanaskan bisa berubah dan menghasilkan senyawa hasil degradasi, jadi sebaiknya tidak dipakai lagi untuk mengolah makanan. `[jeda]` |
| S02_L07 | Tapi minyak jelantah masih bisa dimanfaatkan untuk keperluan lain. Beberapa kegiatan pengabdian masyarakat bahkan sudah mencoba mengolahnya menjadi lilin aromatis. |
| S02_L08 | Dari situ muncul pertanyaan proyek kami: bagaimana minyak jelantah bisa dimanfaatkan jadi lilin yang berguna, sambil tetap memahami proses kimia di balik pembuatannya? |
| S02_L09 | Untuk menjawabnya, kita lihat dulu konsep kimianya bersama Noya! |

### 11.5 S03. Ketepatan konsep kimia (Noya)

| ID | Teks |
|---|---|
| S03_L01 | Halo, aku Noya! Sekarang kita kenalan sama molekul di balik minyak goreng. |
| S03_L02 | Minyak goreng sebagian besar tersusun dari trigliserida, yaitu molekul yang terbentuk dari gliserol dan asam lemak. |
| S03_L03 | Saat dipakai berulang kali, panas dan proses memasak bisa mengubah kualitasnya. Menyaring memang bisa memisahkan remah atau kotoran padat, tapi penyaringan saja tidak mengembalikan minyak ke kondisi baru. |
| S03_L04 | Nah, ada satu hal penting: minyak jelantah tidak berubah menjadi parafin. Minyak dan bahan pembentuk lilin adalah bahan yang berbeda. Di proyek ini, minyak yang sudah disaring dicampur dengan bahan pemadat atau bahan lilin sesuai resep yang kami gunakan. |
| S03_L05 | Waktu campuran dipanaskan, bahan lilin melunak atau meleleh, jadi bisa dicampur dan dituang ke wadah. Setelah dingin, campuran memadat. Perubahan dari cair ke padat ini disebut pembekuan atau pemadatan, dan termasuk perubahan fisika, karena tidak menghasilkan zat baru. |
| S03_L06 | Lalu, saat lilin dinyalakan, panas api melelehkan bahan bakar di dekat sumbu. Cairan itu merambat naik lewat sumbu, sebagian menguap, lalu bereaksi dengan oksigen di udara. Pembakaran inilah perubahan kimia yang menghasilkan panas dan cahaya. |
| S03_L07 | Jadi, dalam satu lilin sederhana, kita bisa melihat pemisahan campuran, pencampuran bahan, perubahan wujud, dan reaksi pembakaran. Sekarang, kita lihat penerapannya bersama Marsha! |

### 11.6 S04. Penerapan & analisis kimia (Marsha, sambil menonton video praktikum)

| ID | Teks |
|---|---|
| S04_L01 | Oke, sekarang kita ikuti prosesnya langkah demi langkah. Dan kita nonton langsung hasil praktikum kami! |
| S04_L02 | Pertama, penyaringan. Minyak jelantah disaring untuk memisahkan sisa makanan dan kotoran yang terlihat. Ini contoh pemisahan secara fisika. Hasilnya mungkin tampak lebih bersih, tapi bukan berarti minyaknya kembali layak untuk memasak. |
| S04_L03 | Kedua, pemanasan dan pencampuran. Bahan lilin dipanaskan perlahan dengan cara yang aman sampai meleleh. Setelah itu, minyak jelantah yang sudah disiapkan dicampurkan sesuai takaran percobaan kami. Pengadukan membantu bahan tercampur lebih merata, dan pewangi ditambahkan sesuai prosedur dan bahan yang kami gunakan. |
| S04_L04 | Ketiga, pencetakan. Campuran dituang ke wadah yang sudah dipasangi sumbu, lalu dibiarkan mendingin. Saat suhunya turun, bahan lilin kembali memadat dan membentuk lilin. |
| S04_L05 | Perhatikan bedanya. Penyaringan dan pencampuran tidak otomatis membentuk zat baru. Pemadatan terjadi karena perubahan suhu. Sedangkan ketika sumbu menyala, berlangsung reaksi kimia pembakaran. |
| S04_L06 | Terakhir, analisisnya. Kita tidak cukup hanya melihat apakah lilinnya jadi. Kita juga amati tekstur setelah memadat, seberapa kuat aromanya, dan apakah nyalanya cukup stabil saat diuji. Dari situ kita tahu bagian mana yang sudah bekerja baik, dan bagian mana yang masih perlu diperbaiki. |
| S04_L07 | Nah, produk akhirnya, biar Ayuya dan Lovyta yang kenalkan! |

### 11.7 S05. Produk atau solusi proyek (Ayuya & Lovyta)

| ID | Pembicara | Teks |
|---|---|---|
| S05_L01 | Ayuya | Taraa! Ini produk kami: lilin aromatis yang memanfaatkan minyak jelantah sebagai salah satu bahannya. |
| S05_L02 | Lovyta | Minyak yang tadinya berpotensi dibuang begitu saja, kami olah jadi produk yang bisa menghadirkan aroma di ruangan. |
| S05_L03 | Ayuya | Prosesnya dimulai dari menyaring minyak, lalu menyiapkan bahan lilin dan wadah bersumbu. |
| S05_L04 | Lovyta | Kemudian bahan dicampur sesuai takaran kami, dituang, dan didinginkan, sampai terbentuk lilin yang siap kami amati dan uji. |
| S05_L05 | Ayuya | Solusinya sederhana, tapi bisa jadi contoh bahwa limbah rumah tangga masih bisa diberi nilai guna. |
| S05_L06 | Lovyta | Tapi ingat ya: lilin ini bukan untuk dikonsumsi, dan minyak yang sudah jadi jelantah juga tidak boleh dipakai lagi untuk memasak. |
| S05_L07 | Ayuya | Kalau mau menguji lilin, lakukan dengan pengawasan, di tempat yang aman, dan jauh dari benda yang mudah terbakar. |
| S05_L08 | Lovyta | Sekarang, kita lihat data dan buktinya bersama Farel dan Sofi! |

### 11.8 S06. Kreativitas & inovasi, data & bukti (Farel & Sofi)

| ID | Pembicara | Teks |
|---|---|---|
| S06_L01 | Farel | Sebelum membahas produknya lebih jauh, coba lihat dulu seberapa besar potensinya. Kajian Indonesia Palm Oil Strategic Studies, atau IPOSS, yang dimuat dalam prosiding ICMCER 2024, memperkirakan sektor rumah tangga Indonesia berpotensi menghasilkan sekitar 898 ribu ton minyak jelantah setiap tahun. |
| S06_L02 | Sofi | Angka itu menunjukkan bahwa jelantah bukan sekadar sisa kecil dari kegiatan memasak. Kalau tidak dikelola dengan baik, jumlahnya bisa menjadi persoalan lingkungan. |
| S06_L03 | Sofi | Survei Katadata Insight Center tahun 2020 terhadap 140 rumah tangga juga menunjukkan bahwa sekitar 64,3 persen responden langsung membuang minyak jelantah. Ini gambaran kebiasaan responden yang disurvei, sekaligus tanda bahwa masih ada peluang untuk mengenalkan cara pemanfaatan yang lebih baik. |
| S06_L04 | Farel | Dari situ, kami mencoba inovasi sederhana: mengolah minyak jelantah menjadi lilin aromatis, dengan menerapkan konsep tadi, mulai dari penyaringan, pencampuran, pemanasan, sampai pemadatan. |
| S06_L05 | Sofi | Lalu, bagaimana kita tahu produknya berhasil? Kami mengamati bentuk dan tekstur lilin setelah memadat, aroma yang dihasilkan, serta kestabilan nyalanya saat diuji. Foto dan catatan proses juga menjadi bukti pendukung. |
| S06_L06 | Farel | Jadi ada dua jenis informasi. Angka nasional tadi memberi konteks tentang masalahnya, sedangkan hasil pengamatan memberi bukti dari percobaan yang kami lakukan. |
| S06_L07 | Sofi | Inovasi ini bukan cuma soal membuat lilin yang harum, tapi juga memberi nilai guna baru pada bahan yang sering dianggap tidak berguna. |
| S06_L08 | Farel | Dari proyek ini kami belajar bahwa kimia bukan hanya teori dan rumus. Kimia juga membantu kita memahami bahan di sekitar dan mencari cara kreatif untuk memanfaatkannya. |
| S06_L09 | Sofi | Nah, supaya semua ini bisa ditelusuri, kita lihat referensinya bersama Disa! |

### 11.9 S07. Referensi & komunikasi ilmiah (Disa)

| ID | Teks |
|---|---|
| S07_L01 | Aku Disa, penjaga perpustakaan di dunia ini. Di proyek ini, kami memakai beberapa referensi untuk memahami masalah jelantah, potensi pemanfaatannya, dan konsep kimianya. |
| S07_L02 | Untuk potensi jelantah rumah tangga, kami merujuk kajian Pamungkas, Sentosa, dan Padmansih di prosiding ICMCER 2024. Untuk survei 140 rumah tangga, kami merujuk publikasi Katadata Insight Center tahun 2020. |
| S07_L03 | Kami juga membaca artikel di Jurnal Puruhita dan Jurnal Karunia tentang risiko penggunaan atau pembuangan minyak jelantah, serta publikasi prosiding seminar nasional tentang pengolahan jelantah menjadi lilin aromaterapi. |
| S07_L04 | Ditambah kajian tentang analisis limbah jelantah dan pemanfaatannya untuk sabun. |
| S07_L05 | Untuk konsep bahan, kami merujuk OpenStax tentang trigliserida dalam minyak dan lemak, serta PubChem tentang sifat parafin. |
| S07_L06 | Dan satu hal lagi: kami membedakan data dari sumber pustaka dan hasil pengamatan kelompok sendiri. Dengan begitu, informasi kami lebih jelas, bisa ditelusuri, dan tidak tercampur dengan data penelitian lain. |
| S07_L07 | Terakhir, siapa saja yang bekerja di balik proyek ini? Kita ke Ais! |

### 11.10 S08. Kontribusi seluruh anggota (Ais)

| ID | Teks |
|---|---|
| S08_L01 | Terakhir, soal kerja sama tim. Dalam pembuatan lilin dari minyak jelantah ini, semua anggota kelompok ikut berkontribusi. |
| S08_L02 | Ada yang menyiapkan alat dan bahan, menyaring minyak, mencampur bahan, serta membantu proses pemanasan dan pencetakan. Ada juga yang menyiapkan wadah, memasang sumbu, mendekorasi produk, mendokumentasikan proses, dan mengumpulkan informasi pendukung. Walaupun tugasnya berbeda-beda, kami saling membantu supaya prosesnya berjalan lancar. |
| S08_L03 | Lewat proyek ini, kami bukan cuma belajar mengolah minyak jelantah jadi lilin. Kami juga belajar membagi tugas, bekerja sama, berkomunikasi, dan bertanggung jawab atas hasil kelompok. |

### 11.11 S09. Penutup (Semua, satu kalimat per orang)

| ID | Pembicara | Teks |
|---|---|---|
| S09_L01 | Malika | Minyak jelantah jangan dibuang sembarangan. |
| S09_L02 | Noya | Kenali konsep kimia di balik prosesnya. |
| S09_L03 | Marsha | Amati dan catat hasilnya dengan teliti. |
| S09_L04 | Ayuya | Cari cara agar bahan sisa punya nilai guna. |
| S09_L05 | Lovyta | Tetap utamakan keselamatan saat membuat dan menguji produk. |
| S09_L06 | Farel | Mulai dari langkah sederhana di sekitar kita. |
| S09_L07 | Sofi | Karena ide kecil juga bisa membawa perubahan. |
| S09_L08 | Disa | Terima kasih sudah menyimak penjelasan kami. |
| S09_L09 | Ais | Sampai jumpa! |
| S09_L10 | **Semua** | Yuk, gunakan ilmu untuk memahami dan merawat lingkungan sekitar! |

### 11.12 Catatan untuk penyunting (diwarisi dari naskah awal)

- Angka 898 ribu ton dan 64,3 persen adalah **data pustaka**, bukan hasil eksperimen kelompok.
- Naskah menyebut **indikator** pengamatan tanpa mengarang angka. Jika ada data nyata (tekstur, aroma, kestabilan nyala), tambahkan di `S06_L05` dan di kartu analisis S04.
- Sesuaikan "bahan pemadat atau bahan lilin" dengan **bahan yang benar-benar digunakan**; isi `src/data/recipe.ts`, dan agent akan menampilkan nama bahan di S03/S04/S05.
- Jika hasil rekaman sangat berbeda dari teks di atas, **ubah `src/data/script.ts`** (teks subtitle) supaya subtitle sama persis dengan yang diucapkan.

---

## 12. Katalog SFX lengkap (satu sumber kebenaran)

**Sumber:** `R` = `@remotion/sfx` · `S` = sintesis lokal `synth-sfx.mjs` · `E` = ElevenLabs `text_to_sound_effects` (maks 5 dtk) · `C` = CC0 manual. Semua prompt E otomatis diakhiri `, no voice, no music, clean, dry`. Prompt ditulis Inggris karena model SFX paling stabil dengan itu.

### 12.1 UI & karakter

| ID | Dur | Sumber | Prompt / resep |
|---|---|---|---|
| `UI_BLIP` | 0,08 | S | square 880 Hz, decay 60 ms |
| `UI_POP` | 0,12 | S | triangle sweep 500→900 Hz, soft |
| `UI_CONFIRM` | 0,25 | S | arpeggio 1047→1319→1568 Hz |
| `UI_ERROR` | 0,25 | S | square 140 Hz 2×80 ms |
| `UI_ACHIEVE` | 1,2 | S/E | "short bright 8-bit achievement fanfare, three ascending notes with sparkle" |
| `UI_DING_SPARKLE` | 1,0 | E | "single glassy bell ding with magical sparkle tail" |
| `UI_TAG_FISIKA` | 0,6 | S/E | "cool teal crystal chime, soft, 2 notes rising" |
| `UI_TAG_KIMIA` | 0,6 | S/E | "warm orange bloom whoosh with sparkling chime, rising" |
| `UI_CARD_FLIP` | 0,3 | E/C | "paper card flip with tiny pixel blip" |
| `JUMP` / `LAND` | 0,2 | S | square sweep 300→700 Hz / noise 40 ms low-pass |
| `STEP_WOOD` | 0,1 | S/E | "single soft footstep on wooden floor, 8-bit flavored" |
| `EMOTE_EXCLAIM` | 0,25 | S | two square notes 1200/1500 Hz |
| `EMOTE_QUESTION` | 0,3 | S | square 600→900 Hz rising bend |
| `EMOTE_IDEA` | 0,6 | S/E | "lightbulb ding, bright, cartoon idea" |
| `EMOTE_HEART` | 0,5 | S/E | "soft cute twinkle, three tiny bells" |
| `HIGH_FIVE_CLAP` | 0,3 | E/C | "two palms high-five clap, dry, short" |
| `WARNING_BEEP` | 0,4 | S | square 440 Hz double beep |
| `STAMP` | 0,3 | E/C | "rubber stamp thud on paper" |

### 12.2 Transisi, tangan & portal

| ID | Dur | Sumber | Prompt |
|---|---|---|---|
| `TR_WHOOSH` | 0,15 | **R** `whoosh` | — |
| `TR_WHIP` | — | **R** `whip` | — |
| `TR_CURTAIN` | 1,5 | E/C | "heavy velvet theater curtain being pulled open, cloth rustle with rope" |
| `TR_IRIS` | 0,6 | S/E | "retro cartoon iris wipe closing, short descending slide whistle-free synth sweep" |
| `TR_LIGHT_FLASH` | 0,7 | E | "warm light flash with airy shimmer swell and soft impact" |
| `TR_PIXEL_DISSOLVE` | 1,0 | S/E | "8-bit glitch dissolve sweep, digital pixel scatter" |
| `HAND_COVER_THUMP` | 0,5 | E/C | "palm covering a phone camera lens, muffled thump with fabric and skin contact" |
| `PORTAL_SUB_RUMBLE` | 4,0 | E | "deep sub rumble swelling slowly, magical portal charging, no melody" |
| `HAND_UNCOVER_RUSTLE` | 1,0 | E | "hand sliding away from a lens, soft skin and fabric rustle, light" |
| `PORTAL_SHIMMER_SWELL` | 3,0 | E | "magical shimmer swell with glassy sparkles opening into a warm space" |

### 12.3 Ambience (loop 5 dtk, crossfade 0,3 dtk)

`AMB_STAGE` "empty theater hush, distant air, faint room tone" · `AMB_KITCHEN` "quiet home kitchen morning, faint fridge hum, distant birds" · `AMB_WATER_UNDER` "underwater river ambience, low hum, tiny bubbles" · `AMB_LAB` "soft laboratory room tone with distant gentle bubbling" · `AMB_WORKSHOP` "light workshop ambience, faint tools, wooden creaks" · `AMB_CINEMA_ROOM` "cozy dim living room, faint CRT TV hum" · `AMB_SHOWROOM` "quiet museum hall air, faint reverb" · `AMB_OBSERVATORY` "high-tech control room hum, faint data blips" · `AMB_LIBRARY` "quiet library, faint page rustles, dust" · `AMB_OFFICE` "quiet room with distant pencil scratching" · `AMB_NIGHT_ROOFTOP` "evening rooftop, soft wind, crickets, distant city".

### 12.4 Foley & sains

| ID | Dur | Prompt |
|---|---|---|
| `SIZZLE` | 4 | "oil gently sizzling in a frying pan, low intensity" |
| `OIL_POUR` | 3 | "thick golden cooking oil pouring from a bottle, viscous" |
| `OIL_DRAIN_GLUG` | 2 | "liquid glugging down a sink drain" |
| `BUBBLES_LOOP` | 5 | "gentle underwater bubbles rising, loopable" |
| `HEAT_SHIMMER` | 2 | "rising heat shimmer, airy tonal whoosh, subtle" |
| `MOLECULE_SNAP` | 0,25 | "small magnetic click snap, satisfying, tiny glass tick" |
| `MOLECULE_JIGGLE` | 4 | "tiny rapid jittery electronic wiggle, loopable, soft" |
| `CHALK_SCRIBBLE` | 1,5 | "chalk scribbling on blackboard, short" |
| `STRAINER_DRIP` | 3 | "liquid dripping through a metal mesh strainer into a bowl" |
| `WAX_MELT` | 4 | "wax melting in a pot, soft bubbling and gentle crackle" |
| `SPOON_STIR` | 3 | "spoon stirring thick liquid in a metal pot" |
| `JAR_POUR` | 3 | "warm liquid being poured into a glass jar" |
| `COOL_CRYSTAL` | 2 | "liquid cooling and crystallizing, tiny glassy ticks, light shimmer" |
| `MATCH_STRIKE` | 1 | "match being struck and lit, short" |
| `FLAME_IGNITE` | 1 | "small candle flame igniting, soft whoomp" |
| `FLAME_LOOP` | 5 | "gentle candle flame flicker, very quiet, loopable" |
| `O2_SWIRL` | 2 | "airy swirl of air gathering toward a flame, soft" |
| `SOFA_SIT` | 0,6 | "person sitting down on a soft sofa" |
| `TV_ON` | 1 | "old CRT television turning on, static thump and rising whine" |
| `CRT_STATIC_POP` | 0,4 | "brief CRT static burst with channel-change click" |
| `CAMERA_SHUTTER` | 0,3 | **R** (`shutter-*` jika ada) atau "camera shutter click" |
| `COUNTER_ROLL` | 3 | "mechanical counter rolling up, rising tick sequence" (S: pulse train naik pitch) |
| `BARREL_THUD` | 0,5 | "metal drum placed down, dull thud" |
| `DOT_POP` | 0,05 | S: noise burst 20 ms + sine 1 kHz, pitch acak ±10% |
| `LADDER_CREAK` | 1 | "wooden rolling library ladder creak" |
| `PAGE_TURN` | 0,6 | "single book page turn" (cek `R` dulu) |
| `BOOK_THUD` | 0,5 | "book set down on a wooden shelf" |
| `PAPER_SLIDE` | 0,5 | "paper sliding on a table" |
| `JAR_PLACE` | 0,4 | "glass jar set on a wooden table" |
| `WICK_PLACE` | 0,3 | "small metal tab placed into a glass jar, tink" |

---

## 13. Kerangka kode kunci (agent: ini kerangka, bukan kode final; selalu cocokkan dengan `/remotion-docs`)

### 13.1 Root & durasi dinamis

```tsx
// src/Root.tsx
import {Composition} from 'remotion';
import {Main} from './Main';
import {FPS, computeTotalFrames} from './data/timeline';

export const Root = () => (
  <Composition
    id="LilinJelantah"
    component={Main}
    width={1920} height={1080} fps={FPS}
    durationInFrames={18180}                 // fallback; dihitung ulang di bawah
    calculateMetadata={async () => ({durationInFrames: computeTotalFrames()})}
  />
);
```

### 13.2 `timeline.ts`

```ts
export const FPS = 30;
export const SCENES = [
  {id: 'S01A', plannedSec: 40, out: 0,  live: true},   // durasi = F00 + ramp
  {id: 'S01B', plannedSec: 30, out: 15},
  {id: 'S02',  plannedSec: 65, out: 15},
  {id: 'S03',  plannedSec: 80, out: 15},
  {id: 'S04',  plannedSec: 100, out: 15},
  {id: 'S05',  plannedSec: 60, out: 15},
  {id: 'S06',  plannedSec: 95, out: 15},
  {id: 'S07',  plannedSec: 60, out: 15},
  {id: 'S08',  plannedSec: 40, out: 15},
  {id: 'S09',  plannedSec: 40, out: 0},
] as const;

export const sceneFrames = (s: (typeof SCENES)[number]) =>
  Math.max(Math.round(s.plannedSec * FPS), Math.ceil((dubEndSec(s.id) + 1.0) * FPS));
export const computeTotalFrames = () =>
  SCENES.reduce((a, s) => a + sceneFrames(s) - s.out, 0);   // overlap transisi dikurangi
export const MIN_FRAMES = 8 * 60 * FPS;                    // 14.400, dicek validate.ts
```

### 13.3 `Main.tsx` (TransitionSeries)

```tsx
<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={dur('S01A')}><S01A_LiveIntro /></TransitionSeries.Sequence>
  {/* hard cut: tidak ada Transition di sini */}
  <TransitionSeries.Sequence durationInFrames={dur('S01B')}><S01B_WorldReveal /></TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={iris()} timing={linearTiming({durationInFrames: 15})} />
  <TransitionSeries.Sequence durationInFrames={dur('S02')}><S02_Masalah /></TransitionSeries.Sequence>
  <TransitionSeries.Transition presentation={pixelDissolve({blocks: 24})} timing={linearTiming({durationInFrames: 15})} />
  {/* ...S03–S09 mengikuti tabel Bagian 9 */}
</TransitionSeries>
{/* Lapisan global di atas: <GlobalAudio/> (BGM + ducking) dan <Subtitles/> */}
```

Presentasi kustom (`pixelDissolve`, `curtain`, `iris`, `lightFlash`) ditulis dengan API `TransitionPresentation` dari `@remotion/transitions`; baca `rules/transitions.md` di skill. `pixelDissolve`: SVG `<mask>` berisi grid blok (mis. 24×14) yang terbuka berurutan menurut `random(seed + index)` dan `presentationProgress`.

### 13.4 Stage, kamera, jangkar baris

```tsx
// src/engine/PixelStage.tsx
export const PX = 4, W = 480, H = 270;
export const PixelStage: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill style={{background: '#000'}}>
    <div style={{width: W, height: H, transform: `scale(${PX})`, transformOrigin: 'top left',
                 imageRendering: 'pixelated', position: 'relative', overflow: 'hidden'}}>
      {children}
    </div>
  </AbsoluteFill>
);

// src/lib/seconds.ts : jangkar ke baris dubbing
export const lineStart = (lineId: string, offsetSec = 0) =>
  Math.round((dubMap[lineId].startSec + offsetSec) * FPS);     // relatif awal scene
```

```ts
// src/data/cues/S03.cues.ts (contoh)
export const S03 = [
  {at: {line: 'S03_L02', off: 0.0}, who: 'noya', do: 'point'},
  {at: {line: 'S03_L02', off: 2.2}, fx: 'moleculeSnap', n: 1},
  {at: {line: 'S03_L04', off: 3.0}, fx: 'notParaffinX', sfx: 'UI_ERROR'},
  {at: {line: 'S03_L06', off: 0.5}, fx: 'lightCandle', sfx: ['MATCH_STRIKE', 'FLAME_IGNITE']},
];
```

### 13.5 Mulut dari lip-sync

```ts
export const useMouth = (lineId: string | undefined, startFrame: number) => {
  const frame = useCurrentFrame();
  if (!lineId) return 'closed';
  const track = lipsync[lineId];
  if (!track) return placeholderMouth(frame, lineId);          // mode sebelum dubbing ada
  const i = Math.floor(((frame - startFrame) / FPS) * track.fps);
  return (['closed', 'half', 'open'] as const)[track.mouth[i] ?? 0];
};
```

### 13.6 `package.json` scripts

```json
{
  "scripts": {
    "dev": "remotion studio",
    "sync": "tsx scripts/probe-media.ts && tsx scripts/analyze-dub.ts && tsx scripts/validate.ts",
    "sfx": "tsx scripts/gen-sfx.ts",
    "still": "remotion still LilinJelantah --frame=2100 out/still.png",
    "render:preview": "remotion render LilinJelantah out/preview.mp4 --scale=0.5 --crf=28",
    "render:final": "remotion render LilinJelantah out/lilin-jelantah-final.mp4 --codec=h264 --crf=16"
  }
}
```

---

## 14. Rencana kerja agent per fase (dengan CHECKPOINT)

Agent selalu: (1) membaca skill, (2) mengerjakan fase, (3) membuktikan dengan **still PNG / render pendek**, (4) commit, (5) melapor.

| Fase | Tugas | Output | Definition of Done |
|---|---|---|---|
| **0. Setup** | Buat proyek, pasang skill & paket (2.4), setup `.mcp.json`, buat struktur folder, `AGENTS.md`, skill `pixel-cinema-style`, `LICENSES.md`, git init | Studio berjalan; komposisi kosong 1920×1080 | `npm run dev` jalan; `npx skills list` menampilkan skill Remotion |
| **1. Style frame** | Baca screenshot, ekstrak palet, bangun **1 frame hero**: Malika (sementara placeholder sprite) + tirai blur + orb teal + bloom + vignette + grain | `out/style-frame-v1.png` bandingkan dengan referensi | Tampak setara referensi (pixel tegas, latar blur, cahaya hangat) |
| ⛔ **CHECKPOINT-1** | Tampilkan style frame + palet. **Tunggu persetujuan** | | User menyetujui |
| **2. Engine** | `PixelStage, Camera, Parallax, Lighting (PointLight, Rays, Bloom), Dust, Vignette, Grain, Letterbox, Grade`, `DialogueBox, NamePlate, Tag, Callout, Counter` | Halaman demo `EngineDemo` (komposisi uji) | Tiap efek bisa dinyalakan via prop; render 5 dtk tanpa error |
| **3. Karakter** | Pilih jalur (6.1), buat 9 karakter + rig + `lineup sheet` | `out/lineup.png`, 9 folder layer | Lolos cek palet; ekspresi/mulut/pose lengkap |
| ⛔ **CHECKPOINT-2** | Tunjukkan lineup sheet. User menilai kemiripan/ciri khas | | Disetujui atau direvisi per karakter |
| **4. Animatic** | Seluruh timeline dengan kotak placeholder + judul scene + subtitle teks + timer; durasi dari naskah (2,4 kata/dtk) | `out/animatic.mp4` (render 0,5×) | **Total ≥ 14.400 frame**; urutan sesuai Bagian 9; transisi bekerja |
| **5. Footage** | `normalize-footage`, `probe-media`, `footage.json`, `RealFootage/TvScreen/EvidenceFrame/FootageSlot`, `detect-cover`, `make-pixel-ramp`, `giant_palm`, transisi tangan (7.8) | Slice: S01A→S01B berjalan dengan footage F00 (atau placeholder) | Hard cut tangan tidak terlihat; footage tidak desync |
| ⛔ **CHECKPOINT-3** | Tunjukkan slice transisi tangan (render 0:30–1:15) | | User menyetujui |
| **6. Produksi scene** | Urutan: **S03 (vertical slice penuh)** → S02 → S04 → S05 → S06 → S07 → S08 → S09 → S01B. Tiap scene: latar, prop, cue karakter, animasi sains, overlay data, SFX cue | Satu PR/commit per scene + still tiap beat | Mengikuti tabel Bagian 10; aturan konten 1.4 terpenuhi |
| **7. Audio** | `npm run sfx` (generate/sintesis), BGM, ambience, ducking, `analyze-dub` (jika WAV ada), pasang dub ke `dub-map` | Mix lengkap | Level sesuai 8.2; tidak ada SFX berisi suara manusia |
| **8. Subtitle & kredit** | Whisper (`id`) → caption JRPG/TikTok, `meta.ts`, end card, `references.json` | Subtitle akurat | Subtitle = ucapan; typo nol |
| **9. QA & render** | `validate.ts`, checklist Bagian 15, render final + versi ringan | `out/lilin-jelantah-final.mp4` | Semua checklist hijau |

### Paralelisasi (Claude Code)

Setelah Fase 2–3 selesai, scene S02–S09 independen. Agent boleh memakai **sub-agent paralel, satu per scene**, dengan syarat: tiap sub-agent hanya menyentuh `src/scenes/<scene>.tsx`, `src/data/cues/<scene>.cues.ts`, dan aset scene-nya; perubahan di `engine/`, `characters/`, `ui/` hanya boleh lewat agent utama. Di Antigravity, kerjakan berurutan atau gunakan beberapa agent dengan batas file yang sama.

### Prompt per fase (contoh)

```text
FASE 6 · S03: Baca Bagian 10 (S03) dan Bagian 11.5 di docs/PLAN.md. Bangun S03_Konsep.tsx
dengan cue di cues/S03.cues.ts yang dijangkarkan ke ID baris dubbing. Wajib: skema trigliserida,
tanda "BUKAN PARAFIN", tag FISIKA/KIMIA, dan api lilin sebagai sumber cahaya utama. Pakai
remotion-best-practices. Render 3 still (awal, tengah, akhir) dan 1 klip 10 dtk, lalu laporkan.
```

---

## 15. QA & pengiriman

### 15.1 Checklist akhir

| Area | Cek |
|---|---|
| **Konten** | Tidak ada klaim "jelantah menjadi parafin"; FISIKA/KIMIA benar; angka 898 ribu ton, 64,3%, 140 RT tepat; label data pustaka vs pengamatan konsisten; pesan keselamatan muncul di S05 dan S09 |
| **Data** | Tidak ada angka hasil uji yang dikarang; semua `TODO(user)` sudah diisi atau ditampilkan sebagai kriteria |
| **Durasi** | ≥ 8:00 (idealnya ±10:00) |
| **Sinkron** | Mulut sinkron; subtitle sama persis dengan ucapan; SFX tepat di beat (thump tangan, tag, api) |
| **Audio** | Dub ≈ −16 LUFS (`ffmpeg -i out/final.mp4 -af loudnorm=print_format=summary -f null -`); tidak clipping; ducking halus; tidak ada suara manusia dari SFX |
| **Visual** | Tidak ada piksel bergetar; tidak ada elemen di luar palet; nameplate terbaca; letterbox tidak memotong subtitle; footage tidak buram/desync |
| **Aksesibilitas** | Kontras teks ≥ 4,5:1; subtitle tersedia; tidak ada kedipan cepat berlebihan (≤ 3 kedip/dtk) |
| **Legal** | `LICENSES.md` lengkap (font OFL, SFX/BGM, foto); semua anggota setuju wajahnya tampil di footage |
| **Teknis** | Render selesai tanpa error; ukuran file wajar; putar di VLC dan HP |

### 15.2 Perintah render

```bash
npm run sync                       # sinkron dubbing, durasi, lipsync, validasi
npx remotion still LilinJelantah --frame=2100 out/s01b-start.png          # cek satu frame
npx remotion render LilinJelantah out/preview.mp4 --scale=0.5 --crf=28     # draft cepat
npx remotion render LilinJelantah out/final.mp4 --codec=h264 --crf=16      # final 1080p
# Versi ringan untuk dikumpulkan/dibagikan:
ffmpeg -i out/final.mp4 -vf scale=1280:720 -c:v libx264 -crf 23 -c:a aac -b:a 160k out/final-720p.mp4
```

Render lambat? Kurangi `blur` besar, matikan grain sementara di draft, render per rentang (`--frames=0-1199`), dan sesuaikan `--concurrency`.

---

## 16. Risiko & fallback

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Sprite buatan agent kurang bagus | Gaya tidak seperti referensi | Checkpoint-2; fokus pada latar blur + lighting; jalur B/C; poles di Aseprite |
| Footage VFR / desync | Suara & gambar tidak sinkron | Wajib `normalize-footage.sh` (7.3) |
| Dubbing lebih pendek dari rencana | Video < 8 menit | Lantai durasi + extender beats (Bagian 9) |
| Dubbing berbeda dari teks | Subtitle salah | Update `script.ts` atau pakai Whisper (Fase 8) |
| Kredit API habis | SFX/karakter tidak bisa digenerate | Fallback `synth-sfx.mjs`, `@remotion/sfx`, CC0 manual, jalur A |
| Render berat (blur + banyak layer) | Render lama | Draft 0,5×, kurangi blur, per rentang frame |
| MCP Remotion tidak ada | — | Memang sudah dimatikan; pakai skill `/remotion-docs` |
| Lokasi skill/MCP Antigravity berubah | Skill tidak terbaca | Cek `.agents/` vs `.agent/` dan dokumentasi terbaru |
| Data hasil uji belum ada | Bagian bukti kosong | Tampilkan kriteria + placeholder; **jangan mengarang** |
| Hak cipta musik/SFX | Video bisa diklaim | Catat lisensi; pakai CC0/generate |

---

## Lampiran A. Skill kustom `pixel-cinema-style`

Simpan sebagai `.claude/skills/pixel-cinema-style/SKILL.md` (Claude Code) atau `.agents/skills/pixel-cinema-style/SKILL.md` (Antigravity).

```markdown
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
```

## Lampiran B. `AGENTS.md` (salin juga ke `CLAUDE.md`)

```markdown
# Aturan agent untuk proyek ini
- Sumber kebenaran: docs/PLAN.md. Baca sebelum bekerja. Gaya: skill pixel-cinema-style.
- Kerjakan per fase (PLAN Bagian 14). Berhenti di setiap CHECKPOINT dan minta persetujuan user.
- Jangan membuat TTS atau suara karakter. Dubbing direkam manual oleh user.
- Jangan mengarang data/angka/hasil percobaan. Gunakan TODO(user) untuk data yang belum ada.
- Semua waktu dalam detik relatif scene, dijangkarkan ke ID baris dubbing. Tanpa Math.random().
- Perintah: npm run dev | npm run sync | npm run sfx | npm run render:preview | npm run render:final.
- Pakai skill remotion-best-practices dan /remotion-docs. MCP Remotion sudah dimatikan, jangan dipasang.
- Setelah tiap fase: render still/klip bukti, commit `phase-N: ...`, lapor singkat.
- Catat setiap aset bersumber luar di public/LICENSES.md.
```

## Lampiran C. Skema data & referensi

```ts
// src/data/meta.ts
export const META = {
  judul: 'Kimia dalam Kehidupan Sehari-hari: Lilin Aromatis dari Minyak Jelantah',
  kelompok: 'TODO(user)', matkul: 'Kimia Dasar (Praktikum)', dosen: 'TODO(user)', institusi: 'TODO(user)',
  anggota: ['Malika','Noya','Marsha','Ayuya','Lovyta','Farel','Sofi','Disa','Ais'],
  HAND_FILL: '#C98A5E',      // diisi otomatis dari scripts (7.8 tahap 2)
  coverAtSec: 0,             // diisi otomatis dari scripts/detect-cover.sh
};
// src/data/recipe.ts
export const recipe = {
  bahanLilin: 'TODO(user)',  // mis. nama bahan pemadat/lilin yang benar-benar dipakai
  pewangi: 'TODO(user)', wadah: 'TODO(user)', sumbu: 'TODO(user)',
  takaran: { jelantahTersaring: 'TODO(user)', bahanLilin: 'TODO(user)', pewangi: 'TODO(user)' },
  suhu: 'TODO(user)',
};
// src/data/contributions.json
// { "malika": ["menyiapkan alat dan bahan"], "noya": ["TODO(user)"], ... }
```

### `references.json` (isi dari daftar pustaka; dipakai kartu S07 dan end card)

| # | Kartu singkat | Rincian lengkap |
|---|---|---|
| 1 | Pamungkas dkk. · 2024 | Pamungkas, D. H., Sentosa, D., & Padmansih, O. K. (2024). "Prospects for Augmenting UCO Collection from Households for SAF Production in Indonesia." *5th International Conference on Multidisciplinary and Current Educational Research (ICMCER 2024)*, hlm. 76. https://iferp-in-docs.s3.ap-south-1.amazonaws.com/conf-proceedings/2024/5th-ICMCER-2024.pdf |
| 2 | Katadata · 2020 | Yoshio, A. (2020, 3 November). "Minyak Jelantah Rumah Tangga Masih Banyak Terbuang." Katadata Insight Center. https://katadata.co.id/infografik/5fa1323b451a1/minyak-jelantah-rumah-tangga-masih-banyak-terbuang |
| 3 | Prosiding SNP2M · 2024 | Nurdin, M. I., Thahir, R., Widiyanti, S. E., & Pampang, H. (2024). "PKM Pengolahan Minyak Jelantah Menjadi Lilin Aromaterapi." *Prosiding Seminar Nasional Penelitian & Pengabdian Kepada Masyarakat*, Vol. 8. https://jurnal.poliupg.ac.id/index.php/snp2m/article/view/5335 |
| 4 | Puruhita · 2022 | Widowati, E., Reva, D. S. N., Anwar, S. H. N., & Chasanah, N. R. (2022). "Upaya Penanaman Kesadaran Masyarakat tentang Bahaya Minyak Jelantah Melalui Pengolahan Pembuatan Lilin Aromaterapi di Desa Windusari." *Jurnal Puruhita, 4*(2), 48–52. https://doi.org/10.15294/puruhita.v4i2.63473 |
| 5 | Karunia · 2023 | Agustikawati, N., Setianingsih, F., & Putri, D. F. A. (2023). "Pelatihan Penjernihan Minyak Jelantah Pada Ibu PKK Desa Labuhan Sumbawa, Kec. Labuhan Badas, Kabupaten Sumbawa." *Karunia: Jurnal Hasil Pengabdian Masyarakat Indonesia, 2*(3), 188–194. https://doi.org/10.58192/karunia.v2i3.1113 |
| 6 | Gusti & Surtikanti · 2024 | Gusti, U. A., & Surtikanti, H. K. (2024). "Analisis Limbah Minyak Jelantah Hasil Penggorengan Pelaku UMKM di Kelurahan Gegerkalong Kota Bandung." *Jurnal Rekayasa Hijau, 8*(3), 263–272. https://doi.org/10.26760/jrh.v8i3.263-272 |
| 7 | Naemah dkk. · 2025 | Naemah, D., Fitriani, A., Satriadi, T., Rudy, G. S., Aryadi, M., & Rahmadi, A. (2025). "Pemanfaatan Minyak Jelantah sebagai Bahan Pembuatan Sabun untuk Mendorong Perilaku Ramah Lingkungan di Masyarakat." *Jurnal Pembelajaran Pemberdayaan Masyarakat (JP2M), 7*(1), 90–100. https://doi.org/10.33474/jp2m.v7i1.24336 |
| 8 | OpenStax | OpenStax. "24.3 Lipid Metabolism." *Anatomy and Physiology 2e*. https://openstax.org/books/anatomy-and-physiology-2e/pages/24-3-lipid-metabolism |
| 9 | PubChem | National Center for Biotechnology Information. "Hydrocarbon Waxes (Paraffin)." *PubChem*. https://pubchem.ncbi.nlm.nih.gov/compound/Paraffin |

---

*Akhir dokumen. Jika ada keputusan baru dari user di tengah pengerjaan, perbarui dokumen ini terlebih dahulu, lalu kode.*
