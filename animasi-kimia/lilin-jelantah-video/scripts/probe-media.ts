import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import {FFMPEG_BIN, FFPROBE_BIN, PROJECT_ROOT} from './lib/ffmpeg-path';

export interface FootageAnnotation {
  t0: number;
  t1: number;
  x: number;
  y: number;
  text: string;
  arrow?: 'left' | 'right' | 'up' | 'down';
}

export interface FootageEntry {
  id: string;
  title: string;
  scene: string;
  file: string;
  pix: string;
  present: boolean;
  durationSec: number;
  fps: number;
  hasAudio: boolean;
  use: {
    from: number;
    to: number;
    audio: 'mute' | 'duck' | 'full';
    playbackRate?: number;
  };
  annotations: FootageAnnotation[];
}

const DEFAULT_FOOTAGE: Record<string, FootageEntry> = {
  F00: {
    id: 'F00',
    title: 'Intro Live-Action & Transisi Tangan Malika',
    scene: 'S01A',
    file: 'footage/F00_intro.mp4',
    pix: 'footage/F00_ramp.mp4',
    present: false,
    durationSec: 40,
    fps: 30,
    hasAudio: true,
    use: {from: 0, to: 40, audio: 'full'},
    annotations: [],
  },
  F01: {
    id: 'F01',
    title: 'Penyaringan Minyak Jelantah',
    scene: 'S04',
    file: 'footage/F01_filtering.mp4',
    pix: 'footage/pix/F01_filtering_soft.mp4',
    present: false,
    durationSec: 14,
    fps: 30,
    hasAudio: false,
    use: {from: 0, to: 14, audio: 'mute'},
    annotations: [
      {t0: 1.0, t1: 5.0, x: 0.52, y: 0.50, text: 'Alat & minyak disiapkan untuk percobaan', arrow: 'left'},
      {t0: 6.0, t1: 12.5, x: 0.54, y: 0.56, text: 'Penakaran minyak ke gelas ukur', arrow: 'up'},
    ],
  },
  F02: {
    id: 'F02',
    title: 'Pemanasan & Peleburan Bahan Lilin',
    scene: 'S04',
    file: 'footage/F02_melting.mp4',
    pix: 'footage/pix/F02_melting_soft.mp4',
    present: false,
    durationSec: 8,
    fps: 30,
    hasAudio: false,
    use: {from: 0, to: 8, audio: 'mute'},
    annotations: [
      {t0: 1.0, t1: 6.5, x: 0.55, y: 0.45, text: 'Bahan lilin meleleh perlahan', arrow: 'left'},
    ],
  },
  F03: {
    id: 'F03',
    title: 'Pencampuran Jelantah + Bahan Lilin + Pewangi',
    scene: 'S04',
    file: 'footage/F03_mixing.mp4',
    pix: 'footage/pix/F03_mixing_soft.mp4',
    present: false,
    durationSec: 9,
    fps: 30,
    hasAudio: false,
    use: {from: 0, to: 9, audio: 'mute'},
    annotations: [
      {t0: 0.8, t1: 8.0, x: 0.5, y: 0.5, text: 'Campur minyak + essential oil + pewarna krayon', arrow: 'left'},
    ],
  },
  F04: {
    id: 'F04',
    title: 'Penuangan ke Wadah Bersumbu',
    scene: 'S04',
    file: 'footage/F04_pouring.mp4',
    pix: 'footage/pix/F04_pouring_soft.mp4',
    present: false,
    durationSec: 7.5,
    fps: 30,
    hasAudio: false,
    use: {from: 0, to: 7.5, audio: 'mute'},
    annotations: [
      {t0: 0.8, t1: 6.5, x: 0.52, y: 0.48, text: 'Tuang ke wadah kaca & rapikan penyangga sumbu', arrow: 'left'},
    ],
  },
  F05: {
    id: 'F05',
    title: 'Pendinginan & Pemadatan Lilin',
    scene: 'S04',
    file: 'footage/F05_cooling.mp4',
    pix: 'footage/pix/F05_cooling_soft.mp4',
    present: false,
    durationSec: 7,
    fps: 30,
    hasAudio: false,
    use: {from: 0, to: 7, audio: 'mute', playbackRate: 1},
    annotations: [
      {t0: 0.8, t1: 6.2, x: 0.5, y: 0.55, text: 'Mendingin & memadat (FISIKA)', arrow: 'up'},
    ],
  },
  F06: {
    id: 'F06',
    title: 'Produk Jadi Lilin Aromatis',
    scene: 'S05',
    file: 'footage/F06_product.mp4',
    pix: 'footage/pix/F06_product_soft.mp4',
    present: false,
    durationSec: 10,
    fps: 30,
    hasAudio: false,
    use: {from: 0, to: 10, audio: 'mute'},
    annotations: [],
  },
  F07: {
    id: 'F07',
    title: 'Demonstrasi Nyala Api Pembakaran & Produk Siap Uji',
    scene: 'S04',
    file: 'footage/F07_burn_test.mp4',
    pix: 'footage/pix/F07_burn_test_soft.mp4',
    present: false,
    durationSec: 12,
    fps: 30,
    hasAudio: false,
    use: {from: 0, to: 12, audio: 'mute'},
    annotations: [
      {t0: 0.5, t1: 4.5, x: 0.5, y: 0.35, text: 'Demonstrasi nyala api stabil (reaksi pembakaran)', arrow: 'left'},
      {t0: 4.8, t1: 11.5, x: 0.5, y: 0.45, text: 'Produk lilin ber-sumbu siap uji nyala dengan pengawasan', arrow: 'up'},
    ],
  },
  F08: {
    id: 'F08',
    title: 'Behind The Scenes Kerja Sama Tim',
    scene: 'S08',
    file: 'footage/F08_bts.mp4',
    pix: 'footage/pix/F08_bts_soft.mp4',
    present: false,
    durationSec: 16,
    fps: 30,
    hasAudio: false,
    use: {from: 0, to: 16, audio: 'mute'},
    annotations: [],
  },
  F09: {
    id: 'F09',
    title: 'Closing Live-Action Kelompok',
    scene: 'S09',
    file: 'footage/F09_closing.mp4',
    pix: 'footage/F09_closing.mp4',
    present: false,
    durationSec: 7,
    fps: 30,
    hasAudio: true,
    use: {from: 0, to: 7, audio: 'full'},
    annotations: [],
  },
};

