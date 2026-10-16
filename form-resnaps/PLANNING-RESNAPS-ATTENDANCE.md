# PLANNING.md — Sistem Absensi QR Dinamis · RE:SNAPS
### Closing Party CHRYSALIS · Versi 2

> Dokumen ini adalah **sumber kebenaran tunggal** untuk AI agent yang membangun sistem. Baca seluruhnya sebelum menulis kode. Kerjakan **per phase, berurutan**, jangan melompat.

### Riwayat Revisi
| Versi | Perubahan |
|---|---|
| v1 | Rencana awal dengan dua QR statis cetak di gerbang |
| **v2** | **QR menjadi dinamis dan ditampilkan dari dashboard panitia.** Panitia memilih mode **Masuk / Pulang** pada tiap layar. Token QR berganti otomatis tiap ±30 detik. Satu kali scan menghasilkan satu sesi dan satu absen. Urutan phase P06–P09 diubah (Auth dan Layar QR dikerjakan sebelum halaman tamu). Phase P10–P16 tetap. |

---

## 0. Cara Memakai Dokumen Ini (Wajib untuk AI Agent)

### 0.1 Aturan kerja
1. **Kerjakan satu phase pada satu waktu.** Jangan mulai phase berikutnya sebelum seluruh *Acceptance Criteria* phase saat ini terpenuhi.
2. **Setelah setiap phase selesai: berhenti, lalu laporkan** ringkasan (apa yang dibuat, file yang berubah, hasil verifikasi, hal yang perlu keputusan manusia). Tunggu konfirmasi sebelum lanjut.
3. **Perbarui `PROGRESS.md`** di akhir setiap task (format di Lampiran D).
4. **Commit kecil dan sering**, satu task = satu commit. Format: `feat(P08): tambah pencarian nama di halaman masuk`.
5. **Jangan mengarang** logo, data tamu, kredensial, atau nilai warna di luar Lampiran A. Jika aset belum ada, pakai placeholder yang jelas bertanda `TODO-ASSET` dan laporkan.
6. **Jika ada ambiguitas, pilih opsi paling sederhana yang aman**, catat di `docs/ASSUMPTIONS.md`, lalu lanjut. Hanya berhenti bertanya untuk hal yang memblokir (mis. kredensial Supabase, data tamu).
7. **Jangan pernah** menaruh `SUPABASE_SERVICE_ROLE_KEY` atau `QR_SIGNING_SECRET` di kode client, di repo, atau di variabel berawalan `NEXT_PUBLIC_`.
8. **Semua teks antarmuka berbahasa Indonesia**, nada ramah dan singkat. Kode, nama variabel, dan komentar teknis berbahasa Inggris.
9. **Zona waktu:** simpan `timestamptz` (UTC) di database, tampilkan selalu dalam **WIB (Asia/Jakarta)**.
10. **Fail-closed:** bila ragu (token salah, sesi habis, koneksi putus, absen ditutup), sistem **menolak** dan menampilkan pesan ramah. Jangan pernah mencatat absen "untuk jaga-jaga".

### 0.2 Definition of Done global (berlaku untuk setiap phase)
- `pnpm lint`, `pnpm typecheck`, `pnpm test` lulus.
- `pnpm build` berhasil tanpa error.
- Tidak ada secret di repo (`git grep` untuk key/token).
- Tampilan diuji di lebar **360 px** (mobile) dan **1280 px** (desktop); layar QR juga diuji di **1920×1080** dan tablet.
- `PROGRESS.md` terbarui.

---

## 1. Ringkasan Proyek

| Item | Isi |
|---|---|
| Brand / nama event | **RE:SNAPS** |
| Acara | **Closing Party CHRYSALIS** |
| Tujuan | Mencatat kehadiran **masuk** dan **pulang** tamu lewat **QR dinamis** yang ditampilkan dari dashboard panitia |
| Pengguna | (1) Tamu/pengunjung, (2) Panitia |
| Sumber data awal | Spreadsheet (Google Sheets / CSV) → dimigrasikan ke **Supabase (PostgreSQL)** |
| Hosting | **Vercel** |
| Skala asumsi | 100–1.000 tamu, lonjakan kedatangan dalam 30–60 menit |

### 1.1 Prinsip produk
- **Hanya tamu terdaftar** yang bisa absen. Nama dipilih dari daftar (bukan diketik bebas).
- **Hanya dua alur:** Masuk dan Pulang.
- **QR ditampilkan dari dashboard**, berganti otomatis, dan **mode (Masuk/Pulang) dipilih panitia pada tiap layar**.
- **Satu scan = satu sesi = satu absen.** Setelah sukses, tamu harus scan ulang QR terbaru untuk absen berikutnya.
- **Nama yang sudah absen disembunyikan** dari daftar pilihan alur terkait.
- **Cepat dan tahan antrean:** satu layar, satu keputusan, sekali ketuk.
- **Panitia selalu punya kendali:** dashboard, layar QR, koreksi manual, buka/tutup absen, ekspor data.

### 1.2 Di luar cakupan (jangan dibangun)
- Registrasi mandiri tamu / penjualan tiket.
- QR personal milik tamu (QR di sini adalah QR **lokasi** yang tampil di layar panitia).
- QR statis cetak (digantikan QR dinamis; lihat rencana cadangan di §11).
- Re-entry (keluar-masuk berkali-kali). Satu tamu = maksimal 1 masuk + 1 pulang.
- Aplikasi native. Sistem berupa web mobile-first.

---

## 2. Keputusan & Asumsi

| # | Keputusan | Alasan |
|---|---|---|
| D1 | **QR dinamis** tampil di halaman panitia (`/panitia/qr` dan kartu di dashboard). Token berganti tiap **30 detik** (bisa diatur 15–60 dtk) | Tangkapan layar/foto QR cepat kedaluwarsa, tidak bisa disebar ke orang di luar venue |
| D2 | **Mode Masuk/Pulang dipilih per layar**, bukan global. Dua layar boleh aktif bersamaan dengan mode berbeda, atau mode sama | Mendukung satu atau banyak gerbang |
| D3 | Token QR bersifat **stateless**: HMAC-SHA256 atas `mode + versi kunci + indeks jendela waktu`, divalidasi server. Berlaku pada jendela sekarang + 1 jendela sebelumnya (*grace*) | Tidak perlu tulis database tiap rotasi; mudah diuji; beberapa layar menampilkan QR yang sama |
| D4 | Scan QR menukar token dengan **sesi scan** (cookie HttpOnly, TTL default 10 menit). Pencarian dan simpan absen memakai sesi, bukan token QR. URL dibersihkan dari token setelah dipertukarkan | Tamu punya waktu memilih nama tanpa dikejar rotasi 30 detik; token tidak tertinggal di riwayat browser |
| D5 | **Sesi bersifat sekali pakai:** dikonsumsi atomik saat absen sukses | Satu scan tidak bisa dipakai mengabsenkan banyak nama |
| D6 | Pencarian nama lewat **API server**, bukan membuka tabel `guests` ke publik | Mencegah scraping seluruh daftar tamu |
| D7 | Daftar `/masuk` hanya tamu **belum masuk**; `/keluar` hanya tamu **sudah masuk dan belum pulang**. Mode ditentukan oleh **sesi**, bukan parameter URL | Memenuhi "nama yang sudah absen disembunyikan"; tamu tidak bisa mengubah mode lewat URL |
| D8 | Ada langkah **konfirmasi** ("Kamu adalah …?") sebelum simpan | Mengurangi salah pilih nama |
| D9 | Pembeda nama kembar memakai kolom `category` yang ditampilkan di hasil pencarian | Nama sama tidak membingungkan |
| D10 | Absen dijalankan lewat **fungsi database atomik (RPC)** + `UNIQUE(guest_id, type)` | Aman dari klik ganda dan race condition |
| D11 | Login panitia memakai **Supabase Auth** (email + password) dengan allowlist | Dashboard dan layar QR tidak boleh terbuka |
| D12 | **`qr_key_version`** di pengaturan: admin dapat "Cabut semua sesi/QR" seketika | Respons cepat bila ada kebocoran |
| D13 | Dashboard memakai **Supabase Realtime** dengan fallback polling 10 detik | Pantauan hampir real-time, tetap jalan jika koneksi realtime putus |
| D14 | Verifikasi tambahan (mis. 4 digit akhir HP) **nonaktif secara default**, tapi disiapkan sebagai *feature flag* | Menjaga alur tetap cepat; bisa dinyalakan bila ada penyalahgunaan |
| D15 | Rate limit utama per **sesi**; limit per IP dibuat **longgar** | Tamu di venue sering berbagi satu IP (Wi-Fi/CGNAT); limit IP ketat akan memblokir tamu sah |

> Asumsi yang belum pasti masuk ke §12 *Pertanyaan Terbuka*. Agent mencatat jawaban/asumsi di `docs/ASSUMPTIONS.md`.

---

## 3. Arsitektur & Tech Stack

```
┌──────────────────────┐ login ┌──────────────────────────┐ service role  ┌──────────────┐
│ Panitia: dashboard / │──────▶│  Next.js di Vercel       │──────────────▶│  Supabase    │
│ Layar QR (tablet/TV) │◀──────│  /panitia/*              │◀──────────────│  Postgres    │
└──────────┬───────────┘ token │  /api/panitia/qr-token   │   RPC atomik  │  Auth        │
           │ QR berganti       │                          │               │  Realtime    │
           │ tiap ±30 dtk      │  /masuk  /keluar         │               │              │
           ▼                   │  /api/session/start      │               │              │
┌──────────────────────┐ scan  │  /api/guests/search      │               │              │
│  Tamu (HP)           │──────▶│  /api/attendance/submit  │               │              │
└──────────────────────┘ cookie└──────────────────────────┘               └──────────────┘
                         sesi
```

| Lapisan | Pilihan |
|---|---|
| Framework | **Next.js (App Router) + TypeScript** |
| Styling | **Tailwind CSS** dengan token dari Lampiran A |
| Database/Auth/Realtime | **Supabase** (`@supabase/supabase-js`, `@supabase/ssr`) |
| Validasi | **zod** |
| QR | `qrcode` (render SVG di client dari URL yang dikirim server) |
| Parsing CSV | `csv-parse` atau `papaparse` |
| Grafik | `recharts` |
| Ikon | `lucide-react` |
| Test | `vitest` (unit), `playwright` (E2E) |
| Paket manager | `pnpm` |
| Hosting | **Vercel** (preview per branch + production) |

