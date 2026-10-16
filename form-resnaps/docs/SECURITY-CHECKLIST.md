# SECURITY CHECKLIST — RE:SNAPS Sistem Absensi (P12)

Laporan verifikasi dan bukti keamanan sistem absensi Closing Party CHRYSALIS.

---

## 1. Matriks Pemeriksaan Keamanan

| # | Item Pemeriksaan | Status | Bukti / Implementasi |
|---|---|---|---|
| **P12.1** | **Security Headers** | ✅ Terverifikasi | Diimplementasikan di `next.config.ts`: `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer` (mencegah bocornya `?t=` token QR ke situs pihak ketiga), `X-Content-Type-Options: nosniff`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Strict-Transport-Security`. |
| **P12.2** | **Audit RLS Database** | ✅ Terverifikasi | RLS aktif di seluruh 7 tabel & view. Role `anon` ditolak total dari membaca/menulis `guests`, `scan_sessions`, `attendance_logs`, `event_settings`, `audit_logs`, `rate_limits`. Role `authenticated` hanya membaca jika terdaftar di `committee_members`. Seluruh eksekusi tulis tamu melalui RPC `SECURITY DEFINER` service role. |
| **P12.3** | **Audit Secret & Bundle Client** | ✅ Terverifikasi | Pemindaian `.next/static` membuktikan **0 byte** keberadaan `QR_SIGNING_SECRET`, `SESSION_COOKIE_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, maupun password PostgreSQL. Modul `admin.ts` dan `session.ts` diproteksi dengan `import 'server-only'`. |
| **P12.4** | **Audit Cookie Sesi (`rs_session`)** | ✅ Terverifikasi | Cookie diset dengan atribut `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`. Ditandatangani HMAC-SHA256 constant-time. Dihapus secara otomatis setelah absensi berhasil dicatat (`clearSessionCookie()`). |
| **P12.5** | **Cache-Control & Perlindungan PII** | ✅ Terverifikasi | Seluruh respons API publik menyertakan header `Cache-Control: no-store`. Kolom `contact` dan `notes` tidak pernah dikembalikan ke endpoint tamu `/api/guests/search`. Pencarian dibatasi minimal 2 huruf dan maksimal 8 hasil. |
| **P12.6** | **Simulasi Penyalahgunaan** | ✅ Terverifikasi | (a) Token kedaluwarsa (> 2 jendela) ditolak `token_expired`.<br>(b) Token dimanipulasi ditolak `token_invalid`.<br>(c) Sesi dipakai berulang ditolak `session_used` (409).<br>(d) Absen ganda tamu ditolak `already_in` (409).<br>(e) Akses tanpa sesi ditolak `session_invalid` (401). |
| **P12.7** | **Ketahanan Jaringan** | ✅ Terverifikasi | Layar QR memiliki antrean *prefetch* 4 token ke depan sehingga tetap berjalan saat koneksi tersendat. Komponen tamu memiliki tombol "Coba Lagi" dan state machine fail-closed tanpa status menggantung. |
| **P12.8** | **Performa & Ukuran Bundle** | ✅ Terverifikasi | Halaman tamu (`/masuk`, `/keluar`) tidak memuat pustaka berat seperti Recharts atau QRCode (hanya dimuat di bundle panitia). CSS memanfaatkan utilitas Tailwind v4 terkonsolidasi. |
| **P12.9** | **Aksesibilitas (WCAG 2.2 AA)** | ✅ Terverifikasi | Kontras warna seluruh komponen diuji di `docs/CONTRAST.md`. Seluruh target sentuh tombol dan opsi $\ge 48$ px. Seluruh status menggunakan kombinasi Ikon + Label Teks tegas (tidak bergantung pada warna saja). Font input $\ge 16$ px mencegah zoom otomatis Safari iOS. |
| **P12.10** | **Halaman 404 & Error** | ✅ Terverifikasi | Dibuat di `app/not-found.tsx` dan `app/error.tsx` menggunakan token warna dan tipografi RE:SNAPS. Seluruh aplikasi menyertakan meta tag `noindex, nofollow` dan `app/robots.ts` memblokir seluruh web crawler. |
| **P12.11** | **Kebijakan Retensi Data** | ✅ Terverifikasi | Prosedur pasca-acara terdokumentasi di `docs/RUNBOOK.md`: pembersihan sesi aktif via `revoke_all_sessions`, ekspor final terenkripsi, serta penghapusan data kontak tamu setelah periode retensi. |
