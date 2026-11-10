import {Expr, Limb, POSE_STAND, Pose, lerpPose} from './Budi';
import {Timeline} from './timeline';
import {bagTakenAt, kemejaAt} from './state';
import {bump, clamp, easeInOut, easeOut, easeOutBack, lerp, prog, smooth} from './util';

export const SC = 0.8;
export const HIP_STAND = 1111;
const X0 = 443;
const LIE_Y = 1095;
const SIT_Y = 1118;
const X_STAND = 640;
const X_STOP = 1800;

const mk = (torso: number, head: number, armL: Limb, armR: Limb, legL: Limb, legR: Limb): Pose => ({torso, head, armL, armR, legL, legR});

const P_LIE = mk(0, 0, [-5, 0], [5, 0], [0, 0], [0, 0]);
const P_SIT_PANIC = mk(-4, 0, [-150, -25], [150, 25], [90, 0], [90, 0]);
const P_SIT_WIPE = mk(0, 0, [-6, 0], [135, 90], [90, 0], [90, 0]);
const P_SIT = mk(0, 0, [-6, 0], [8, 0], [90, 0], [90, 0]);
const P_HEAD = mk(0, 0, [-120, -102], [120, 102], [0, 0], [0, 0]);
const P_CHEER = mk(0, 0, [-70, 0], [70, 0], [0, 0], [0, 0]);
const P_THINK = mk(0, 8, [-6, 0], [110, 120], [0, 0], [0, 0]);
const P_DROOP = mk(-4, 12, [-4, 0], [4, 0], [0, 0], [0, 0]);
const P_PHONE = mk(0, 0, [-6, 0], [40, 110], [0, 0], [0, 0]);
const P_GRAB = mk(8, 0, [-40, 40], [130, 0], [25, -10], [-20, -30]);
const P_SKID = mk(-18, 0, [-70, -30], [50, 60], [50, 0], [-15, -30]);

const runPose = (t: number): Pose => {
  const ph = t * Math.PI * 2 * 3.0;
  const leg = (p: number): Limb => [55 * Math.sin(p), -(10 + 55 * Math.max(0, Math.cos(p + 0.6)))];
  const arm = (p: number): Limb => [-50 * Math.sin(p), 70];
  return mk(12, -4, arm(ph), arm(ph + Math.PI), leg(ph), leg(ph + Math.PI));
};
const walkPose = (t: number): Pose => {
  const ph = t * Math.PI * 2 * 1.5;
  const leg = (p: number): Limb => [26 * Math.sin(p), -(6 + 22 * Math.max(0, Math.cos(p + 0.6)))];
  const arm = (p: number): Limb => [-22 * Math.sin(p), 10];
  return mk(3, 0, arm(ph), arm(ph + Math.PI), leg(ph), leg(ph + Math.PI));
};

export type BudiState = {
  x: number;
  y: number;
  rot: number;
  pose: Pose;
  flip: boolean;
  expr: Expr;
  look: number;
  kemeja: boolean;
  tas: boolean;
  phone: boolean;
  pale: number;
  sweat: number;
  shadow: number;
};