### 3.1 Environment variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # SERVER ONLY
QR_SIGNING_SECRET=                # SERVER ONLY, acak ≥ 32 byte, beda untuk dev dan production
SESSION_COOKIE_SECRET=            # SERVER ONLY, acak ≥ 32 byte
NEXT_PUBLIC_SITE_URL=             # mis. https://resnaps-absen.vercel.app
APP_TIMEZONE=Asia/Jakarta
```
Sediakan `.env.example` (tanpa nilai). `.env*` wajib di `.gitignore`.

---

## 4. Alur Pengguna

### 4.1 Alur Panitia: menampilkan QR
1. Panitia login → buka **Layar QR** (`/panitia/qr`) di tablet/laptop/monitor di gerbang, atau pakai kartu QR di dashboard.
2. Pilih mode **Masuk** atau **Pulang** (kontrol segmented dengan label dan ikon besar). Pilihan tersimpan di perangkat tersebut.
3. QR tampil besar dengan **hitung mundur** ("Berganti dalam 18 dtk"). QR otomatis diperbarui; panitia tidak perlu menyentuh apa pun.
4. Bila absen untuk mode itu **ditutup**, QR tidak ditampilkan; muncul status "Absen masuk ditutup" + tombol *Buka absen*.
5. Panitia dapat *Jeda*, masuk *Layar penuh*, dan *Kunci kontrol* agar tidak terpencet.

### 4.2 Alur Masuk (tamu)
1. Tamu scan QR di layar panitia (mode **Masuk**) → `/masuk?t=TOKEN` terbuka.
2. Halaman menukar token menjadi **sesi scan** (`POST /api/session/start`), lalu membersihkan `?t=` dari URL.
3. Tamu mengetik ≥ 2 huruf di kolom **Cari namamu**.
4. Daftar hasil (maks. 8): **Nama** + *category*. Hanya tamu yang **belum masuk**.
5. Tamu memilih nama → **konfirmasi**: "Kamu adalah **{Nama}** ({category})?" → *Ya, absen masuk* / *Bukan saya*.
6. Server menjalankan RPC `check_in` (sesi dikonsumsi atomik). Hasil:
   - `ok` → layar sukses: nama, jam masuk (WIB). Info: "Untuk absen orang lain, scan ulang QR di layar."
   - `already_in` → "Kamu sudah absen masuk pukul HH.MM WIB."
   - `closed` → "Absen masuk sedang ditutup."
   - `session_expired` / `session_used` → "Sesi berakhir. Scan ulang QR terbaru di layar panitia."
7. Nama tersebut **tidak muncul lagi** di pencarian `/masuk`.

### 4.3 Alur Pulang (tamu)
Sama seperti §4.2 dengan perbedaan:
- QR yang dipindai berasal dari layar mode **Pulang**.
- Daftar hanya berisi tamu yang **sudah masuk dan belum pulang**.
- RPC `check_out` menolak jika belum ada catatan masuk (`not_checked_in`).
- Setelah sukses, nama hilang dari pencarian `/keluar`.

### 4.4 Kasus tepi
| Kasus | Perilaku |
|---|---|
| Tamu membuka `/masuk` tanpa scan (tidak ada token/sesi) | Layar "Scan QR di layar panitia untuk mulai absen" (tanpa daftar nama) |
| Token kedaluwarsa (foto/screenshot lama) | "QR sudah kedaluwarsa. Scan ulang QR terbaru di layar." |
| QR mode Pulang dibuka di `/masuk` (atau sebaliknya) | Otomatis diarahkan ke halaman yang sesuai mode token |
| Tamu diam > 10 menit setelah scan | "Sesi berakhir" + petunjuk scan ulang |
| Empty state pencarian | "Nama tidak ditemukan. Mungkin kamu sudah absen, atau namamu belum terdaftar. Hubungi panitia di meja registrasi." |
| Layar QR kehilangan koneksi | QR terakhir tetap tampil sampai token habis, lalu berubah menjadi "Koneksi terputus" (fail-closed) |

### 4.5 Alur Panitia: operasional
Dashboard (ringkasan + tabel + aktivitas) → tindakan: absen manual, batalkan absen, buka/tutup absen, atur interval QR, cabut semua sesi, ekspor CSV.

---

## 5. Model Data (Supabase / PostgreSQL)

### 5.1 Tabel inti
```sql
create extension if not exists pg_trgm;
create extension if not exists unaccent;

create type attendance_type   as enum ('in', 'out');
create type attendance_source as enum ('qr', 'manual');

create table guests (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  name_search   text not null,          -- lower + unaccent + trim + spasi tunggal
  category      text,                   -- divisi / angkatan / grup (pembeda nama kembar)
  contact       text,                   -- opsional
  notes         text,
  import_batch  text,
  created_at    timestamptz not null default now()
);
create index guests_name_trgm on guests using gin (name_search gin_trgm_ops);

-- satu scan QR = satu sesi
create table scan_sessions (
  id           uuid primary key default gen_random_uuid(),
  mode         attendance_type not null,       -- ditentukan token QR, bukan URL
  key_version  int not null,                   -- salinan event_settings.qr_key_version saat dibuat
  issued_at    timestamptz not null default now(),
  expires_at   timestamptz not null,
  consumed_at  timestamptz,                    -- terisi saat absen sukses (sekali pakai)
  guest_id     uuid references guests(id),
  ip_hash      text,                           -- hash + salt, bukan IP mentah
  user_agent   text
);
create index scan_sessions_expires on scan_sessions (expires_at);

create table attendance_logs (
  id          uuid primary key default gen_random_uuid(),
  guest_id    uuid not null references guests(id) on delete cascade,
  type        attendance_type not null,
  scanned_at  timestamptz not null default now(),
  source      attendance_source not null default 'qr',
  session_id  uuid references scan_sessions(id),   -- null jika manual
  actor       uuid references auth.users(id),      -- terisi jika manual oleh panitia
  user_agent  text,
  unique (guest_id, type)                          -- 1 masuk + 1 pulang per tamu
);
create index attendance_logs_scanned_at on attendance_logs (scanned_at);

create table event_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);
-- key: checkin_open, checkout_open,
--      qr_window_seconds (30), qr_grace_windows (1), session_ttl_seconds (600),
--      qr_key_version (1), verification_mode (false), event_name, event_date

create table committee_members (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  role     text not null default 'committee' check (role in ('admin','committee')),
  created_at timestamptz not null default now()
);

