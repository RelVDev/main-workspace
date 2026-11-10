// Sintesis musik lembut + SFX halus (tanpa aset luar). Hasil: public/music.wav, public/sfx/*.wav
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(join(root, 'sfx'), {recursive: true});

let seed = 12345;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noise = () => rand() * 2 - 1;
const TAU = Math.PI * 2;

const toWav = (buf, sr) => {
  const n = buf.length;
  const out = Buffer.alloc(44 + n * 2);
  out.write('RIFF', 0);
  out.writeUInt32LE(36 + n * 2, 4);
  out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(sr, 24);
  out.writeUInt32LE(sr * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write('data', 36);
  out.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buf[i])) * 32767), 44 + i * 2);
  return out;
};

const SR = 44100;
const make = (dur, fn) => {
  const n = Math.floor(dur * SR);
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) b[i] = fn(i / SR, i);
  // fade pendek di ujung agar tidak "klik"
  const f = Math.min(n, 300);
  for (let i = 0; i < f; i++) b[n - 1 - i] *= i / f;
  return b;
};
const save = (name, buf, sr = SR) => writeFileSync(join(root, 'sfx', `${name}.wav`), toWav(buf, sr));
const env = (t, d) => Math.exp(-t * d);

// whoosh
{
  let y = 0;
  save('whoosh', make(0.7, (t) => {
    const u = t / 0.7;
    const a = 0.02 + 0.22 * Math.sin(u * Math.PI);
    y += a * (noise() - y);
    return y * Math.pow(Math.sin(u * Math.PI), 1.5) * 2.2;
  }));
}
// startle
save('startle', make(0.5, (t) => {
  const f = t < 0.13 ? 600 + (t / 0.13) * 300 : 800 + Math.min(1, (t - 0.13) / 0.15) * 500;
  const e = t < 0.13 ? Math.sin((t / 0.13) * Math.PI) : env(t - 0.13, 6);
  return (Math.sin(TAU * f * t) + 0.3 * Math.sin(TAU * f * 2 * t)) * e * 0.35;
}));
// tick
save('tick', make(0.1, (t) => (Math.sin(TAU * 1800 * t) * env(t, 90) + noise() * env(t, 200) * 0.4) * 0.6));
// drip
save('drip', make(0.3, (t) => Math.sin(TAU * (400 + 500 * env(t, 25)) * t) * env(t, 18) * 0.5));
// ping
save('ping', make(1.0, (t) => (Math.sin(TAU * 1318 * t) + 0.3 * Math.sin(TAU * 2636 * t)) * env(t, 5) * 0.35));
// power
save('power', make(1.0, (t) => {
  const notes = [523, 659, 784, 1046];
  let s = 0;
  notes.forEach((f, i) => {
    const tt = t - i * 0.12;
    if (tt > 0) s += Math.sin(TAU * f * tt) * env(tt, 7) * 0.25;
  });
  return s;
}));
// click (relay)
save('click', make(0.15, (t) => {
  let s = Math.sin(TAU * 1200 * t) * env(t, 120) * 0.5 + noise() * env(t, 300) * 0.5;
  const t2 = t - 0.035;
  if (t2 > 0) s += (Math.sin(TAU * 900 * t2) * env(t2, 140) * 0.35 + noise() * env(t2, 350) * 0.3);
  return s * 0.9;
}));
// fan
{
  let y = 0;
  save('fan', make(2.8, (t) => {
    y += 0.08 * (noise() - y);
    const a = Math.min(1, t / 1.2) * 0.9;
    return (y * 3.2 + Math.sin(TAU * 110 * t) * 0.05) * a * 0.35 * Math.min(1, (2.8 - t) / 0.4);
  }));
}
// chime
save('chime', make(1.8, (t) => {
  let s = Math.sin(TAU * 784 * t) * env(t, 3);
  const t2 = t - 0.18;
  if (t2 > 0) s += Math.sin(TAU * 1175 * t2) * env(t2, 3);
  return s * 0.28;
}));
// step
{
  let y = 0;
  save('step', make(0.15, (t) => {
    y += 0.15 * (noise() - y);
    return (Math.sin(TAU * (60 + 60 * env(t, 30)) * t) * env(t, 38) * 0.6 + y * env(t, 50) * 0.5) * 0.8;
  }));
}
// pop
save('pop', make(0.2, (t) => Math.sin(TAU * (300 + 500 * Math.min(1, t / 0.04)) * t) * env(t, 45) * 0.5));
// send
save('send', make(0.8, (t) => {
  let s = 0;
  for (let i = 0; i < 6; i++) {
    const tt = t - i * 0.09;
    if (tt > 0) s += Math.sin(TAU * (900 + i * 120) * tt) * env(tt, 30) * 0.3;
  }
  return s;
}));
// door
{
  let y = 0;
  save('door', make(1.0, (t) => {
    const creak = Math.sin(TAU * (170 + 50 * Math.sin(t * 7) + 80 * t) * t) * (t < 0.6 ? Math.sin((t / 0.6) * Math.PI) : 0) * 0.18;
    y += 0.1 * (noise() - y);
    return creak + y * (t < 0.6 ? 0.25 : 0) + (t > 0.62 ? Math.sin(TAU * 70 * (t - 0.62)) * env(t - 0.62, 14) * 0.5 : 0);
  }));
}
// skid
{
  let y = 0;
  save('skid', make(0.5, (t) => {
    const u = t / 0.5;
    y += (0.35 - 0.3 * u) * (noise() - y);
    return y * 2.0 * Math.pow(1 - u, 1.2) * 0.8;
  }));
}
// sad
save('sad', make(1.0, (t) => {
  const f = t < 0.45 ? 392 : t < 0.9 ? 330 : 294;
  const vib = 1 + 0.015 * Math.sin(TAU * 6 * t);
  return Math.sin(TAU * f * vib * t) * Math.min(1, t / 0.05) * env(t, 2.2) * 0.3;
}));
// warn
save('warn', make(0.7, (t) => {
  const f = t < 0.3 ? 660 : 520;
  const tt = t < 0.3 ? t : t - 0.3;
  return Math.sin(TAU * f * t) * env(tt, 6) * 0.3;
}));

