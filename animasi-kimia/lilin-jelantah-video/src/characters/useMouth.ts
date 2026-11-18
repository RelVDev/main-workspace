import {random, useCurrentFrame, useVideoConfig} from 'remotion';
import {LIPSYNC_TRACKS} from '../data/lipsync';
import {dubMap} from '../data/timeline';

export type MouthShape = 'closed' | 'half' | 'open' | 'smile' | 'o';

export const useMouth = (
  lineId: string | undefined,
  explicitMouth: MouthShape | 'auto' = 'auto',
): MouthShape => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  if (explicitMouth !== 'auto') return explicitMouth;
  if (!lineId) return 'closed';

  const entry = dubMap[lineId];
  if (!entry) return 'closed';

  const startFrame = Math.round(entry.startSec * fps);
  const endFrame = Math.round(entry.endSec * fps);
  if (frame < startFrame || frame > endFrame) return 'closed';

  const track = LIPSYNC_TRACKS[lineId];
  if (track) {
    const idx = Math.floor(((frame - startFrame) / fps) * track.fps);
    const val = track.mouth[idx] ?? 0;
    return (['closed', 'half', 'open'] as const)[val] ?? 'closed';
  }

  // Placeholder mode (PLAN 5.4): deterministic seeded mouth movement at ~7.5 Hz
  const bucket = Math.floor((frame - startFrame) / 4);
  const r = random(`mouth-${lineId}-${bucket}`);
  if (r < 0.22) return 'closed';
  if (r < 0.52) return 'half';
  if (r < 0.88) return 'open';
  return 'o';
};