create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor       uuid references auth.users(id),
  action      text not null,   -- manual_attendance, undo_attendance, toggle_open, revoke_sessions, change_qr_settings, import, ...
  target_guest uuid references guests(id) on delete set null,
  meta        jsonb,
  created_at  timestamptz not null default now()
);
```

> `QR_SIGNING_SECRET` **tidak** disimpan di database; hanya di environment server. Database hanya menyimpan `qr_key_version` (angka) yang ikut ditandatangani ke dalam token.

### 5.2 View status tamu
`guest_status` (gunakan `security_invoker = true`):

| Kolom | Isi |
|---|---|
| `guest_id`, `full_name`, `category` | dari `guests` |
| `checked_in_at`, `checked_out_at` | agregasi `attendance_logs` |
| `status` | `belum_hadir` · `di_dalam` · `sudah_pulang` |

### 5.3 Fungsi RPC (SECURITY DEFINER, hanya dipanggil dari server)
| Fungsi | Perilaku |
|---|---|
| `start_scan_session(p_mode, p_key_version, p_ip_hash, p_ua)` | Tolak `closed` jika absen mode itu ditutup, atau `token_revoked` jika `p_key_version` ≠ `qr_key_version` saat ini. Insert sesi dengan `expires_at = now() + session_ttl`. Return `id`, `expires_at`. |
| `search_guests(p_query, p_mode, p_limit)` | `p_mode='in'` → tamu tanpa log `in`; `p_mode='out'` → tamu dengan log `in` tanpa log `out`. Cocokkan `name_search` (ILIKE/trigram). Return `id, full_name, category` saja. Maks. 8. Mode **diambil dari sesi**. |
| `check_in(p_session_id, p_guest_id, p_ua)` | **Satu transaksi:** validasi sesi (ada, `mode='in'`, belum dikonsumsi, belum kedaluwarsa, `key_version` masih berlaku) → cek `checkin_open` → insert log `in` (dengan `session_id`) → tandai sesi `consumed_at`. Bila gagal (mis. `already_in`), sesi **tidak** dikonsumsi. |
| `check_out(p_session_id, p_guest_id, p_ua)` | Seperti di atas, dengan `mode='out'`, `checkout_open`, dan wajib ada log `in`. |
| `manual_attendance(p_guest_id, p_type, p_actor)` | Untuk panitia, tanpa sesi. `source='manual'`, tulis `audit_logs`. Tetap menghormati aturan "pulang butuh masuk". |
| `undo_attendance(p_guest_id, p_type, p_actor, p_reason)` | Hapus log + tulis `audit_logs`. Tidak boleh hapus `in` jika sudah ada `out`. |
| `revoke_all_sessions(p_actor)` | Naikkan `qr_key_version`, set `expires_at = now()` pada semua sesi aktif, tulis `audit_logs`. Semua token/QR lama langsung tidak berlaku. |

Kode hasil standar: `ok`, `already_in`, `already_out`, `not_found`, `not_checked_in`, `closed`, `token_revoked`, `session_invalid`, `session_expired`, `session_used`.

### 5.4 Keamanan data (RLS)
- **RLS aktif di semua tabel.** Role `anon`: **tidak ada akses** langsung.
- Role `authenticated` yang ada di `committee_members`: `SELECT` pada `guests`, `attendance_logs`, `guest_status`, `audit_logs`, `event_settings`; operasi tulis hanya lewat RPC.
- Tabel `scan_sessions`: tidak dapat dibaca role `anon`/`authenticated`; hanya server (service role).
- Akses publik (tamu) **hanya** lewat Route Handler Next.js yang memakai service role dan memanggil RPC.

### 5.5 Desain token QR (spesifikasi untuk `lib/qr-token.ts`)
- `W` = `qr_window_seconds` (default 30). `idx = floor(unixSeconds / W)`.
- Token ringkas (≤ ~60 karakter, base64url): `{keyVersion}.{idx}.{sig}`, dengan `sig = truncate(HMAC-SHA256(QR_SIGNING_SECRET, "{mode}|{keyVersion}|{idx}"), 16 byte)`.
- **Mode tidak ditulis di token** tetapi ikut ditandatangani; server mencoba verifikasi untuk `in` dan `out`, dan hasilnya menentukan mode sesi. (Alternatif yang boleh dipilih agent: menuliskan mode di token, selama ikut ditandatangani. Catat di `ASSUMPTIONS.md`.)
- Valid jika `idx` ∈ {sekarang, sekarang − `qr_grace_windows`} dan `keyVersion` = `qr_key_version` saat ini. Perbandingan tanda tangan **constant-time**.
- Fungsi murni dengan jam yang bisa disuntik (`now` sebagai parameter) agar mudah diuji.
- Masa hidup efektif satu QR ≈ `W` sampai `2W` detik.
- **Sesi scan:** cookie `rs_session` (`HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=session_ttl`), isi `{sessionId}.{hmac}` ditandatangani `SESSION_COOKIE_SECRET`.

---

## 6. Peta Rute & API

| Rute | Akses | Fungsi |
|---|---|---|
| `/` | Publik | Halaman info singkat (tanpa data tamu), `noindex` |
| `/masuk` | Publik (token QR → sesi) | Absen masuk |
| `/keluar` | Publik (token QR → sesi) | Absen pulang |
| `/panitia/login` | Publik | Login panitia |
| `/panitia` | Panitia | Dashboard (termasuk kartu QR) |
| `/panitia/qr` | Panitia | **Layar QR dinamis** (layout layar penuh) |
| `/panitia/tamu` | Panitia | Daftar tamu + aksi manual |
| `/panitia/log` | Panitia | Riwayat aktivitas + audit |
| `/panitia/pengaturan` | Admin | Interval QR, TTL sesi, cabut sesi, verifikasi |

| Endpoint | Akses | Fungsi |
|---|---|---|
| `POST /api/session/start` | Publik + token QR | Tukar token QR → sesi scan (set cookie) |
| `GET /api/session/me` | Publik + cookie sesi | Mode, sisa waktu sesi, status absen buka/tutup |
| `GET /api/guests/search?q=` | Publik + cookie sesi | Pencarian nama (mode dari sesi) |
| `POST /api/attendance/submit` | Publik + cookie sesi | Simpan absen (masuk/pulang sesuai sesi) |
| `GET /api/panitia/qr-token?mode=in\|out&ahead=n` | Panitia | Token jendela sekarang + `n` jendela ke depan, `serverNow`, status buka/tutup |
| `POST /api/panitia/toggle-open` | Panitia | Buka/tutup absen per mode |
| `POST /api/panitia/revoke-sessions` | Admin | Cabut semua sesi dan QR aktif |
| `GET /api/export` | Panitia | Ekspor CSV |

---

## 7. Aturan Brand & Desain (ringkas)

Nilai warna lengkap dan token CSS ada di **Lampiran A** (diturunkan dari dokumen *Sistem Warna* RE:SNAPS). Catatan penting:

- Palet adalah **usulan digital** yang diturunkan dari logo. Nilai final dikunci memakai berkas logo vektor/panduan merek resmi. Jika berkas itu tersedia nanti, **hanya `tokens.css` yang perlu diubah**.
- **Proporsi:** ±70% netral terang (`canvas`, `surface`, `white`), ±20% foto dan teks gelap, ±10% aksen identitas.
- **Gradien** hanya untuk **satu fokus visual per layar**. Tidak untuk latar semua kartu/paragraf, dan **tidak untuk menyampaikan status**.
- Rencana pemakaian: halaman tamu → gradien pada **strip header/logo**; tombol utama **solid `brand-blue` + teks putih**. Dashboard → gradien hanya pada aksen judul halaman. **Layar QR → gradien hanya pada strip tipis di tepi atas**; area QR selalu **hitam di atas putih polos** (tanpa gradien, tanpa logo di tengah QR) demi keterbacaan scan.
- **Status** (`success/warning/error/info`) dan **mode (Masuk/Pulang)** selalu disertai **ikon + label teks besar**, tidak hanya warna.
- Hindari teks putih kecil di atas kuning/oranye; pada aksen terang pakai teks `ink`.
- Periksa kontras final terhadap **WCAG 2.2 AA**, terutama teks kecil dan kontrol interaktif.
- Tipografi, bentuk sudut, dan logo **belum diberikan** di dokumen sumber. Default sementara: font **Plus Jakarta Sans** (via `next/font`), sudut kartu 16 px, tombol 12 px, tinggi target sentuh ≥ 48 px. Tandai sebagai `TODO-ASSET` bila ada panduan resmi.

---

## 8. Struktur Repo

```
resnaps-attendance/
├─ app/
│  ├─ (public)/masuk/page.tsx
│  ├─ (public)/keluar/page.tsx
│  ├─ panitia/
│  │  ├─ login/page.tsx
│  │  ├─ qr/page.tsx                      # layout layar penuh
│  │  └─ (protected)/{page.tsx, tamu/, log/, pengaturan/}
│  ├─ api/
│  │  ├─ session/{start, me}/route.ts
│  │  ├─ guests/search/route.ts
│  │  ├─ attendance/submit/route.ts
│  │  ├─ panitia/{qr-token, toggle-open, revoke-sessions}/route.ts
│  │  └─ export/route.ts
│  ├─ layout.tsx
│  └─ globals.css
├─ components/{ui/, attendance/, dashboard/, qr/, brand/}
├─ lib/{supabase/{client,server,admin}.ts, qr-token.ts, session.ts, validation/, time.ts, csv.ts}
├─ styles/tokens.css
├─ supabase/{migrations/, seed.sql}
├─ scripts/{import-guests.ts, add-committee.ts, mint-dev-token.ts}
├─ data/                      # GITIGNORED: CSV tamu asli
├─ public/brand/              # logo (TODO-ASSET)
├─ tests/{unit/, e2e/}
├─ docs/{ASSUMPTIONS.md, RUNBOOK.md, DATA-TEMPLATE.md}
├─ PLANNING.md
└─ PROGRESS.md
```

---

## 9. Roadmap Ringkas

| Phase | Nama | Estimasi* | Bergantung pada |
|---|---|---|---|
| P00 | Kickoff & Pengumpulan Aset | 1 jam | – |
| P01 | Setup Repo, Tooling, Vercel | 1–2 jam | P00 |
| P02 | Design System & Brand Tokens | 2–3 jam | P01 |
| P03 | Supabase: Skema, RLS, RPC | 4–5 jam | P01 |
| P04 | Pipeline Import Spreadsheet → Supabase | 2–3 jam | P03 |
| P05 | API Server & Mesin Token QR Dinamis | 3–4 jam | P03 |
| P06 | Autentikasi Panitia | 2 jam | P03 |
| P07 | **Layar QR Dinamis (Dashboard)** | 4–5 jam | P02, P05, P06 |
| P08 | Halaman Absen Masuk | 3 jam | P02, P05, P07 |
| P09 | Halaman Absen Pulang | 1–2 jam | P08 |
| P10 | Dashboard Panitia (pantau) | 4 jam | P06, P02 |
| P11 | Fitur Operasional Panitia | 3–4 jam | P10 |
| P12 | Hardening, Keamanan, Aksesibilitas | 2–3 jam | P07–P11 |
| P13 | Pengujian Otomatis & Beban | 3–4 jam | P12 |
| P14 | Deploy Production ke Vercel | 1–2 jam | P13 |
| P15 | UAT & Gladi Resik | 2–3 jam (+ waktu panitia) | P14 |
| P16 | Hari H & Pasca Event | – | P15 |

*Estimasi kerja agent + review manusia; hanya untuk perencanaan.

**Jalur kritis:** P01 → P03 → P05 → P06 → P07 → P08 → P09 → P12 → P13 → P14 → P15.
**Dapat paralel:** P02 ‖ P03 ‖ P04; P06 ‖ P05; P10 ‖ P08–P09.

**Jadwal mundur dari tanggal acara (H):**
- **H-14** — P00–P05 selesai.
- **H-10** — P06–P09 selesai (QR dinamis + alur tamu berfungsi end-to-end).
- **H-7** — P10–P11 selesai · **feature freeze**.
- **H-5** — P12–P13 selesai.
- **H-3** — P14 deploy production · import data final.
- **H-2** — P15 UAT bersama panitia.
- **H-1** — Gladi resik di venue (jaringan, perangkat layar QR, pencahayaan).
- **H** — P16.

---

## 10. Detail Phase

> Format tiap phase: **Tujuan → Task → Output → Acceptance Criteria → Catatan/Guardrail**.

---

### PHASE 00 — Kickoff & Pengumpulan Aset
**Tujuan:** Semua input yang dibutuhkan jelas sebelum kode ditulis.

**Task**
- [ ] P00.1 Baca `PLANNING.md` penuh; ringkas pemahaman di `docs/ASSUMPTIONS.md`.
- [ ] P00.2 Buat `PROGRESS.md` (format Lampiran D).
- [ ] P00.3 Minta/cek ketersediaan: logo RE:SNAPS (SVG), file spreadsheet tamu, tanggal/jam/venue, email panitia, kredensial Supabase & akun Vercel, **jenis perangkat untuk layar QR**.
- [ ] P00.4 Jawab/catat asumsi untuk setiap butir di §12.
- [ ] P00.5 Buat `docs/DATA-TEMPLATE.md` berisi template kolom spreadsheet (Lampiran B).

**Output:** `PROGRESS.md`, `docs/ASSUMPTIONS.md`, `docs/DATA-TEMPLATE.md`.

**Acceptance Criteria**
- Daftar aset yang masih kurang tercatat jelas dengan penanggung jawab.
- Tidak ada pertanyaan terbuka yang memblokir P01–P03.

---

### PHASE 01 — Setup Repo, Tooling, dan Vercel
**Tujuan:** Fondasi proyek yang bisa dibuild dan ter-deploy otomatis.

**Task**
- [ ] P01.1 `create-next-app` (App Router, TypeScript, Tailwind, ESLint, tanpa folder `src` agar sesuai §8).
- [ ] P01.2 Pasang dependensi: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `qrcode`, `csv-parse`, `recharts`, `lucide-react`, `date-fns` + `date-fns-tz`, `server-only`; dev: `vitest`, `@playwright/test`, `prettier`, `tsx`.
- [ ] P01.3 Konfigurasi scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e`, `import:guests`.
- [ ] P01.4 Buat struktur folder §8, `.env.example`, `.gitignore` (termasuk `data/`, `.env*`).
- [ ] P01.5 Tambahkan `robots` (`noindex, nofollow`) pada layout root dan `app/robots.ts` yang melarang semua crawler.
- [ ] P01.6 Inisialisasi Git, push ke repo remote, hubungkan ke **Vercel** (preview deploy aktif).
- [ ] P01.7 Halaman `/` placeholder "RE:SNAPS — Sistem Absensi" untuk memastikan deploy jalan.

