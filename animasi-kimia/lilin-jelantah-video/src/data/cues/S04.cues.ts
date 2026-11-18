import type {SfxCue} from '../../audio/SfxLayer';
import {lineStartSec} from '../../lib/seconds';

export const S04_SFX: SfxCue[] = [
  {id: 'AMB_WORKSHOP', t: 0, dur: 14, vol: 0.12, loop: true},
  {id: 'UI_CONFIRM', t: 1.5, dur: 0.3, vol: 0.4},
  {id: 'UI_CONFIRM', t: 3.5, dur: 0.3, vol: 0.4},
  {id: 'UI_CONFIRM', t: 5.5, dur: 0.3, vol: 0.4},
  {id: 'UI_CONFIRM', t: 7.5, dur: 0.3, vol: 0.4},
  {id: 'SOFA_SIT', t: 11.0, dur: 0.6, vol: 0.35},
  {id: 'AMB_CINEMA_ROOM', t: 14.0, dur: 87, vol: 0.12, loop: true},
  {id: 'TV_ON', t: 17.0, dur: 0.9, vol: 0.5},
  {id: 'CRT_STATIC_POP', t: lineStartSec('S04_L02', 0), dur: 0.4, vol: 0.5},
  {id: 'UI_TAG_FISIKA', t: lineStartSec('S04_L02', 4.0), dur: 0.7, vol: 0.6},
  {id: 'CRT_STATIC_POP', t: lineStartSec('S04_L03', 0), dur: 0.4, vol: 0.5},
  {id: 'EMOTE_EXCLAIM', t: lineStartSec('S04_L03', 5.0), dur: 0.3, vol: 0.4},
  {id: 'CRT_STATIC_POP', t: lineStartSec('S04_L04', 0), dur: 0.4, vol: 0.5},
  {id: 'COOL_CRYSTAL', t: lineStartSec('S04_L04', 3.0), dur: 1.8, vol: 0.3},
  {id: 'UI_TAG_FISIKA', t: lineStartSec('S04_L04', 5.0), dur: 0.7, vol: 0.6},
  {id: 'CRT_STATIC_POP', t: lineStartSec('S04_L05', 0), dur: 0.4, vol: 0.5},
  {id: 'UI_TAG_KIMIA', t: lineStartSec('S04_L05', 4.5), dur: 0.7, vol: 0.6},
  {id: 'UI_CARD_FLIP', t: lineStartSec('S04_L06', 1.0), dur: 0.35, vol: 0.45},
  {id: 'UI_CARD_FLIP', t: lineStartSec('S04_L06', 4.0), dur: 0.35, vol: 0.45},
  {id: 'UI_CARD_FLIP', t: lineStartSec('S04_L06', 7.0), dur: 0.35, vol: 0.45},
  {id: 'CAMERA_SHUTTER', t: lineStartSec('S04_L06', 10.5), dur: 0.3, vol: 0.35},
  {id: 'TR_CURTAIN', t: lineStartSec('S04_L07', 0.5), dur: 1.4, vol: 0.6},
];
