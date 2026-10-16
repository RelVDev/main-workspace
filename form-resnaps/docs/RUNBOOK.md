# RUNBOOK — RE:SNAPS Sistem Absensi

Panduan operasional panitia dan teknis untuk sistem absensi Closing Party CHRYSALIS.

---

## 1. Persiapan Data Tamu (Google Sheets → Supabase)

### 1.1 Format Spreadsheet Tamu
Gunakan format kolom yang sudah dibakukan di `docs/DATA-TEMPLATE.md` (Lampiran B):
- `nama` (Wajib, maks 120 karakter) — Nama lengkap/panggilan tamu.
- `kategori` (Disarankan) — Divisi, angkatan, atau grup; berfungsi membedakan nama kembar.
- `kontak` (Opsional) — Nomor telepon/HP; disimpan di server, **tidak pernah ditampilkan** ke tamu.
- `catatan` (Opsional) — Catatan internal panitia (mis. "VIP", "Pembicara").

### 1.2 Ekspor dari Google Sheets
1. Buka spreadsheet tamu panitia.
2. Pastikan baris 1 berisi header: `nama,kategori,kontak,catatan`.
3. Klik **File** → **Download** → **Comma Separated Values (.csv)**.
4. Simpan berkas sebagai `data/guests.csv` di folder proyek (folder `data/` otomatis diabaikan oleh Git untuk perlindungan privasi).

### 1.3 Menjalankan Import
Jalankan langkah simulasi (*dry-run*) terlebih dahulu:
```bash
# 1. Simulasi (tidak mengubah database)
pnpm import:guests data/guests.csv

# Atau tentukan nama batch secara khusus:
pnpm import:guests data/guests.csv --batch=2026-10-20-final
```

Periksa laporan di layar dan berkas laporan di `data/import-report-<batch>.txt`.
Jika ada baris duplikat atau tidak valid, koreksi data di spreadsheet lalu unduh ulang.

Jika laporan sudah bersih dan sesuai:
```bash
# 2. Eksekusi import sungguhan
pnpm import:guests data/guests.csv --commit --batch=2026-10-20-final
```

Import bersifat **idempoten**: tamu yang sudah pernah masuk (berdasarkan kecocokan nama dan kategori) akan dilewati secara otomatis tanpa menggandakan baris.

---

## 2. Operasional Layar QR di Venue (Hari H)

1. **Perangkat:** Siapkan minimal 2 perangkat (tablet/laptop) dengan charger terpasang dan mode layar *Never Sleep* / *Auto-lock OFF*.
2. **Koneksi:** Hubungkan ke Wi-Fi venue atau tethering 4G/5G panitia.
3. **Membuka Layar:**
   - Panitia login di `/panitia/login`.
   - Buka `/panitia/qr`.
   - Pilih mode **MASUK** untuk gerbang kedatangan, atau **PULANG** untuk gerbang kepulangan.
   - Klik **Layar Penuh** (*Fullscreen*) dan aktifkan **Kunci Kontrol** agar tidak terpencet tamu.
4. **Rotasi QR:** QR berganti otomatis setiap 30 detik. Panitia tidak perlu menyegarkan peramban.

---

## 3. Prosedur Darurat & Mitigasi Lapangan

| Kejadian | Tindakan Cepat |
|---|---|
| **Layar QR mati / lowbat** | Pindahkan ke perangkat cadangan yang sudah disiapkan; buka `/panitia/qr` dan pilih mode yang sama. |
| **Koneksi internet venue putus** | Layar QR memegang token cadangan (*prefetch*). Jika koneksi mati total, panitia beralih ke absen manual di HP via `/panitia/tamu`. |
| **Tamu gagal scan / HP bermasalah** | Panitia mencari nama tamu di `/panitia/tamu` dan menekan tombol **Catat Masuk (Manual)**. |
| **QR tersebar ke luar venue** | Admin membuka `/panitia/pengaturan` dan menekan **Cabut Semua Sesi/QR**. Semua QR lama dan sesi aktif seketika hangus; layar otomatis mengambil kunci baru. |