**Output:** Repo siap, URL preview Vercel aktif.

**Acceptance Criteria**
- `pnpm build` sukses lokal dan di Vercel.
- Preview URL dapat dibuka di HP.
- Tidak ada file `.env` ter-commit.

---

### PHASE 02 — Design System & Brand Tokens
**Tujuan:** Identitas RE:SNAPS terpasang di seluruh komponen dasar sebelum membuat halaman.

**Task**
- [ ] P02.1 Salin token dari **Lampiran A** ke `styles/tokens.css`; impor di `globals.css`.
- [ ] P02.2 Petakan token ke tema Tailwind (`brand-blue`, `canvas`, `ink`, `ink-muted`, `line`, `success`, dll.) dan utilitas gradien (`bg-gradient-brand`, `-cool`, `-warm`).
- [ ] P02.3 Pasang font (`next/font`), atur `body` → `canvas` + `ink`.
- [ ] P02.4 Siapkan `components/brand/Logo.tsx` memakai `public/brand/logo.svg` (placeholder `TODO-ASSET` jika belum ada) dan `BrandHeader.tsx` (strip gradien + logo + judul acara).
- [ ] P02.5 Bangun komponen UI dasar: `Button` (primary solid biru, secondary outline, ukuran sentuh ≥ 48 px), `Input` (+ state fokus jelas), `Card`, `Badge`, `StatusBanner` (success/warning/error/info **dengan ikon + label**), `SegmentedControl` (untuk pilihan Masuk/Pulang, dengan ikon + label), `Skeleton`, `Toast`, `EmptyState`.
- [ ] P02.6 Buat halaman internal `/_design` (hanya `NODE_ENV !== 'production'`) sebagai katalog komponen.
- [ ] P02.7 Audit kontras kombinasi yang dipakai (teks/permukaan, tombol, status, fokus) → catat hasil di `docs/CONTRAST.md`.

**Output:** Komponen UI + token + katalog.

**Acceptance Criteria**
- Semua warna di kode berasal dari token (tidak ada hex liar di komponen).
- Kombinasi teks/latar yang dipakai memenuhi **WCAG 2.2 AA** (4.5:1 teks normal, 3:1 teks besar/kontrol).
- Gradien hanya muncul di `BrandHeader` / aksen yang diizinkan §7.

**Guardrail:** Jangan mendesain ulang logo atau mengubah nilai hex. Perbedaan dengan panduan resmi dicatat, bukan "diperbaiki" sendiri.

---

### PHASE 03 — Supabase: Skema, RLS, RPC
**Tujuan:** Database aman, atomik, dan siap menerima data serta sesi scan.

**Task**
- [ ] P03.1 Buat project Supabase (region terdekat dengan pengguna, mis. Singapore); simpan URL/key ke `.env.local` dan Vercel (Preview).
- [ ] P03.2 Migrasi `0001_extensions_types.sql` — ekstensi `pg_trgm`, `unaccent`, enum.
- [ ] P03.3 Migrasi `0002_tables.sql` — `guests`, `scan_sessions`, `attendance_logs`, `event_settings`, `committee_members`, `audit_logs` + index (§5.1; urutan: `scan_sessions` sebelum `attendance_logs`).
- [ ] P03.4 Migrasi `0003_views.sql` — `guest_status` (`security_invoker`).
- [ ] P03.5 Migrasi `0004_rpc.sql` — `start_scan_session`, `search_guests`, `check_in`, `check_out`, `manual_attendance`, `undo_attendance`, `revoke_all_sessions` (§5.3), semua `SECURITY DEFINER` dengan `search_path` terkunci.
- [ ] P03.6 Migrasi `0005_rls.sql` — aktifkan RLS semua tabel; policy panitia berbasis fungsi `is_committee()`; cabut hak `anon`; `scan_sessions` hanya untuk service role.
- [ ] P03.7 Migrasi `0006_seed_settings.sql` — default `event_settings`: `checkin_open=false`, `checkout_open=false`, `qr_window_seconds=30`, `qr_grace_windows=1`, `session_ttl_seconds=600`, `qr_key_version=1`, `verification_mode=false`.
- [ ] P03.8 `supabase/seed.sql` berisi **±30 tamu dummy** (termasuk 2 nama kembar beda kategori, nama beraksen, nama panjang) khusus development.
- [ ] P03.9 Tes SQL:
  - Dua pemanggilan `check_in` bersamaan untuk tamu sama → tepat satu `ok`, satu `already_in`.
  - `check_out` tanpa `in` → `not_checked_in`.
  - Satu sesi dipakai dua kali → kedua `session_used`.
  - Sesi kedaluwarsa → `session_expired`.
  - Sesi `mode='out'` dipakai di `check_in` → `session_invalid`.
  - Setelah `revoke_all_sessions` → sesi lama `session_invalid`/`token_revoked`.
  - `already_in` tidak mengonsumsi sesi.
- [ ] P03.10 Generate tipe TypeScript dari skema ke `lib/supabase/types.ts`.

**Output:** Folder `supabase/migrations/`, seed, tipe TS.

**Acceptance Criteria**
- Query langsung memakai `anon` key ke semua tabel **ditolak**.
- RPC mengembalikan kode hasil sesuai §5.3 pada semua skenario tes.
- Migrasi dapat dijalankan dari nol pada database kosong tanpa error.

---

### PHASE 04 — Pipeline Import Spreadsheet → Supabase
**Tujuan:** Data tamu dari spreadsheet masuk ke Supabase dengan bersih, aman diulang, dan bisa diaudit.

**Task**
- [ ] P04.1 Finalkan template spreadsheet (Lampiran B) dan bagikan ke panitia; kunci header kolom.
- [ ] P04.2 Tulis `scripts/import-guests.ts` (jalan dengan `tsx`, membaca CSV hasil ekspor Google Sheets dari `data/`).
- [ ] P04.3 **Normalisasi:** trim, spasi ganda → tunggal, hapus karakter kontrol; hitung `name_search` (lowercase + unaccent, logika sama dengan DB).
- [ ] P04.4 **Validasi:** `nama` wajib; `kategori` disarankan; panjang maks. 120 karakter; tolak baris kosong.
- [ ] P04.5 **Deteksi duplikat:** nama + kategori sama → ditandai *konflik*, tidak diimpor otomatis; nama sama kategori beda → diizinkan (dengan peringatan).
- [ ] P04.6 **Mode `--dry-run`** (default): cetak laporan tanpa menulis ke DB. Mode `--commit` untuk menulis.
- [ ] P04.7 **Idempoten:** import ulang tidak menggandakan data (upsert berdasar `name_search + category`); setiap run diberi `import_batch` (mis. `2026-xx-xx-1`).
- [ ] P04.8 **Laporan** `data/import-report-<batch>.txt` dan `.csv`: jumlah dibaca, valid, ditambahkan, dilewati, konflik, tidak valid + nomor baris.
- [ ] P04.9 Catat ke `audit_logs` (`action='import'`, meta berisi hitungan).
- [ ] P04.10 Dokumentasikan langkah ekspor Sheets → CSV → import di `docs/RUNBOOK.md`.

**Output:** Skrip import, template data, laporan contoh.

**Acceptance Criteria**
- Dry-run pada CSV uji (termasuk duplikat, baris kosong, spasi aneh) menghasilkan laporan benar.
- Import dua kali berturut-turut → jumlah `guests` tidak berubah pada run kedua.
- File CSV asli **tidak** ter-commit (cek `.gitignore`).

---

### PHASE 05 — API Server & Mesin Token QR Dinamis
**Tujuan:** Satu-satunya pintu akses tamu ke database: token QR berumur pendek → sesi sekali pakai → absen.

**Task**
- [ ] P05.1 `lib/supabase/admin.ts` — client service role (**server only**, `import 'server-only'`).
- [ ] P05.2 `lib/qr-token.ts` sesuai §5.5: `mintToken(mode, now)`, `mintAhead(mode, now, n)`, `verifyToken(token, now)` → `{ok, mode} | {ok:false, reason: 'invalid'|'expired'|'revoked'}`. Fungsi murni, jam disuntik, perbandingan constant-time.
- [ ] P05.3 `lib/session.ts` — buat/baca/hapus cookie `rs_session` (flag `HttpOnly; Secure; SameSite=Lax`), helper `requireSession()` yang memverifikasi tanda tangan lalu memeriksa sesi di DB.
- [ ] P05.4 `lib/validation/` — skema zod: `q` (2–60 karakter, di-trim), `guest_id` (uuid), `t` (string ≤ 120), `mode` (`in|out`).
- [ ] P05.5 `POST /api/session/start`: verifikasi token → baca pengaturan → `start_scan_session` → set cookie (menggantikan cookie lama) → return `{ mode, expiresAt }`. Pesan error spesifik: `token_expired`, `token_invalid`, `closed`, `token_revoked`.
- [ ] P05.6 `GET /api/session/me`: return `{ mode, expiresAt, open, consumed }`; dipakai UI untuk menampilkan status dan sisa waktu.
- [ ] P05.7 `GET /api/guests/search?q=`: wajib sesi valid dan belum dikonsumsi → `search_guests` dengan **mode dari sesi** → maks. 8 item `{id, name, category}`; header `Cache-Control: no-store`.
- [ ] P05.8 `POST /api/attendance/submit` `{guest_id}`: wajib sesi valid → `check_in` atau `check_out` sesuai mode sesi → peta kode hasil ke HTTP + pesan Indonesia. Bila sukses, hapus cookie sesi.
- [ ] P05.9 **Rate limit** (D15): kunci utama = id sesi (mis. search 60/menit/sesi); batas per IP dibuat longgar (mis. 300/menit) sebagai pengaman kasar. Opsi: Upstash Ratelimit atau aturan Vercel Firewall. Catat pilihan di `ASSUMPTIONS.md`.
- [ ] P05.10 Format error seragam `{ ok:false, code, message }`; **jangan bocorkan** detail internal/SQL. `ip_hash` memakai hash + salt, bukan IP mentah.
- [ ] P05.11 `scripts/mint-dev-token.ts`: cetak URL `/masuk?t=...` / `/keluar?t=...` valid untuk uji manual lokal (tidak aktif di production).
- [ ] P05.12 Unit test (jam disuntik): token valid, batas jendela, grace, token terlalu lama, token diubah 1 karakter, versi kunci berbeda, cookie sesi dimanipulasi.

