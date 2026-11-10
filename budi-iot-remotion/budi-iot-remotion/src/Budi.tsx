import React from 'react';
import {INK, mix, rad} from './util';

export type Expr = 'netral' | 'senang' | 'sedih' | 'kaget' | 'tekad' | 'tidur';
/** [sudut atas, sudut tambahan bawah (siku/lutut)]; 0 = lurus ke bawah, 90 = ke kanan, 180 = ke atas */
export type Limb = [number, number];
export type Pose = {torso: number; head: number; armL: Limb; armR: Limb; legL: Limb; legR: Limb};

export const POSE_STAND: Pose = {torso: 0, head: 0, armL: [-6, 0], armR: [6, 0], legL: [0, 0], legR: [0, 0]};

export const lerpPose = (a: Pose, b: Pose, k: number): Pose => {
  const l = (x: number, y: number): number => x + (y - x) * k;
  const l2 = (x: Limb, y: Limb): Limb => [l(x[0], y[0]), l(x[1], y[1])];
  return {
    torso: l(a.torso, b.torso),
    head: l(a.head, b.head),
    armL: l2(a.armL, b.armL),
    armR: l2(a.armR, b.armR),
    legL: l2(a.legL, b.legL),
    legR: l2(a.legR, b.legR),
  };
};

export type BudiProps = {
  /** posisi pinggul di dunia */
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  /** rotasi seluruh badan (derajat) di sekitar pinggul */
  rot?: number;
  pose: Pose;
  expr: Expr;
  /** arah pandang mata (-1..1) */
  look?: number;
  kemeja?: boolean;
  tas?: boolean;
  phone?: boolean;
  /** 0..1 wajah memucat */
  pale?: number;
  /** 0..1 intensitas keringat */
  sweat?: number;
  /** waktu (detik) untuk animasi kecil */
  t: number;
};

const SKIN = '#f2c48d';
const KAOS = '#2a9d8f';
const KEMEJA = '#d9593d';
const COLLAR = '#f4f1de';
const PANTS = '#2f4858';
const SHOE = '#f4f1de';
const BAG = '#e09f3e';
const PALE = '#cdd3c2';
const LEG_W = 30;
const ARM_W = 24;
const OUT = 5;

const dir = (deg: number): [number, number] => [Math.sin(rad(deg)), Math.cos(rad(deg))];

type LimbProps = {
  sx: number;
  sy: number;
  a: Limb;
  l1: number;
  l2: number;
  w: number;
  c1: string;
  c2: string;
};

const LimbShape: React.FC<LimbProps> = ({sx, sy, a, l1, l2, w, c1, c2}) => {
  const [d1x, d1y] = dir(a[0]);
  const [d2x, d2y] = dir(a[0] + a[1]);
  const ex = sx + d1x * l1;
  const ey = sy + d1y * l1;
  const hx = ex + d2x * l2;
  const hy = ey + d2y * l2;
  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={INK} strokeWidth={w + OUT * 2} />
      <line x1={ex} y1={ey} x2={hx} y2={hy} stroke={INK} strokeWidth={w + OUT * 2} />
      <line x1={sx} y1={sy} x2={ex} y2={ey} stroke={c1} strokeWidth={w} />
      <line x1={ex} y1={ey} x2={hx} y2={hy} stroke={c2} strokeWidth={w} />
    </g>
  );
};

const endPoint = (sx: number, sy: number, a: Limb, l1: number, l2: number): [number, number] => {
  const [d1x, d1y] = dir(a[0]);
  const [d2x, d2y] = dir(a[0] + a[1]);
  return [sx + d1x * l1 + d2x * l2, sy + d1y * l1 + d2y * l2];
};

const Leg: React.FC<{sx: number; a: Limb}> = ({sx, a}) => {
  const [fx, fy] = endPoint(sx, 0, a, 76, 76);
  return (
    <g>
      <LimbShape sx={sx} sy={0} a={a} l1={76} l2={76} w={LEG_W} c1={PANTS} c2={PANTS} />
      <g transform={`translate(${fx} ${fy}) rotate(${-(a[0] + a[1])})`}>
        <ellipse cx={12} cy={8} rx={27} ry={14} fill={SHOE} stroke={INK} strokeWidth={5} />
        <path d="M -8 14 L 30 14" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      </g>
    </g>
  );
};

