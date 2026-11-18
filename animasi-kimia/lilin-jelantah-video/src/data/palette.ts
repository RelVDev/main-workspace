// ASSUMPTION: Derived from PLAN.md Section 4.2 starting hexes (reference/style-frame.png not supplied).
// Strictly 32 master colors + up to 6 per-character colors in characters.json.

export const MASTER_PALETTE = [
  '#1B1020', // 00 ink / deepest plum outline
  '#2A1530', // 01 deep plum shadow
  '#3D1C42', // 02 mid plum
  '#4E1A3C', // 03 dark magenta curtain shadow
  '#6B1F4A', // 04 velvet burgundy
  '#8A2A4A', // 05 warm maroon
  '#B23A5A', // 06 rose crimson
  '#D94E52', // 07 alert red
  '#5A3418', // 08 dark wood
  '#7A4A22', // 09 mid wood
  '#A06834', // 10 light wood / cork
  '#C98A5E', // 11 warm tan / HAND_FILL default
  '#C46A2C', // 12 deep amber / used oil
  '#F08A3C', // 13 vibrant amber-orange
  '#FFB25A', // 14 golden amber / fresh oil
  '#FFD97D', // 15 pale gold / flame inner
  '#FFF3DC', // 16 cream highlight / rim light
  '#F6D9C4', // 17 light warm skin
  '#DFAC8B', // 18 medium warm skin
  '#F4A3B0', // 19 blush pink
  '#153243', // 20 deep navy-teal
  '#1E4D5C', // 21 dark teal / river
  '#2C7A7B', // 22 mid teal / lab board
  '#4FD1C5', // 23 bright teal / FISIKA / orb
  '#9FF3EE', // 24 pale cyan / orb core
  '#2F6B4F', // 25 eco dark green
  '#52A86D', // 26 eco green
  '#4A5568', // 27 slate metal
  '#718096', // 28 steel gray
  '#CBD5E0', // 29 light silver / glass
  '#F7FAFC', // 30 crisp off-white / lab coat / wax
  '#100A14', // 31 void plum-black
] as const;

export const PALETTE = {
  ink: '#1B1020',
  void: '#100A14',
  plumDeep: '#2A1530',
  plumMid: '#3D1C42',
  magentaDark: '#4E1A3C',
  burgundy: '#6B1F4A',
  maroon: '#8A2A4A',
  crimson: '#B23A5A',
  red: '#D94E52',
  woodDark: '#5A3418',
  woodMid: '#7A4A22',
  woodLight: '#A06834',
  tan: '#C98A5E',
  amberDeep: '#C46A2C',
  amber: '#F08A3C',
  gold: '#FFB25A',
  goldPale: '#FFD97D',
  cream: '#FFF3DC',
  skinLight: '#F6D9C4',
  skinMed: '#DFAC8B',
  blush: '#F4A3B0',
  navy: '#153243',
  tealDark: '#1E4D5C',
  tealMid: '#2C7A7B',
  teal: '#4FD1C5',
  cyan: '#9FF3EE',
  greenDark: '#2F6B4F',
  green: '#52A86D',
  slate: '#4A5568',
  steel: '#718096',
  silver: '#CBD5E0',
  white: '#F7FAFC',
} as const;
