import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {SCRIPT_LINES, wordCount, type SceneId} from '../src/data/script';
import {FFMPEG_BIN, FFPROBE_BIN, PROJECT_ROOT} from './lib/ffmpeg-path';

export interface DubMapEntry {
  lineId: string;
  scene: SceneId;
  speaker: string;
  text: string;
  file: string | null;
  hasAudio: boolean;
  startSec: number;
  endSec: number;
  durationSec: number;
}

export interface LipSyncTrack {
  lineId: string;
  fps: number;
  speechStart: number;
  speechEnd: number;
  mouth: number[];
}

const PLANNED_SEC: Record<SceneId, {plannedSec: number; out: number}> = {
  S01A: {plannedSec: 40, out: 0},
  S01B: {plannedSec: 30, out: 24},
  S02: {plannedSec: 65, out: 24},
  S03: {plannedSec: 80, out: 24},
  S04: {plannedSec: 100, out: 24},
  S05: {plannedSec: 60, out: 24},
  S06: {plannedSec: 95, out: 24},
  S07: {plannedSec: 60, out: 24},
  S08: {plannedSec: 40, out: 24},
  S09: {plannedSec: 49, out: 0},
};

function probeAudioDuration(absPath: string): number {
  const out = execFileSync(
    FFPROBE_BIN,
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', absPath],
    {encoding: 'utf8'},
  ).trim();
  return Math.max(0.5, Number(out) || 1);
}

function extractLipSync(lineId: string, absPath: string, durationSec: number): LipSyncTrack {
  const sampleRate = 16000;
  const lipFps = 15;
  const winSamples = Math.floor(sampleRate / lipFps);
  const pcm = execFileSync(FFMPEG_BIN, [
    '-v',
    'error',
    '-i',
    absPath,
    '-f',
    'f32le',
    '-ac',
    '1',
    '-ar',
    String(sampleRate),
    '-',
  ]);
  const floats = new Float32Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.byteLength / 4));
  const rmsList: number[] = [];
  for (let i = 0; i + winSamples <= floats.length; i += winSamples) {
    let sumSq = 0;
    for (let j = 0; j < winSamples; j++) {
      const s = floats[i + j];
      sumSq += s * s;
    }
    rmsList.push(Math.sqrt(sumSq / winSamples));
  }

  const sorted = [...rmsList].sort((a, b) => a - b);
  const p90 = sorted[Math.floor(sorted.length * 0.9)] ?? 0.05;
  const openThresh = Math.max(0.015, p90 * 0.55);
  const halfThresh = Math.max(0.008, p90 * 0.22);

  const rawMouth = rmsList.map((r) => (r >= openThresh ? 2 : r >= halfThresh ? 1 : 0));
  // Smooth with minimum 2-frame hold
  const mouth = [...rawMouth];
  for (let i = 1; i < mouth.length - 1; i++) {
    if (mouth[i] !== mouth[i - 1] && mouth[i] !== mouth[i + 1]) {
      mouth[i] = mouth[i - 1];
    }
  }

  const firstActive = mouth.findIndex((m) => m > 0);
  let lastActive = mouth.length - 1;
  while (lastActive > 0 && mouth[lastActive] === 0) lastActive--;

  return {
    lineId,
    fps: lipFps,
    speechStart: firstActive >= 0 ? Math.round((firstActive / lipFps) * 100) / 100 : 0,
    speechEnd: lastActive > 0 ? Math.round((lastActive / lipFps) * 100) / 100 : durationSec,
    mouth,
  };
}

