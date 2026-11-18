import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {FFMPEG_BIN, PROJECT_ROOT} from './lib/ffmpeg-path';

// Normalizes any raw SFX placed in public/sfx/_raw/<ID>.* to public/sfx/<ID>.wav (-3dB peak, trimmed silence).
function main() {
  const rawDir = path.join(PROJECT_ROOT, 'public/sfx/_raw');
  const outDir = path.join(PROJECT_ROOT, 'public/sfx');
  if (!fs.existsSync(rawDir)) return;

  const files = fs.readdirSync(rawDir).filter((f) => /\.(wav|mp3|ogg|m4a)$/i.test(f));
  if (files.length === 0) {
    console.log('No raw SFX in public/sfx/_raw/ to process.');
    return;
  }

  for (const f of files) {
    const id = f.replace(/\.[^.]+$/, '');
    const inPath = path.join(rawDir, f);
    const outPath = path.join(outDir, `${id}.wav`);
    execFileSync(FFMPEG_BIN, [
      '-y',
      '-i',
      inPath,
      '-af',
      'silenceremove=start_periods=1:start_threshold=-50dB,loudnorm=I=-16:TP=-3:LRA=11',
      '-ac',
      '1',
      '-ar',
      '48000',
      outPath,
    ]);
    console.log(`Processed raw SFX -> ${outPath}`);
  }
}

main();
