// Pakai: node scripts/srt-to-timing.mjs narasi.srt [public/timing.json]
// Satu cue SRT = satu adegan (urut sama dengan naskah, total 30 kalimat).
import {existsSync, readFileSync, writeFileSync} from 'node:fs';

const [, , srtPath, outPath = 'public/timing.json'] = process.argv;
if (!srtPath) {
  console.error('Pakai: node scripts/srt-to-timing.mjs narasi.srt [public/timing.json]');
  process.exit(1);
}
const toSec = (s) => {
  const m = s.trim().match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if (!m) throw new Error(`Format waktu salah: ${s}`);
  return +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4].padEnd(3, '0').slice(0, 3) / 1000;
};
const raw = readFileSync(srtPath, 'utf8').replace(/\r/g, '').replace(/^\uFEFF/, '');
const scenes = [];
for (const block of raw.split(/\n\s*\n/)) {
  const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
  const ti = lines.findIndex((l) => l.includes('-->'));
  if (ti < 0) continue;
  const [a, b] = lines[ti].split('-->');
  scenes.push({
    id: scenes.length + 1,
    start: +toSec(a).toFixed(3),
    end: +toSec(b).toFixed(3),
    text: lines.slice(ti + 1).join(' '),
  });
}
let audioDurationSec;
if (existsSync(outPath)) {
  try {
    audioDurationSec = JSON.parse(readFileSync(outPath, 'utf8')).audioDurationSec;
  } catch {}
}
writeFileSync(
  outPath,
  JSON.stringify(
    {
      _catatan: 'Dibuat dari SRT. Satu entri = satu adegan; adegan berjalan dari start sampai start entri berikutnya.',
      audioDurationSec,
      scenes,
    },
    null,
    1,
  ),
);
console.log(`${scenes.length} adegan ditulis ke ${outPath}` + (scenes.length !== 30 ? '  (PERINGATAN: harus 30 adegan)' : ''));