export const budiAt = (t: number, T: Timeline): BudiState => {
  const s = (i: number): number => T.s(i);
  const at = (i: number, f: number): number => T.at(i, f);
  let x = X0;
  let y = LIE_Y;
  let rot = -90;
  let pose: Pose = P_LIE;
  let shadow = 0;
  let look = 0;

  const tW0 = at(1, 0.1);
  const tW1 = at(1, 0.3);
  const tJ0 = at(5, 0.15);
  const tJ1 = at(5, 0.55);
  const tRun0 = at(13, 0.18);
  const tGrab0 = at(13, 0.42);
  const tGrab1 = at(13, 0.52);

  if (t < tW0) {
    y = LIE_Y + Math.sin(t * 2) * 1.5;
  } else if (t < tW1) {
    const k = easeOutBack(prog(t, tW0, tW1));
    rot = lerp(-90, 0, k);
    y = lerp(LIE_Y, SIT_Y, clamp(k, 0, 1.2));
    pose = lerpPose(P_LIE, P_SIT_PANIC, clamp(k, 0, 1));
  } else if (t < s(2)) {
    rot = 0;
    y = SIT_Y;
    x = X0 + Math.sin(t * 40) * 2;
    pose = P_SIT_PANIC;
  } else if (t < s(3)) {
    rot = 0;
    y = SIT_Y;
    const k = smooth(prog(t, s(2), s(2) + 0.3));
    pose = lerpPose(P_SIT_PANIC, P_SIT_WIPE, k);
    pose = {...pose, armR: [pose.armR[0], pose.armR[1] + 12 * Math.sin(t * 10) * k]};
  } else if (t < s(4)) {
    rot = 0;
    y = SIT_Y;
    pose = lerpPose(P_SIT_WIPE, P_SIT, smooth(prog(t, s(3), s(3) + 0.3)));
    pose = {...pose, head: 10 * smooth(prog(t, s(3) + 0.2, s(3) + 0.6))};
    look = 1;
  } else if (t < tJ0) {
    rot = 0;
    y = SIT_Y;
    x = X0 + Math.sin(t * 40) * 2.5;
    pose = P_SIT_PANIC;
  } else if (t < tJ1) {
    const k = prog(t, tJ0, tJ1);
    rot = 0;
    x = lerp(X0, X_STAND, easeInOut(k));
    y = lerp(SIT_Y, HIP_STAND, easeInOut(k)) - 150 * Math.sin(k * Math.PI);
    pose = lerpPose(P_SIT_PANIC, P_HEAD, smooth(k));
    shadow = 1 - 0.6 * Math.sin(k * Math.PI);
  } else if (t < s(6)) {
    rot = 0;
    x = X_STAND + Math.sin(t * 38) * 2;
    y = HIP_STAND;
    pose = P_HEAD;
    shadow = 1;
  } else if (t < at(12, 0.1)) {
    rot = 0;
    x = X_STAND;
    y = HIP_STAND + Math.sin(t * 2.2) * 1.5;
    pose = lerpPose(P_HEAD, P_STAND_IDLE(t), smooth(prog(t, s(6), at(6, 0.5))));
    shadow = 1;
  } else if (t < tRun0) {
    rot = 0;
    x = X_STAND;
    y = HIP_STAND;
    const k = smooth(prog(t, at(12, 0.1), at(12, 0.1) + 0.4)) * (1 - smooth(prog(t, at(13, 0.0), at(13, 0.1))));
    pose = lerpPose(POSE_STAND, P_CHEER, k);
    shadow = 1;
  } else if (t < tGrab0) {
    const k = prog(t, tRun0, tGrab0);
    x = lerp(X_STAND, 945, smooth(k));
    y = HIP_STAND - Math.abs(Math.sin(t * Math.PI * 3)) * 8;
    rot = 0;
    pose = runPose(t);
    shadow = 1;
  } else if (t < tGrab1) {
    x = 945;
    y = HIP_STAND - 10 * Math.sin(prog(t, tGrab0, tGrab1) * Math.PI);
    rot = 0;
    pose = P_GRAB;
    shadow = 1;
  } else if (t < s(14)) {
    const k = easeOut(prog(t, tGrab1, s(14)));
    x = lerp(945, 1330, k);
    y = HIP_STAND - Math.abs(Math.sin(t * Math.PI * 3)) * 8;
    rot = 0;
    pose = runPose(t);
    shadow = 1;
  } else if (t < s(15)) {
    x = lerp(1330, 1380, prog(t, s(14), s(15)));
    y = HIP_STAND - Math.abs(Math.sin(t * Math.PI * 3)) * 8;
    rot = 0;
    pose = runPose(t);
    shadow = 1;
  } else if (t < at(15, 0.5)) {
    x = lerp(1380, 1770, easeInOut(prog(t, s(15), at(15, 0.5))) * 0.5 + 0.5 * prog(t, s(15), at(15, 0.5)));
    y = HIP_STAND - Math.abs(Math.sin(t * Math.PI * 3)) * 8;
    rot = 0;
    pose = runPose(t);
    shadow = 1;
  } else if (t < at(15, 0.72)) {
    const k = easeOut(prog(t, at(15, 0.5), at(15, 0.72)));
    x = lerp(1770, X_STOP, k);
    y = HIP_STAND;
    rot = 0;
    pose = lerpPose(P_SKID, POSE_STAND, smooth(prog(t, at(15, 0.62), at(15, 0.72))));
    shadow = 1;
  } else if (t < s(28)) {
    x = X_STOP;
    y = HIP_STAND + Math.sin(t * 2.2) * 1.2;
    rot = 0;
    shadow = 1;
    if (t < s(17)) {
      pose = lerpPose(POSE_STAND, P_THINK, smooth(prog(t, s(16), s(16) + 0.3)));
    } else if (t < s(19)) {
      const k = smooth(prog(t, s(17), s(17) + 0.15));
      pose = lerpPose(P_THINK, P_HEAD, k);
      x = X_STOP + Math.sin(t * 45) * 2 * bump(t, s(17), s(17) + 0.5) + Math.sin(t * 45) * 2 * bump(t, s(18), s(18) + 0.5);
    } else if (t < s(20)) {
      pose = lerpPose(P_HEAD, P_DROOP, smooth(prog(t, s(19), s(19) + 0.4)));
    } else if (t < s(26)) {
      const kp = smooth(prog(t, at(20, 0.4), at(20, 0.6)));
      pose = lerpPose(P_DROOP, P_PHONE, kp);
      pose = {...pose, head: lerp(pose.head, 0, kp)};
    } else {
      pose = P_PHONE;
      const kc = smooth(prog(t, s(26), at(26, 0.3)));
      pose = {...pose, armL: [lerp(-6, -155, kc), lerp(0, -15, kc)] as Limb};
      if (t > s(27)) pose = {...pose, armL: [lerp(-155, -6, smooth(prog(t, s(27), at(27, 0.2)))), 0] as Limb};
    }
  } else {
    const kEnd = at(29, 0.85);
    if (t < kEnd) {
      const k = prog(t, s(28), kEnd);
      x = lerp(X_STOP, 2420, k);
      y = HIP_STAND - Math.abs(Math.sin(t * Math.PI * 1.5)) * 4;
      pose = lerpPose(P_PHONE, walkPose(t), smooth(prog(t, s(28), s(28) + 0.4)));
    } else {
      x = 2420;
      y = HIP_STAND;
      const w = smooth(prog(t, kEnd, kEnd + 0.3));
      pose = lerpPose(walkPose(kEnd), mk(0, 0, [-6, 0], [160, 25 + 22 * Math.sin(t * 12)], [0, 0], [0, 0]), w);
    }
    rot = 0;
    shadow = 1;
  }

  // ekspresi
  let expr: Expr = 'tidur';
  const E: [number, Expr][] = [
    [at(1, 0.12), 'kaget'],
    [s(2), 'sedih'],
    [s(3), 'netral'],
    [at(3, 0.72), 'kaget'],
    [s(6), 'netral'],
    [at(6, 0.5), 'tekad'],
    [at(12, 0.1), 'senang'],
    [s(13), 'tekad'],
    [at(15, 0.5), 'kaget'],
    [at(16, 0.45), 'kaget'],
    [s(19), 'sedih'],
    [s(20), 'tekad'],
    [at(20, 0.3), 'senang'],
  ];
  E.forEach(([tt, e]) => {
    if (t >= tt) expr = e;
  });
  if (t >= at(16, 0.0) && t < at(16, 0.45)) expr = 'netral';

  const sweatBase =
    t < tW1 ? 0 : t < s(6) ? 1 : t < at(7, 0) ? 0.4 * (1 - prog(t, s(6), s(7))) : t < s(13) ? 0 : t < s(16) ? 0.3 : t < s(20) ? 0.9 : 0.9 * (1 - prog(t, s(20), at(20, 0.3)));
  const pale = t < s(20) ? smooth(prog(t, s(19), at(19, 0.35))) : 1 - smooth(prog(t, s(20), at(20, 0.15)));

  return {
    x,
    y,
    rot,
    pose,
    flip: t >= at(15, 0.72) && t < s(28),
    expr,
    look,
    kemeja: kemejaAt(t, T),
    tas: bagTakenAt(t, T),
    phone: t >= at(20, 0.45) && t < at(28, 0.05),
    pale: clamp(pale),
    sweat: clamp(sweatBase),
    shadow,
  };
};

function P_STAND_IDLE(t: number): Pose {
  return {...POSE_STAND, torso: Math.sin(t * 2.2) * 1.5};
}