**Output:** Route Handler + `lib/qr-token.ts` + `lib/session.ts` + unit test.

**Acceptance Criteria**
- Tanpa token/sesi valid → 401/403 pada semua endpoint publik.
- Token di luar jendela+grace ditolak; token yang diubah ditolak.
- Sesi sekali pakai: submit kedua dengan sesi yang sama → `session_used`.
- `q` < 2 karakter → 400; hasil tidak pernah > 8 item; respons tidak memuat `contact` atau `notes`.
- `SUPABASE_SERVICE_ROLE_KEY`, `QR_SIGNING_SECRET`, `SESSION_COOKIE_SECRET` tidak muncul di bundle client (cek `.next/static`).

---

### PHASE 06 — Autentikasi Panitia
**Tujuan:** Dashboard dan layar QR hanya bisa diakses panitia yang diizinkan.

**Task**
- [ ] P06.1 `lib/supabase/server.ts` dan `client.ts` memakai `@supabase/ssr` (cookie session).
- [ ] P06.2 Halaman `/panitia/login` (email + password), pesan error generik ("Email atau password salah").
- [ ] P06.3 Middleware: semua `/panitia/*` kecuali `/panitia/login` → wajib sesi **dan** ada di `committee_members`; selain itu redirect. Endpoint `/api/panitia/*` dan `/api/export` menerapkan pemeriksaan yang sama di server.
- [ ] P06.4 Pembuatan akun panitia: `scripts/add-committee.ts` (input email, role) atau langkah manual terdokumentasi di `RUNBOOK.md`; **nonaktifkan pendaftaran publik** di Supabase Auth.
- [ ] P06.5 Matriks role:
  | Aksi | `committee` | `admin` |
  |---|---|---|
  | Lihat dashboard, tabel, log | ✅ | ✅ |
  | Tampilkan Layar QR, pilih mode | ✅ | ✅ |
  | Buka/tutup absen | ✅ | ✅ |
  | Absen manual, batalkan absen, ekspor | ✅ | ✅ |
  | Tambah tamu, atur interval QR/TTL, cabut semua sesi, kelola panitia | ❌ | ✅ |
- [ ] P06.6 Tombol *Keluar* (logout) dan penanganan sesi kedaluwarsa (pesan jelas + redirect).
- [ ] P06.7 Pastikan **refresh sesi otomatis** berjalan stabil untuk halaman yang dibiarkan terbuka lama (Layar QR akan aktif berjam-jam); uji minimal 4 jam.

**Output:** Login + proteksi rute/API + role.

**Acceptance Criteria**
- Akses `/panitia` atau `/api/panitia/*` tanpa login → ditolak/redirect.
- User terautentikasi tetapi **tidak** ada di `committee_members` → ditolak.
- Role `committee` tidak bisa membuka `/panitia/pengaturan`.
- Sesi login tetap hidup pada uji 4 jam tanpa interaksi (atau gagal dengan pesan yang jelas, bukan layar kosong).

---

### PHASE 07 — Layar QR Dinamis (Dashboard)
**Tujuan:** Panitia menampilkan QR yang berganti otomatis dan memilih mode Masuk/Pulang langsung dari dashboard.

**Task**
- [ ] P07.1 `GET /api/panitia/qr-token?mode=&ahead=`: wajib login panitia. Return `{ mode, url, windowSeconds, expiresAt, serverNow, ahead:[{url, validFrom}], open }`. Jika absen mode itu **ditutup** → `{ open:false }` **tanpa token** (fail-closed). `url` = `{SITE_URL}/masuk?t=…` untuk `in`, `{SITE_URL}/keluar?t=…` untuk `out`.
- [ ] P07.2 Komponen `components/qr/QrDisplay.tsx`: render QR (SVG) dari `url`; **sinkronisasi jam** dengan selisih `serverNow − Date.now()`; ganti QR tepat saat jendela berganti; ambil token baru ke server saat sisa < 8 detik; **prefetch** 3–5 token ke depan agar tetap tampil jika koneksi putus sebentar.
- [ ] P07.3 **Pemilih mode:** `SegmentedControl` **MASUK | PULANG** dengan ikon + label besar. Disimpan di query `?mode=` dan `localStorage` (per perangkat). Mode default saat pertama kali: *Masuk*. Ganti mode → QR berubah < 1 detik.
- [ ] P07.4 **Judul besar** di atas QR sesuai mode: "SCAN UNTUK ABSEN MASUK" / "SCAN UNTUK ABSEN PULANG" + instruksi 3 langkah singkat di bawah QR.
- [ ] P07.5 **Hitung mundur** (cincin/progress solid `brand-blue`, tanpa gradien) + teks "Berganti dalam N dtk".
- [ ] P07.6 **Status & kontrol absen:** chip "Absen masuk: DIBUKA/DITUTUP" (ikon + label) dan tombol *Buka/Tutup absen* (konfirmasi) memakai `POST /api/panitia/toggle-open`. Saat ditutup, QR disembunyikan dan diganti pesan + tombol *Buka absen*.
- [ ] P07.7 Tombol **Jeda/Lanjutkan** (menyembunyikan QR di layar itu; tidak mengubah status global).
- [ ] P07.8 **Layar penuh:** route `/panitia/qr` dengan layout minimal (tanpa sidebar), tombol *Layar penuh* (Fullscreen API), **Screen Wake Lock** agar layar tidak mati, dan **Kunci kontrol** (aktifkan = kontrol tidak merespons ketuk biasa; buka kunci = tahan 1 detik).
- [ ] P07.9 **Counter ringkas** di bawah QR: mode Masuk → "Sudah masuk 312 / 450"; mode Pulang → "Sudah pulang 120 · Di dalam 192". Polling 5 detik.
- [ ] P07.10 **Fail-closed & koneksi:** indikator koneksi (Terhubung / Terputus). Bila token cadangan habis dan server tak terjangkau → QR diganti "Koneksi terputus, mencoba lagi…" (jangan menampilkan QR basi). Bila sesi login panitia berakhir → "Sesi berakhir, login ulang".
- [ ] P07.11 **Keterbacaan QR:** QR ≥ 60% sisi terpendek layar (min. 320 px), *quiet zone* ≥ 4 modul, hitam di putih polos, koreksi error **M**, tanpa logo/gradien di dalam QR; frame brand (strip gradien tipis, logo) hanya di luar area QR.
- [ ] P07.12 Pastikan `QrDisplay` dapat dipakai ulang sebagai **kartu kompak** di dashboard (dipasang di P10.10) dan sebagai layar penuh.
- [ ] P07.13 Uji pindai nyata: layar tablet, laptop, dan monitor; Android + iOS; jarak ±30 cm, ±1 m, ±2 m; kecerahan 50% dan 100%; ruangan terang dan redup.

**Output:** Halaman `/panitia/qr`, komponen `QrDisplay`, endpoint token.

**Acceptance Criteria**
- Scan QR dari layar mode Masuk membuka `/masuk` dan sesi berhasil dibuat; mode Pulang membuka `/keluar`.
- Dua layar dengan mode sama menampilkan QR **identik** pada saat yang sama; dua layar mode berbeda independen.
- QR lama (> `2W` detik) menghasilkan "QR sudah kedaluwarsa".
- Menutup absen membuat QR hilang pada layar dalam ≤ 5 detik.
- Layar tetap menyala dan QR terus berganti selama uji 2 jam tanpa interaksi.
- QR terbaca andal pada seluruh kombinasi uji P07.13.

---

### PHASE 08 — Halaman Absen Masuk (`/masuk`)
**Tujuan:** Alur tamu yang cepat, jelas, dan tahan salah-pilih, berbasis sesi hasil scan.

**Task**
- [ ] P08.1 Layout halaman: `BrandHeader`, judul **"Absen Masuk"**, subjudul nama acara, kolom pencarian.
- [ ] P08.2 **Mesin status halaman:**
  1. Ada `?t=` → `POST /api/session/start` → sukses: `history.replaceState` menghapus `t`; gagal: layar pesan sesuai kode (`token_expired`, `token_invalid`, `closed`, `token_revoked`).
  2. Tanpa `t` tetapi cookie sesi valid → lanjut (`GET /api/session/me`).
  3. Tanpa `t` dan tanpa sesi → layar "Scan QR di layar panitia untuk mulai absen" (tanpa daftar nama).
  4. Mode sesi = `out` → redirect otomatis ke `/keluar`.
