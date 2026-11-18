export type CharId =
  | 'malika'
  | 'noya'
  | 'marsha'
  | 'ayuya'
  | 'lovyta'
  | 'farel'
  | 'sofi'
  | 'disa'
  | 'ais';

export type SpeakerId = CharId | 'semua';

export type SceneId =
  | 'S01A'
  | 'S01B'
  | 'S02'
  | 'S03'
  | 'S04'
  | 'S05'
  | 'S06'
  | 'S07'
  | 'S08'
  | 'S09';

export interface ScriptLine {
  id: string;
  scene: SceneId;
  speaker: SpeakerId;
  text: string;
  pauseAfterSec?: number;
  minStartSec?: number;
}

// Naskah v2 sesuai PLAN.md Bagian 11 (tanpa teks dalam kurung siku []).
// Jeda [jeda] dikonversi menjadi pauseAfterSec: 0.8 (default antar baris: 0.35).
export const SCRIPT_LINES: ScriptLine[] = [
  // S01B. Masuk dunia (Bagian 11.3)
  {
    id: 'S01B_L01',
    scene: 'S01B',
    speaker: 'malika',
    text: 'Selamat datang di Dunia Kimia Pixel!',
    minStartSec: 2.0,
  },
  {
    id: 'S01B_L02',
    scene: 'S01B',
    speaker: 'semua',
    text: 'Di video ini, kami akan mengajak kalian melihat bagaimana konsep kimia bisa kita temukan dalam kehidupan sehari-hari, lewat pembuatan lilin aromatis dari minyak jelantah.',
    minStartSec: 10.0,
  },
  {
    id: 'S01B_L03',
    scene: 'S01B',
    speaker: 'noya',
    text: 'Kedengarannya sederhana, ya? Tapi di balik satu lilin kecil, ada banyak konsep kimia yang bisa kita amati.',
    minStartSec: 18.5,
  },
  {
    id: 'S01B_L04',
    scene: 'S01B',
    speaker: 'malika',
    text: 'Yuk, kita mulai dari masalahnya dulu.',
    minStartSec: 25.0,
  },

  // S02. Identifikasi masalah (Bagian 11.4)
  {
    id: 'S02_L01',
    scene: 'S02',
    speaker: 'malika',
    text: 'Coba bayangkan sisa minyak goreng di dapur rumahmu.',
    minStartSec: 0.8,
  },
  {
    id: 'S02_L02',
    scene: 'S02',
    speaker: 'malika',
    text: 'Minyak yang sudah dipakai menggoreng berkali-kali itu kita sebut minyak jelantah.',
    minStartSec: 6.0,
  },
  {
    id: 'S02_L03',
    scene: 'S02',
    speaker: 'malika',
    text: 'Sayangnya, minyak jelantah sering langsung dibuang ke tanah, selokan, atau saluran air.',
    pauseAfterSec: 0.8,
    minStartSec: 14.0,
  },
  {
    id: 'S02_L04',
    scene: 'S02',
    speaker: 'malika',
    text: 'Padahal, kalau dibuang sembarangan, minyak bisa mengganggu lingkungan. Di perairan, lapisan minyak dapat menghambat pertukaran oksigen dan mengganggu kehidupan organisme.',
    minStartSec: 24.0,
  },
  {
    id: 'S02_L05',
    scene: 'S02',
    speaker: 'malika',
    text: 'Beberapa kajian juga membahas dampaknya terhadap kualitas air dan tanah.',
    pauseAfterSec: 0.8,
    minStartSec: 38.0,
  },
  {
    id: 'S02_L06',
    scene: 'S02',
    speaker: 'malika',
    text: 'Dipakai memasak lagi juga bukan ide bagus. Minyak yang sudah berulang kali dipanaskan bisa berubah dan menghasilkan senyawa hasil degradasi, jadi sebaiknya tidak dipakai lagi untuk mengolah makanan.',
    pauseAfterSec: 0.8,
    minStartSec: 46.0,
  },
  {
    id: 'S02_L07',
    scene: 'S02',
    speaker: 'malika',
    text: 'Tapi minyak jelantah masih bisa dimanfaatkan untuk keperluan lain. Beberapa kegiatan pengabdian masyarakat bahkan sudah mencoba mengolahnya menjadi lilin aromatis.',
    minStartSec: 54.0,
  },
  {
    id: 'S02_L08',
    scene: 'S02',
    speaker: 'malika',
    text: 'Dari situ muncul pertanyaan proyek kami: bagaimana minyak jelantah bisa dimanfaatkan jadi lilin yang berguna, sambil tetap memahami proses kimia di balik pembuatannya?',
  },
  {
    id: 'S02_L09',
    scene: 'S02',
    speaker: 'malika',
    text: 'Untuk menjawabnya, kita lihat dulu konsep kimianya bersama Noya!',
  },

  // S03. Ketepatan konsep kimia (Bagian 11.5)
  {
    id: 'S03_L01',
    scene: 'S03',
    speaker: 'noya',
    text: 'Halo, aku Noya! Sekarang kita kenalan sama molekul di balik minyak goreng.',
    minStartSec: 0.8,
  },
  {
    id: 'S03_L02',
    scene: 'S03',
    speaker: 'noya',
    text: 'Minyak goreng sebagian besar tersusun dari trigliserida, yaitu molekul yang terbentuk dari gliserol dan asam lemak.',
    minStartSec: 8.0,
  },
  {
    id: 'S03_L03',
    scene: 'S03',
    speaker: 'noya',
    text: 'Saat dipakai berulang kali, panas dan proses memasak bisa mengubah kualitasnya. Menyaring memang bisa memisahkan remah atau kotoran padat, tapi penyaringan saja tidak mengembalikan minyak ke kondisi baru.',
    minStartSec: 22.0,
  },
  {
    id: 'S03_L04',
    scene: 'S03',
    speaker: 'noya',
    text: 'Nah, ada satu hal penting: minyak jelantah tidak berubah menjadi parafin. Minyak dan bahan pembentuk lilin adalah bahan yang berbeda. Di proyek ini, minyak yang sudah disaring dicampur dengan bahan pemadat atau bahan lilin sesuai resep yang kami gunakan.',
    minStartSec: 32.0,
  },
  {
    id: 'S03_L05',
    scene: 'S03',
    speaker: 'noya',
    text: 'Waktu campuran dipanaskan, bahan lilin melunak atau meleleh, jadi bisa dicampur dan dituang ke wadah. Setelah dingin, campuran memadat. Perubahan dari cair ke padat ini disebut pembekuan atau pemadatan, dan termasuk perubahan fisika, karena tidak menghasilkan zat baru.',
    minStartSec: 44.0,
  },
  {
    id: 'S03_L06',
    scene: 'S03',
    speaker: 'noya',
    text: 'Lalu, saat lilin dinyalakan, panas api melelehkan bahan bakar di dekat sumbu. Cairan itu merambat naik lewat sumbu, sebagian menguap, lalu bereaksi dengan oksigen di udara. Pembakaran inilah perubahan kimia yang menghasilkan panas dan cahaya.',
    minStartSec: 58.0,
  },
  {
    id: 'S03_L07',
    scene: 'S03',
    speaker: 'noya',
    text: 'Jadi, dalam satu lilin sederhana, kita bisa melihat pemisahan campuran, pencampuran bahan, perubahan wujud, dan reaksi pembakaran. Sekarang, kita lihat penerapannya bersama Marsha!',
    minStartSec: 72.0,
  },

  // S04. Penerapan & analisis kimia (Bagian 11.6)
  {
    id: 'S04_L01',
    scene: 'S04',
    speaker: 'marsha',
    text: 'Oke, sekarang kita ikuti prosesnya langkah demi langkah. Dan kita nonton langsung hasil praktikum kami!',
    minStartSec: 1.0,
  },
  {
    id: 'S04_L02',
    scene: 'S04',
    speaker: 'marsha',
    text: 'Pertama, penyaringan. Minyak jelantah disaring untuk memisahkan sisa makanan dan kotoran yang terlihat. Ini contoh pemisahan secara fisika. Hasilnya mungkin tampak lebih bersih, tapi bukan berarti minyaknya kembali layak untuk memasak.',
    minStartSec: 20.0,
  },
  {
    id: 'S04_L03',
    scene: 'S04',
    speaker: 'marsha',
    text: 'Kedua, pemanasan dan pencampuran. Bahan lilin dipanaskan perlahan dengan cara yang aman sampai meleleh. Setelah itu, minyak jelantah yang sudah disiapkan dicampurkan sesuai takaran percobaan kami. Pengadukan membantu bahan tercampur lebih merata, dan pewangi ditambahkan sesuai prosedur dan bahan yang kami gunakan.',
    minStartSec: 36.0,
  },
  {
    id: 'S04_L04',
    scene: 'S04',
    speaker: 'marsha',
    text: 'Ketiga, pencetakan. Campuran dituang ke wadah yang sudah dipasangi sumbu, lalu dibiarkan mendingin. Saat suhunya turun, bahan lilin kembali memadat dan membentuk lilin.',
    minStartSec: 52.0,
  },
  {
    id: 'S04_L05',
    scene: 'S04',
    speaker: 'marsha',
    text: 'Perhatikan bedanya. Penyaringan dan pencampuran tidak otomatis membentuk zat baru. Pemadatan terjadi karena perubahan suhu. Sedangkan ketika sumbu menyala, berlangsung reaksi kimia pembakaran.',
    minStartSec: 66.0,
  },
  {
    id: 'S04_L06',
    scene: 'S04',
    speaker: 'marsha',
    text: 'Terakhir, analisisnya. Kita tidak cukup hanya melihat apakah lilinnya jadi. Kita juga amati tekstur setelah memadat, seberapa kuat aromanya, dan apakah nyalanya cukup stabil saat diuji. Dari situ kita tahu bagian mana yang sudah bekerja baik, dan bagian mana yang masih perlu diperbaiki.',
    minStartSec: 78.0,
  },
  {
    id: 'S04_L07',
    scene: 'S04',
    speaker: 'marsha',
    text: 'Nah, produk akhirnya, biar Ayuya dan Lovyta yang kenalkan!',
    minStartSec: 94.0,
  },

  // S05. Produk atau solusi proyek (Bagian 11.7)
  {
    id: 'S05_L01',
    scene: 'S05',
    speaker: 'ayuya',
    text: 'Taraa! Ini produk kami: lilin aromatis yang memanfaatkan minyak jelantah sebagai salah satu bahannya.',
    minStartSec: 1.0,
  },
  {
    id: 'S05_L02',
    scene: 'S05',
    speaker: 'lovyta',
    text: 'Minyak yang tadinya berpotensi dibuang begitu saja, kami olah jadi produk yang bisa menghadirkan aroma di ruangan.',
    minStartSec: 7.5,
  },
  {
    id: 'S05_L03',
    scene: 'S05',
    speaker: 'ayuya',
    text: 'Prosesnya dimulai dari menyaring minyak, lalu menyiapkan bahan lilin dan wadah bersumbu.',
    minStartSec: 14.5,
  },
  {
    id: 'S05_L04',
    scene: 'S05',
    speaker: 'lovyta',
    text: 'Kemudian bahan dicampur sesuai takaran kami, dituang, dan didinginkan, sampai terbentuk lilin yang siap kami amati dan uji.',
  },
  {
    id: 'S05_L05',
    scene: 'S05',
    speaker: 'ayuya',
    text: 'Solusinya sederhana, tapi bisa jadi contoh bahwa limbah rumah tangga masih bisa diberi nilai guna.',
    minStartSec: 27.0,
  },
  {
    id: 'S05_L06',
    scene: 'S05',
    speaker: 'lovyta',
    text: 'Tapi ingat ya: lilin ini bukan untuk dikonsumsi, dan minyak yang sudah jadi jelantah juga tidak boleh dipakai lagi untuk memasak.',
    minStartSec: 34.5,
  },
  {
    id: 'S05_L07',
    scene: 'S05',
    speaker: 'ayuya',
    text: 'Kalau mau menguji lilin, lakukan dengan pengawasan, di tempat yang aman, dan jauh dari benda yang mudah terbakar.',
    minStartSec: 43.0,
  },
  {
    id: 'S05_L08',
    scene: 'S05',
    speaker: 'lovyta',
    text: 'Sekarang, kita lihat data dan buktinya bersama Farel dan Sofi!',
    minStartSec: 52.0,
  },

  // S06. Kreativitas, inovasi, data & bukti (Bagian 11.8)
  {
    id: 'S06_L01',
    scene: 'S06',
    speaker: 'farel',
    text: 'Sebelum membahas produknya lebih jauh, coba lihat dulu seberapa besar potensinya. Kajian Indonesia Palm Oil Strategic Studies, atau IPOSS, yang dimuat dalam prosiding ICMCER 2024, memperkirakan sektor rumah tangga Indonesia berpotensi menghasilkan sekitar 898 ribu ton minyak jelantah setiap tahun.',
    minStartSec: 0.8,
  },
  {
    id: 'S06_L02',
    scene: 'S06',
    speaker: 'sofi',
    text: 'Angka itu menunjukkan bahwa jelantah bukan sekadar sisa kecil dari kegiatan memasak. Kalau tidak dikelola dengan baik, jumlahnya bisa menjadi persoalan lingkungan.',
    minStartSec: 14.0,
  },
  {
    id: 'S06_L03',
    scene: 'S06',
    speaker: 'sofi',
    text: 'Survei Katadata Insight Center tahun 2020 terhadap 140 rumah tangga juga menunjukkan bahwa sekitar 64,3 persen responden langsung membuang minyak jelantah. Ini gambaran kebiasaan responden yang disurvei, sekaligus tanda bahwa masih ada peluang untuk mengenalkan cara pemanfaatan yang lebih baik.',
    minStartSec: 22.5,
  },
  {
    id: 'S06_L04',
    scene: 'S06',
    speaker: 'farel',
    text: 'Dari situ, kami mencoba inovasi sederhana: mengolah minyak jelantah menjadi lilin aromatis, dengan menerapkan konsep tadi, mulai dari penyaringan, pencampuran, pemanasan, sampai pemadatan.',
    minStartSec: 40.0,
  },
  {
    id: 'S06_L05',
    scene: 'S06',
    speaker: 'sofi',
    text: 'Lalu, bagaimana kita tahu produknya berhasil? Kami mengamati bentuk dan tekstur lilin setelah memadat, aroma yang dihasilkan, serta kestabilan nyalanya saat diuji. Foto dan catatan proses juga menjadi bukti pendukung.',
    minStartSec: 52.0,
  },
  {
    id: 'S06_L06',
    scene: 'S06',
    speaker: 'farel',
    text: 'Jadi ada dua jenis informasi. Angka nasional tadi memberi konteks tentang masalahnya, sedangkan hasil pengamatan memberi bukti dari percobaan yang kami lakukan.',
    minStartSec: 72.0,
  },
  {
    id: 'S06_L07',
    scene: 'S06',
    speaker: 'sofi',
    text: 'Inovasi ini bukan cuma soal membuat lilin yang harum, tapi juga memberi nilai guna baru pada bahan yang sering dianggap tidak berguna.',
    minStartSec: 82.0,
  },
  {
    id: 'S06_L08',
    scene: 'S06',
    speaker: 'farel',
    text: 'Dari proyek ini kami belajar bahwa kimia bukan hanya teori dan rumus. Kimia juga membantu kita memahami bahan di sekitar dan mencari cara kreatif untuk memanfaatkannya.',
  },
  {
    id: 'S06_L09',
    scene: 'S06',
    speaker: 'sofi',
    text: 'Nah, supaya semua ini bisa ditelusuri, kita lihat referensinya bersama Disa!',
  },

  // S07. Referensi & komunikasi ilmiah (Bagian 11.9)
  {
    id: 'S07_L01',
    scene: 'S07',
    speaker: 'disa',
    text: 'Aku Disa, penjaga perpustakaan di dunia ini. Di proyek ini, kami memakai beberapa referensi untuk memahami masalah jelantah, potensi pemanfaatannya, dan konsep kimianya.',
    minStartSec: 0.8,
  },
  {
    id: 'S07_L02',
    scene: 'S07',
    speaker: 'disa',
    text: 'Untuk potensi jelantah rumah tangga, kami merujuk kajian Pamungkas, Sentosa, dan Padmansih di prosiding ICMCER 2024. Untuk survei 140 rumah tangga, kami merujuk publikasi Katadata Insight Center tahun 2020.',
    minStartSec: 9.0,
  },
  {
    id: 'S07_L03',
    scene: 'S07',
    speaker: 'disa',
    text: 'Kami juga membaca artikel di Jurnal Puruhita dan Jurnal Karunia tentang risiko penggunaan atau pembuangan minyak jelantah, serta publikasi prosiding seminar nasional tentang pengolahan jelantah menjadi lilin aromaterapi.',
    minStartSec: 22.0,
  },
  {
    id: 'S07_L04',
    scene: 'S07',
    speaker: 'disa',
    text: 'Ditambah kajian tentang analisis limbah jelantah dan pemanfaatannya untuk sabun.',
    minStartSec: 36.0,
  },
  {
    id: 'S07_L05',
    scene: 'S07',
    speaker: 'disa',
    text: 'Untuk konsep bahan, kami merujuk OpenStax tentang trigliserida dalam minyak dan lemak, serta PubChem tentang sifat parafin.',
    minStartSec: 42.0,
  },
  {
    id: 'S07_L06',
    scene: 'S07',
    speaker: 'disa',
    text: 'Dan satu hal lagi: kami membedakan data dari sumber pustaka dan hasil pengamatan kelompok sendiri. Dengan begitu, informasi kami lebih jelas, bisa ditelusuri, dan tidak tercampur dengan data penelitian lain.',
    minStartSec: 50.0,
  },
  {
    id: 'S07_L07',
    scene: 'S07',
    speaker: 'disa',
    text: 'Terakhir, siapa saja yang bekerja di balik proyek ini? Kita ke Ais!',
  },

  // S08. Kontribusi seluruh anggota (Bagian 11.10)
  {
    id: 'S08_L01',
    scene: 'S08',
    speaker: 'ais',
    text: 'Terakhir, soal kerja sama tim. Dalam pembuatan lilin dari minyak jelantah ini, semua anggota kelompok ikut berkontribusi.',
    minStartSec: 0.8,
  },
  {
    id: 'S08_L02',
    scene: 'S08',
    speaker: 'ais',
    text: 'Ada yang menyiapkan alat dan bahan, menyaring minyak, mencampur bahan, serta membantu proses pemanasan dan pencetakan. Ada juga yang menyiapkan wadah, memasang sumbu, mendekorasi produk, mendokumentasikan proses, dan mengumpulkan informasi pendukung. Walaupun tugasnya berbeda-beda, kami saling membantu supaya prosesnya berjalan lancar.',
    minStartSec: 8.5,
  },
  {
    id: 'S08_L03',
    scene: 'S08',
    speaker: 'ais',
    text: 'Lewat proyek ini, kami bukan cuma belajar mengolah minyak jelantah jadi lilin. Kami juga belajar membagi tugas, bekerja sama, berkomunikasi, dan bertanggung jawab atas hasil kelompok.',
    minStartSec: 28.0,
  },

  // S09. Penutup (Bagian 11.11)
  {
    id: 'S09_L01',
    scene: 'S09',
    speaker: 'malika',
    text: 'Minyak jelantah jangan dibuang sembarangan.',
    minStartSec: 3.0,
  },
  {
    id: 'S09_L02',
    scene: 'S09',
    speaker: 'noya',
    text: 'Kenali konsep kimia di balik prosesnya.',
  },
  {
    id: 'S09_L03',
    scene: 'S09',
    speaker: 'marsha',
    text: 'Amati dan catat hasilnya dengan teliti.',
  },
  {
    id: 'S09_L04',
    scene: 'S09',
    speaker: 'ayuya',
    text: 'Cari cara agar bahan sisa punya nilai guna.',
  },
  {
    id: 'S09_L05',
    scene: 'S09',
    speaker: 'lovyta',
    text: 'Tetap utamakan keselamatan saat membuat dan menguji produk.',
  },
  {
    id: 'S09_L06',
    scene: 'S09',
    speaker: 'farel',
    text: 'Mulai dari langkah sederhana di sekitar kita.',
  },
  {
    id: 'S09_L07',
    scene: 'S09',
    speaker: 'sofi',
    text: 'Karena ide kecil juga bisa membawa perubahan.',
  },
  {
    id: 'S09_L08',
    scene: 'S09',
    speaker: 'disa',
    text: 'Terima kasih sudah menyimak penjelasan kami.',
  },
  {
    id: 'S09_L09',
    scene: 'S09',
    speaker: 'ais',
    text: 'Sampai jumpa!',
  },
  {
    id: 'S09_L10',
    scene: 'S09',
    speaker: 'semua',
    text: 'Yuk, gunakan ilmu untuk memahami dan merawat lingkungan sekitar!',
    minStartSec: 25.0,
  },
];

