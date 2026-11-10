import {Timeline} from './timeline';
import {easeInOut, easeOut, prog, smooth} from './util';

/** Posisi tetap objek di dunia (koordinat dunia). */
export const L = {
  roof: {x0: 130, x1: 1270, yEave: 646, yRidge: 410},
  room: {x0: 200, x1: 1200, y0: 664, y1: 1250},
  sira: {x: 330, y: 800},
  therm: {x: 400, y: 770},
  clock: {x: 680, y: 830},
  lamp: {x: 760, y: 782},
  ac: {x: 980, y: 690, w: 200, h: 80},
  router: {x: 1140, y: 874},
  plug: {x: 1120, y: 1190},
  iron: {x: 985, y: 1078},
  hook: {x: 1055, y: 958},
  phoneTip: {x: 1735, y: 1060},
  panel: {cx: 1560, cy: 810, w: 240, h: 430},
  cloud: {x: 1450, y: 410},
};

/** Suhu ruangan (°C) */
export const tempAt = (t: number, T: Timeline): number =>
  29 +
  3 * easeInOut(prog(t, T.s(8), T.at(8, 0.9))) -
  8 * easeInOut(prog(t, T.at(11, 0.75), T.at(12, 0.9)));

/** Kecerahan lampu 0..1 */
export const lampAt = (t: number, T: Timeline): number => {
  const off = T.at(23, 0.32);
  if (t > off - 0.4 && t < off) return 0.55 + 0.45 * Math.abs(Math.sin((t - off) * 38));
  return 1 - smooth(prog(t, off, off + 0.3));
};

/** Panas setrika 0..1 */
export const ironAt = (t: number, T: Timeline): number => {
  const off = T.at(25, 0.3);
  return 1 - smooth(prog(t, off, off + 1.6));
};
export const ironOnAt = (t: number, T: Timeline): boolean => t < T.at(25, 0.3);

export const acStage = (t: number, T: Timeline) => {
  const sigA = T.at(11, 0.3);
  const sigB = T.at(11, 0.5);
  const openA = T.at(11, 0.55);
  const openB = T.at(11, 0.85);
  const fanA = T.at(11, 0.7);
  const fanB = T.at(12, 0.1);
  const ramp = prog(t, fanA, fanB);
  const span = fanB - fanA;
  const integ = t < fanA ? 0 : t < fanB ? (span * ramp * ramp) / 2 : span / 2 + (t - fanB);
  return {
    led: t < sigA ? 'off' : t < sigB ? 'blink' : 'on',
    on: t >= sigB,
    open: easeOut(prog(t, openA, openB)),
    fanAngle: 540 * integ,
    air: smooth(prog(t, T.at(11, 0.8), T.at(12, 0.5))),
    tint: smooth(prog(t, T.at(11, 0.9), T.at(12, 0.95))),
  };
};

export const doorOpenAt = (t: number, T: Timeline): number => easeOut(prog(t, T.at(13, 0.5), T.at(13, 0.62)));
export const bagTakenAt = (t: number, T: Timeline): boolean => t >= T.at(13, 0.5);
export const kemejaAt = (t: number, T: Timeline): boolean => t >= T.at(13, 0.12);
export const blanketFrontAt = (t: number, T: Timeline): boolean => t < T.at(5, 0.12);

/** Posisi alur data (polyline dunia) */
export const PATH_PHONE_CLOUD: [number, number][] = [
  [1735, 1050],
  [1700, 820],
  [1610, 610],
  [1510, 480],
];
export const PATH_CLOUD_ROUTER: [number, number][] = [
  [1400, 460],
  [1330, 640],
  [1250, 800],
  [1170, 862],
];
export const PATH_ROUTER_LAMP: [number, number][] = [
  [1140, 860],
  [1010, 830],
  [880, 790],
  [790, 764],
];
export const PATH_ROUTER_PLUG: [number, number][] = [
  [1140, 890],
  [1135, 1040],
  [1125, 1170],
];
export const PATH_SIRA_AC: [number, number][] = [
  [345, 752],
  [345, 678],
  [1060, 678],
  [1060, 692],
];
