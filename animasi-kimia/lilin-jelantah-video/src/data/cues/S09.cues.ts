import type {SfxCue} from '../../audio/SfxLayer';
import {lineStartSec} from '../../lib/seconds';

export const S09_SFX: SfxCue[] = [
  {id: 'AMB_NIGHT_ROOFTOP', t: 0, dur: 49, vol: 0.14, loop: true},
  ...['S09_L01', 'S09_L02', 'S09_L03', 'S09_L04', 'S09_L05', 'S09_L06', 'S09_L07', 'S09_L08', 'S09_L09'].map(
    (lid) => ({
      id: 'UI_BLIP',
      t: lineStartSec(lid, 0),
      dur: 0.15,
      vol: 0.28,
    }),
  ),
  {id: 'MATCH_STRIKE', t: lineStartSec('S09_L05', 0.4), dur: 0.8, vol: 0.5},
  {id: 'FLAME_IGNITE', t: lineStartSec('S09_L05', 1.1), dur: 0.9, vol: 0.55},
  {id: 'FLAME_LOOP', t: lineStartSec('S09_L05', 1.6), dur: 15, vol: 0.13, loop: true},
  {id: 'ZOOM_WHOOSH', t: lineStartSec('S09_L10', -0.2), dur: 0.55, vol: 0.36},
  {id: 'JUMP', t: lineStartSec('S09_L10', 0.2), dur: 0.25, vol: 0.3},
  {id: 'TEAM_CHIME', t: lineStartSec('S09_L10', 0.25), dur: 1.2, vol: 0.52},
  {id: 'PORTAL_SHIMMER_SWELL', t: lineStartSec('S09_L10', 0.8), dur: 2.6, vol: 0.4},
  {id: 'UI_SPARKLE_CHIME', t: 37.5, dur: 0.8, vol: 0.42},
];