const Arm: React.FC<{sx: number; a: Limb; kemeja: boolean; phone: boolean}> = ({sx, a, kemeja, phone}) => {
  const sy = -118;
  const [hx, hy] = endPoint(sx, sy, a, 62, 58);
  return (
    <g>
      <LimbShape sx={sx} sy={sy} a={a} l1={62} l2={58} w={ARM_W} c1={kemeja ? KEMEJA : KAOS} c2={kemeja ? KEMEJA : SKIN} />
      <circle cx={hx} cy={hy} r={15} fill={SKIN} stroke={INK} strokeWidth={5} />
      {phone ? (
        <g transform={`translate(${hx + 4} ${hy - 30})`}>
          <rect x={-15} y={-26} width={30} height={52} rx={6} fill="#23272e" stroke={INK} strokeWidth={4} />
          <rect x={-10} y={-20} width={20} height={36} rx={3} fill="#7fd6ff" />
          <circle cx={0} cy={20} r={2.5} fill="#8b93a1" />
        </g>
      ) : null}
    </g>
  );
};

const Face: React.FC<{expr: Expr; look: number; pale: number; sweat: number; t: number}> = ({expr, look, pale, sweat, t}) => {
  const skin = mix(SKIN, PALE, pale);
  const line = {stroke: INK, strokeWidth: 5, strokeLinecap: 'round' as const, fill: 'none'};
  const eyes = (): React.ReactNode => {
    switch (expr) {
      case 'tidur':
        return (
          <g {...line}>
            <path d="M -28 4 Q -19 12 -10 4" />
            <path d="M 10 4 Q 19 12 28 4" />
          </g>
        );
      case 'senang':
        return (
          <g {...line}>
            <path d="M -28 6 Q -19 -5 -10 6" />
            <path d="M 10 6 Q 19 -5 28 6" />
          </g>
        );
      case 'kaget':
        return (
          <g>
            <circle cx={-19} cy={2} r={11} fill="#fff" stroke={INK} strokeWidth={4} />
            <circle cx={19} cy={2} r={11} fill="#fff" stroke={INK} strokeWidth={4} />
            <circle cx={-19 + look * 5} cy={2} r={4.5} fill={INK} />
            <circle cx={19 + look * 5} cy={2} r={4.5} fill={INK} />
          </g>
        );
      default: {
        const o = look * 3;
        return (
          <g {...line}>
            <path d={`M ${-27 + o} 4 L ${-12 + o} 4`} />
            <path d={`M ${12 + o} 4 L ${27 + o} 4`} />
          </g>
        );
      }
    }
  };
  const brows = (): React.ReactNode => {
    switch (expr) {
      case 'sedih':
        return (
          <g {...line} strokeWidth={4.5}>
            <path d="M -30 -8 L -10 -17" />
            <path d="M 30 -8 L 10 -17" />
          </g>
        );
      case 'tekad':
        return (
          <g {...line} strokeWidth={6}>
            <path d="M -31 -18 L -9 -8" />
            <path d="M 31 -18 L 9 -8" />
          </g>
        );
      case 'kaget':
        return (
          <g {...line} strokeWidth={4.5}>
            <path d="M -30 -19 Q -19 -27 -8 -19" />
            <path d="M 8 -19 Q 19 -27 30 -19" />
          </g>
        );
      default:
        return null;
    }
  };
  const mouth = (): React.ReactNode => {
    switch (expr) {
      case 'senang':
        return <path d="M -17 20 Q 0 46 17 20 Z" fill="#8a2f2f" stroke={INK} strokeWidth={5} strokeLinejoin="round" />;
      case 'sedih':
        return <path d="M -13 34 Q 0 20 13 34" {...line} />;
      case 'kaget':
        return <ellipse cx={0} cy={30} rx={8} ry={11} fill="#8a2f2f" stroke={INK} strokeWidth={4.5} />;
      case 'tekad':
        return <path d="M -9 30 Q 4 34 13 25" {...line} />;
      case 'tidur':
        return <path d="M -6 30 Q 0 34 6 30" {...line} />;
      default:
        return <path d="M -8 30 L 8 30" {...line} />;
    }
  };
  const drops: React.ReactNode[] = [];
  if (sweat > 0.01) {
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.9 + i / 3) % 1;
      const dx = 44 - i * 4 + (i === 1 ? -80 : 0);
      const dy = -34 + ph * 78;
      drops.push(
        <g key={i} transform={`translate(${dx} ${dy}) scale(${0.9 + 0.3 * sweat})`} opacity={sweat * (1 - ph * ph * ph)}>
          <path d="M 0 -13 Q 9 0 0 9 Q -9 0 0 -13 Z" fill="#8fd3f4" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
        </g>,
      );
    }
  }
  return (
    <g>
      <circle r={54} fill={skin} stroke={INK} strokeWidth={6} />
      {expr === 'senang' ? (
        <g fill="#f4978e" opacity={0.7}>
          <ellipse cx={-34} cy={22} rx={9} ry={5.5} />
          <ellipse cx={34} cy={22} rx={9} ry={5.5} />
        </g>
      ) : null}
      {eyes()}
      {brows()}
      {mouth()}
      {pale > 0.5 ? (
        <g stroke="#5b6c8f" strokeWidth={4} strokeLinecap="round" opacity={(pale - 0.5) * 2}>
          <path d="M -26 -26 L -26 -6" />
          <path d="M -10 -26 L -10 -2" />
          <path d="M 8 -26 L 8 -2" />
          <path d="M 24 -26 L 24 -6" />
        </g>
      ) : null}
      {drops}
    </g>
  );
};

