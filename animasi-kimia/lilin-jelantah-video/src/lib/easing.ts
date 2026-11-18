import {Easing} from 'remotion';

export const easeInOutCubic = Easing.inOut(Easing.cubic);
export const easeOutCubic = Easing.out(Easing.cubic);
export const easeInCubic = Easing.in(Easing.cubic);
export const easeOutBack = Easing.back(1.4);

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export const stepFrame = (frame: number, stepFps: number, compFps = 30): number =>
  Math.floor((frame * stepFps) / compFps);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * clamp01(t);

/**
 * Smoothly interpolates through [timeSec, value] control points using cubic in-out easing
 * between adjacent timestamps, eliminating abrupt 1-frame camera jumps.
 */
export function smoothKeyframes(
  t: number,
  frames: ReadonlyArray<readonly [number, number]>,
  easingFn: (x: number) => number = easeInOutCubic,
): number {
  if (frames.length === 0) return 0;
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 0; i < frames.length - 1; i++) {
    const [t0, v0] = frames[i];
    const [t1, v1] = frames[i + 1];
    if (t <= t1) {
      if (t1 <= t0) return v1;
      const u = clamp01((t - t0) / (t1 - t0));
      return v0 + (v1 - v0) * easingFn(u);
    }
  }
  return frames[frames.length - 1][1];
}

/**
 * Smoothly transitions value to target whenever switching beats over rampSec.
 * Pass explicit beat transitions via smoothKeyframes for deterministic Remotion playback.
 */
export const smoothWindow = (
  t: number,
  startSec: number,
  endSec: number,
  fadeSec = 0.35,
): number => {
  if (t <= startSec || t >= endSec) return 0;
  const inF = fadeSec > 0 ? clamp01((t - startSec) / fadeSec) : 1;
  const outF = fadeSec > 0 ? clamp01((endSec - t) / fadeSec) : 1;
  return easeInOutCubic(Math.min(inF, outF));
};
