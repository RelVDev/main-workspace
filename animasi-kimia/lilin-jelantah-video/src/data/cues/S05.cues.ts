import type {SfxCue} from '../../audio/SfxLayer';
import {lineStartSec} from '../../lib/seconds';

export const S05_SFX: SfxCue[] = [
  {id: 'AMB_SHOWROOM', t: 0, dur: 60, vol: 0.12, loop: true},
  {id: 'TR_CURTAIN', t: 0.2, dur: 1.4, vol: 0.52},
  {id: 'TEAM_CHIME', t: 0.8, dur: 1.2, vol: 0.5},
  {id: 'UI_POP', t: lineStartSec('S05_L02', 0.3), dur: 0.2, vol: 0.35},
  {id: 'UI_POP', t: lineStartSec('S05_L02', 1.4), dur: 0.2, vol: 0.35},
  {id: 'UI_POP', t: lineStartSec('S05_L02', 2.5), dur: 0.2, vol: 0.35},
  {id: 'UI_SPARKLE_CHIME', t: lineStartSec('S05_L02', 4.3), dur: 0.6, vol: 0.48},
  {id: 'CARD_WHOOSH', t: lineStartSec('S05_L03', 0), dur: 0.36, vol: 0.34},
  {id: 'UI_BLIP', t: lineStartSec('S05_L03', 0.5), dur: 0.2, vol: 0.32},
  {id: 'UI_BLIP', t: lineStartSec('S05_L04', 0.5), dur: 0.2, vol: 0.32},
  {id: 'ZOOM_WHOOSH', t: lineStartSec('S05_L05', 0), dur: 0.55, vol: 0.38},
  {id: 'EMOTE_HEART', t: lineStartSec('S05_L05', 0.8), dur: 0.5, vol: 0.45},
  {id: 'ZOOM_WHOOSH', t: lineStartSec('S05_L06', -0.2), dur: 0.55, vol: 0.34},
  {id: 'WARNING_BEEP', t: lineStartSec('S05_L06', 0.5), dur: 0.4, vol: 0.48},
  {id: 'STAMP', t: lineStartSec('S05_L06', 2.8), dur: 0.35, vol: 0.55},
  {id: 'WARNING_BEEP', t: lineStartSec('S05_L07', 0.5), dur: 0.4, vol: 0.48},
  {id: 'STAMP', t: lineStartSec('S05_L07', 1.2), dur: 0.35, vol: 0.55},
  {id: 'MATCH_STRIKE', t: lineStartSec('S05_L08', 0.2), dur: 0.8, vol: 0.5},
  {id: 'FLAME_IGNITE', t: lineStartSec('S05_L08', 0.9), dur: 0.9, vol: 0.52},
  {id: 'FLAME_LOOP', t: lineStartSec('S05_L08', 1.5), dur: 6.0, vol: 0.16, loop: true},
  {id: 'UI_DING_SPARKLE', t: lineStartSec('S05_L08', 2.0), dur: 0.8, vol: 0.42},
  {id: 'TR_LIGHT_FLASH', t: 58.5, dur: 0.8, vol: 0.5},
];