export const Budi: React.FC<BudiProps> = ({
  x,
  y,
  scale = 0.8,
  flip = false,
  rot = 0,
  pose,
  expr,
  look = 0,
  kemeja = false,
  tas = false,
  phone = false,
  pale = 0,
  sweat = 0,
  t,
}) => {
  const sx = flip ? -scale : scale;
  const skin = mix(SKIN, PALE, pale);
  return (
    <g transform={`translate(${x} ${y}) scale(${sx} ${scale}) rotate(${rot})`}>
      {/* bayangan lantai disisipkan oleh pemanggil */}
      <Leg sx={-16} a={pose.legL} />
      <Leg sx={16} a={pose.legR} />
      <g transform={`rotate(${pose.torso})`}>
        {tas ? (
          <g>
            <rect x={-84} y={-140} width={56} height={116} rx={18} fill={BAG} stroke={INK} strokeWidth={6} />
            <rect x={-76} y={-80} width={40} height={36} rx={9} fill="#c27f26" stroke={INK} strokeWidth={4} />
          </g>
        ) : null}
        {/* badan */}
        <path
          d="M -42 -4 L -44 -112 Q -44 -142 -16 -144 L 16 -144 Q 44 -142 44 -112 L 42 -4 Q 0 8 -42 -4 Z"
          fill={kemeja ? KEMEJA : KAOS}
          stroke={INK}
          strokeWidth={6}
          strokeLinejoin="round"
        />
        {kemeja ? (
          <g>
            <path d="M -13 -144 L 13 -144 L 11 -2 L -11 -2 Z" fill={KAOS} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            <path d="M -13 -146 L -32 -152 L -24 -126 Z" fill={COLLAR} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
            <path d="M 13 -146 L 32 -152 L 24 -126 Z" fill={COLLAR} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          </g>
        ) : (
          <path d="M -15 -144 Q 0 -126 15 -144" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        )}
        <rect x={-42} y={-12} width={84} height={10} fill="#1f2a30" opacity={0.85} />
        {tas ? <path d="M -30 -142 Q -26 -80 -22 -20" stroke="#8a5a1c" strokeWidth={9} strokeLinecap="round" fill="none" /> : null}
        {/* kepala */}
        <g transform={`rotate(${pose.head} 0 -150)`}>
          <g transform="translate(0 -198)">
            <circle cx={-54} cy={2} r={12} fill={skin} stroke={INK} strokeWidth={5} />
            <circle cx={54} cy={2} r={12} fill={skin} stroke={INK} strokeWidth={5} />
            <Face expr={expr} look={look} pale={pale} sweat={sweat} t={t} />
            <path
              d="M -56 -8 C -62 -66 62 -66 56 -8 C 44 -30 24 -38 4 -30 C -16 -40 -40 -30 -56 -8 Z"
              fill={INK}
              stroke={INK}
              strokeWidth={5}
              strokeLinejoin="round"
            />
          </g>
        </g>
        <Arm sx={-40} a={pose.armL} kemeja={kemeja} phone={false} />
        <Arm sx={40} a={pose.armR} kemeja={kemeja} phone={phone} />
      </g>
    </g>
  );
};
