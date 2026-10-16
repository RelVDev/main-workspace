# Next.js 16 & Supabase Fullstack Patterns Skill

## Overview
Pola arsitektur Next.js 16 (App Router) + Supabase SSR untuk aplikasi absensi berbasis sesi dan realtime.

## Aturan Teknis Next.js 16
1. **Cookies Asynchronous:**
   - Selalu panggil `const jar = await cookies();` di Server Component, Server Action, dan Route Handler.
   - Panggilan `jar.set(...)` atau `jar.delete(...)` harus di-await.
2. **Dynamic Segments vs Cache Components:**
   - Jangan gunakan `export const dynamic = "force-dynamic"` bersamaan dengan `cacheComponents: true` di `next.config.ts`.
   - Route handler yang membaca headers, cookies, atau searchParams secara otomatis diklasifikasikan sebagai dinamis (`ƒ`).
3. **Server-Only Guards:**
   - Semua modul akses database service role (`admin.ts`) dan pemrosesan secret wajib memakai `import "server-only";` di baris pertama.
4. **Font & Performance:**
   - Gunakan `next/font/google` dengan `display: "swap"` dan CSS variable (`Plus_Jakarta_Sans`).

## Pola Supabase & PostgreSQL
1. **Supabase SSR (@supabase/ssr):**
   - Untuk route terproteksi panitia, gunakan `createServerClient` dengan adapter cookie untuk membaca sesi JWT `authenticated`.
   - Untuk endpoint absensi publik, gunakan `createAdminClient` (service role) agar dapat menjalankan RPC `SECURITY DEFINER` dengan aman.
2. **Koneksi Database Direct vs Pooler:**
   - Di lingkungan Codespace / container tanpa rute IPv6, gunakan pooler Supabase port 5432 / 6543 dengan SSL mode `require` dan format URI lengkap yang menyertakan identifier SNI.
3. **Pola RPC Atomik:**
   - Kunci baris sesi: `select * from scan_sessions where id = p_session_id for update;`
   - Jangan pernah mengonsumsi sesi jika validasi (closed, already_in, not_found, key_version) gagal.
4. **Realtime & Fallback:**
   - Dashboard berlangganan channel Realtime pada tabel `attendance_logs`.
   - Sediakan fallback polling otomatis (10 detik) saat status channel mengalami `TIMED_OUT` atau `CHANNEL_ERROR`.
