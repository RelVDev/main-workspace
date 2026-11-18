#!/usr/bin/env node
/**
 * Local non-vocal SFX & Ambience synthesizer (PLAN.md Section 8.3 & 12).
 * Generates clean 48kHz 16-bit mono WAV files normalized to -3 dB peak.
 * Idempotent: skips files that already exist unless --force is passed.
 */

import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SFX_DIR = path.join(ROOT, 'public', 'sfx');
const MANIFEST_PATH = path.join(SFX_DIR, 'sfx-manifest.json');
const SR = 48000;
const FORCE = process.argv.includes('--force');

// Deterministic PRNG
function makeRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function writeWav(filePath, samples) {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const a = Math.abs(samples[i]);
    if (a > peak) peak = a;
  }
  const targetPeak = Math.pow(10, -3 / 20); // -3 dB
  const gain = peak > 1e-6 ? targetPeak / peak : 1;

  const numSamples = samples.length;
  const buf = Buffer.alloc(44 + numSamples * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + numSamples * 2, 4);
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
  buf.writeUInt32LE(numSamples * 2, 40);

  for (let i = 0; i < numSamples; i++) {
    const v = Math.max(-1, Math.min(1, samples[i] * gain));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buf);
}

const sq = (p) => (Math.sin(p) >= 0 ? 1 : -1);
const tri = (p) => (2 / Math.PI) * Math.asin(Math.sin(p));
const envAD = (t, a, d) => (t < a ? t / Math.max(0.001, a) : Math.max(0, Math.exp(-(t - a) / Math.max(0.01, d))));

function synth(durSec, fn) {
  const n = Math.ceil(durSec * SR);
  const out = new Float32Array(n);
  const rng = makeRng(n * 31 + 7);
  let phase = 0;
  let lp = 0;
  let hp = 0;
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const white = rng() * 2 - 1;
    lp += 0.12 * (white - lp);
    hp = 0.9 * (hp + white - prev);
    prev = white;
    const res = fn({t, dur: durSec, phase, white, lp, hp, rng});
    if (typeof res === 'object') {
      out[i] = res.sample;
      phase = res.phase;
    } else {
      out[i] = res;
    }
  }
  return out;
}

function sweep(durSec, f0, f1, waveFn, ampFn) {
  const n = Math.ceil(durSec * SR);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = f0 + (f1 - f0) * (t / durSec);
    phase += (2 * Math.PI * f) / SR;
    out[i] = waveFn(phase) * ampFn(t, durSec);
  }
  return out;
}

function notes(noteList, waveFn = tri, decay = 0.12) {
  const totalDur = noteList.reduce((m, x) => Math.max(m, x.t + x.dur), 0) + 0.15;
  const out = new Float32Array(Math.ceil(totalDur * SR));
  for (const nt of noteList) {
    let phase = 0;
    const start = Math.floor(nt.t * SR);
    const len = Math.floor(nt.dur * SR);
    for (let i = 0; i < len; i++) {
      const idx = start + i;
      if (idx >= out.length) break;
      const lt = i / SR;
      phase += (2 * Math.PI * nt.f) / SR;
      out[idx] += waveFn(phase) * envAD(lt, 0.006, decay) * (nt.vol ?? 0.6);
    }
  }
  return out;
}

function makeLoopAmbience(durSec, builder) {
  const raw = synth(durSec, builder);
  // 0.3s crossfade at ends for seamless loop
  const fade = Math.min(Math.floor(0.3 * SR), Math.floor(raw.length / 4));
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    raw[i] = raw[i] * k + raw[raw.length - fade + i] * (1 - k);
  }
  return raw.slice(0, raw.length - fade);
}

