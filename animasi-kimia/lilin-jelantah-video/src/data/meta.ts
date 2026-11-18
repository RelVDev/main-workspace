import type {CharId} from './script';

export interface MemberProfile {
  fullName: string;
  nim: string;
  role: string;
}

// Isi `nim` & `fullName` dengan data NIM resmi kelompok agar otomatis tampil pada kartu nama interaktif Opening (S01A) dan End Card (S09).
export const MEMBER_PROFILES: Record<CharId, MemberProfile> = {
  malika: {fullName: 'Malika', nim: '', role: 'Masalah & Pembuka'},
  noya: {fullName: 'Noya', nim: '', role: 'Konsep & Reaksi Kimia'},
  marsha: {fullName: 'Marsha', nim: '', role: 'Penerapan & Analisis'},
  ayuya: {fullName: 'Ayuya', nim: '', role: 'Pengembangan Produk'},
  lovyta: {fullName: 'Lovyta', nim: '', role: 'Finishing & Keselamatan'},
  farel: {fullName: 'Farel', nim: '', role: 'Data Pustaka & Inovasi'},
  sofi: {fullName: 'Sofi', nim: '', role: 'Bukti & Evaluasi Hasil'},
  disa: {fullName: 'Disa', nim: '', role: 'Kurasi Referensi Ilmiah'},
  ais: {fullName: 'Ais', nim: '', role: 'Dokumentasi & Koordinasi'},
};

export const META = {
  judul: 'Kimia dalam Kehidupan Sehari-hari: Lilin Aromatis dari Minyak Jelantah',
  kelompok: 'Kelompok Praktikum Kimia Dasar',
  matkul: 'Kimia Dasar (Praktikum)',
  dosen: '',
  institusi: '',
  anggota: [
    'Malika',
    'Noya',
    'Marsha',
    'Ayuya',
    'Lovyta',
    'Farel',
    'Sofi',
    'Disa',
    'Ais',
  ] as const,
  // Diisi otomatis oleh scripts/detect-cover.sh bila dibutuhkan
  HAND_FILL: '#C98A5E',
  coverAtSec: 35.5,
  // [OPSIONAL] tampilkan chip reaksi pembakaran CO2 + H2O dan maskot Jeli
  showOptionalCombustionProducts: true,
  showMascotJeli: true,
};
