// Kriteria evaluasi & pengamatan kualitatif kelompok (tanpa angka pengukuran fiktif).
export interface ObservationCard {
  id: 'tekstur' | 'aroma' | 'kestabilan';
  judul: string;
  kriteria: string;
  hasilUser: string;
}

export const OBSERVATION_CRITERIA: ObservationCard[] = [
  {
    id: 'tekstur',
    judul: 'Tekstur Setelah Memadat',
    kriteria: 'Kepadatan, kehalusan permukaan, tidak retak/berminyak berlebih',
    hasilUser: 'Hasil: Lilin memadat merata pada 3 varian warna dalam wadah kaca',
  },
  {
    id: 'aroma',
    judul: 'Aroma yang Dihasilkan',
    kriteria: 'Kesegaran aroma pewangi & berkurangnya bau jelantah',
    hasilUser: 'Hasil: Diperkaya essential oil Vanilla untuk menetralkan bau jelantah',
  },
  {
    id: 'kestabilan',
    judul: 'Kestabilan Nyala Saat Diuji',
    kriteria: 'Nyala api stabil, asap minim, wadah aman (uji dengan pengawasan)',
    hasilUser: 'Evaluasi: Sumbu terpasang tegak dengan penyangga stik kayu siap uji aman',
  },
];
