// Hasil pengamatan kelompok sebenarnya.
// Sesuai PLAN.md 1.4: tanpa data user, hanya tampilkan kriteria + TODO(user), dilarang mengarang angka.
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
    hasilUser: 'TODO(user): isi hasil pengamatan tekstur nyata',
  },
  {
    id: 'aroma',
    judul: 'Aroma yang Dihasilkan',
    kriteria: 'Kesegaran aroma pewangi & berkurangnya bau jelantah',
    hasilUser: 'TODO(user): isi hasil pengamatan aroma nyata',
  },
  {
    id: 'kestabilan',
    judul: 'Kestabilan Nyala Saat Diuji',
    kriteria: 'Nyala api stabil, asap minim, wadah aman (uji dengan pengawasan)',
    hasilUser: 'TODO(user): isi hasil pengamatan uji nyala nyata',
  },
];
