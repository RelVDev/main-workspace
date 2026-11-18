import type {SfxCue} from '../../audio/SfxLayer';

// Opening S01A memakai audio rekaman live-action asli (F00_intro.mp4),
// sehingga SFX hanya berupa aksen halus perpindahan segmen perkenalan & pengantar keluar ke dunia pixel.
export const S01A_SFX: SfxCue[] = [
  {id: 'UI_SPARKLE_CHIME', t: 0.2, dur: 0.6, vol: 0.22},
  {id: 'CARD_WHOOSH', t: 9.6, dur: 0.35, vol: 0.24},
  {id: 'CARD_WHOOSH', t: 26.3, dur: 0.35, vol: 0.24},
  {id: 'CARD_WHOOSH', t: 42.5, dur: 0.35, vol: 0.24},
  {id: 'CARD_WHOOSH', t: 59.3, dur: 0.35, vol: 0.24},
];
