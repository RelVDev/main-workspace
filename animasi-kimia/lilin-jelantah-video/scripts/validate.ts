import fs from 'node:fs';
import path from 'node:path';
import {PROJECT_ROOT} from './lib/ffmpeg-path';
import {MASTER_PALETTE} from '../src/data/palette';
import {SCRIPT_LINES} from '../src/data/script';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const bright = Math.max(l1, l2);
  const dark = Math.min(l1, l2);
  return (bright + 0.05) / (dark + 0.05);
}

function main() {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validate durations >= 14,400 frames (8 minutes)
  const durationsPath = path.join(PROJECT_ROOT, 'src/data/durations.json');
  if (!fs.existsSync(durationsPath)) {
    errors.push('src/data/durations.json belum ada. Jalankan analyze-dub.ts.');
  } else {
    const dur = JSON.parse(fs.readFileSync(durationsPath, 'utf8'));
    if (dur.totalFrames < 14400) {
      errors.push(`Durasi total ${dur.totalFrames} frame < batas minimum 14.400 frame (8:00).`);
    }
    console.log(`[OK] Durasi net: ${dur.totalFrames} frames (${dur.totalSeconds}s).`);
  }

  // 2. Validate master palette <= 32 colors
  if (MASTER_PALETTE.length > 32) {
    errors.push(`Master palette melebihi 32 warna (${MASTER_PALETTE.length}).`);
  } else {
    console.log(`[OK] Master palette: ${MASTER_PALETTE.length} warna.`);
  }

  // 3. Validate nameplate contrast against ink (#1B1020) or cream (#FFF3DC)
  const charsPath = path.join(PROJECT_ROOT, 'src/data/characters.json');
  const chars = JSON.parse(fs.readFileSync(charsPath, 'utf8')) as Record<
    string,
    {displayName: string; accentColor: string}
  >;
  for (const [id, ch] of Object.entries(chars)) {
    const ratioDark = contrastRatio(ch.accentColor, '#1B1020');
    const ratioLight = contrastRatio(ch.accentColor, '#FFF3DC');
    const best = Math.max(ratioDark, ratioLight);
    if (best < 4.5) {
      errors.push(
        `Kontras nameplate ${id} (${ch.accentColor}) hanya ${best.toFixed(2)}:1 (< 4.5:1).`,
      );
    }
  }

  // 4. Content rules check on script
  for (const line of SCRIPT_LINES) {
    if (/(?<!tidak\s+)berubah\s+menjadi\s+parafin/i.test(line.text)) {
      errors.push(`Pelanggaran aturan kimia pada ${line.id}: menyebut jelantah berubah menjadi parafin!`);
    }
  }

  // 5. Check SFX files referenced vs public/sfx
  const sfxDir = path.join(PROJECT_ROOT, 'public/sfx');
  const sfxCount = fs.existsSync(sfxDir)
    ? fs.readdirSync(sfxDir).filter((f) => f.endsWith('.wav') || f.endsWith('.mp3')).length
    : 0;
  console.log(`[INFO] SFX lokal tersedia: ${sfxCount} file.`);

  // 6. Check BGM files
  const musicDir = path.join(PROJECT_ROOT, 'public/music');
  const bgmCount = fs.existsSync(musicDir)
    ? fs.readdirSync(musicDir).filter((f) => f.endsWith('.wav') || f.endsWith('.mp3')).length
    : 0;
  console.log(`[INFO] BGM lokal tersedia: ${bgmCount} file.`);

  // 7. Check character sprite folders
  const charSpritesDir = path.join(PROJECT_ROOT, 'public/sprites/characters');
  for (const id of Object.keys(chars)) {
    const dir = path.join(charSpritesDir, id);
    if (!fs.existsSync(dir)) {
      warnings.push(`Folder sprite karakter belum ada: public/sprites/characters/${id}`);
    }
  }

  if (warnings.length > 0) {
    console.log('\nWarnings:');
    for (const w of warnings) console.log(`  - ${w}`);
  }
  if (errors.length > 0) {
    console.error('\nValidation FAILED:');
    for (const e of errors) console.error(`  x ${e}`);
    process.exit(1);
  }
  console.log('\n[PASS] Validasi proyek berhasil!');
}

main();
