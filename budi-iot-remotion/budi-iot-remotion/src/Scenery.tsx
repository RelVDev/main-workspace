import React from 'react';
import {FONT, INK, rnd} from './util';

export const GROUND_Y = 1250;

const CloudShape: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => {
  const circles: [number, number, number][] = [
    [-70, 10, 42],
    [-20, -14, 56],
    [42, -6, 48],
    [84, 14, 34],
    [0, 22, 46],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g fill={INK}>
        {circles.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r + 6} />
        ))}
      </g>
      <g fill="#ffffff">
        {circles.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </g>
      <ellipse cx={4} cy={44} rx={92} ry={9} fill="#dcecf7" />
    </g>
  );
};

export const Sky: React.FC<{t: number}> = ({t}) => {
  const clouds: [number, number, number][] = [
    [200, 230, 1.0],
    [760, 60, 0.8],
    [1750, 170, 1.25],
    [2300, 280, 1.0],
    [2900, 120, 0.9],
    [-300, 330, 1.2],
  ];
  const rays: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * 360 + t * 8;
    rays.push(<line key={i} x1={0} y1={-98} x2={0} y2={-124} transform={`rotate(${a})`} stroke="#ffb703" strokeWidth={13} strokeLinecap="round" />);
  }
  return (
    <g>
      <defs>
        <linearGradient id="skyg" gradientUnits="userSpaceOnUse" x1="0" y1="-500" x2="0" y2="1250">
          <stop offset="0" stopColor="#4fa8ea" />
          <stop offset="1" stopColor="#d6eefa" />
        </linearGradient>
      </defs>
      <rect x={-2000} y={-3000} width={7500} height={4250} fill="url(#skyg)" />
      <g transform="translate(1000 140)">
        {rays}
        <circle r={70} fill="#ffd23f" stroke={INK} strokeWidth={7} />
        <circle r={46} cx={-12} cy={-12} fill="#ffe680" opacity={0.7} />
      </g>
      {clouds.map(([cx, cy, s], i) => (
        <CloudShape key={i} x={((cx + t * (6 + i * 1.5) + 2000) % 5200) - 1800} y={cy} s={s} />
      ))}
    </g>
  );
};

const Worm: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => (
  <path
    d={`M ${x} ${y} q 10 ${-12 + k} 20 0 t 20 0 t 20 0`}
    fill="none"
    stroke="#e58fa6"
    strokeWidth={9}
    strokeLinecap="round"
  />
);

