export interface LipSyncData {
  lineId: string;
  fps: number;
  speechStart: number;
  speechEnd: number;
  mouth: number[];
}

// Diisi otomatis oleh scripts/analyze-dub.ts saat file WAV dubbing ditambahkan ke public/dub/
export const LIPSYNC_TRACKS: Record<string, LipSyncData> = {

};