- [ ] P08.3 Komponen `GuestSearch`: input dengan **debounce 250 ms**, minimal 2 huruf, `autocomplete="off"`, `inputmode="search"`, indikator loading (Skeleton), pembatalan request lama (AbortController).
- [ ] P08.4 Daftar hasil: nama tebal + `category` redup (`ink-muted`), area sentuh ≥ 48 px, navigasi keyboard (↑ ↓ Enter), `role="listbox"`.
- [ ] P08.5 Empty state sesuai §4.4.
- [ ] P08.6 Langkah **konfirmasi** (modal/sheet): "Kamu adalah **{Nama}**?" + tombol *Ya, absen masuk* dan *Bukan saya*.
- [ ] P08.7 Submit: tombol *disabled* + spinner selama proses (cegah klik ganda); kirim `guest_id` ke `/api/attendance/submit`.
- [ ] P08.8 Layar hasil: **Sukses** (nama, jam WIB, ikon centang + label, info "Untuk absen orang lain, scan ulang QR di layar"), **Sudah absen** (jam sebelumnya), **Absen ditutup**, **Sesi berakhir** (petunjuk scan ulang), **Error jaringan** (tombol *Coba lagi*; sesi tidak hilang selama belum sukses).
- [ ] P08.9 Tampilkan sisa waktu sesi **hanya saat < 2 menit** ("Sesi berakhir dalam 1:42") dengan gaya `info`, tidak mengganggu.
- [ ] P08.10 Setelah sukses, simpan penanda ringan di `localStorage` (hanya UX); **bukan** mekanisme keamanan.
- [ ] P08.11 Polesan: `viewport` mobile, `theme-color`, fokus otomatis ke input, tidak ada zoom paksa pada iOS (font input ≥ 16 px).

**Output:** Halaman `/masuk` lengkap.

**Acceptance Criteria**
- Scan dari Layar QR (P07) → cari nama seed → konfirmasi → sukses; nama **tidak muncul lagi** saat dicari ulang di sesi baru.
- Klik ganda cepat tidak menghasilkan dua catatan.
- Memakai ulang URL/cookie setelah sukses tidak dapat mengabsenkan nama lain (`session_used`).
- Membuka `/masuk` tanpa scan tidak menampilkan data tamu apa pun.
- Nama kembar dapat dibedakan lewat `category`.
- Dapat dioperasikan penuh di 360 px dan dengan keyboard.

---

### PHASE 09 — Halaman Absen Pulang (`/keluar`)
**Tujuan:** Alur pulang dengan logika filter yang benar, memakai ulang komponen P08.

**Task**
- [ ] P09.1 Refaktor `GuestSearch`, mesin status halaman, dan alur konfirmasi menjadi komponen generik berprop `mode: 'in' | 'out'`.
- [ ] P09.2 Buat `/keluar` dengan judul **"Absen Pulang"**, teks dan pesan khusus pulang; mode sesi = `in` → redirect ke `/masuk`.
- [ ] P09.3 Pastikan daftar hanya tamu **di dalam** (sudah masuk, belum pulang).
- [ ] P09.4 Tangani kode `not_checked_in`: "Kamu belum tercatat absen masuk. Hubungi panitia."
- [ ] P09.5 Layar sukses: ucapan terima kasih + jam pulang (WIB) + durasi hadir (opsional, tampil kecil).
- [ ] P09.6 Pembeda visual masuk vs pulang memakai **judul, ikon, dan label** (bukan warna saja) dan tidak menambah gradien kedua.

**Output:** Halaman `/keluar`.

**Acceptance Criteria**
- Tamu yang belum masuk **tidak muncul** di `/keluar`.
- Tamu yang sudah pulang **tidak muncul** lagi di `/keluar`.
- QR mode Pulang yang dipindai selalu berakhir di `/keluar`, QR mode Masuk di `/masuk`.
- Alur masuk (P08) tetap lolos seluruh kriterianya setelah refaktor.

---

### PHASE 10 — Dashboard Panitia (Pantauan)
**Tujuan:** Panitia melihat kondisi acara secara hampir real-time dan punya akses cepat ke QR.

**Task**
- [ ] P10.1 **Kartu metrik** (dari `guest_status`): Total terdaftar · Sudah masuk (n, %) · Sedang di dalam · Sudah pulang · Belum hadir.
- [ ] P10.2 **Progress bar kehadiran** (persentase masuk dari total).
- [ ] P10.3 **Grafik** jumlah masuk dan pulang per interval 15 menit (garis/bar), sumbu waktu WIB.
- [ ] P10.4 **Aktivitas terbaru:** 20 catatan terakhir (nama, jenis, jam, sumber qr/manual).
- [ ] P10.5 **Tabel tamu:** kolom nama, kategori, status (badge **ikon + label**), jam masuk, jam pulang; pencarian, filter status/kategori, urut kolom, pagination atau virtualisasi untuk ≥ 1.000 baris.
- [ ] P10.6 **Realtime:** langganan Supabase Realtime pada `attendance_logs`; indikator koneksi (Live / Terputus). Jika terputus → polling 10 detik otomatis.
- [ ] P10.7 Indikator "Terakhir diperbarui HH:MM:SS WIB".
- [ ] P10.8 **Mode layar besar** (opsional, `?tv=1`): hanya angka besar + progress, tanpa kontrol, font besar untuk monitor panitia.
- [ ] P10.9 Gradien hanya di aksen judul dashboard; kartu tetap `surface`.
- [ ] P10.10 **Kartu QR di dashboard:** pasang `QrDisplay` versi kompak (pemilih mode Masuk/Pulang + QR + hitung mundur) dan tombol **"Buka Layar QR penuh"** (tab/perangkat lain). Status buka/tutup absen tampil di header dashboard.

**Output:** Dashboard `/panitia`.

**Acceptance Criteria**
- Saat tamu absen di HP, angka dashboard berubah ≤ 3 detik (realtime) atau ≤ 10 detik (fallback).
- Angka dashboard konsisten dengan tabel dan dengan hasil ekspor.
- Tabel 1.000 baris tetap responsif.
- Kartu QR di dashboard menghasilkan QR yang valid dan berganti otomatis, identik dengan Layar QR penuh pada mode yang sama.

---

### PHASE 11 — Fitur Operasional Panitia
**Tujuan:** Panitia bisa menangani kasus nyata di lapangan.

**Task**
- [ ] P11.1 **Absen manual** dari tabel: tombol *Catat masuk* / *Catat pulang* (konfirmasi) via `manual_attendance`, `source='manual'`, `actor` terisi, tulis `audit_logs`.
- [ ] P11.2 **Batalkan absen** (`undo_attendance`) dengan alasan wajib diisi; aturan: batalkan pulang dulu sebelum masuk.
- [ ] P11.3 **Buka/tutup** absen masuk dan absen pulang (toggle terpisah) tersedia di dashboard dan Layar QR; tulis `audit_logs`.
- [ ] P11.4 **Ekspor CSV** (`/api/export`): nama, kategori, status, jam masuk, jam pulang (WIB), durasi, sumber. **Cegah CSV/formula injection** (awali sel berawalan `= + - @` dengan `'`). UTF-8 dengan BOM.
- [ ] P11.5 **Tambah tamu on-the-spot** (admin saja): form nama + kategori → insert `guests` + audit. Tamu baru langsung muncul di pencarian.
- [ ] P11.6 Halaman `/panitia/log`: riwayat `attendance_logs` + `audit_logs`, filter tanggal/aksi.
- [ ] P11.7 **Pengaturan QR (admin)** di `/panitia/pengaturan`: interval rotasi (15–60 dtk), jumlah *grace*, TTL sesi (5–15 menit); perubahan dicatat di `audit_logs` dan berlaku pada token berikutnya.
- [ ] P11.8 **Cabut semua sesi/QR** (admin, konfirmasi dua langkah) → `revoke_all_sessions`; Layar QR otomatis mengambil token baru.
- [ ] P11.9 Opsi `verification_mode` (flag, default **off**): bila aktif, tamu diminta 4 digit akhir kontak setelah memilih nama; server memverifikasi. Implementasikan di UI dan API, tetapi biarkan nonaktif.

**Output:** Halaman tamu/log/pengaturan + ekspor.

**Acceptance Criteria**
- Setiap tindakan manual muncul di `audit_logs` dengan aktor dan waktu.
- Menutup absen masuk membuat `/masuk` menampilkan "Absen masuk ditutup" seketika, dan sesi yang sudah terbit gagal saat submit dengan kode `closed`.
- Setelah "Cabut semua sesi", QR dan sesi yang terbit sebelumnya tidak dapat dipakai, sementara QR baru langsung berfungsi.
- Ekspor CSV terbuka benar di Excel/Sheets, karakter Indonesia tidak rusak.

---

### PHASE 12 — Hardening: Keamanan, Ketahanan, Aksesibilitas
**Tujuan:** Menutup celah sebelum diuji dan dirilis.

**Task**
- [ ] P12.1 **Security headers** (CSP dasar, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `X-Content-Type-Options`, `Permissions-Policy`) lewat `next.config`. Pastikan token QR tidak bocor lewat header `Referer`.
- [ ] P12.2 Audit RLS: uji dengan `anon` dan `authenticated` non-panitia pada setiap tabel/view/RPC, termasuk `scan_sessions`.
- [ ] P12.3 Audit bundle: tidak ada secret dan tidak ada data tamu di HTML/JS statis.
- [ ] P12.4 Audit cookie sesi (`HttpOnly`, `Secure`, `SameSite`, `Max-Age`), tanda tangan, dan penghapusan setelah sukses.
- [ ] P12.5 Semua respons API publik `no-store`; tidak ada logging PII berlebih (jangan log nama lengkap di log server tanpa perlu).
- [ ] P12.6 **Simulasi penyalahgunaan:** (a) screenshot QR dipakai > 2×W detik kemudian, (b) satu sesi dipakai berulang, (c) enumerasi pencarian berulang, (d) mengganti mode lewat URL, (e) menukar cookie antar perangkat. Semua harus gagal dengan pesan wajar.
- [ ] P12.7 **Ketahanan jaringan:** timeout request, pesan error ramah, tombol *Coba lagi*, tidak ada state "menggantung".
- [ ] P12.8 **Performa:** target LCP < 2,5 s di 4G simulasi; ukuran JS halaman tamu seminimal mungkin (tanpa library grafik/QR di halaman tamu).
- [ ] P12.9 **Aksesibilitas:** fokus terlihat, label form, `aria-live` untuk hasil pencarian dan status, urutan tab logis, kontras lolos, zoom 200%; Layar QR menjaga kontras dan ukuran teks terbaca dari jarak ±2 m.
- [ ] P12.10 Halaman `404` dan `error` bergaya brand; semua halaman `noindex`.
- [ ] P12.11 Review penanganan data pribadi: kolom `contact` tidak pernah dikirim ke klien tamu; kebijakan retensi dicatat di `RUNBOOK.md` (lihat P16).

**Output:** Laporan `docs/SECURITY-CHECKLIST.md` (centang + bukti).

