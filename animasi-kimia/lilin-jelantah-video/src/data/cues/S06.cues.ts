import type {SfxCue} from '../../audio/SfxLayer';
import {lineStartSec} from '../../lib/seconds';

export const S06_SFX: SfxCue[] = [
  {id: 'AMB_OBSERVATORY', t: 0, dur: 108, vol: 0.1, loop: true},
  {id: 'COUNTER_ROLL', t: lineStartSec('S06_L01', 1.0), dur: 3.0, vol: 0.35},
  {id: 'UI_CONFIRM', t: lineStartSec('S06_L01', 4.2), dur: 0.3, vol: 0.45},
  {id: 'BARREL_THUD', t: lineStartSec('S06_L02', 0.4), dur: 0.5, vol: 0.5},
  {id: 'BARREL_THUD', t: lineStartSec('S06_L02', 1.4), dur: 0.5, vol: 0.5},
  {id: 'BARREL_THUD', t: lineStartSec('S06_L02', 2.4), dur: 0.5, vol: 0.5},
  ...Array.from({length: 10}, (_, i) => ({
    id: 'DOT_POP',
    t: lineStartSec('S06_L03', 0.5 + i * 0.8),
    dur: 0.1,
    vol: 0.25,
  })),
  {id: 'UI_ACHIEVE', t: lineStartSec('S06_L03', 9.0), dur: 1.2, vol: 0.5},
  {id: 'UI_BLIP', t: lineStartSec('S06_L04', 1.0), dur: 0.2, vol: 0.3},
  {id: 'UI_BLIP', t: lineStartSec('S06_L04', 2.5), dur: 0.2, vol: 0.3},
  {id: 'UI_BLIP', t: lineStartSec('S06_L04', 4.0), dur: 0.2, vol: 0.3},
  {id: 'UI_CARD_FLIP', t: lineStartSec('S06_L05', 1.0), dur: 0.35, vol: 0.45},
  {id: 'UI_CARD_FLIP', t: lineStartSec('S06_L05', 4.5), dur: 0.35, vol: 0.45},
  {id: 'UI_CARD_FLIP', t: lineStartSec('S06_L05', 8.0), dur: 0.35, vol: 0.45},
  {id: 'UI_TAG_FISIKA', t: lineStartSec('S06_L06', 0.8), dur: 0.6, vol: 0.45},
  {id: 'UI_TAG_KIMIA', t: lineStartSec('S06_L06', 3.5), dur: 0.6, vol: 0.45},
  {id: 'HIGH_FIVE_CLAP', t: lineStartSec('S06_L08', 2.0), dur: 0.35, vol: 0.5},
  {id: 'TR_WHOOSH', t: lineStartSec('S06_L09', 2.0), dur: 0.5, vol: 0.4},
];
