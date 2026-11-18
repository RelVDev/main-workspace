import type {SfxCue} from '../../audio/SfxLayer';
import {lineStartSec} from '../../lib/seconds';

export const S07_SFX: SfxCue[] = [
  {id: 'AMB_LIBRARY', t: 0, dur: 69, vol: 0.1, loop: true},
  {id: 'LADDER_CREAK', t: 0.5, dur: 0.9, vol: 0.35},
  {id: 'UI_CONFIRM', t: 1.2, dur: 0.3, vol: 0.4},
  {id: 'PAGE_TURN', t: lineStartSec('S07_L02', 0.5), dur: 0.5, vol: 0.35},
  {id: 'PAGE_TURN', t: lineStartSec('S07_L02', 4.0), dur: 0.5, vol: 0.35},
  {id: 'PAGE_TURN', t: lineStartSec('S07_L03', 0.5), dur: 0.5, vol: 0.35},
  {id: 'PAGE_TURN', t: lineStartSec('S07_L03', 5.0), dur: 0.5, vol: 0.35},
  {id: 'BOOK_THUD', t: lineStartSec('S07_L04', 0.5), dur: 0.45, vol: 0.4},
  {id: 'PAGE_TURN', t: lineStartSec('S07_L05', 0.5), dur: 0.5, vol: 0.35},
  {id: 'PAPER_SLIDE', t: lineStartSec('S07_L06', 1.0), dur: 0.5, vol: 0.35},
  {id: 'UI_ACHIEVE', t: lineStartSec('S07_L06', 4.5), dur: 1.2, vol: 0.45},
];
