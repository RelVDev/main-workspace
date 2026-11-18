import type {SfxCue} from '../../audio/SfxLayer';
import {lineStartSec} from '../../lib/seconds';

export const S08_SFX: SfxCue[] = [
  {id: 'AMB_OFFICE', t: 0, dur: 40, vol: 0.13, loop: true},
  {id: 'PAPER_SLIDE', t: 1.2, dur: 0.5, vol: 0.38},
  {id: 'CARD_WHOOSH', t: lineStartSec('S08_L02', -0.2), dur: 0.36, vol: 0.35},
  ...Array.from({length: 9}, (_, i) => ({
    id: 'UI_POP',
    t: lineStartSec('S08_L02', 0.5 + i * 1.4),
    dur: 0.18,
    vol: 0.34,
  })),
  {id: 'ZOOM_WHOOSH', t: lineStartSec('S08_L03', 0), dur: 0.55, vol: 0.34},
  {id: 'JAR_PLACE', t: lineStartSec('S08_L03', 0.5), dur: 0.4, vol: 0.42},
  {id: 'WICK_PLACE', t: lineStartSec('S08_L03', 2.0), dur: 0.35, vol: 0.42},
  {id: 'CAMERA_SHUTTER', t: lineStartSec('S08_L03', 4.0), dur: 0.3, vol: 0.42},
  {id: 'HIGH_FIVE_CLAP', t: lineStartSec('S08_L03', 6.8), dur: 0.35, vol: 0.52},
  {id: 'TEAM_CHIME', t: lineStartSec('S08_L03', 7.0), dur: 1.0, vol: 0.45},
  {id: 'TR_LIGHT_FLASH', t: 38.4, dur: 0.8, vol: 0.52},
];
