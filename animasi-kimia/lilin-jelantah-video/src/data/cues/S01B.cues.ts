import type {SfxCue} from '../../audio/SfxLayer';
import {lineStartSec} from '../../lib/seconds';

export const S01B_SFX: SfxCue[] = [
  {id: 'AMB_STAGE', t: 0, dur: 32, vol: 0.12, loop: true},
  {id: 'HAND_UNCOVER_RUSTLE', t: 0.3, dur: 1.0, vol: 0.6},
  {id: 'PORTAL_SHIMMER_SWELL', t: 0.6, dur: 2.8, vol: 0.7},
  {id: 'UI_DING_SPARKLE', t: 1.8, dur: 1.0, vol: 0.5},
  {id: 'TR_CURTAIN', t: 6.0, dur: 1.4, vol: 0.6},
  ...Array.from({length: 8}, (_, i) => ({
    id: 'UI_POP',
    t: 6.4 + i * 0.4,
    dur: 0.2,
    vol: 0.35,
  })),
  {id: 'UI_ACHIEVE', t: lineStartSec('S01B_L02', 0.2), dur: 1.2, vol: 0.5},
  {id: 'JUMP', t: lineStartSec('S01B_L02', 0.2), dur: 0.25, vol: 0.28},
  {id: 'JUMP', t: lineStartSec('S01B_L02', 0.3), dur: 0.25, vol: 0.25},
  {id: 'TR_IRIS', t: lineStartSec('S01B_L04', 2.5), dur: 0.6, vol: 0.5},
];
