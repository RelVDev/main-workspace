import {FPS, dubMap} from '../data/timeline';

export const sec = (seconds: number, fps = FPS): number => Math.round(seconds * fps);

export const lineStartSec = (lineId: string, offsetSec = 0): number => {
  const entry = dubMap[lineId];
  return (entry?.startSec ?? 0) + offsetSec;
};

export const lineStart = (lineId: string, offsetSec = 0, fps = FPS): number =>
  Math.round(lineStartSec(lineId, offsetSec) * fps);

export const lineEnd = (lineId: string, offsetSec = 0, fps = FPS): number => {
  const entry = dubMap[lineId];
  return Math.round(((entry?.endSec ?? 0) + offsetSec) * fps);
};

export const lineDuration = (lineId: string, fps = FPS): number => {
  const entry = dubMap[lineId];
  return Math.max(1, Math.round((entry?.durationSec ?? 2) * fps));
};
