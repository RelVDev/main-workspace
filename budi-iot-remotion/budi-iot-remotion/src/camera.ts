import {Timeline} from './timeline';
import {clamp, easeInOut, lerp, smooth} from './util';

export type Cam = {x: number; y: number; z: number};
type Way = {f: number; c: Cam};
const c = (x: number, y: number, z: number): Cam => ({x, y, z});

/**
 * Pergerakan kamera per adegan (indeks 0..29). Tiap adegan = daftar titik
 * (fraksi waktu adegan -> posisi kamera di dunia). Antar titik di-ease halus.
 * Koordinat dunia: tanah y=1250, rumah x 200..1200, jalan menuju kampus ke kanan.
 */
export const SHOTS: Way[][] = [
  /* 0 Pagi itu, matahari sudah tinggi */ [{f: 0, c: c(900, 260, 1.0)}, {f: 1, c: c(700, 900, 1.0)}],
  /* 1 Budi terbangun dengan panik */ [{f: 0, c: c(700, 960, 1.0)}, {f: 1, c: c(440, 1040, 1.9)}],
  /* 2 Badannya gerah */ [{f: 0, c: c(430, 1000, 2.6)}, {f: 1, c: c(440, 1010, 2.85)}],
  /* 3 melirik jam */ [{f: 0, c: c(430, 960, 2.0)}, {f: 0.7, c: c(900, 830, 2.15)}, {f: 1, c: c(900, 830, 2.3)}],
  /* 4 Gawat! */ [{f: 0, c: c(445, 975, 2.4)}, {f: 1, c: c(445, 965, 3.1)}],
  /* 5 hampir terlambat */ [{f: 0, c: c(520, 1050, 1.5)}, {f: 1, c: c(650, 1050, 1.3)}],
  /* 6 Tapi tenang */ [{f: 0, c: c(650, 1030, 1.25)}, {f: 1, c: c(690, 985, 1.05)}],
  /* 7 Kamar Budi tidak sembarangan */ [{f: 0, c: c(700, 945, 1.0)}, {f: 1, c: c(700, 930, 0.95)}],
  /* 8 Sensor suhu */ [{f: 0, c: c(360, 820, 2.3)}, {f: 1, c: c(340, 810, 2.6)}],
  /* 9 SI-RA bekerja */ [{f: 0, c: c(360, 800, 2.3)}, {f: 1, c: c(520, 780, 1.5)}],
  /* 10 Suhu terlalu tinggi */ [{f: 0, c: c(430, 770, 1.85)}, {f: 1, c: c(470, 775, 1.7)}],
  /* 11 Menyalakan AC */ [{f: 0, c: c(700, 790, 1.25)}, {f: 0.5, c: c(900, 770, 1.5)}, {f: 1, c: c(1060, 790, 1.95)}],
  /* 12 udara sejuk */ [{f: 0, c: c(900, 900, 1.3)}, {f: 1, c: c(700, 960, 1.0)}],
  /* 13 menyambar tas, berlari keluar */ [{f: 0, c: c(700, 990, 1.0)}, {f: 0.55, c: c(1010, 1010, 1.2)}, {f: 1, c: c(1250, 1060, 1.15)}],
  /* 14 lupa lampu & setrikaan */ [{f: 0, c: c(740, 790, 1.7)}, {f: 0.5, c: c(850, 900, 1.45)}, {f: 1, c: c(980, 1030, 1.8)}],
  /* 15 berhenti di jalan */ [{f: 0, c: c(1500, 1060, 1.1)}, {f: 0.6, c: c(1740, 1040, 1.3)}, {f: 1, c: c(1790, 1020, 1.5)}],
  /* 16 teringat sesuatu */ [{f: 0, c: c(1790, 1000, 2.0)}, {f: 1, c: c(1770, 960, 2.3)}],
  /* 17 Setrikaan! */ [{f: 0, c: c(1770, 960, 2.3)}, {f: 1, c: c(1770, 955, 2.4)}],
  /* 18 Lampu! */ [{f: 0, c: c(1770, 955, 2.4)}, {f: 1, c: c(1770, 955, 2.3)}],
  /* 19 Wajahnya pucat */ [{f: 0, c: c(1795, 985, 2.9)}, {f: 1, c: c(1795, 975, 3.2)}],
  /* 20 tersenyum, smartphone */ [{f: 0, c: c(1760, 990, 2.2)}, {f: 1, c: c(1660, 920, 1.75)}],
  /* 21 satu sentuhan -> Cloud -> rumah */ [
    {f: 0, c: c(1680, 900, 1.55)},
    {f: 0.3, c: c(1640, 700, 0.85)},
    {f: 0.55, c: c(1450, 760, 0.8)},
    {f: 1, c: c(940, 950, 1.0)},
  ],
  /* 22 Klik! (lampu) */ [{f: 0, c: c(800, 760, 2.0)}, {f: 1, c: c(780, 750, 2.3)}],
  /* 23 Lampu padam */ [{f: 0, c: c(770, 780, 1.9)}, {f: 1, c: c(740, 800, 1.6)}],
  /* 24 Klik! (setrika) */ [{f: 0, c: c(990, 1060, 2.2)}, {f: 1, c: c(980, 1050, 2.5)}],
  /* 25 Setrikaan mati */ [{f: 0, c: c(990, 1040, 2.0)}, {f: 1, c: c(1000, 1000, 1.5)}],
  /* 26 Semua beres */ [{f: 0, c: c(1275, 1000, 0.85)}, {f: 1, c: c(1275, 985, 0.8)}],
  /* 27 Internet of Things */ [{f: 0, c: c(1180, 900, 0.72)}, {f: 1, c: c(1260, 880, 0.7)}],
  /* 28 aman, efisien, selamat */ [{f: 0, c: c(1850, 1000, 1.3)}, {f: 1, c: c(1990, 1020, 1.2)}],
  /* 29 Teknologi mempermudah hidup */ [{f: 0, c: c(1500, 920, 0.85)}, {f: 1, c: c(1700, 950, 0.6)}],
];

const wayAt = (ways: Way[], p: number): Cam => {
  if (p <= ways[0].f) return ways[0].c;
  for (let i = 0; i < ways.length - 1; i++) {
    const a = ways[i];
    const b = ways[i + 1];
    if (p <= b.f) {
      const k = easeInOut(clamp((p - a.f) / (b.f - a.f || 1e-6)));
      return {x: lerp(a.c.x, b.c.x, k), y: lerp(a.c.y, b.c.y, k), z: lerp(a.c.z, b.c.z, k)};
    }
  }
  return ways[ways.length - 1].c;
};

/** Kamera pada waktu t. Transisi antar adegan dihaluskan (blend ~0.6 dtk). */
export const cameraAt = (t: number, T: Timeline): Cam => {
  const i = T.index(t);
  const dur = T.d(i);
  const p = clamp((t - T.s(i)) / dur);
  const base = wayAt(SHOTS[i], p);
  if (i === 0) return base;
  const tr = Math.min(0.7, dur * 0.6);
  const k = smooth(clamp((t - T.s(i)) / tr));
  if (k >= 1) return base;
  const prev = wayAt(SHOTS[i - 1], 1);
  // zoom diinterpolasi secara logaritmik agar terasa natural
  const z = Math.exp(lerp(Math.log(prev.z), Math.log(base.z), k));
  return {x: lerp(prev.x, base.x, k), y: lerp(prev.y, base.y, k), z};
};
