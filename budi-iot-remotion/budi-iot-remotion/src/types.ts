export type Scene = {
  id: number;
  text: string;
  /** detik: mulai kalimat diucapkan (dari SRT) */
  start: number;
  /** detik: selesai kalimat diucapkan (dari SRT) */
  end: number;
};

export type VideoProps = {
  scenes: Scene[];
  /** durasi narasi (detik) */
  narrationSec: number;
};

export const SCENE_COUNT = 30;
export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;
