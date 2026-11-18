import type {SfxCue} from '../../audio/SfxLayer';
import {lineStartSec} from '../../lib/seconds';

export const S08_SFX: SfxCue[] = [
  {id: 'AMB_OFFICE', t: 0, dur: 40, vol: 0.1, loop: true},
  {id: 'PAPER_SLIDE', t: 1.5, dur: 0.5, vol: 0.35},
  ...Array.from({length: 9}, (_, i) => ({
    id: 'UI_POP',
    t: lineStartSec('S08_L02', 0.5 + i * 1.4),
    dur: 0.18,
    vol: 0.3,
  })),
  {id: 'JAR_PLACE', t: lineStartSec('S08_L03', 0.5), dur: 0.4, vol: 0.4},
  {id: 'WICK_PLACE', t: lineStartSec('S08_L03', 2.0), dur: 0.35, vol: 0.4},
  {id: 'CAMERA_SHUTTER', t: lineStartSec('S08_L03', 4.0), dur: 0.3, vol: 0.4},
  {id: 'HIGH_FIVE_CLAP', t: lineStartSec('S08_L03', 7.0), dur: 0.35, vol: 0.5},
  {id: 'TR_LIGHT_FLASH', t: 38.5, dur: 0.7, vol: 0.55},
];
