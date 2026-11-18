import type {SfxCue} from '../../audio/SfxLayer';
import {lineStartSec} from '../../lib/seconds';

export const S03_SFX: SfxCue[] = [
  {id: 'AMB_LAB', t: 0, dur: 93, vol: 0.12, loop: true},
  {id: 'UI_POP', t: 0.5, dur: 0.2, vol: 0.35},
  {id: 'CHALK_SCRIBBLE', t: lineStartSec('S03_L02', 0.3), dur: 1.4, vol: 0.3},
  {id: 'MOLECULE_SNAP', t: lineStartSec('S03_L02', 2.0), dur: 0.3, vol: 0.5},
  {id: 'MOLECULE_SNAP', t: lineStartSec('S03_L02', 3.8), dur: 0.3, vol: 0.5},
  {id: 'MOLECULE_SNAP', t: lineStartSec('S03_L02', 5.6), dur: 0.3, vol: 0.5},
  {id: 'MOLECULE_JIGGLE', t: lineStartSec('S03_L03', 1.2), dur: 3.0, vol: 0.2},
  {id: 'STRAINER_DRIP', t: lineStartSec('S03_L03', 4.5), dur: 2.5, vol: 0.4},
  {id: 'UI_ERROR', t: lineStartSec('S03_L04', 2.0), dur: 0.4, vol: 0.6},
  {id: 'WAX_MELT', t: lineStartSec('S03_L05', 1.0), dur: 3.5, vol: 0.4},
  {id: 'SPOON_STIR', t: lineStartSec('S03_L05', 4.0), dur: 2.5, vol: 0.3},
  {id: 'JAR_POUR', t: lineStartSec('S03_L05', 6.5), dur: 2.5, vol: 0.45},
  {id: 'COOL_CRYSTAL', t: lineStartSec('S03_L05', 9.0), dur: 2.0, vol: 0.4},
  {id: 'UI_TAG_FISIKA', t: lineStartSec('S03_L05', 10.2), dur: 0.7, vol: 0.6},
  {id: 'MATCH_STRIKE', t: lineStartSec('S03_L06', 0.6), dur: 0.8, vol: 0.55},
  {id: 'FLAME_IGNITE', t: lineStartSec('S03_L06', 1.3), dur: 0.9, vol: 0.6},
  {id: 'FLAME_LOOP', t: lineStartSec('S03_L06', 2.0), dur: 12.0, vol: 0.18, loop: true},
  {id: 'O2_SWIRL', t: lineStartSec('S03_L06', 4.5), dur: 2.0, vol: 0.35},
  {id: 'UI_TAG_KIMIA', t: lineStartSec('S03_L06', 6.5), dur: 0.7, vol: 0.6},
  {id: 'UI_CONFIRM', t: lineStartSec('S03_L07', 1.0), dur: 0.3, vol: 0.4},
  {id: 'UI_CONFIRM', t: lineStartSec('S03_L07', 2.2), dur: 0.3, vol: 0.4},
  {id: 'UI_CONFIRM', t: lineStartSec('S03_L07', 3.4), dur: 0.3, vol: 0.4},
  {id: 'UI_CONFIRM', t: lineStartSec('S03_L07', 4.6), dur: 0.3, vol: 0.4},
  {id: 'TR_WHIP', t: lineStartSec('S03_L07', 7.0), dur: 0.4, vol: 0.5},
];