const CATALOG = {
  // 12.1 UI & karakter
  UI_BLIP: () => sweep(0.08, 880, 920, sq, (t) => envAD(t, 0.003, 0.025) * 0.6),
  UI_POP: () => sweep(0.12, 500, 920, tri, (t) => envAD(t, 0.005, 0.04) * 0.7),
  UI_CONFIRM: () => notes([{t: 0, f: 1047, dur: 0.08}, {t: 0.06, f: 1319, dur: 0.08}, {t: 0.12, f: 1568, dur: 0.16}], tri, 0.09),
  UI_ERROR: () => notes([{t: 0, f: 150, dur: 0.09}, {t: 0.11, f: 130, dur: 0.14}], sq, 0.06),
  UI_ACHIEVE: () => notes([{t: 0, f: 523.25, dur: 0.12}, {t: 0.11, f: 659.25, dur: 0.12}, {t: 0.22, f: 783.99, dur: 0.14}, {t: 0.35, f: 1046.5, dur: 0.45}], tri, 0.25),
  UI_DING_SPARKLE: () => notes([{t: 0, f: 1568, dur: 0.7, vol: 0.7}, {t: 0.08, f: 2349, dur: 0.6, vol: 0.35}, {t: 0.16, f: 3136, dur: 0.5, vol: 0.2}], Math.sin, 0.32),
  UI_TAG_FISIKA: () => notes([{t: 0, f: 880, dur: 0.25}, {t: 0.09, f: 1318.5, dur: 0.4}], Math.sin, 0.18),
  UI_TAG_KIMIA: () => notes([{t: 0, f: 587.3, dur: 0.22}, {t: 0.08, f: 880, dur: 0.25}, {t: 0.16, f: 1174.6, dur: 0.35}], tri, 0.18),
  UI_CARD_FLIP: () => synth(0.28, ({t, hp}) => hp * envAD(t, 0.005, 0.05) * 0.6 + Math.sin(2 * Math.PI * 1200 * t) * envAD(t, 0.002, 0.03) * 0.25),
  JUMP: () => sweep(0.2, 300, 720, sq, (t) => envAD(t, 0.005, 0.07) * 0.5),
  LAND: () => synth(0.18, ({t, lp}) => lp * envAD(t, 0.004, 0.05) * 0.8),
  STEP_WOOD: () => synth(0.1, ({t, lp, hp}) => (lp * 0.6 + hp * 0.4) * envAD(t, 0.002, 0.025)),
  EMOTE_EXCLAIM: () => notes([{t: 0, f: 1200, dur: 0.08}, {t: 0.09, f: 1500, dur: 0.14}], sq, 0.07),
  EMOTE_QUESTION: () => sweep(0.3, 600, 920, sq, (t) => envAD(t, 0.01, 0.12) * 0.5),
  EMOTE_IDEA: () => notes([{t: 0, f: 1760, dur: 0.45}], Math.sin, 0.22),
  EMOTE_HEART: () => notes([{t: 0, f: 1318, dur: 0.12}, {t: 0.09, f: 1568, dur: 0.12}, {t: 0.18, f: 1975, dur: 0.25}], Math.sin, 0.14),
  HIGH_FIVE_CLAP: () => synth(0.28, ({t, hp}) => hp * envAD(t, 0.002, 0.045)),
  WARNING_BEEP: () => notes([{t: 0, f: 440, dur: 0.11}, {t: 0.16, f: 440, dur: 0.14}], sq, 0.08),
  STAMP: () => synth(0.28, ({t, lp}) => (Math.sin(2 * Math.PI * 95 * t) * 0.7 + lp * 0.5) * envAD(t, 0.003, 0.06)),

  // 12.2 Transisi, tangan & portal
  TR_WHOOSH: () => synth(0.45, ({t, hp, lp}) => (hp * 0.5 + lp * 0.5) * Math.sin((Math.PI * t) / 0.45) * 0.8),
  TR_WHIP: () => sweep(0.3, 1400, 320, tri, (t) => envAD(t, 0.01, 0.1)),
  TR_CURTAIN: () => synth(1.4, ({t, hp, lp}) => (hp * 0.4 + lp * 0.6) * Math.sin((Math.PI * t) / 1.4) * (0.6 + 0.4 * Math.sin(t * 22))),
  TR_IRIS: () => sweep(0.6, 820, 220, tri, (t) => envAD(t, 0.01, 0.22)),
  TR_LIGHT_FLASH: () => synth(0.7, ({t, hp}) => (Math.sin(2 * Math.PI * 660 * t) * 0.35 + hp * 0.45) * envAD(t, 0.05, 0.28)),
  TR_PIXEL_DISSOLVE: () => synth(0.9, ({t, white}) => (Math.floor(t * 24) % 2 === 0 ? sq(2 * Math.PI * (300 + (Math.floor(t * 18) % 5) * 140) * t) * 0.35 : white * 0.25) * envAD(t, 0.02, 0.35)),
  HAND_COVER_THUMP: () => synth(0.5, ({t, lp}) => (Math.sin(2 * Math.PI * (85 - t * 40) * t) * 0.8 + lp * 0.5) * envAD(t, 0.004, 0.12)),
  PORTAL_SUB_RUMBLE: () => synth(3.8, ({t, lp}) => (Math.sin(2 * Math.PI * 52 * t) * 0.6 + Math.sin(2 * Math.PI * 78 * t) * 0.3 + lp * 0.25) * Math.sin((Math.PI * t) / 3.8)),
  HAND_UNCOVER_RUSTLE: () => synth(0.9, ({t, hp}) => hp * envAD(t, 0.05, 0.3) * 0.65),
  PORTAL_SHIMMER_SWELL: () => synth(2.8, ({t}) => (Math.sin(2 * Math.PI * 523.25 * t) * 0.3 + Math.sin(2 * Math.PI * 659.25 * t) * 0.28 + Math.sin(2 * Math.PI * 1046.5 * t) * 0.22) * Math.sin((Math.PI * t) / 2.8)),

  // 12.3 Ambience (loop 5 dtk)
  AMB_STAGE: () => makeLoopAmbience(5.3, ({t, lp}) => lp * 0.35 + Math.sin(2 * Math.PI * 60 * t) * 0.08),
  AMB_KITCHEN: () => makeLoopAmbience(5.3, ({t, lp}) => lp * 0.25 + Math.sin(2 * Math.PI * 110 * t) * 0.06),
  AMB_WATER_UNDER: () => makeLoopAmbience(5.3, ({t, lp}) => lp * 0.45 + Math.sin(2 * Math.PI * (140 + 40 * Math.sin(t * 7)) * t) * 0.1),
  AMB_LAB: () => makeLoopAmbience(5.3, ({t, lp}) => lp * 0.22 + Math.sin(2 * Math.PI * 95 * t) * 0.06),
  AMB_WORKSHOP: () => makeLoopAmbience(5.3, ({t, lp}) => lp * 0.3),
  AMB_CINEMA_ROOM: () => makeLoopAmbience(5.3, ({t, lp}) => lp * 0.2 + Math.sin(2 * Math.PI * 120 * t) * 0.05),
  AMB_SHOWROOM: () => makeLoopAmbience(5.3, ({t, lp}) => lp * 0.18),
  AMB_OBSERVATORY: () => makeLoopAmbience(5.3, ({t, lp}) => lp * 0.18 + Math.sin(2 * Math.PI * 82 * t) * 0.12),
  AMB_LIBRARY: () => makeLoopAmbience(5.3, ({t, lp}) => lp * 0.18),
  AMB_OFFICE: () => makeLoopAmbience(5.3, ({t, lp}) => lp * 0.2),
  AMB_NIGHT_ROOFTOP: () => makeLoopAmbience(5.3, ({t, lp}) => lp * 0.28 + (Math.sin(t * 28) > 0.7 ? Math.sin(2 * Math.PI * 3800 * t) * 0.05 : 0)),

  // 12.4 Foley & sains
  SIZZLE: () => synth(4.0, ({t, hp}) => hp * (0.4 + 0.35 * Math.sin(t * 17)) * envAD(t, 0.1, 2.5)),
  OIL_POUR: () => synth(3.0, ({t, lp}) => lp * (0.5 + 0.4 * Math.sin(t * 12)) * Math.sin((Math.PI * t) / 3.0)),
  OIL_DRAIN_GLUG: () => synth(2.0, ({t, lp}) => Math.sin(2 * Math.PI * (180 + 90 * Math.sin(t * 14)) * t) * 0.5 * envAD(t, 0.05, 0.9) + lp * 0.3),
  BUBBLES_LOOP: () => makeLoopAmbience(5.3, ({t, lp}) => lp * 0.25 + (Math.floor(t * 4) % 3 === 0 ? Math.sin(2 * Math.PI * (340 + ((t * 180) % 240)) * t) * 0.25 : 0)),
  HEAT_SHIMMER: () => synth(2.0, ({t, hp}) => (Math.sin(2 * Math.PI * 320 * t) * 0.25 + hp * 0.35) * Math.sin((Math.PI * t) / 2.0)),
  MOLECULE_SNAP: () => notes([{t: 0, f: 1100, dur: 0.05}, {t: 0.04, f: 1650, dur: 0.1}], tri, 0.04),
  MOLECULE_JIGGLE: () => synth(3.0, ({t}) => Math.sin(2 * Math.PI * (420 + 60 * Math.sin(t * 24)) * t) * 0.3),
  CHALK_SCRIBBLE: () => synth(1.4, ({t, hp}) => hp * (0.3 + 0.5 * Math.abs(Math.sin(t * 15))) * Math.sin((Math.PI * t) / 1.4)),
  STRAINER_DRIP: () => synth(2.5, ({t}) => (Math.floor(t * 5) !== Math.floor((t - 0.03) * 5) ? Math.sin(2 * Math.PI * 950 * t) * 0.5 : 0) + Math.sin(2 * Math.PI * 520 * t) * 0.05),
  WAX_MELT: () => synth(3.5, ({t, lp, hp}) => (lp * 0.4 + hp * 0.25) * Math.sin((Math.PI * t) / 3.5)),
  SPOON_STIR: () => synth(2.5, ({t, lp}) => lp * 0.4 + Math.sin(2 * Math.PI * 640 * t) * (0.2 + 0.2 * Math.sin(t * 9))),
  JAR_POUR: () => sweep(2.5, 280, 560, Math.sin, (t) => Math.sin((Math.PI * t) / 2.5) * 0.55),
  COOL_CRYSTAL: () => notes([{t: 0, f: 1318, dur: 0.25}, {t: 0.25, f: 1760, dur: 0.3}, {t: 0.5, f: 2093, dur: 0.5}], Math.sin, 0.25),
  MATCH_STRIKE: () => synth(0.8, ({t, hp}) => hp * envAD(t, 0.02, 0.18)),
  FLAME_IGNITE: () => synth(0.9, ({t, lp}) => lp * envAD(t, 0.03, 0.28) + Math.sin(2 * Math.PI * 140 * t) * envAD(t, 0.01, 0.14) * 0.5),
  FLAME_LOOP: () => makeLoopAmbience(5.3, ({t, lp}) => lp * (0.3 + 0.15 * Math.sin(t * 6))),
  O2_SWIRL: () => synth(2.0, ({t, hp}) => hp * Math.sin((Math.PI * t) / 2.0) * 0.6),
  SOFA_SIT: () => synth(0.55, ({t, lp}) => lp * envAD(t, 0.02, 0.14) * 0.8),
  TV_ON: () => sweep(0.9, 60, 2600, Math.sin, (t) => envAD(t, 0.05, 0.35) * 0.4),
  CRT_STATIC_POP: () => synth(0.35, ({t, white}) => white * envAD(t, 0.004, 0.08)),
  CAMERA_SHUTTER: () => synth(0.25, ({t, hp}) => hp * (t < 0.06 || (t > 0.09 && t < 0.15) ? 0.8 : 0.05)),
  COUNTER_ROLL: () => synth(2.8, ({t}) => ((Math.floor(t * 14) % 2 === 0 ? 1 : 0) * Math.sin(2 * Math.PI * (600 + t * 220) * t) * 0.4)),
  BARREL_THUD: () => synth(0.45, ({t, lp}) => (Math.sin(2 * Math.PI * 82 * t) * 0.7 + lp * 0.3) * envAD(t, 0.005, 0.14)),
  DOT_POP: () => sweep(0.06, 900, 1250, Math.sin, (t) => envAD(t, 0.002, 0.02) * 0.5),
  LADDER_CREAK: () => sweep(0.9, 260, 190, tri, (t) => Math.sin((Math.PI * t) / 0.9) * 0.4),
  PAGE_TURN: () => synth(0.5, ({t, hp}) => hp * envAD(t, 0.03, 0.14) * 0.7),
  BOOK_THUD: () => synth(0.45, ({t, lp}) => (Math.sin(2 * Math.PI * 105 * t) * 0.65 + lp * 0.4) * envAD(t, 0.004, 0.1)),
  PAPER_SLIDE: () => synth(0.45, ({t, hp}) => hp * envAD(t, 0.04, 0.14) * 0.55),
  JAR_PLACE: () => notes([{t: 0, f: 740, dur: 0.12}], Math.sin, 0.06),
  WICK_PLACE: () => notes([{t: 0, f: 1620, dur: 0.14}], Math.sin, 0.05),
};

