import type {SfxCue} from '../../audio/SfxLayer';
import {lineStartSec} from '../../lib/seconds';

export const S02_SFX: SfxCue[] = [
  {id: 'AMB_KITCHEN', t: 0, dur: 24, vol: 0.12, loop: true},
  {id: 'SIZZLE', t: lineStartSec('S02_L02', 0), dur: 5.5, vol: 0.42},
  {id: 'UI_POP', t: lineStartSec('S02_L02', 1.2), dur: 0.2, vol: 0.35},
  {id: 'UI_POP', t: lineStartSec('S02_L02', 2.6), dur: 0.2, vol: 0.35},
  {id: 'UI_POP', t: lineStartSec('S02_L02', 4.0), dur: 0.2, vol: 0.35},
  {id: 'STEP_WOOD', t: lineStartSec('S02_L03', 0.2), dur: 0.15, vol: 0.3},
  {id: 'OIL_POUR', t: lineStartSec('S02_L03', 1.2), dur: 3.0, vol: 0.55},
  {id: 'OIL_DRAIN_GLUG', t: lineStartSec('S02_L03', 2.4), dur: 2.0, vol: 0.5},
  {id: 'UI_ERROR', t: lineStartSec('S02_L03', 4.5), dur: 0.35, vol: 0.5},
  {id: 'TR_WHOOSH', t: lineStartSec('S02_L04', -0.2), dur: 0.5, vol: 0.4},
  {id: 'AMB_WATER_UNDER', t: lineStartSec('S02_L04', 0), dur: 22, vol: 0.12, loop: true},
  {id: 'BUBBLES_LOOP', t: lineStartSec('S02_L04', 1.0), dur: 12.0, vol: 0.2, loop: true},
  {id: 'WARNING_BEEP', t: lineStartSec('S02_L04', 4.5), dur: 0.5, vol: 0.35},
  {id: 'HEAT_SHIMMER', t: lineStartSec('S02_L06', 0.5), dur: 2.0, vol: 0.3},
  {id: 'AMB_KITCHEN', t: lineStartSec('S02_L07', 0), dur: 27, vol: 0.12, loop: true},
  {id: 'EMOTE_QUESTION', t: lineStartSec('S02_L07', 1.0), dur: 0.4, vol: 0.5},
  {id: 'EMOTE_IDEA', t: lineStartSec('S02_L08', 0.5), dur: 0.7, vol: 0.5},
  {id: 'STEP_WOOD', t: lineStartSec('S02_L09', 0.2), dur: 0.15, vol: 0.3},
  {id: 'TR_LIGHT_FLASH', t: lineStartSec('S02_L09', 2.4), dur: 0.7, vol: 0.5},
];