**Acceptance Criteria**
- Tidak ada temuan *high/critical* terbuka.
- Seluruh skenario P12.6 gagal sebagaimana mestinya.
- Lighthouse mobile pada `/masuk`: Accessibility ≥ 95, Performance ≥ 85.

---

### PHASE 13 — Pengujian Otomatis & Beban
**Tujuan:** Bukti bahwa alur inti benar dan tahan lonjakan.

**Task**
- [ ] P13.1 **Unit test** (vitest): token QR (jendela, grace, tamper, versi kunci), cookie sesi, normalisasi nama, validasi zod, peta kode hasil, util waktu WIB, escape CSV.
- [ ] P13.2 **Integrasi:** RPC terhadap Supabase lokal/test (skenario P03.9 + buka/tutup + undo + revoke).
- [ ] P13.3 **E2E Playwright** (viewport mobile; Layar QR dibuka di konteks terpisah untuk membaca URL QR):
  1. Panitia login → Layar QR mode Masuk → ambil URL QR → tamu membuka → cari → pilih → konfirmasi → sukses → nama hilang dari pencarian.
  2. Mode Pulang: tamu belum masuk tidak muncul; setelah masuk muncul; setelah pulang hilang.
  3. Token kedaluwarsa → pesan "QR sudah kedaluwarsa".
  4. Sesi dipakai dua kali → ditolak.
  5. QR mode Pulang dibuka di `/masuk` → redirect ke `/keluar`.
  6. Absen ditutup → QR hilang dan pesan sesuai.
  7. Ganti mode di Layar QR → URL QR berubah sesuai mode.
  8. Dashboard menampilkan angka yang berubah setelah absen.
- [ ] P13.4 **Uji konkurensi:** 20 submit paralel untuk tamu yang sama → tepat 1 sukses; 20 submit paralel dengan **satu sesi** untuk 20 tamu berbeda → tepat 1 sukses.
- [ ] P13.5 **Uji beban ringan** (k6/autocannon): 150 pengguna serentak menukar token, mencari, dan absen (data seed ≥ 1.000 tamu) → p95 pencarian < 500 ms, tidak ada error 5xx, **tidak ada penolakan sah akibat rate limit per IP** (semua klien berasal dari satu IP).
- [ ] P13.6 **Uji ketahanan Layar QR:** 2 jam berjalan, simulasi koneksi putus 60 detik (QR cadangan tampil lalu fail-closed), simulasi login habis.
- [ ] P13.7 **Uji perangkat nyata:** Android (Chrome), iPhone (Safari), satu HP lama/layar kecil; kamera bawaan dan aplikasi pemindai QR pihak ketiga.
- [ ] P13.8 Pasang CI (GitHub Actions) yang menjalankan lint, typecheck, unit test pada setiap PR.

**Output:** Suite test + laporan hasil `docs/TEST-REPORT.md`.

**Acceptance Criteria**
- Semua test hijau di CI.
- Hasil uji konkurensi, beban, dan ketahanan Layar QR terlampir di laporan.
- Bug yang ditemukan diperbaiki atau dicatat dengan tingkat keparahan.

---

### PHASE 14 — Deploy Production ke Vercel
**Tujuan:** Lingkungan produksi terpisah, bersih, dan terverifikasi.

**Task**
- [ ] P14.1 Buat **project Supabase production** terpisah dari dev (atau pastikan data dev dibersihkan).
- [ ] P14.2 Jalankan seluruh migrasi ke production; **jangan** jalankan `seed.sql` dummy.
- [ ] P14.3 Set environment variables di Vercel (Production). `SUPABASE_SERVICE_ROLE_KEY`, `QR_SIGNING_SECRET`, `SESSION_COOKIE_SECRET` hanya sebagai variabel server dan **berbeda** dari dev.
- [ ] P14.4 Buat akun panitia production (admin + beberapa committee), uji login dari perangkat yang akan dipakai sebagai layar QR.
- [ ] P14.5 Jalankan import data **final** (dry-run → commit); cek jumlah terhadap spreadsheet sumber.
- [ ] P14.6 Atur domain (mis. subdomain event) atau gunakan domain `.vercel.app` yang stabil; perbarui `NEXT_PUBLIC_SITE_URL` (URL dalam QR harus domain final).
- [ ] P14.7 **Siapkan perangkat layar QR:** login, buka `/panitia/qr`, pilih mode, aktifkan layar penuh dan Wake Lock; atur perangkat agar **tidak auto-lock**, kecerahan tinggi, mode jangan ganggu, charger terpasang. Siapkan **minimal 2 perangkat** (utama + cadangan).
- [ ] P14.8 Smoke test di production: layar QR → scan dari HP → masuk, pulang, dashboard, ekspor; lalu **hapus data uji** (atau gunakan satu tamu "TEST" yang dihapus sesudahnya).
- [ ] P14.9 Pastikan absen **tertutup** (`checkin_open=false`, `checkout_open=false`) setelah smoke test sampai hari H.
- [ ] P14.10 Aktifkan backup/snapshot data Supabase sesuai paket yang tersedia; catat cara restore.

**Output:** Production siap, perangkat layar QR siap.

**Acceptance Criteria**
- Jumlah `guests` di production = jumlah baris valid di spreadsheet.
- Tabel `attendance_logs` kosong dan `scan_sessions` bersih setelah smoke test.
- QR dari layar production membuka halaman production dan sesi berhasil dibuat.

---

### PHASE 15 — UAT & Gladi Resik
**Tujuan:** Panitia dan sampel tamu mencoba sistem dalam kondisi mendekati nyata.

**Task**
- [ ] P15.1 Susun skrip UAT (`docs/UAT.md`) untuk panitia, minimal 12 skenario: menyalakan Layar QR, pilih mode, ganti mode, absen normal, nama kembar, salah pilih, double submit, QR kedaluwarsa, absen ditutup/dibuka, koreksi manual, undo, ekspor, cabut sesi, koneksi lambat, Layar QR mati lalu pindah ke perangkat cadangan.
- [ ] P15.2 Sesi UAT dengan 3–5 panitia + 10–20 tamu uji; catat waktu rata-rata per absen (target ≤ 20 detik dari scan sampai sukses) dan **persentase gagal scan**.
- [ ] P15.3 **Gladi di venue:** cek sinyal seluler/Wi-Fi di titik gerbang; posisi dan tinggi layar QR; **pantulan/pencahayaan**; jarak scan nyata; ketersediaan listrik untuk perangkat; uji dua layar (Masuk dan Pulang) berdampingan agar tamu tidak salah scan.
- [ ] P15.4 Siapkan **rencana cadangan** (`docs/RUNBOOK.md`): Layar QR mati → pindah ke perangkat cadangan (login + pilih mode); internet venue buruk → panitia absen manual dari dashboard di HP; sistem down → daftar tamu cetak/ekspor CSV + centang manual, input susulan setelah pulih.
- [ ] P15.5 Latih panitia: menyalakan dan mengunci Layar QR, ganti mode, buka/tutup absen, absen manual, undo, baca dashboard.
- [ ] P15.6 Perbaiki temuan prioritas tinggi; deploy ulang; ulang smoke test; bersihkan data uji.
- [ ] P15.7 **Go/No-Go checklist** (Lampiran C) ditandatangani penanggung jawab acara.

**Output:** Laporan UAT, runbook final, keputusan Go/No-Go.

**Acceptance Criteria**
- Tidak ada bug *blocker/high* terbuka.
- Waktu absen rata-rata memenuhi target dan tingkat gagal scan ≤ 5%.
- Panitia mampu menjalankan prosedur darurat (termasuk pindah perangkat layar QR) tanpa bantuan developer.

---

### PHASE 16 — Hari H & Pasca Event
**Tujuan:** Operasi acara lancar dan data ditutup dengan rapi.

**Task (Hari H)**
- [ ] P16.1 Pagi hari: cek `/panitia` online, jumlah tamu benar, absen masih tertutup, perangkat layar QR terisi daya penuh, login aktif, charger terpasang.
- [ ] P16.2 Pasang layar QR di titik masuk (mode **Masuk**) dan titik pulang (mode **Pulang**); aktifkan **Kunci kontrol**; uji scan sekali dengan HP panitia.
- [ ] P16.3 Buka absen masuk sesuai jadwal; absen pulang dibuka sesuai kebijakan panitia (sepanjang acara atau saat penutupan).
- [ ] P16.4 Pantau dashboard: lonjakan, error, tamu yang melaporkan masalah; tangani lewat absen manual.
- [ ] P16.5 Saat penutupan: buka absen pulang, tampilkan QR mode Pulang di semua gerbang keluar; pantau "Sedang di dalam".
- [ ] P16.6 Ekspor CSV berkala (mis. tiap 1–2 jam) sebagai cadangan.

**Task (Pasca event)**
- [ ] P16.7 Tutup kedua absen; **cabut semua sesi**; matikan Layar QR; ekspor final dan simpan di tempat aman.
- [ ] P16.8 Rekap: total hadir, jam puncak masuk/pulang, durasi hadir rata-rata, tamu tidak hadir.
- [ ] P16.9 **Retensi data:** hapus/anonimkan kolom `contact` dan data pribadi sesuai kebijakan panitia (mis. maksimal 30 hari setelah acara); bersihkan `scan_sessions`; catat tanggal pelaksanaan.
- [ ] P16.10 Nonaktifkan akun panitia yang tidak diperlukan; rotasi/hapus `QR_SIGNING_SECRET`; pertimbangkan menjeda atau menghapus project setelah arsip selesai.
- [ ] P16.11 Retrospektif singkat `docs/RETRO.md` (apa yang berjalan baik, apa yang diperbaiki).

**Acceptance Criteria**
- Ekspor final tersimpan dan dapat dibuka.
- Data pribadi dihapus/dianonimkan sesuai jadwal retensi.

---

