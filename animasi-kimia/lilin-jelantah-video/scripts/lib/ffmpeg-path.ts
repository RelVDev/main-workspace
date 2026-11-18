import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

function resolveBinary(name: 'ffmpeg' | 'ffprobe'): string {
  const compositorBin = path.join(
    PROJECT_ROOT,
    'node_modules/@remotion/compositor-linux-x64-gnu',
    name,
  );
  if (fs.existsSync(compositorBin)) {
    return compositorBin;
  }
  try {
    const found = execFileSync('which', [name], {encoding: 'utf8'}).trim();
    if (found) return found;
  } catch {
    // ignore
  }
  throw new Error(`Binary ${name} tidak ditemukan di sistem maupun @remotion/compositor.`);
}

export const FFMPEG_BIN = resolveBinary('ffmpeg');
export const FFPROBE_BIN = resolveBinary('ffprobe');
export {PROJECT_ROOT};