function main() {
  fs.mkdirSync(SFX_DIR, {recursive: true});
  const manifest = [];
  let created = 0;

  for (const [id, gen] of Object.entries(CATALOG)) {
    const fname = `${id}.wav`;
    const outPath = path.join(SFX_DIR, fname);
    let samples;
    if (!FORCE && fs.existsSync(outPath)) {
      const size = fs.statSync(outPath).size;
      const dur = Math.round(((size - 44) / (SR * 2)) * 100) / 100;
      manifest.push({
        id,
        file: `sfx/${fname}`,
        source: 'local-synth',
        durationSec: dur,
        loop: id.startsWith('AMB_') || id.endsWith('_LOOP'),
        license: 'CC0 (local synthesis, non-vocal)',
        peakDb: -3,
      });
      continue;
    }
    samples = gen();
    writeWav(outPath, samples);
    created++;
    manifest.push({
      id,
      file: `sfx/${fname}`,
      source: 'local-synth',
      durationSec: Math.round((samples.length / SR) * 100) / 100,
      loop: id.startsWith('AMB_') || id.endsWith('_LOOP'),
      license: 'CC0 (local synthesis, non-vocal)',
      peakDb: -3,
    });
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`SFX ready: ${manifest.length} total (${created} newly synthesized).`);
}

main();
