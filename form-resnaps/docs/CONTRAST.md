# Audit Kontras (P02.7)

Metode: rasio kontras WCAG 2.x (relative luminance), nilai dari `styles/tokens.css` (Lampiran A).
Ambang: teks normal 4.5:1, teks besar dan kontrol/indikator non-teks 3:1.

## Kombinasi yang dipakai

| Teks / ikon | Latar | Rasio | Hasil | Dipakai di |
|---|---|---|---|---|
| ink #252339 | canvas #FFF9F4 | 14.59 | lulus | body, judul |
| ink | surface #FFFFFF | 15.24 | lulus | kartu, input |
| ink | surface-soft #FFF0E7 | 13.69 | lulus | segmented control |
| ink-muted #666476 | canvas | 5.51 | lulus | sub-judul |
| ink-muted | surface | 5.75 | lulus | teks sekunder, empty state |
| ink-muted | surface-soft | 5.17 | lulus | |
| white #FFFFFF | brand-blue #1677B8 | 4.81 | lulus | tombol primer, mode aktif |
| white | brand-purple #6035A8 | 8.16 | lulus | |
| white | brand-magenta #B313A5 | 5.91 | lulus | |
| ink | brand-gold #F2B92E | 8.53 | lulus | aksen terang (teks gelap) |
| ink | brand-orange #F28B43 | 6.20 | lulus | |
| ink | brand-coral #E66B72 | 4.87 | lulus | |
| success #267A57 | surface | 5.24 | lulus | StatusBanner |
| warning #9A5A00 | surface | 5.47 | lulus | |
| error #B8323A | surface | 5.91 | lulus | |
| info #236A9A | surface | 5.83 | lulus | |
| success / warning / error / info | canvas | 5.02 / 5.24 / 5.66 / 5.59 | lulus | |
| brand-blue | canvas | 4.61 | lulus (teks besar & kontrol) | tombol sekunder, ikon |
| brand-blue | surface | 4.81 | lulus | |
| muted | line #E9E2E4 | 4.51 | lulus | |

## Kombinasi yang TIDAK lulus dan tidak dipakai

| Teks | Latar | Rasio | Keputusan |
|---|---|---|---|
| white | brand-gold | 1.79 | dilarang (sesuai §7: hindari teks putih di kuning/oranye). Tidak dipakai. |
| white | brand-orange | 2.46 | dilarang (sama). Tidak dipakai. |
| line #E9E2E4 | surface | 1.28 | border dekoratif, bukan kontrol atau satu-satunya penanda. Input memakai border `line` hanya sebagai batas visual; fokus memakai border biru dan ring. Kontrol tetap terbaca lewat label. Dicatat sebagai risiko rendah. |

## Catatan

- Status selalu memakai ikon + label teks (§7), sehingga tidak bergantung pada warna saja.
- Gradien hanya pada strip `BrandHeader` dan `bg-gradient-*`; teks tidak diletakkan di atas gradien.
- Nilai di atas dihitung ulang ketika palet final dari panduan merek tersedia (`TODO-ASSET`).