function probeVideo(absPath: string) {
  const out = execFileSync(
    FFPROBE_BIN,
    [
      '-v',
      'error',
      '-show_entries',
      'format=duration:stream=codec_type,r_frame_rate',
      '-of',
      'json',
      absPath,
    ],
    {encoding: 'utf8'},
  );
  const parsed = JSON.parse(out) as {
    format?: {duration?: string};
    streams?: Array<{codec_type?: string; r_frame_rate?: string}>;
  };
  const durationSec = Number(parsed.format?.duration ?? 0);
  const vStream = parsed.streams?.find((s) => s.codec_type === 'video');
  const aStream = parsed.streams?.find((s) => s.codec_type === 'audio');
  let fps = 30;
  if (vStream?.r_frame_rate) {
    const [num, den] = vStream.r_frame_rate.split('/').map(Number);
    if (num && den) fps = Math.round((num / den) * 100) / 100;
  }
  return {durationSec, fps, hasAudio: Boolean(aStream)};
}

function readSinglePixelPng(pngBuf: Buffer): string | null {
  let offset = 8; // skip PNG signature
  const idatChunks: Buffer[] = [];
  let colorType = 2;
  while (offset + 12 <= pngBuf.length) {
    const len = pngBuf.readUInt32BE(offset);
    const type = pngBuf.toString('ascii', offset + 4, offset + 8);
    const data = pngBuf.subarray(offset + 8, offset + 8 + len);
    if (type === 'IHDR' && data.length >= 10) {
      colorType = data[9];
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + len;
  }
  if (idatChunks.length === 0) return null;
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  // raw[0] is PNG scanline filter byte; following bytes are R,G,B(,A)
  if (raw.length < 4) return null;
  if (colorType === 0) {
    const g = raw[1].toString(16).padStart(2, '0');
    return `#${g}${g}${g}`;
  }
  const r = raw[1].toString(16).padStart(2, '0');
  const g = raw[2].toString(16).padStart(2, '0');
  const b = raw[3].toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

function sampleAvgColors(absPath: string, durationSec: number): string[] {
  const colors: string[] = [];
  const sampleCount = Math.min(8, Math.max(3, Math.round(durationSec / 2)));
  for (let i = 0; i < sampleCount; i++) {
    const ts = Math.max(0.1, ((i + 0.5) / sampleCount) * durationSec);
    try {
      const png = execFileSync(FFMPEG_BIN, [
        '-v',
        'error',
        '-ss',
        ts.toFixed(2),
        '-i',
        absPath,
        '-frames:v',
        '1',
        '-vf',
        'scale=1:1:flags=area',
        '-c:v',
        'png',
        '-f',
        'image2pipe',
        'pipe:1',
      ]);
      const hex = readSinglePixelPng(png);
      if (hex) colors.push(hex);
    } catch {
      // ignore sample error
    }
  }
  return colors.length > 0 ? colors : ['#FFB25A'];
}

function main() {
  const footageJsonPath = path.join(PROJECT_ROOT, 'src/data/footage.json');
  const lightJsonPath = path.join(PROJECT_ROOT, 'src/data/footage-light.json');

  let existing: Record<string, FootageEntry> = {};
  if (fs.existsSync(footageJsonPath)) {
    existing = JSON.parse(fs.readFileSync(footageJsonPath, 'utf8'));
  }

  const footageDir = path.join(PROJECT_ROOT, 'public/footage');
  const pixDir = path.join(PROJECT_ROOT, 'public/footage/pix');
  const filesInDir = fs.existsSync(footageDir) ? fs.readdirSync(footageDir) : [];

  const result: Record<string, FootageEntry> = {};
  const lightResult: Record<string, string[]> = {
    F01: ['#C46A2C', '#F08A3C', '#FFB25A', '#F08A3C'],
    F02: ['#FFB25A', '#FFD97D', '#FFF3DC', '#FFB25A'],
    F03: ['#F08A3C', '#FFB25A', '#4FD1C5', '#FFB25A'],
    F04: ['#FFB25A', '#F08A3C', '#FFF3DC', '#FFB25A'],
    F05: ['#4FD1C5', '#9FF3EE', '#CBD5E0', '#FFF3DC'],
    F06: ['#FFD97D', '#FFB25A', '#FFF3DC', '#F08A3C'],
    F07: ['#F08A3C', '#FFB25A', '#FFD97D', '#FFB25A'],
    F08: ['#FFB25A', '#F4A3B0', '#4FD1C5', '#FFF3DC'],
  };

  for (const [id, def] of Object.entries(DEFAULT_FOOTAGE)) {
    const prev = existing[id];
    const base: FootageEntry = prev
      ? {...def, ...prev, id, title: def.title, annotations: def.annotations}
      : {...def};

    const matchedFile = filesInDir.find((f) => f.startsWith(`${id}_`) && f.endsWith('.mp4'));
    const relFile = matchedFile ? `footage/${matchedFile}` : def.file;
    const absFile = path.join(PROJECT_ROOT, 'public', relFile);

    if (fs.existsSync(absFile)) {
      const probed = probeVideo(absFile);
      const pixCandidate = matchedFile
        ? `footage/pix/${matchedFile.replace(/\.mp4$/, '_soft.mp4')}`
        : def.pix;
      const absPix = path.join(PROJECT_ROOT, 'public', pixCandidate);
      base.file = relFile;
      base.pix = fs.existsSync(absPix) ? pixCandidate : relFile;
      base.present = true;
      base.durationSec = Math.round(probed.durationSec * 100) / 100;
      base.fps = probed.fps;
      base.hasAudio = probed.hasAudio;
      base.use = {
        ...def.use,
        from: 0,
        to: base.durationSec,
      };
      lightResult[id] = sampleAvgColors(absFile, probed.durationSec);
    } else {
      base.present = false;
      base.file = def.file;
      base.pix = def.pix;
      if (fs.existsSync(pixDir) && id === 'F00') {
        base.pix = 'footage/F00_ramp.mp4';
      }
    }

    result[id] = base;
  }

  fs.writeFileSync(footageJsonPath, JSON.stringify(result, null, 2) + '\n');
  fs.writeFileSync(lightJsonPath, JSON.stringify(lightResult, null, 2) + '\n');
  console.log(`Updated footage.json (${Object.values(result).filter((x) => x.present).length}/${Object.keys(result).length} present).`);
}

main();
