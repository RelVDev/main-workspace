// Kurva ducking BGM saat dubbing aktif (PLAN.md Bagian 8.2):
// Turun selama 8 frame sebelum baris, naik perlahan selama 24 frame setelah baris.
export const bgmVolume = (
  f: number,
  dubRanges: [number, number][],
  base = 0.2,
  ducked = 0.08,
): number => {
  if (dubRanges.length === 0) return base;
  const active = dubRanges.some(([a, b]) => f >= a - 8 && f <= b + 24);
  if (!active) return base;
  const inside = dubRanges.some(([a, b]) => f >= a && f <= b);
  if (inside) return ducked;

  let t = 1;
  for (const [a, b] of dubRanges) {
    if (f >= a - 8 && f < a) {
      t = Math.min(t, (a - f) / 8);
    } else if (f > b && f <= b + 24) {
      t = Math.min(t, (f - b) / 24);
    }
  }
  return ducked + (base - ducked) * t * t;
};
