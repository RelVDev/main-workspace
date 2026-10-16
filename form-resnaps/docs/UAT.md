# SKRIP PENGUJIAN PENERIMAAN PENGGUNA (UAT) — RE:SNAPS

Dokumen panduan pengujian bagi panitia pelaksana Closing Party CHRYSALIS (Phase 15).

---

## 1. Persiapan Sebelum UAT
1. **Perangkat:** Siapkan 2 perangkat layar QR (laptop/tablet) dan minimal 3 ponsel penguji (Android & iPhone).
2. **Koneksi:** Terhubung ke jaringan internet venue.
3. **Akun:** Login panitia menggunakan akun `admin@resnaps.local` atau akun panitia masing-masing.

---

## 2. Matriks 15 Skenario UAT

| # | Skenario | Langkah Pengujian | Hasil yang Diharapkan | Status |
|---|---|---|---|---|
| **1** | **Menyalakan Layar QR** | Buka `/panitia/qr` di browser tablet/laptop. | Layar QR tampil bersih hitam-putih, hitung mundur 30s berjalan, strip gradien di atas. | [ ] |
| **2** | **Rotasi Token Otomatis** | Amati layar selama 60 detik tanpa menyentuh perangkat. | QR berganti tepat saat hitung mundur mencapai 0; tidak ada kedipan layar. | [ ] |
| **3** | **Ganti Mode Layar** | Ketuk tombol segmen "PULANG" lalu kembali ke "MASUK". | Judul berganti menjadi "SCAN UNTUK ABSEN PULANG", QR langsung berubah dalam < 1 detik. | [ ] |
| **4** | **Absensi Masuk Normal** | Scan QR dengan kamera HP -> buka link `/masuk` -> ketik nama -> pilih nama -> konfirmasi "Ya, Absen Masuk". | Layar sukses hijau muncul dengan jam WIB. Nama hilang dari pencarian `/masuk`. | [ ] |
| **5** | **Pembeda Nama Kembar** | Cari nama kembar (mis. "Bagas Pratama") di `/masuk`. | Hasil pencarian menampilkan nama disertai kategori divisi yang jelas ("Divisi Acara" vs "Divisi Media"). | [ ] |
| **6** | **Konfirmasi Salah Pilih** | Pilih nama tamu lain -> tekan "Bukan Saya". | Modal konfirmasi tertutup, tamu kembali ke kotak pencarian tanpa mencatat absen. | [ ] |
| **7** | **Pencegahan Double Submit** | Tekan tombol "Ya, Absen Masuk" secara cepat dua kali. | Tombol langsung berputar (*loading*) dan dinonaktifkan; hanya 1 catatan yang masuk. | [ ] |
| **8** | **Pencegahan Reuse Sesi** | Setelah sukses absen, tekan tombol *Back* di peramban dan coba absen nama lain. | Sistem menolak dengan pesan "Sesi ini sudah dipakai. Scan ulang QR terbaru." | [ ] |
| **9** | **QR Kedaluwarsa** | Foto QR layar, tunggu 90 detik, lalu scan dari foto lama. | Sistem menolak dengan pesan "QR sudah kedaluwarsa. Scan ulang QR terbaru di layar." | [ ] |
| **10** | **Buka / Tutup Absen** | Panitia menekan tombol "Tutup Absen" di Layar QR atau Dashboard. | QR seketika disembunyikan; tamu yang mencoba membuka link mendapat pesan "Absen sedang ditutup". | [ ] |
| **11** | **Absen Pulang (Validasi)** | Tamu yang belum absen masuk mencoba scan di layar mode "PULANG". | Nama tidak muncul di pencarian `/keluar`. | [ ] |
| **12** | **Koreksi Absen Manual** | Panitia membuka `/panitia/tamu`, cari tamu, tekan "Masuk" manual. | Status tamu berubah menjadi "Di Dalam" dan jam masuk tercatat dengan label "Manual". | [ ] |
| **13** | **Pembatalan Absen (Undo)** | Panitia menekan "Batal" pada tamu, isi alasan pembatalan. | Catatan absensi terhapus; alasan dan identitas panitia terekam di `/panitia/log`. | [ ] |
| **14** | **Ekspor Laporan CSV** | Tekan tombol "Ekspor CSV" di Dashboard atau halaman Tamu. | Berkas `.csv` terunduh, terbuka rapi di Excel tanpa teks rusak (UTF-8 BOM aktif). | [ ] |
| **15** | **Tanggap Darurat Cabut Sesi** | Buka `/panitia/pengaturan`, klik "Cabut Semua Sesi", ketik konfirmasi "CABUT". | Seluruh sesi aktif seketika hangus; Layar QR otomatis memuat versi kunci baru. | [ ] |

---

## 3. Kriteria Keberhasilan UAT
- Waktu rata-rata per absensi tamu: $\le 20$ detik (dari scan kamera hingga layar sukses).
- Tingkat kegagalan scan kamera: $\le 5\%$.
- Seluruh 15 skenario di atas berstatus **LULUS**.
