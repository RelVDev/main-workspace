#!/usr/bin/env node
/**
 * Local seamless-looping instrumental BGM generator (PLAN.md Section 8.4).
 * Generates warm non-vocal chiptune / lo-fi / marimba / piano / acoustic tracks
 * per scene as 44.1kHz 16-bit mono WAV files in public/music/bgm_<scene>.wav.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MUSIC_DIR = path.join(ROOT, 'public', 'music');
const SR = 44100;

const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

function writeWav(filePath, samples) {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i]);
    if (a > peak) peak = a;
  }
  const target = Math.pow(10, -4 / 20);
  const gain = peak > 1e-6 ? target / peak : 1;

  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(samples.length * 2, 40);

  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i] * gain));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buf);
}

const tri = (p) => (2 / Math.PI) * Math.asin(Math.sin(p));
const softSq = (p) => Math.tanh(Math.sin(p) * 2.2);

function renderLoop({bpm, bars, chords, arpPattern, bassFollow, tone = 'harp', padLevel = 0.22}) {
  const beatSec = 60 / bpm;
  const barSec = beatSec * 4;
  const totalSec = barSec * bars;
  const n = Math.floor(totalSec * SR);
  const buf = new Float32Array(n);

  const addNote = (startSec, durSec, freq, amp, mode) => {
    const s0 = Math.floor(startSec * SR);
    const len = Math.floor(durSec * SR);
    for (let i = 0; i < len; i++) {
      const idx = (s0 + i) % n;
      const t = i / SR;
      const env =
        mode === 'pad'
          ? Math.sin((Math.PI * t) / durSec)
          : Math.min(1, t / 0.015) * Math.exp(-t / Math.max(0.08, durSec * 0.45));
      const p = 2 * Math.PI * freq * t;
      let w = Math.sin(p);
      if (mode === 'harp') w = 0.65 * Math.sin(p) + 0.35 * tri(p * 2) * 0.4;
      else if (mode === 'marimba') w = 0.8 * Math.sin(p) + 0.2 * Math.sin(p * 4) * Math.exp(-t * 25);
      else if (mode === 'piano') w = 0.7 * Math.sin(p) + 0.2 * Math.sin(p * 2) + 0.1 * tri(p);
      else if (mode === 'chip') w = 0.6 * softSq(p) + 0.4 * tri(p);
      else if (mode === 'bass') w = 0.8 * Math.sin(p) + 0.2 * tri(p);
      buf[idx] += w * env * amp;
    }
  };

  for (let b = 0; b < bars; b++) {
    const chord = chords[b % chords.length];
    const barStart = b * barSec;

    // Warm pad chord
    if (padLevel > 0) {
      for (const m of chord) {
        addNote(barStart, barSec, midiToHz(m), padLevel / chord.length, 'pad');
      }
    }

    // Bass pulse
    if (bassFollow) {
      for (let step = 0; step < 4; step++) {
        addNote(barStart + step * beatSec, beatSec * 0.85, midiToHz(chord[0] - 12), 0.22, 'bass');
      }
    }

    // Arpeggio / melody
    if (arpPattern.length > 0) {
      const stepSec = barSec / arpPattern.length;
      for (let s = 0; s < arpPattern.length; s++) {
        const idx = arpPattern[s];
        if (idx < 0) continue;
        const m = chord[idx % chord.length] + (idx >= chord.length ? 12 : 0);
        addNote(barStart + s * stepSec, stepSec * 1.4, midiToHz(m), 0.28, tone);
      }
    }
  }

  return buf;
}

const TRACKS = {
  S01A: {
    bpm: 72,
    bars: 4,
    chords: [[60, 64, 67], [60, 64, 67], [65, 69, 72], [67, 71, 74]],
    arpPattern: [],
    bassFollow: false,
    tone: 'pad',
    padLevel: 0.35,
  },
  S01B: {
    bpm: 90,
    bars: 4,
    chords: [[60, 64, 67, 71], [65, 69, 72, 76], [62, 65, 69, 72], [67, 71, 74, 77]],
    arpPattern: [0, 1, 2, 3, 2, 1, 4, 2],
    bassFollow: true,
    tone: 'harp',
    padLevel: 0.25,
  },
  S02: {
    bpm: 78,
    bars: 4,
    chords: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]],
    arpPattern: [0, -1, 1, 2, 0, -1, 2, 1],
    bassFollow: true,
    tone: 'piano',
    padLevel: 0.2,
  },
  S03: {
    bpm: 102,
    bars: 4,
    chords: [[62, 66, 69], [67, 71, 74], [64, 67, 71], [69, 73, 76]],
    arpPattern: [0, 2, 1, 3, 2, 0, 1, 2],
    bassFollow: true,
    tone: 'marimba',
    padLevel: 0.14,
  },
  S04: {
    bpm: 95,
    bars: 4,
    chords: [[60, 64, 67, 71], [57, 60, 64, 67], [65, 69, 72, 76], [67, 71, 74, 77]],
    arpPattern: [0, 1, -1, 2, 3, 1, 2, -1],
    bassFollow: true,
    tone: 'chip',
    padLevel: 0.2,
  },
  S05: {
    bpm: 108,
    bars: 4,
    chords: [[60, 64, 67], [67, 71, 74], [69, 72, 76], [65, 69, 72]],
    arpPattern: [0, 1, 2, 3, 4, 2, 3, 1],
    bassFollow: true,
    tone: 'harp',
    padLevel: 0.2,
  },
  S06: {
    bpm: 96,
    bars: 4,
    chords: [[57, 60, 64], [55, 59, 62], [53, 57, 60], [55, 59, 64]],
    arpPattern: [0, 2, 0, 2, 1, 2, 3, 2],
    bassFollow: true,
    tone: 'chip',
    padLevel: 0.24,
  },
  S07: {
    bpm: 74,
    bars: 4,
    chords: [[65, 69, 72], [60, 64, 67], [62, 65, 69], [67, 71, 74]],
    arpPattern: [0, 1, 2, -1, 3, 2, 1, -1],
    bassFollow: false,
    tone: 'piano',
    padLevel: 0.18,
  },
  S08: {
    bpm: 88,
    bars: 4,
    chords: [[60, 64, 67], [67, 71, 74], [69, 72, 76], [65, 69, 72]],
    arpPattern: [0, 1, 2, 1, 3, 2, 1, 2],
    bassFollow: true,
    tone: 'harp',
    padLevel: 0.2,
  },
  S09: {
    bpm: 80,
    bars: 4,
    chords: [[60, 64, 67, 71], [69, 72, 76, 79], [65, 69, 72, 76], [67, 71, 74, 79]],
    arpPattern: [0, 1, 2, 3, 4, 3, 2, 1],
    bassFollow: true,
    tone: 'piano',
    padLevel: 0.28,
  },
};

function main() {
  fs.mkdirSync(MUSIC_DIR, {recursive: true});
  for (const [id, cfg] of Object.entries(TRACKS)) {
    const outPath = path.join(MUSIC_DIR, `bgm_${id}.wav`);
    const samples = renderLoop(cfg);
    writeWav(outPath, samples);
    console.log(`Generated bgm_${id}.wav (${(samples.length / SR).toFixed(1)}s loop)`);
  }
}

main();