// Baris dialog pengantar live-action S01A (untuk tampilan subtitle/preview & placeholder F00)
export const S01A_LIVE_LINES: Array<{
  id: string;
  speaker: SpeakerId;
  text: string;
  startSec: number;
  endSec: number;
}> = [
  {id: 'S01A_L01', speaker: 'semua', text: 'Halo, teman-teman!', startSec: 1.5, endSec: 4.0},
  {
    id: 'S01A_L02',
    speaker: 'malika',
    text: 'Aku Malika, yang bakal cerita soal masalahnya.',
    startSec: 4.2,
    endSec: 7.2,
  },
  {
    id: 'S01A_L03',
    speaker: 'noya',
    text: 'Aku Noya, yang jelasin konsep kimianya.',
    startSec: 7.4,
    endSec: 10.2,
  },
  {
    id: 'S01A_L04',
    speaker: 'marsha',
    text: 'Aku Marsha, yang bahas penerapannya.',
    startSec: 10.4,
    endSec: 13.0,
  },
  {
    id: 'S01A_L05',
    speaker: 'ayuya',
    text: 'Aku Ayuya, bagian produk.',
    startSec: 13.2,
    endSec: 15.6,
  },
  {
    id: 'S01A_L06',
    speaker: 'lovyta',
    text: 'Aku Lovyta, bagian produk juga.',
    startSec: 15.8,
    endSec: 18.2,
  },
  {
    id: 'S01A_L07',
    speaker: 'farel',
    text: 'Aku Farel, bagian data dan bukti.',
    startSec: 18.4,
    endSec: 21.0,
  },
  {
    id: 'S01A_L08',
    speaker: 'sofi',
    text: 'Aku Sofi, bagian data dan bukti juga.',
    startSec: 21.2,
    endSec: 24.0,
  },
  {
    id: 'S01A_L09',
    speaker: 'disa',
    text: 'Aku Disa, penjaga referensi.',
    startSec: 24.2,
    endSec: 26.8,
  },
  {
    id: 'S01A_L10',
    speaker: 'ais',
    text: 'Dan aku Ais, yang cerita soal kerja sama tim.',
    startSec: 27.0,
    endSec: 30.0,
  },
  {
    id: 'S01A_L11',
    speaker: 'malika',
    text: 'Hari ini kami mau ajak kalian lihat kimia di kehidupan sehari-hari lewat lilin aromatis dari minyak jelantah. Tapi kalian harus ikut kami masuk ke dunia yang beda dulu. Siap?',
    startSec: 30.2,
    endSec: 35.4,
  },
];

export const wordCount = (text: string): number =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
