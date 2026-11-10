import {Timeline} from './timeline';

export type Cue = {t: number; file: string; vol: number};

/** durasi file SFX (detik) - sesuai scripts/synth-audio.mjs */
export const SFX_DUR: Record<string, number> = {
  whoosh: 0.7,
  startle: 0.5,
  tick: 0.1,
  drip: 0.3,
  ping: 1.0,
  power: 1.0,
  click: 0.15,
  fan: 2.8,
  chime: 1.8,
  step: 0.15,
  pop: 0.2,
  send: 0.8,
  door: 1.0,
  skid: 0.5,
  sad: 1.0,
  warn: 0.7,
};

/** Semua SFX ditempatkan relatif terhadap awal adegan (ikut timing.json). */
export const buildCues = (T: Timeline): Cue[] => {
  const c: Cue[] = [];
  const add = (t: number, file: string, vol = 0.6): void => {
    c.push({t: Math.max(0, t), file, vol});
  };
  const steps = (a: number, b: number, every: number, vol: number): void => {
    for (let t = a; t < b; t += every) add(t, 'step', vol);
  };
  add(T.at(0, 0.45), 'whoosh', 0.35);
  add(T.at(1, 0.12), 'startle', 0.7);
  add(T.at(2, 0.2), 'drip', 0.5);
  add(T.at(2, 0.55), 'drip', 0.5);
  for (let t = T.s(3); t < T.at(3, 0.7); t += 0.5) add(t, 'tick', 0.45);
  add(T.at(3, 0.72), 'startle', 0.8);
  add(T.s(4), 'startle', 0.9);
  add(T.at(5, 0.15), 'whoosh', 0.4);
  add(T.at(5, 0.55), 'step', 0.9);
  add(T.s(6) + 0.1, 'ping', 0.3);
  for (let i = 0; i < 4; i++) add(T.at(7, 0.1 + i * 0.2) + 0.1, 'pop', 0.5);
  [0.1, 0.4, 0.7].forEach((f) => add(T.at(8, f), 'ping', 0.45));
  add(T.s(9), 'power', 0.6);
  add(T.s(10) + 0.1, 'warn', 0.5);
  add(T.at(11, 0.02), 'send', 0.5);
  add(T.at(11, 0.5), 'click', 0.8);
  add(T.at(11, 0.7), 'fan', 0.35);
  add(T.at(12, 0.55), 'chime', 0.45);
  add(T.at(13, 0.12), 'pop', 0.7);
  steps(T.at(13, 0.18), T.at(13, 0.42), 0.17, 0.5);
  add(T.at(13, 0.52), 'door', 0.5);
  steps(T.at(13, 0.55), T.e(13), 0.17, 0.5);
  add(T.s(14) + 0.4, 'warn', 0.5);
  steps(T.s(15), T.at(15, 0.5), 0.17, 0.5);
  add(T.at(15, 0.5), 'skid', 0.7);
  add(T.s(16), 'pop', 0.6);
  add(T.s(17), 'pop', 0.6);
  add(T.s(18), 'pop', 0.6);
  add(T.s(19), 'sad', 0.6);
  add(T.at(20, 0.3), 'ping', 0.45);
  add(T.at(20, 0.55), 'pop', 0.6);
  add(T.at(21, 0.06), 'click', 0.5);
  add(T.at(21, 0.1), 'send', 0.5);
  add(T.at(21, 0.32), 'ping', 0.45);
  add(T.at(21, 0.7), 'ping', 0.45);
  add(T.at(21, 0.74), 'send', 0.5);
  add(T.at(22, 0.08), 'click', 0.9);
  add(T.at(23, 0.32), 'click', 0.6);
  add(T.at(24, 0.08), 'click', 0.9);
  add(T.at(25, 0.3), 'click', 0.6);
  add(T.at(26, 0.15), 'chime', 0.5);
  add(T.at(27, 0.16), 'pop', 0.5);
  add(T.at(27, 0.4), 'pop', 0.5);
  add(T.at(27, 0.62), 'pop', 0.5);
  add(T.at(27, 0.82), 'chime', 0.5);
  add(T.at(28, 0.2), 'pop', 0.5);
  add(T.at(28, 0.45), 'pop', 0.5);
  steps(T.s(28) + 0.3, T.at(29, 0.85), 0.4, 0.22);
  add(T.at(29, 0.85), 'chime', 0.55);
  return c;
};