export const Ground: React.FC<{t: number}> = ({t}) => {
  const pebbles: React.ReactNode[] = [];
  for (let i = 0; i < 40; i++) {
    const x = -300 + rnd(i * 3 + 1) * 3900;
    const y = 1330 + rnd(i * 3 + 2) * 520;
    const r = 7 + rnd(i * 3 + 3) * 11;
    pebbles.push(<ellipse key={i} cx={x} cy={y} rx={r * 1.2} ry={r} fill="#b08a66" stroke={INK} strokeWidth={4} />);
  }
  const worms: React.ReactNode[] = [];
  for (let i = 0; i < 10; i++) {
    worms.push(<Worm key={i} x={-200 + rnd(i + 50) * 3800} y={1360 + rnd(i + 70) * 460} k={Math.sin(t * 2 + i) * 5} />);
  }
  const rocks: React.ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const x = -200 + i * 260 + rnd(i + 5) * 80;
    const y = 1760 + rnd(i + 9) * 140;
    const r = 46 + rnd(i + 11) * 40;
    rocks.push(
      <g key={i}>
        <ellipse cx={x} cy={y} rx={r * 1.15} ry={r} fill="#9fa3a8" stroke={INK} strokeWidth={6} />
        <path d={`M ${x - r * 0.6} ${y - r * 0.35} q ${r * 0.4} ${-r * 0.35} ${r * 0.9} ${-r * 0.1}`} stroke="#c7cacd" strokeWidth={8} strokeLinecap="round" fill="none" />
      </g>,
    );
  }
  const tufts: React.ReactNode[] = [];
  for (let i = 0; i < 60; i++) {
    const x = -300 + i * 62 + rnd(i) * 30;
    tufts.push(<path key={i} d={`M ${x} ${GROUND_Y} l -4 -14 M ${x + 7} ${GROUND_Y} l 2 -18 M ${x + 14} ${GROUND_Y} l 7 -12`} stroke="#4c9a3a" strokeWidth={4} strokeLinecap="round" fill="none" />);
  }
  return (
    <g>
      <defs>
        <linearGradient id="soilg" gradientUnits="userSpaceOnUse" x1="0" y1="1275" x2="0" y2="2200">
          <stop offset="0" stopColor="#8d5d3c" />
          <stop offset="1" stopColor="#4d301d" />
        </linearGradient>
      </defs>
      <rect x={-2000} y={1275} width={7500} height={2500} fill="url(#soilg)" />
      {pebbles}
      {worms}
      {rocks}
      <rect x={-2000} y={GROUND_Y} width={7500} height={28} fill="#7cc65b" />
      <line x1={-2000} y1={GROUND_Y + 14} x2={5500} y2={GROUND_Y + 14} stroke={INK} strokeWidth={4} strokeDasharray="34 12 12 12" />
      <line x1={-2000} y1={GROUND_Y} x2={5500} y2={GROUND_Y} stroke={INK} strokeWidth={6} />
      {tufts}
      {/* jalan menuju kampus */}
      <rect x={1262} y={GROUND_Y - 2} width={2200} height={26} fill="#c9c4b8" stroke={INK} strokeWidth={5} />
      {[1340, 1560, 1780, 2000, 2220, 2440].map((x) => (
        <line key={x} x1={x} y1={GROUND_Y + 11} x2={x + 90} y2={GROUND_Y + 11} stroke="#ffffff" strokeWidth={5} strokeLinecap="round" />
      ))}
    </g>
  );
};

export const Tree: React.FC<{x: number; s?: number; t: number}> = ({x, s = 1, t}) => (
  <g transform={`translate(${x} ${GROUND_Y}) scale(${s})`}>
    <rect x={-14} y={-150} width={28} height={150} fill="#8a5a3b" stroke={INK} strokeWidth={6} />
    <g transform={`rotate(${Math.sin(t * 1.2 + x) * 1.2} 0 -150)`}>
      <g fill={INK}>
        <circle cx={0} cy={-210} r={78} />
        <circle cx={-62} cy={-170} r={54} />
        <circle cx={62} cy={-170} r={54} />
      </g>
      <g fill="#59b04a">
        <circle cx={0} cy={-210} r={72} />
        <circle cx={-62} cy={-170} r={48} />
        <circle cx={62} cy={-170} r={48} />
      </g>
      <ellipse cx={-22} cy={-232} rx={28} ry={14} fill="#86d070" opacity={0.8} />
    </g>
  </g>
);

export const Campus: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect x={2250} y={880} width={450} height={370} fill="#e9d2a8" stroke={INK} strokeWidth={7} />
    <rect x={2230} y={850} width={490} height={44} fill="#8e6a4a" stroke={INK} strokeWidth={7} />
    {[2290, 2370, 2540, 2620].map((x) => (
      <rect key={x} x={x} y={940} width={56} height={90} fill="#bfe3f5" stroke={INK} strokeWidth={5} />
    ))}
    {[2290, 2370, 2540, 2620].map((x) => (
      <rect key={`b${x}`} x={x} y={1070} width={56} height={90} fill="#bfe3f5" stroke={INK} strokeWidth={5} />
    ))}
    <rect x={2425} y={1090} width={70} height={160} fill="#7a5638" stroke={INK} strokeWidth={6} />
    <rect x={2380} y={800} width={160} height={50} rx={10} fill="#2a9d8f" stroke={INK} strokeWidth={6} />
    <text x={2460} y={836} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill="#fff">
      KAMPUS
    </text>
    <line x1={2700} y1={850} x2={2700} y2={730} stroke={INK} strokeWidth={6} />
    <path d={`M 2700 735 q 30 ${10 + Math.sin(t * 3) * 6} 56 0 l 0 36 q -26 ${10 - Math.sin(t * 3) * 6} -56 0 z`} fill="#e05252" stroke={INK} strokeWidth={5} />
  </g>
);
