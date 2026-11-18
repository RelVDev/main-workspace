import type {SfxCue} from '../../audio/SfxLayer';
import {S01A_LIVE_LINES} from '../script';
import {META} from '../meta';

export const S01A_SFX: SfxCue[] = [
  ...S01A_LIVE_LINES.slice(1, 10).map((l) => ({
    id: 'UI_BLIP',
    t: l.startSec,
    dur: 0.2,
    vol: 0.3,
  })),
  {id: 'HAND_COVER_THUMP', t: META.coverAtSec, dur: 0.6, vol: 0.85},
  {id: 'PORTAL_SUB_RUMBLE', t: META.coverAtSec + 0.2, dur: 4.0, vol: 0.5},
  {id: 'TR_PIXEL_DISSOLVE', t: 38.8, dur: 1.1, vol: 0.4},
];
