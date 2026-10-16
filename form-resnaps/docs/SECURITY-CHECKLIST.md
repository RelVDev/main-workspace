# Checklist Keamanan & Hardening (P12)

Audit kepatuhan dan mitigasi risiko keamanan pada sistem absensi RE:SNAPS.

## 1. Header Keamanan HTTP (P12.1)
- [x] `X-Frame-Options: DENY` — Mencegah clickjacking pada seluruh halaman panitia dan absensi.
- [x] `X-Content-Type-Options: nosniff` — Mencegah MIME type sniffing.
- [x] `Referrer-Policy: no-referrer` — Mencegah kebocoran parameter token QR (`?t=...`) melalui header HTTP Referer saat tamu menavigasi ke luar.
- [x] `Permissions-Policy: camera=*, microphone=(), geolocation=()` — Membatasi akses sensor perangkat.

## 2. Akses Kontrol Database & RLS (P12.2)
- [x] RLS aktif pada seluruh 7 tabel: `guests`, `scan_sessions`, `attendance_logs`, `event_settings`, `committee_members`, `audit_logs`, `rate_limits`.
- [x] Hak akses `anon` ditolak 100% pada seluruh tabel dan seluruh RPC function.
- [x] Hak akses `authenticated` hanya diizinkan membaca jika user terdaftar di tabel `committee_members`.
- [x] Tabel `scan_sessions` tidak memiliki policy untuk role client; hanya dapat diakses melalui service role server.

## 3. Isolasi Rahasia & Kebocoran Bundle (P12.3)
- [x] `SUPABASE_SERVICE_ROLE_KEY`, `QR_SIGNING_SECRET`, dan `SESSION_COOKIE_SECRET` dipagari dengan `import "server-only"`.
- [x] Hasil pemindaian bundel client (`.next/static`): 0 kunci rahasia terdeteksi.
- [x] Berkas kredensial `.env.local` ter-ignore Git (tidak ter-commit).

## 4. Keamanan Sesi Scan & Cookie (P12.4)
- [x] Cookie `rs_session` berflag `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, `Max-Age=600s`.
- [x] Nilai cookie ditandatangani HMAC-SHA256 dengan perbandingan `timingSafeEqual`.
- [x] Cookie dibersihkan seketika setelah absensi sukses; pemakaian ulang ditolak sebagai `session_used`.

## 5. Perlindungan Privasi Data Tamu (P12.5 & P12.11)
- [x] Kolom `contact` dan `notes` tidak pernah dikirim ke klien publik (`/api/guests/search` hanya mengembalikan `id, name, category`).
- [x] Pencarian dibatasi minimal 2 huruf dan maksimal 8 hasil untuk mencegah enumerasi daftar tamu.
- [x] Header `Cache-Control: no-store` dipasang pada seluruh respons API publik.
- [x] Alamat IP tamu tidak disimpan secara mentah, melainkan di-hash dengan salt (`createHash("sha256").update(salt + ip)`).

## 6. Simulasi Penyalahgunaan (P12.6)
| Skenario | Hasil Uji | Status |
|---|---|---|
| Tangkapan layar QR dipakai > 60 detik kemudian | Ditolak: `token_expired` | LULUS |
| Manipulasi 1 karakter tanda tangan QR | Ditolak: `token_invalid` | LULUS |
| Token jendela masa depan | Ditolak: `token_invalid` | LULUS |
| Satu sesi dipakai untuk absen 2 tamu | Percobaan ke-2 ditolak: `session_used` | LULUS |
| Pergantian mode lewat URL manual | Sesi terkunci pada mode token QR; otomatis dialihkan | LULUS |
| Absensi ganda bersamaan untuk 1 tamu | Tepat 1 berhasil, lainnya `already_in` | LULUS |
| Formula injection pada ekspor CSV | Sel diawali tanda `'` | LULUS |
