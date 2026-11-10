export const clamp = (v: number, a = 0, b = 1): number => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
export const prog = (t: number, a: number, b: number): number => clamp((t - a) / (b - a || 1e-6));
export const smooth = (k: number): number => k * k * (3 - 2 * k);
export const easeInOut = (k: number): number =>
  k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
export const easeOut = (k: number): number => 1 - Math.pow(1 - k, 3);
export const easeOutBack = (k: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2);
};
export const rad = (deg: number): number => (deg * Math.PI) / 180;

/** pulsa 0..1..0 di antara a dan b */
export const bump = (t: number, a: number, b: number): number => {
  const k = prog(t, a, b);
  return Math.sin(k * Math.PI);
};

const hex = (c: string): [number, number, number] => {
  const h = c.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
export const mix = (c1: string, c2: string, k: number): string => {
  const a = hex(c1);
  const b = hex(c2);
  const f = (i: number): string =>
    Math.round(lerp(a[i], b[i], clamp(k)))
      .toString(16)
      .padStart(2, '0');
  return `#${f(0)}${f(1)}${f(2)}`;
};

/** pseudo-random deterministik 0..1 */
export const rnd = (seed: number): number => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

export const INK = '#1a1a1a';
export const SW = 7; // tebal outline utama

export type Pt = [number, number];

export const polyLen = (p: Pt[]): number => {
  let L = 0;
  for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return L;
};

/** titik di sepanjang polyline pada fraksi k (0..1) */
export const polyAt = (p: Pt[], k: number): Pt => {
  const total = polyLen(p);
  let target = clamp(k) * total;
  for (let i = 1; i < p.length; i++) {
    const seg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (target <= seg || i === p.length - 1) {
      const u = seg === 0 ? 0 : Math.min(1, target / seg);
      return [lerp(p[i - 1][0], p[i][0], u), lerp(p[i - 1][1], p[i][1], u)];
    }
    target -= seg;
  }
  return p[p.length - 1];
};

/** path SVG dari awal polyline sampai fraksi k (tergambar bertahap) */
export const polyPart = (p: Pt[], k: number): string => {
  const total = polyLen(p);
  let remain = clamp(k) * total;
  let d = `M ${p[0][0]} ${p[0][1]}`;
  for (let i = 1; i < p.length; i++) {
    const seg = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    if (remain >= seg) {
      d += ` L ${p[i][0]} ${p[i][1]}`;
      remain -= seg;
    } else {
      const u = seg === 0 ? 0 : remain / seg;
      d += ` L ${lerp(p[i - 1][0], p[i][0], u)} ${lerp(p[i - 1][1], p[i][1], u)}`;
      break;
    }
  }
  return d;
};

export const FONT = "'Poppins','Segoe UI','Helvetica Neue',Arial,sans-serif";
