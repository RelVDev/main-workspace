import durationsJson from './durations.json';
import dubMapJson from './dub-map.json';
import type {SceneId} from './script';

export const FPS = 30;
export const MIN_FRAMES = 8 * 60 * FPS; // 14.400 frames = 8 menit minimum mutlak

export interface SceneMeta {
  id: SceneId;
  title: string;
  plannedSec: number;
  out: number;
  live?: boolean;
}

export const SCENES: readonly SceneMeta[] = [
  {id: 'S01A', title: '1. Opening Live-Action', plannedSec: 40, out: 0, live: true},
  {id: 'S01B', title: '1. Masuk Dunia Kimia Pixel', plannedSec: 30, out: 24},
  {id: 'S02', title: '2. Identifikasi Masalah', plannedSec: 65, out: 24},
  {id: 'S03', title: '3. Ketepatan Konsep Kimia', plannedSec: 80, out: 24},
  {id: 'S04', title: '4. Penerapan & Analisis', plannedSec: 100, out: 24},
  {id: 'S05', title: '5. Produk / Solusi Proyek', plannedSec: 60, out: 24},
  {id: 'S06', title: '6. Kreativitas, Data & Bukti', plannedSec: 95, out: 24},
  {id: 'S07', title: '7. Referensi & Komunikasi Ilmiah', plannedSec: 60, out: 24},
  {id: 'S08', title: '8. Kontribusi Seluruh Anggota', plannedSec: 40, out: 24},
  {id: 'S09', title: '9. Penutup & Keselamatan', plannedSec: 49, out: 0},
] as const;

export interface DubLineEntry {
  lineId: string;
  scene: SceneId;
  speaker: string;
  text: string;
  file: string | null;
  hasAudio: boolean;
  startSec: number;
  endSec: number;
  durationSec: number;
}

export const dubMap = dubMapJson as Record<string, DubLineEntry>;

export const dubEndSec = (sceneId: SceneId): number => {
  const entries = Object.values(dubMap).filter((d) => d.scene === sceneId);
  if (entries.length === 0) return 0;
  return Math.max(...entries.map((d) => d.endSec));
};

export const sceneFrames = (s: SceneMeta): number => {
  const fromJson = (durationsJson as {scenes?: Record<string, {frames: number}>}).scenes?.[s.id]?.frames;
  if (fromJson) return fromJson;
  return Math.max(Math.round(s.plannedSec * FPS), Math.ceil((dubEndSec(s.id) + 1.0) * FPS));
};

export const sceneDurationFrames = (id: SceneId): number => {
  const found = SCENES.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown scene ${id}`);
  return sceneFrames(found);
};

export const computeTotalFrames = (): number =>
  SCENES.reduce((acc, s) => acc + sceneFrames(s) - s.out, 0);

export const getSceneStartFrame = (id: SceneId): number => {
  let cursor = 0;
  for (const s of SCENES) {
    if (s.id === id) return cursor;
    cursor += sceneFrames(s) - s.out;
  }
  return cursor;
};

export const getSceneDubRangesFrames = (sceneId: SceneId): [number, number][] => {
  return Object.values(dubMap)
    .filter((d) => d.scene === sceneId)
    .map((d) => [Math.round(d.startSec * FPS), Math.round(d.endSec * FPS)]);
};

export const getGlobalDubRangesFrames = (): [number, number][] => {
  const ranges: [number, number][] = [];
  for (const s of SCENES) {
    const startFrame = getSceneStartFrame(s.id);
    if (s.live) {
      // Live action dialogue window spans the full intro recording minus lead-out pad
      const s01aLen = sceneFrames(s);
      ranges.push([startFrame + 6, Math.max(startFrame + 10, startFrame + s01aLen - 15)]);
      continue;
    }
    for (const [a, b] of getSceneDubRangesFrames(s.id)) {
      ranges.push([startFrame + a, startFrame + b]);
    }
  }
  return ranges;
};