## 11. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| **Layar QR mati / baterai habis / perangkat hang** | Antrean berhenti | Minimal 2 perangkat, charger, kecerahan dan auto-lock diatur, prosedur pindah perangkat (P15.4); cadangan: absen manual dari dashboard |
| **Internet venue buruk** (layar QR tidak bisa ambil token) | QR hilang | Prefetch token ke depan (P07.2), fail-closed dengan pesan jelas, rencana cadangan manual |
| Screenshot/foto QR disebar ke tamu di luar venue | Absen palsu | Token berumur 30–60 dtk, sesi sekali pakai, tombol "Cabut semua sesi" |
| Tamu salah scan (QR Masuk vs Pulang) | Absen di mode salah | Judul besar + ikon di Layar QR, mode ditentukan token, halaman tamu menampilkan judul mode jelas; dua layar ditempatkan berjauhan |
| Rate limit per IP memblokir tamu sah (satu Wi-Fi/CGNAT) | Tamu gagal absen | Limit utama per sesi, limit IP longgar (D15), diuji di P13.5 |
| Tamu salah pilih nama / memilih nama orang lain | Data keliru | Langkah konfirmasi, panitia undo, opsi verifikasi 4 digit (flag) |
| Nama kembar | Salah catat | Tampilkan `category` di hasil pencarian |
| Klik ganda / lonjakan bersamaan | Duplikat | `UNIQUE` + RPC atomik + sesi sekali pakai + tombol disabled |
| Scraping daftar tamu | Kebocoran data pribadi | API server, wajib sesi, min. 2 huruf, maks. 8 hasil, rate limit, tanpa `contact` |
| Jam perangkat layar QR tidak akurat | Hitung mundur meleset | Sinkronisasi dengan `serverNow` dari server; validasi token hanya di server |
| Data spreadsheet kotor | Tamu tak ditemukan | Pipeline import + laporan (P04), tambah tamu on-the-spot (P11.5) |
| Realtime terputus | Dashboard basi | Fallback polling + indikator koneksi |
| Login panitia di Layar QR kedaluwarsa | QR berhenti | Refresh sesi otomatis diuji 4 jam (P06.7), pesan "login ulang" yang jelas |
| Kuota/limit layanan gratis | Gangguan | Cek batas paket Vercel & Supabase saat P14; uji beban (P13) |

---

## 12. Pertanyaan Terbuka (isi sebelum / selama P00)

1. Berkas **logo RE:SNAPS (SVG/PNG transparan)** dan panduan merek lain (tipografi, bentuk) — tersedia atau hanya palet warna?
2. **Tanggal, jam mulai–selesai, dan venue** acara?
3. Perkiraan **jumlah tamu**.
4. **Berapa layar QR** dan jenis perangkatnya (tablet, laptop, monitor/TV)? Apakah ada listrik/charger di gerbang?
5. Apakah gerbang masuk dan pulang **sama atau terpisah**? (Menentukan apakah dua layar dengan mode berbeda dipasang berdampingan atau berjauhan.)
6. Interval rotasi QR default **30 detik** (rentang 15–60) dan TTL sesi tamu **10 menit** — sudah sesuai?
7. Kolom apa saja di spreadsheet tamu (khususnya pembeda nama kembar: divisi/angkatan/grup)? Apakah ada nomor kontak?
8. Perlu **verifikasi tambahan** (mis. 4 digit akhir HP) atau cukup pilih nama + konfirmasi?
9. Kapan absen pulang dibuka — **sepanjang acara** atau hanya saat penutupan?
10. Daftar **email panitia** dan siapa yang berperan sebagai admin? Setuju bahwa role `committee` boleh buka/tutup absen?
11. Kebijakan **retensi data** setelah acara (berapa hari)?
12. Apakah tamu **walk-in** (tidak terdaftar) diperbolehkan? Jika ya, hanya lewat panitia (P11.5).

---

## Lampiran A — Sistem Warna RE:SNAPS (sumber: dokumen Sistem Warna)

> Palet digital **usulan**, diturunkan secara visual dari logo. Kunci nilai final dengan berkas logo vektor/panduan merek resmi.

### A.1 Warna inti
| Token | Hex | Peran | Penggunaan |
|---|---|---|---|
| brand-blue | #1677B8 | Biru identitas | Tautan utama, ikon, aksen, gradien |
| brand-purple | #6035A8 | Ungu identitas | Aksen dan bagian gradien |
| brand-magenta | #B313A5 | Magenta identitas | Aksen kreatif, penanda pilihan, gradien |
| brand-coral | #E66B72 | Koral identitas | Aksen hangat dan gradien |
| brand-gold | #F2B92E | Kuning emas identitas | Sorotan, detail kecil, gradien |
| brand-orange | #F28B43 | Oranye identitas | Aksen pendamping dan gradien |

### A.2 Permukaan dan teks
| Token | Hex | Peran | Penggunaan |
|---|---|---|---|
| canvas | #FFF9F4 | Latar halaman | Latar utama hangat |
| surface | #FFFFFF | Permukaan kartu | Kartu, modal, panel |
| surface-soft | #FFF0E7 | Latar sekunder | Blok cerita, banner, sorotan |
| ink | #252339 | Teks utama | Judul, isi, navigasi |
| ink-muted | #666476 | Teks sekunder | Deskripsi, metadata, label |
| line | #E9E2E4 | Garis batas | Border, pemisah, kontrol nonaktif |
| white | #FFFFFF | Putih | Teks di tombol gelap dan elemen kontras |

### A.3 Status
| Token | Hex | Peran |
|---|---|---|
| success | #267A57 | Berhasil atau selesai |
| warning | #9A5A00 | Perlu perhatian |
| error | #B8323A | Gagal atau kesalahan |
| info | #236A9A | Informasi |

Status dibedakan dengan **label atau ikon**, bukan warna saja.

### A.4 Aturan pemakaian
- Gradien pada **satu fokus visual per layar**; bukan latar semua kartu/paragraf; bukan untuk status atau informasi penting.
- Teks di atas gradien harus kontras memadai; gunakan lapisan gelap atau letakkan teks pada area solid.
- Proporsi awal: **70%** netral terang · **20%** foto dan teks gelap · **10%** aksen identitas. Pada halaman galeri, foto boleh dominan.
- Gunakan `ink` di atas `canvas`/`surface` untuk teks isi; `ink-muted` hanya pada permukaan terang.
- Hindari teks putih kecil di atas kuning/oranye terang; aksen terang → teks gelap; biru/ungu gelap → teks putih (setelah kontras diperiksa).
- Periksa kombinasi final terhadap **WCAG 2.2 AA**.

### A.5 Token CSS (`styles/tokens.css`)
```css
:root {
  /* Brand */
  --color-brand-blue: #1677B8;
  --color-brand-purple: #6035A8;
  --color-brand-magenta: #B313A5;
  --color-brand-coral: #E66B72;
  --color-brand-orange: #F28B43;
  --color-brand-gold: #F2B92E;

  /* Surfaces and text */
  --color-canvas: #FFF9F4;
  --color-surface: #FFFFFF;
  --color-surface-soft: #FFF0E7;
  --color-ink: #252339;
  --color-ink-muted: #666476;
  --color-line: #E9E2E4;
  --color-white: #FFFFFF;

  /* Status */
  --color-success: #267A57;
  --color-warning: #9A5A00;
  --color-error: #B8323A;
  --color-info: #236A9A;

  /* Gradients */
  --gradient-brand: linear-gradient(
    110deg,
    #1677B8 0%,
    #6035A8 28%,
    #B313A5 49%,
    #E66B72 69%,
    #F28B43 84%,
    #F2B92E 100%
  );
  --gradient-cool: linear-gradient(110deg, #1677B8, #6035A8 55%, #B313A5);
  --gradient-warm: linear-gradient(110deg, #F2B92E, #F28B43 48%, #E66B72);
}
```

---

## Lampiran B — Template Spreadsheet Tamu

| Kolom | Wajib | Contoh | Catatan |
|---|---|---|---|
| `nama` | ✅ | Anindya Putri Maharani | Nama sebagaimana dikenali tamu; maks. 120 karakter |
| `kategori` | Disarankan | Divisi Dokumentasi | Pembeda nama kembar (divisi/angkatan/grup) |
| `kontak` | Opsional | 0812xxxxxxx | Hanya untuk verifikasi 4 digit (jika diaktifkan); tidak pernah tampil ke tamu |
| `catatan` | Opsional | Pembicara | Internal panitia |

Aturan: satu baris = satu orang; baris pertama = header persis seperti di atas; hindari sel digabung; ekspor sebagai **CSV UTF-8**.

---

## Lampiran C — Go/No-Go Checklist (H-1)

- [ ] Production terhubung ke database production; jumlah tamu cocok dengan spreadsheet final.
- [ ] Tabel `attendance_logs` kosong dan `scan_sessions` bersih sebelum acara.
- [ ] `QR_SIGNING_SECRET` production berbeda dari dev dan tidak ada di repo.
- [ ] Minimal **2 perangkat layar QR** siap (utama + cadangan): login aktif, auto-lock mati, kecerahan tinggi, charger terpasang.
- [ ] Layar QR mode **Masuk** dan mode **Pulang** diuji scan di ≥ 2 jenis HP pada jarak nyata di gerbang.
- [ ] Akun admin dan panitia bisa login; panitia tahu cara menyalakan/mengunci Layar QR, ganti mode, buka/tutup absen, absen manual, undo, cabut sesi.
- [ ] Sinyal/Wi-Fi di gerbang teruji; tamu dan perangkat layar sama-sama bisa terhubung.
- [ ] Rencana cadangan (pindah perangkat, absen manual, daftar cetak + CSV) siap di meja registrasi.
- [ ] Backup/ekspor terjadwal dan penanggung jawabnya jelas.
- [ ] Kontak darurat developer tersedia pada hari H.
- [ ] Absen berstatus **tertutup** sampai dibuka resmi oleh panitia.

---

## Lampiran D — Format `PROGRESS.md`

```md
# PROGRESS

## Status saat ini
Phase aktif: P__ — <nama>
Terakhir diperbarui: <tanggal/jam WIB>

## Ringkasan phase
| Phase | Status (todo/doing/done/blocked) | Catatan | Tanggal selesai |
|---|---|---|---|
| P00 | todo | | |
| ... | | | |

## Log task
- [x] P01.1 create-next-app — commit abc123
- [ ] P01.2 ...

## Keputusan & asumsi baru
- <tanggal> — <keputusan> — <alasan>

## Blocker / butuh input manusia
- <hal yang menunggu jawaban>

## Aset TODO-ASSET
- [ ] logo.svg — penanggung jawab: <nama>
```
