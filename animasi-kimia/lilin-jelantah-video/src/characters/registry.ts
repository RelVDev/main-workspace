import charactersJson from '../data/characters.json';
import type {CharId, SpeakerId} from '../data/script';
import {PALETTE} from '../data/palette';

export interface CharacterMeta {
  id: CharId;
  displayName: string;
  accentColor: string;
  role: string;
  skin: string;
  hairStyle: string;
  hijab: boolean;
  glasses: boolean;
  outfitStyle: string;
  accessory: string;
  heightScale: number;
}

export const CHARACTERS = charactersJson as Record<CharId, CharacterMeta>;

export const ALL_CHAR_IDS: CharId[] = [
  'malika',
  'noya',
  'marsha',
  'ayuya',
  'lovyta',
  'farel',
  'sofi',
  'disa',
  'ais',
];

export const getSpeakerInfo = (speaker: SpeakerId): {name: string; color: string} => {
  if (speaker === 'semua') {
    return {name: 'Semua Anggota', color: PALETTE.gold};
  }
  const meta = CHARACTERS[speaker];
  return {name: meta.displayName, color: meta.accentColor};
};

function lum(hex: string): number {
  const clean = hex.replace('#', '');
  const vals = [0, 2, 4].map((i) => {
    const s = parseInt(clean.slice(i, i + 2), 16) / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * vals[0] + 0.7152 * vals[1] + 0.0722 * vals[2];
}

export const getAccentTextColor = (bgHex: string): string => {
  const lBg = lum(bgHex);
  const cDark = (Math.max(lBg, lum(PALETTE.ink)) + 0.05) / (Math.min(lBg, lum(PALETTE.ink)) + 0.05);
  const cLight = (Math.max(lBg, lum(PALETTE.cream)) + 0.05) / (Math.min(lBg, lum(PALETTE.cream)) + 0.05);
  return cDark >= cLight ? PALETTE.ink : PALETTE.cream;
};
