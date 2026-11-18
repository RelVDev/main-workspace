#!/usr/bin/env node
/**
 * Rich local non-vocal SFX & Ambience synthesizer (PLAN.md Section 8.3 & 12).
 * Generates warm layered 48kHz 16-bit mono WAV files normalized to -3 dB peak.
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
  const targetPeak = Math.pow(10, -3 / 20);
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

const sq = (p) => Math.tanh(Math.sin(p) * 3.0);
const tri = (p) => (2 / Math.PI) * Math.asin(Math.sin(p));
const bell = (p) => 0.72 * Math.sin(p) + 0.2 * Math.sin(p * 2.0) + 0.08 * Math.sin(p * 3.0);
const envAD = (t, a, d) =>
  t < a ? t / Math.max(0.001, a) : Math.max(0, Math.exp(-(t - a) / Math.max(0.01, d)));

function synth(durSec, fn) {
  const n = Math.ceil(durSec * SR);
  const out = new Float32Array(n);
  const rng = makeRng(n * 31 + 17);
  let lp = 0;
  let hp = 0;
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const white = rng() * 2 - 1;
    lp += 0.1 * (white - lp);
    hp = 0.91 * (hp + white - prev);
    prev = white;
    out[i] = fn({t, dur: durSec, white, lp, hp, rng});
  }
  return out;
}

function sweep(durSec, f0, f1, waveFn, ampFn) {
  const n = Math.ceil(durSec * SR);
  const out = new Float32Array(n);
  let phase = 0;
  let phase2 = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = f0 + (f1 - f0) * Math.pow(t / durSec, 0.85);
    phase += (2 * Math.PI * f) / SR;
    phase2 += (2 * Math.PI * f * 1.5) / SR;
    out[i] = (waveFn(phase) * 0.8 + waveFn(phase2) * 0.2) * ampFn(t, durSec);
  }
  return out;
}

function notes(noteList, waveFn = bell, decay = 0.14) {
  const totalDur = noteList.reduce((m, x) => Math.max(m, x.t + x.dur), 0) + 0.18;
  const out = new Float32Array(Math.ceil(totalDur * SR));
  for (const nt of noteList) {
    let phase = 0;
    let phaseSub = 0;
    const start = Math.floor(nt.t * SR);
    const len = Math.floor(nt.dur * SR);
    for (let i = 0; i < len; i++) {
      const idx = start + i;
      if (idx >= out.length) break;
      const lt = i / SR;
      phase += (2 * Math.PI * nt.f) / SR;
      phaseSub += (2 * Math.PI * nt.f * 0.5) / SR;
      out[idx] +=
        (waveFn(phase) * 0.85 + Math.sin(phaseSub) * 0.15) *
        envAD(lt, 0.005, decay) *
        (nt.vol ?? 0.6);
    }
  }
  return out;
}

function makeLoopAmbience(durSec, builder) {
  const raw = synth(durSec, builder);
  const fade = Math.min(Math.floor(0.35 * SR), Math.floor(raw.length / 4));
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    raw[i] = raw[i] * k + raw[raw.length - fade + i] * (1 - k);
  }
  return raw.slice(0, raw.length - fade);
}

const CATALOG = {
  // 12.1 UI & karakter (warmer crystal/wood harmonics)
  UI_BLIP: () => sweep(0.08, 760, 1040, bell, (t) => envAD(t, 0.003, 0.025) * 0.65),
  UI_POP: () => sweep(0.13, 460, 980, bell, (t) => envAD(t, 0.004, 0.045) * 0.72),
  UI_CONFIRM: () =>
    notes(
      [
        {t: 0, f: 880, dur: 0.09},
        {t: 0.055, f: 1174.66, dur: 0.1},
        {t: 0.11, f: 1567.98, dur: 0.2},
      ],
      bell,
      0.11,
    ),
  UI_ERROR: () =>
    notes(
      [
        {t: 0, f: 196, dur: 0.1},
        {t: 0.11, f: 155.56, dur: 0.18},
      ],
      tri,
      0.08,
    ),
  UI_ACHIEVE: () =>
    notes(
      [
        {t: 0, f: 523.25, dur: 0.14},
        {t: 0.09, f: 659.25, dur: 0.14},
        {t: 0.18, f: 783.99, dur: 0.16},
        {t: 0.27, f: 1046.5, dur: 0.55},
        {t: 0.27, f: 1318.5, dur: 0.5, vol: 0.35},
      ],
      bell,
      0.26,
    ),
  UI_DING_SPARKLE: () =>
    notes(
      [
        {t: 0, f: 1568, dur: 0.75, vol: 0.65},
        {t: 0.07, f: 2093, dur: 0.65, vol: 0.45},
        {t: 0.14, f: 2637, dur: 0.55, vol: 0.3},
        {t: 0.21, f: 3136, dur: 0.5, vol: 0.2},
      ],
      bell,
      0.34,
    ),
  UI_SPARKLE_CHIME: () =>
    notes(
      [
        {t: 0, f: 1046.5, dur: 0.2, vol: 0.45},
        {t: 0.06, f: 1318.5, dur: 0.22, vol: 0.5},
        {t: 0.12, f: 1568.0, dur: 0.25, vol: 0.5},
        {t: 0.18, f: 1975.5, dur: 0.38, vol: 0.4},
      ],
      bell,
      0.22,
    ),
  UI_TAG_FISIKA: () =>
    notes(
      [
        {t: 0, f: 783.99, dur: 0.24},
        {t: 0.07, f: 1174.66, dur: 0.38},
        {t: 0.14, f: 1567.98, dur: 0.42, vol: 0.4},
      ],
      bell,
      0.2,
    ),
  UI_TAG_KIMIA: () =>
    notes(
      [
        {t: 0, f: 587.33, dur: 0.22},
        {t: 0.07, f: 880, dur: 0.26},
        {t: 0.14, f: 1174.66, dur: 0.38},
        {t: 0.21, f: 1479.98, dur: 0.42, vol: 0.4},
      ],
      bell,
      0.2,
    ),
  UI_CARD_FLIP: () =>
    synth(
      0.3,
      ({t, hp}) =>
        hp * envAD(t, 0.004, 0.05) * 0.6 + Math.sin(2 * Math.PI * 1050 * t) * envAD(t, 0.002, 0.03) * 0.28,
    ),
  CARD_WHOOSH: () =>
    synth(
      0.36,
      ({t, lp, hp}) =>
        (lp * 0.45 + hp * 0.55) * Math.sin((Math.PI * t) / 0.36) * 0.7 +
        Math.sin(2 * Math.PI * (420 + t * 500) * t) * envAD(t, 0.04, 0.1) * 0.18,
    ),
  ZOOM_WHOOSH: () =>
    synth(
      0.55,
      ({t, lp, hp}) =>
        (lp * 0.65 + hp * 0.25) * Math.sin((Math.PI * t) / 0.55) * 0.8 +
        Math.sin(2 * Math.PI * (110 + t * 180) * t) * Math.sin((Math.PI * t) / 0.55) * 0.22,
    ),
  DATA_TICK: () => sweep(0.05, 1100, 1480, Math.sin, (t) => envAD(t, 0.001, 0.018) * 0.55),
  TEAM_CHIME: () =>
    notes(
      [
        {t: 0, f: 523.25, dur: 0.16},
        {t: 0.08, f: 659.25, dur: 0.16},
        {t: 0.16, f: 783.99, dur: 0.18},
        {t: 0.24, f: 987.77, dur: 0.22},
        {t: 0.32, f: 1174.66, dur: 0.48},
      ],
      bell,
      0.28,
    ),
  JUMP: () => sweep(0.22, 320, 760, tri, (t) => envAD(t, 0.005, 0.08) * 0.55),
  LAND: () => synth(0.18, ({t, lp}) => (lp * 0.7 + Math.sin(2 * Math.PI * 115 * t) * 0.3) * envAD(t, 0.003, 0.05)),
  STEP_WOOD: () => synth(0.1, ({t, lp, hp}) => (lp * 0.65 + hp * 0.35) * envAD(t, 0.002, 0.025)),
  EMOTE_EXCLAIM: () => notes([{t: 0, f: 1174.6, dur: 0.08}, {t: 0.08, f: 1567.9, dur: 0.15}], bell, 0.08),
  EMOTE_QUESTION: () => sweep(0.32, 560, 960, bell, (t) => envAD(t, 0.01, 0.12) * 0.52),
  EMOTE_IDEA: () =>
    notes(
      [
        {t: 0, f: 1568, dur: 0.35},
        {t: 0.06, f: 2093, dur: 0.45, vol: 0.45},
      ],
      bell,
      0.24,
    ),
  EMOTE_HEART: () =>
    notes(
      [
        {t: 0, f: 1046.5, dur: 0.12},
        {t: 0.08, f: 1318.5, dur: 0.12},
        {t: 0.16, f: 1568, dur: 0.28},
      ],
      bell,
      0.16,
    ),
  HIGH_FIVE_CLAP: () =>
    synth(
      0.32,
      ({t, hp, lp}) =>
        hp * envAD(t, 0.002, 0.04) * 0.75 +
        lp * envAD(t, 0.004, 0.08) * 0.4 +
        Math.sin(2 * Math.PI * 1318 * t) * envAD(t, 0.005, 0.09) * 0.22,
    ),
  WARNING_BEEP: () =>
    notes(
      [
        {t: 0, f: 440, dur: 0.11},
        {t: 0.15, f: 523.25, dur: 0.14},
      ],
      sq,
      0.08,
    ),
  STAMP: () => synth(0.28, ({t, lp}) => (Math.sin(2 * Math.PI * 95 * t) * 0.72 + lp * 0.5) * envAD(t, 0.003, 0.06)),

  // 12.2 Transisi & portal
  TR_WHOOSH: () => synth(0.5, ({t, hp, lp}) => (hp * 0.45 + lp * 0.55) * Math.sin((Math.PI * t) / 0.5) * 0.82),
  TR_WHIP: () => sweep(0.32, 1300, 290, tri, (t) => envAD(t, 0.01, 0.1)),
  TR_CURTAIN: () =>
    synth(1.4, ({t, hp, lp}) => (hp * 0.4 + lp * 0.6) * Math.sin((Math.PI * t) / 1.4) * (0.65 + 0.35 * Math.sin(t * 18))),
  TR_IRIS: () => sweep(0.7, 780, 220, bell, (t) => envAD(t, 0.02, 0.24)),
  TR_LIGHT_FLASH: () =>
    synth(0.8, ({t, hp}) => (Math.sin(2 * Math.PI * 523.25 * t) * 0.3 + Math.sin(2 * Math.PI * 784 * t) * 0.22 + hp * 0.4) * envAD(t, 0.06, 0.32)),
  TR_PIXEL_DISSOLVE: () =>
    synth(
      0.95,
      ({t, white}) =>
        (Math.sin(2 * Math.PI * (340 + (Math.floor(t * 20) % 6) * 120) * t) * 0.32 + white * 0.18) *
        envAD(t, 0.04, 0.36),
    ),
  HAND_COVER_THUMP: () => synth(0.45, ({t, lp}) => (Math.sin(2 * Math.PI * 82 * t) * 0.75 + lp * 0.45) * envAD(t, 0.004, 0.12)),
  PORTAL_SUB_RUMBLE: () =>
    synth(3.2, ({t, lp}) => (Math.sin(2 * Math.PI * 55 * t) * 0.55 + lp * 0.25) * Math.sin((Math.PI * t) / 3.2)),
  HAND_UNCOVER_RUSTLE: () => synth(0.8, ({t, hp}) => hp * envAD(t, 0.05, 0.28) * 0.55),
  PORTAL_SHIMMER_SWELL: () =>
    synth(
      2.6,
      ({t}) =>
        (Math.sin(2 * Math.PI * 523.25 * t) * 0.3 +
          Math.sin(2 * Math.PI * 659.25 * t) * 0.28 +
          Math.sin(2 * Math.PI * 1046.5 * t) * 0.22) *
        Math.sin((Math.PI * t) / 2.6),
    ),

  // 12.3 Ambience (loop 5.3 dtk)
  AMB_STAGE: () => makeLoopAmbience(5.3, ({t, lp}) => lp * 0.32 + Math.sin(2 * Math.PI * 64 * t) * 0.08),
  AMB_KITCHEN: () => makeLoopAmbience(5.3, ({t, lp}) => lp * 0.25 + Math.sin(2 * Math.PI * 110 * t) * 0.06),
  AMB_WATER_UNDER: () =>
    makeLoopAmbience(5.3, ({t, lp}) => lp * 0.42 + Math.sin(2 * Math.PI * (140 + 40 * Math.sin(t * 7)) * t) * 0.1),
  AMB_LAB: () =>
    makeLoopAmbience(
      5.3,
      ({t, lp}) =>
        lp * 0.2 +
        Math.sin(2 * Math.PI * 95 * t) * 0.05 +
        (Math.sin(t * 11) > 0.85 ? Math.sin(2 * Math.PI * 680 * t) * 0.06 : 0),
    ),
  AMB_WORKSHOP: () => makeLoopAmbience(5.3, ({lp}) => lp * 0.26),
  AMB_CINEMA_ROOM: () => makeLoopAmbience(5.3, ({t, lp}) => lp * 0.2 + Math.sin(2 * Math.PI * 120 * t) * 0.05),
  AMB_SHOWROOM: () => makeLoopAmbience(5.3, ({lp}) => lp * 0.18),
  AMB_OBSERVATORY: () => makeLoopAmbience(5.3, ({t, lp}) => lp * 0.18 + Math.sin(2 * Math.PI * 82 * t) * 0.1),
  AMB_LIBRARY: () => makeLoopAmbience(5.3, ({lp}) => lp * 0.18),
  AMB_OFFICE: () => makeLoopAmbience(5.3, ({lp}) => lp * 0.2),
  AMB_NIGHT_ROOFTOP: () =>
    makeLoopAmbience(5.3, ({t, lp}) => lp * 0.26 + (Math.sin(t * 28) > 0.72 ? Math.sin(2 * Math.PI * 3600 * t) * 0.04 : 0)),

  // 12.4 Foley & sains
  FLASK_BUBBLE: () =>
    synth(
      1.8,
      ({t, lp}) =>
        lp * 0.2 +
        (Math.sin(t * 22) > 0.4 ? Math.sin(2 * Math.PI * (380 + ((t * 420) % 340)) * t) * 0.45 : 0) *
          Math.sin((Math.PI * t) / 1.8),
    ),
  SIZZLE: () => synth(4.0, ({t, hp}) => hp * (0.4 + 0.35 * Math.sin(t * 17)) * envAD(t, 0.1, 2.5)),
  OIL_POUR: () => synth(3.0, ({t, lp}) => lp * (0.5 + 0.4 * Math.sin(t * 12)) * Math.sin((Math.PI * t) / 3.0)),
  OIL_DRAIN_GLUG: () =>
    synth(2.0, ({t, lp}) => Math.sin(2 * Math.PI * (180 + 90 * Math.sin(t * 14)) * t) * 0.5 * envAD(t, 0.05, 0.9) + lp * 0.3),
  BUBBLES_LOOP: () =>
    makeLoopAmbience(
      5.3,
      ({t, lp}) => lp * 0.22 + (Math.floor(t * 4) % 3 === 0 ? Math.sin(2 * Math.PI * (340 + ((t * 180) % 240)) * t) * 0.25 : 0),
    ),
  HEAT_SHIMMER: () =>
    synth(2.0, ({t, hp}) => (Math.sin(2 * Math.PI * 320 * t) * 0.22 + hp * 0.35) * Math.sin((Math.PI * t) / 2.0)),
  MOLECULE_SNAP: () => notes([{t: 0, f: 987.8, dur: 0.06}, {t: 0.045, f: 1480, dur: 0.12}], bell, 0.05),
  MOLECULE_JIGGLE: () => synth(3.0, ({t}) => Math.sin(2 * Math.PI * (420 + 60 * Math.sin(t * 24)) * t) * 0.26),
  CHALK_SCRIBBLE: () =>
    synth(1.4, ({t, hp}) => hp * (0.3 + 0.5 * Math.abs(Math.sin(t * 15))) * Math.sin((Math.PI * t) / 1.4)),
  STRAINER_DRIP: () =>
    synth(
      2.5,
      ({t}) =>
        (Math.floor(t * 5) !== Math.floor((t - 0.03) * 5) ? Math.sin(2 * Math.PI * 950 * t) * 0.5 : 0) +
        Math.sin(2 * Math.PI * 520 * t) * 0.05,
    ),
  WAX_MELT: () => synth(3.5, ({t, lp, hp}) => (lp * 0.4 + hp * 0.25) * Math.sin((Math.PI * t) / 3.5)),
  SPOON_STIR: () =>
    synth(2.5, ({t, lp}) => lp * 0.35 + Math.sin(2 * Math.PI * 640 * t) * (0.18 + 0.18 * Math.sin(t * 9))),
  JAR_POUR: () => sweep(2.5, 280, 560, Math.sin, (t) => Math.sin((Math.PI * t) / 2.5) * 0.55),
  COOL_CRYSTAL: () =>
    notes(
      [
        {t: 0, f: 1318, dur: 0.25},
        {t: 0.2, f: 1760, dur: 0.32},
        {t: 0.4, f: 2093, dur: 0.55},
      ],
      bell,
      0.26,
    ),
  MATCH_STRIKE: () => synth(0.8, ({t, hp}) => hp * envAD(t, 0.02, 0.18)),
  FLAME_IGNITE: () =>
    synth(0.9, ({t, lp}) => lp * envAD(t, 0.03, 0.28) + Math.sin(2 * Math.PI * 140 * t) * envAD(t, 0.01, 0.14) * 0.5),
  FLAME_LOOP: () => makeLoopAmbience(5.3, ({t, lp}) => lp * (0.28 + 0.14 * Math.sin(t * 6))),
  O2_SWIRL: () => synth(2.0, ({t, hp}) => hp * Math.sin((Math.PI * t) / 2.0) * 0.55),
  SOFA_SIT: () => synth(0.55, ({t, lp}) => lp * envAD(t, 0.02, 0.14) * 0.78),
  TV_ON: () => sweep(0.9, 60, 2600, Math.sin, (t) => envAD(t, 0.05, 0.35) * 0.38),
  CRT_STATIC_POP: () => synth(0.35, ({t, white}) => white * envAD(t, 0.004, 0.08)),
  CAMERA_SHUTTER: () =>
    synth(0.25, ({t, hp}) => hp * (t < 0.06 || (t > 0.09 && t < 0.15) ? 0.8 : 0.05)),
  COUNTER_ROLL: () =>
    synth(2.8, ({t}) => (Math.floor(t * 14) % 2 === 0 ? 1 : 0) * Math.sin(2 * Math.PI * (600 + t * 220) * t) * 0.38),
  BARREL_THUD: () =>
    synth(0.45, ({t, lp}) => (Math.sin(2 * Math.PI * 82 * t) * 0.72 + lp * 0.3) * envAD(t, 0.005, 0.14)),
  DOT_POP: () => sweep(0.06, 860, 1280, bell, (t) => envAD(t, 0.002, 0.02) * 0.52),
  LADDER_CREAK: () => sweep(0.9, 260, 190, tri, (t) => Math.sin((Math.PI * t) / 0.9) * 0.38),
  PAGE_TURN: () => synth(0.5, ({t, hp}) => hp * envAD(t, 0.03, 0.14) * 0.65),
  BOOK_THUD: () =>
    synth(0.45, ({t, lp}) => (Math.sin(2 * Math.PI * 105 * t) * 0.65 + lp * 0.4) * envAD(t, 0.004, 0.1)),
  PAPER_SLIDE: () => synth(0.45, ({t, hp}) => hp * envAD(t, 0.04, 0.14) * 0.52),
  JAR_PLACE: () => notes([{t: 0, f: 740, dur: 0.14}], bell, 0.07),
  WICK_PLACE: () => notes([{t: 0, f: 1620, dur: 0.16}], bell, 0.06),
};

function main() {
  fs.mkdirSync(SFX_DIR, {recursive: true});
  const manifest = [];
  let created = 0;

  for (const [id, gen] of Object.entries(CATALOG)) {
    const fname = `${id}.wav`;
    const outPath = path.join(SFX_DIR, fname);
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
    const samples = gen();
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
  console.log(`SFX ready: ${manifest.length} total (${created} synthesized).`);
}

main();