function main() {
  const dubDir = path.join(PROJECT_ROOT, 'public/dub');
  const lipsyncDir = path.join(PROJECT_ROOT, 'src/data/lipsync');
  fs.mkdirSync(lipsyncDir, {recursive: true});

  const wavFiles = fs.existsSync(dubDir)
    ? fs.readdirSync(dubDir).filter((f) => f.toLowerCase().endsWith('.wav'))
    : [];

  const dubMap: Record<string, DubMapEntry> = {};
  const cursorByScene: Record<string, number> = {};
  const dubEndByScene: Record<string, number> = {};

  for (const line of SCRIPT_LINES) {
    const matchedWav = wavFiles.find((f) => f.startsWith(`${line.id}_`) || f === `${line.id}.wav`);
    let durationSec: number;
    let file: string | null = null;
    let hasAudio = false;

    if (matchedWav) {
      const absPath = path.join(dubDir, matchedWav);
      durationSec = Math.round(probeAudioDuration(absPath) * 100) / 100;
      file = `dub/${matchedWav}`;
      hasAudio = true;
      const track = extractLipSync(line.id, absPath, durationSec);
      fs.writeFileSync(path.join(lipsyncDir, `${line.id}.json`), JSON.stringify(track, null, 2) + '\n');
    } else {
      // Placeholder timing per PLAN 5.4: jumlahKata / 2.4 dtk
      durationSec = Math.round(Math.max(1.8, wordCount(line.text) / 2.4) * 100) / 100;
    }

    const prevEnd = cursorByScene[line.scene] ?? 0.5;
    const startSec = Math.round(Math.max(prevEnd, line.minStartSec ?? 0) * 100) / 100;
    const endSec = Math.round((startSec + durationSec) * 100) / 100;
    const gap = line.pauseAfterSec ?? 0.35;
    cursorByScene[line.scene] = Math.round((endSec + gap) * 100) / 100;
    dubEndByScene[line.scene] = Math.max(dubEndByScene[line.scene] ?? 0, endSec);

    dubMap[line.id] = {
      lineId: line.id,
      scene: line.scene,
      speaker: line.speaker,
      text: line.text,
      file,
      hasAudio,
      startSec,
      endSec,
      durationSec,
    };
  }

  const footageJsonPath = path.join(PROJECT_ROOT, 'src/data/footage.json');
  const footageInfo = fs.existsSync(footageJsonPath)
    ? (JSON.parse(fs.readFileSync(footageJsonPath, 'utf8')) as Record<string, {present?: boolean; durationSec?: number}>)
    : {};

  const FPS = 30;
  const scenesSummary: Record<
    string,
    {plannedSec: number; dubEndSec: number; finalSec: number; frames: number; out: number}
  > = {};
  let totalFrames = 0;

  for (const [sceneId, cfg] of Object.entries(PLANNED_SEC)) {
    const dubEnd = dubEndByScene[sceneId] ?? 0;
    let finalSec = Math.max(cfg.plannedSec, Math.ceil((dubEnd + 1.0) * 10) / 10);
    if (sceneId === 'S01A' && footageInfo.F00?.present && footageInfo.F00.durationSec) {
      finalSec = Math.max(10, Math.round(footageInfo.F00.durationSec * 100) / 100);
    }
    const frames = Math.round(finalSec * FPS);
    scenesSummary[sceneId] = {
      plannedSec: cfg.plannedSec,
      dubEndSec: Math.round(dubEnd * 100) / 100,
      finalSec,
      frames,
      out: cfg.out,
    };
    totalFrames += frames - cfg.out;
  }

  const durationsPayload = {
    fps: FPS,
    totalFrames,
    totalSeconds: Math.round((totalFrames / FPS) * 100) / 100,
    scenes: scenesSummary,
  };

  fs.writeFileSync(path.join(PROJECT_ROOT, 'src/data/dub-map.json'), JSON.stringify(dubMap, null, 2) + '\n');
  fs.writeFileSync(path.join(PROJECT_ROOT, 'src/data/durations.json'), JSON.stringify(durationsPayload, null, 2) + '\n');

  const lipFiles = fs.readdirSync(lipsyncDir).filter((f) => f.endsWith('.json')).sort();
  const imports = lipFiles
    .map((f) => `import _${f.replace('.json', '')} from './${f}';`)
    .join('\n');
  const entries = lipFiles
    .map((f) => `  '${f.replace('.json', '')}': _${f.replace('.json', '')},`)
    .join('\n');
  const indexContent = `export interface LipSyncData {
  lineId: string;
  fps: number;
  speechStart: number;
  speechEnd: number;
  mouth: number[];
}

${imports ? imports + '\n\n' : ''}// Diisi otomatis oleh scripts/analyze-dub.ts saat file WAV dubbing ditambahkan ke public/dub/
export const LIPSYNC_TRACKS: Record<string, LipSyncData> = {
${entries}
};
`;
  fs.writeFileSync(path.join(lipsyncDir, 'index.ts'), indexContent);

  console.log(`Generated dub-map.json (${Object.keys(dubMap).length} lines, ${wavFiles.length} WAVs found).`);
  console.log(`Total net duration: ${totalFrames} frames (${(totalFrames / FPS).toFixed(1)}s = ${(totalFrames / FPS / 60).toFixed(2)} min).`);
}

main();