// ---------- musik ----------
{
  const MSR = 22050;
  const DUR = 120;
  const n = MSR * DUR;
  const m = new Float32Array(n);
  const bpm = 84;
  const beat = 60 / bpm;
  const bar = beat * 4;
  const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
  const chords = [
    [48, 52, 55, 59],
    [45, 48, 52, 55],
    [41, 45, 48, 52],
    [43, 47, 50, 52],
  ];
  const bars = Math.ceil(DUR / bar);
  for (let b = 0; b < bars; b++) {
    const ch = chords[b % 4];
    const start = b * bar - 0.4;
    const len = bar + 1.2;
    const i0 = Math.max(0, Math.floor(start * MSR));
    const i1 = Math.min(n, Math.floor((start + len) * MSR));
    for (const note of ch) {
      const f = hz(note);
      for (let i = i0; i < i1; i++) {
        const tt = i / MSR - start;
        const e = Math.min(1, tt / 0.9) * Math.min(1, (len - tt) / 0.9);
        m[i] += (Math.sin(TAU * f * tt) + 0.25 * Math.sin(TAU * f * 2 * tt)) * e * 0.05;
      }
    }
    // bass
    const fb = hz(ch[0] - 12);
    for (let i = Math.max(0, Math.floor(b * bar * MSR)); i < Math.min(n, Math.floor((b + 1) * bar * MSR)); i++) {
      const tt = i / MSR - b * bar;
      m[i] += Math.sin(TAU * fb * tt) * Math.min(1, tt / 0.1) * Math.min(1, (bar - tt) / 0.3) * 0.07;
    }
    // arpeggio kalimba
    const pat = [0, 2, 1, 3, 2, 1, 3, 2];
    for (let k = 0; k < 8; k++) {
      const t0 = b * bar + k * (beat / 2);
      const f = hz(ch[pat[k]] + 24);
      const a = Math.floor(t0 * MSR);
      const L = Math.floor(0.9 * MSR);
      for (let j = 0; j < L && a + j < n; j++) {
        const tt = j / MSR;
        m[a + j] += (Math.sin(TAU * f * tt) + 0.15 * Math.sin(TAU * f * 3 * tt)) * Math.exp(-tt * 5) * 0.09 * (k % 2 === 0 ? 1 : 0.7);
      }
    }
  }
  // gema lembut
  const d1 = Math.floor(0.29 * MSR);
  const d2 = Math.floor(0.43 * MSR);
  for (let i = 0; i < n; i++) {
    if (i >= d1) m[i] += 0.28 * m[i - d1];
    if (i >= d2) m[i] += 0.2 * m[i - d2];
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(m[i]));
  for (let i = 0; i < n; i++) m[i] = (m[i] / peak) * 0.6;
  writeFileSync(join(root, 'music.wav'), toWav(m, MSR));
}
console.log('selesai: public/music.wav + public/sfx/*.wav');
