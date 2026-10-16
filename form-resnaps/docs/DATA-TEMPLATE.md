# Template Spreadsheet Tamu

Ekspor sebagai **CSV UTF-8**. Baris pertama = header persis seperti di bawah. Satu baris = satu orang. Hindari sel digabung.

| Kolom | Wajib | Contoh | Catatan |
|---|---|---|---|
| `nama` | ya | Anindya Putri Maharani | Maks. 120 karakter |
| `kategori` | disarankan | Divisi Dokumentasi | Pembeda nama kembar (divisi/angkatan/grup) |
| `kontak` | opsional | 0812xxxxxxx | Hanya untuk verifikasi 4 digit (jika diaktifkan); tidak pernah tampil ke tamu |
| `catatan` | opsional | Pembicara | Internal panitia |

Contoh isi:

```csv
nama,kategori,kontak,catatan
Anindya Putri Maharani,Divisi Dokumentasi,0812xxxxxxx,Pembicara
```

File CSV asli disimpan di `data/` (di-ignore git) dan tidak pernah di-commit.
