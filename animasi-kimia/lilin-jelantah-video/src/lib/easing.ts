import {Easing} from 'remotion';

export const easeInOutCubic = Easing.inOut(Easing.cubic);
export const easeOutCubic = Easing.out(Easing.cubic);
export const easeInCubic = Easing.in(Easing.cubic);
export const easeOutBack = Easing.back(1.4);

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export const stepFrame = (frame: number, stepFps: number, compFps = 30): number =>
  Math.floor((frame * stepFps) / compFps);
