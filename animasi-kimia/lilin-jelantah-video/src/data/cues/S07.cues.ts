import type {SfxCue} from '../../audio/SfxLayer';
import {lineStartSec} from '../../lib/seconds';

export const S07_SFX: SfxCue[] = [
  {id: 'AMB_LIBRARY', t: 0, dur: 69, vol: 0.13, loop: true},
  {id: 'LADDER_CREAK', t: 0.5, dur: 0.9, vol: 0.36},
  {id: 'UI_CONFIRM', t: 1.2, dur: 0.3, vol: 0.42},
  {id: 'ZOOM_WHOOSH', t: lineStartSec('S07_L02', -0.2), dur: 0.55, vol: 0.32},
  {id: 'PAGE_TURN', t: lineStartSec('S07_L02', 0.5), dur: 0.5, vol: 0.4},
  {id: 'CARD_WHOOSH', t: lineStartSec('S07_L02', 2.2), dur: 0.36, vol: 0.32},
  {id: 'PAGE_TURN', t: lineStartSec('S07_L02', 4.0), dur: 0.5, vol: 0.4},
  {id: 'PAGE_TURN', t: lineStartSec('S07_L03', 0.5), dur: 0.5, vol: 0.4},
  {id: 'CARD_WHOOSH', t: lineStartSec('S07_L03', 3.0), dur: 0.36, vol: 0.32},
  {id: 'PAGE_TURN', t: lineStartSec('S07_L03', 5.0), dur: 0.5, vol: 0.4},
  {id: 'BOOK_THUD', t: lineStartSec('S07_L04', 0.5), dur: 0.45, vol: 0.44},
  {id: 'PAGE_TURN', t: lineStartSec('S07_L05', 0.5), dur: 0.5, vol: 0.4},
  {id: 'ZOOM_WHOOSH', t: lineStartSec('S07_L06', 0), dur: 0.55, vol: 0.34},
  {id: 'PAPER_SLIDE', t: lineStartSec('S07_L06', 1.0), dur: 0.5, vol: 0.4},
  {id: 'JAR_PLACE', t: lineStartSec('S07_L06', 2.6), dur: 0.3, vol: 0.38},
  {id: 'UI_SPARKLE_CHIME', t: lineStartSec('S07_L06', 4.5), dur: 0.8, vol: 0.48},
];
