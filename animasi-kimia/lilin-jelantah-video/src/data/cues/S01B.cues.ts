import type {SfxCue} from '../../audio/SfxLayer';
import {lineStartSec} from '../../lib/seconds';

export const S01B_SFX: SfxCue[] = [
  {id: 'AMB_STAGE', t: 0, dur: 32, vol: 0.14, loop: true},
  {id: 'PORTAL_SHIMMER_SWELL', t: 0.1, dur: 2.6, vol: 0.52},
  {id: 'UI_DING_SPARKLE', t: 1.6, dur: 1.0, vol: 0.45},
  {id: 'ZOOM_WHOOSH', t: 5.7, dur: 0.6, vol: 0.35},
  {id: 'TR_CURTAIN', t: 5.9, dur: 1.4, vol: 0.55},
  ...Array.from({length: 8}, (_, i) => ({
    id: 'UI_POP',
    t: 6.4 + i * 0.4,
    dur: 0.18,
    vol: 0.34,
  })),
  {id: 'TEAM_CHIME', t: lineStartSec('S01B_L02', 0.1), dur: 1.0, vol: 0.48},
  {id: 'JUMP', t: lineStartSec('S01B_L02', 0.15), dur: 0.25, vol: 0.28},
  {id: 'LAND', t: lineStartSec('S01B_L02', 1.05), dur: 0.2, vol: 0.22},
  {id: 'UI_SPARKLE_CHIME', t: lineStartSec('S01B_L03', 0.3), dur: 0.6, vol: 0.3},
  {id: 'ZOOM_WHOOSH', t: 24.0, dur: 0.6, vol: 0.32},
  {id: 'UI_DING_SPARKLE', t: 29.4, dur: 0.8, vol: 0.4},
  {id: 'TR_IRIS', t: lineStartSec('S01B_L04', 2.4), dur: 0.7, vol: 0.48},
];
