import {Scene, SCENE_COUNT} from './types';

export type Timeline = {
  n: number;
  total: number;
  /** awal adegan i (detik) */
  s: (i: number) => number;
  /** akhir adegan i (detik) */
  e: (i: number) => number;
  /** durasi adegan i */
  d: (i: number) => number;
  /** waktu pada fraksi f (0..1) di adegan i */
  at: (i: number, f: number) => number;
  /** indeks adegan aktif pada waktu t */
  index: (t: number) => number;
};

/**
 * Adegan i berjalan dari start_i sampai start_{i+1} (jeda setelah kalimat
 * menjadi bagian adegan itu). Adegan pertama mulai di 0, terakhir sampai total.
 */
export const makeTimeline = (scenes: Scene[], total: number): Timeline => {
  const n = SCENE_COUNT;
  const starts: number[] = [];
  for (let i = 0; i < n; i++) {
    if (scenes.length === n) {
      starts.push(i === 0 ? 0 : scenes[i].start);
    } else {
      starts.push((total / n) * i);
    }
  }
  const ci = (i: number): number => Math.min(n - 1, Math.max(0, Math.round(i)));
  const s = (i: number): number => starts[ci(i)];
  const e = (i: number): number => (ci(i) === n - 1 ? total : starts[ci(i) + 1]);
  const d = (i: number): number => Math.max(0.05, e(i) - s(i));
  const at = (i: number, f: number): number => s(i) + d(i) * f;
  const index = (t: number): number => {
    let r = 0;
    for (let i = 0; i < n; i++) {
      if (t >= starts[i]) r = i;
    }
    return r;
  };
  return {n, total, s, e, d, at, index};
};
