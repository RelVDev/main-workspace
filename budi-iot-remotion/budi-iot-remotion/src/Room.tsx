import React from 'react';
import {Timeline} from './timeline';
import {
  L,
  acStage,
  bagTakenAt,
  doorOpenAt,
  ironAt,
  ironOnAt,
  lampAt,
  tempAt,
} from './state';
import {FONT, INK, bump, clamp, easeOutBack, lerp, mix, polyAt, polyPart, prog, rnd, smooth} from './util';
import {GROUND_Y} from './Scenery';
import {PATH_ROUTER_LAMP, PATH_ROUTER_PLUG, PATH_SIRA_AC} from './state';

type P = {t: number; T: Timeline};

export const Wifi: React.FC<{x: number; y: number; s?: number; color?: string; w?: number}> = ({x, y, s = 1, color = '#5ee1ff', w = 3.5}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round">
    <path d="M -5 -3 A 7 7 0 0 1 5 -3" transform="translate(0 6)" />
    <path d="M -10 -6 A 13 13 0 0 1 10 -6" transform="translate(0 6)" />
    <path d="M -15 -9 A 19 19 0 0 1 15 -9" transform="translate(0 6)" />
    <circle cx={0} cy={5} r={2} fill={color} stroke="none" />
  </g>
);

/** Modul IoT kecil yang menempel di perangkat; muncul bertahap di adegan 7. */
const Chip: React.FC<{x: number; y: number; appear: number; t: number; led?: string}> = ({x, y, appear, t, led = '#4ade80'}) => {
  const k = clamp(appear);
  if (k <= 0) return null;
  const s = easeOutBack(k);
  const blink = Math.sin(t * 6) > 0 ? 1 : 0.35;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-20} y={-13} width={40} height={26} rx={6} fill="#17324d" stroke={INK} strokeWidth={4} />
      <Wifi x={-4} y={-2} s={0.62} />
      <circle cx={13} cy={-6} r={3.2} fill={led} opacity={blink} />
    </g>
  );
};

const Pill: React.FC<{x: number; y: number; text: string; k: number; color?: string; size?: number}> = ({x, y, text, k, color = '#ffffff', size = 28}) => {
  if (k <= 0.01) return null;
  const w = text.length * size * 0.62 + 40;
  const s = easeOutBack(clamp(k));
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-w / 2} y={-size * 0.85} width={w} height={size * 1.7} rx={size * 0.85} fill={color} stroke={INK} strokeWidth={5} />
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={size} fill={INK}>
        {text}
      </text>
    </g>
  );
};
export {Pill};

export const HouseBack: React.FC<P> = () => {
  const stripes: React.ReactNode[] = [];
  for (let i = 0; i < 10; i += 2) stripes.push(<rect key={i} x={200 + i * 100} y={664} width={100} height={550} fill="#f1dfbe" />);
  return (
    <g>
      <rect x={176} y={GROUND_Y} width={1048} height={44} fill="#a8a296" stroke={INK} strokeWidth={6} />
      <rect x={950} y={360} width={90} height={190} fill="#9b5a47" stroke={INK} strokeWidth={7} />
      <rect x={940} y={346} width={110} height={26} fill="#7d4636" stroke={INK} strokeWidth={6} />
      <rect x={200} y={664} width={1000} height={586} fill="#f6e7cc" />
      {stripes}
      <rect x={200} y={1212} width={1000} height={14} fill="#e2c597" stroke={INK} strokeWidth={3} />
      <rect x={200} y={1226} width={1000} height={24} fill="#c98f5b" />
    </g>
  );
};

export const HouseFront: React.FC<P> = ({t, T}) => {
  const o = doorOpenAt(t, T);
  const fx = 1200 + o * 124;
  const top = 800 - 28 * o;
  const tiles: React.ReactNode[] = [];
  const slope = (L.roof.x1 - L.roof.x0) / 2 / (L.roof.yEave - L.roof.yRidge);
  for (let i = 1; i < 5; i++) {
    const y = L.roof.yEave - i * 44;
    const dx = (L.roof.yEave - y) * slope;
    tiles.push(<line key={i} x1={L.roof.x0 + dx + 18} y1={y} x2={L.roof.x1 - dx - 18} y2={y} stroke="#a3432f" strokeWidth={5} strokeLinecap="round" />);
  }
  return (
    <g>
      {/* dinding kiri, kanan atas, plafon */}
      <rect x={176} y={636} width={24} height={614} fill="#e0c9a3" stroke={INK} strokeWidth={6} />
      <rect x={1200} y={636} width={24} height={164} fill="#e0c9a3" stroke={INK} strokeWidth={6} />
      <rect x={176} y={636} width={1048} height={30} fill="#d9c3a0" stroke={INK} strokeWidth={6} />
      {/* pintu */}
      <polygon points={`1224,800 ${fx},${top} ${fx},1250 1224,1250`} fill="#9a6b43" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <circle cx={lerp(1210, fx - 14, o)} cy={1040} r={6} fill="#ffd23f" stroke={INK} strokeWidth={3} />
      {/* atap */}
      <polygon points={`${L.roof.x0},${L.roof.yEave} 700,${L.roof.yRidge} ${L.roof.x1},${L.roof.yEave}`} fill="#c0573f" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      {tiles}
      <circle cx={700} cy={545} r={36} fill="#bfe3f5" stroke={INK} strokeWidth={6} />
      <path d="M 664 545 H 736 M 700 509 V 581" stroke={INK} strokeWidth={4} />
    </g>
  );
};

export const Bed: React.FC<P> = () => (
  <g>
    <rect x={207} y={1030} width={24} height={220} rx={6} fill="#8a5a3b" stroke={INK} strokeWidth={6} />
    <rect x={215} y={1200} width={390} height={30} fill="#8a5a3b" stroke={INK} strokeWidth={6} />
    <rect x={590} y={1200} width={16} height={50} fill="#8a5a3b" stroke={INK} strokeWidth={5} />
    <rect x={232} y={1138} width={368} height={64} rx={14} fill="#dfe9f5" stroke={INK} strokeWidth={6} />
    <ellipse cx={288} cy={1126} rx={56} ry={22} fill="#ffffff" stroke={INK} strokeWidth={6} />
  </g>
);

export const Blanket: React.FC = () => (
  <g>
    <path d="M 398 1138 Q 414 1086 468 1090 L 560 1094 Q 602 1100 602 1142 L 602 1204 L 398 1204 Z" fill="#6a8fd8" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M 440 1110 L 440 1200 M 500 1100 L 500 1200 M 560 1104 L 560 1200" stroke="#8fb0ee" strokeWidth={8} strokeLinecap="round" />
  </g>
);

export const SunBeam: React.FC = () => <polygon points="450,905 610,905 430,1132 262,1132" fill="#ffe27a" opacity={0.26} />;

export const WindowFrame: React.FC<P> = ({t}) => (
  <g>
    <defs>
      <linearGradient id="winsky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#74bff0" />
        <stop offset="1" stopColor="#d6eefa" />
      </linearGradient>
    </defs>
    <rect x={450} y={820} width={160} height={190} fill="url(#winsky)" stroke={INK} strokeWidth={7} />
    <circle cx={565 + Math.sin(t) * 3} cy={868} r={20} fill="#ffd23f" stroke={INK} strokeWidth={4} />
    <path d="M 450 915 H 610 M 530 820 V 1010" stroke={INK} strokeWidth={6} />
    <rect x={440} y={1008} width={180} height={14} fill="#c98f5b" stroke={INK} strokeWidth={5} />
    <path d="M 450 820 Q 470 900 452 1010 L 428 1010 Q 440 900 428 820 Z" fill="#f4978e" stroke={INK} strokeWidth={5} />
    <path d="M 610 820 Q 590 900 608 1010 L 632 1010 Q 620 900 632 820 Z" fill="#f4978e" stroke={INK} strokeWidth={5} />
  </g>
);

export const Clock: React.FC<P> = ({t, T}) => {
  const shake = bump(t, T.at(3, 0.72), T.at(3, 1.0)) * Math.sin(t * 60) * 3;
  const sec = (t * 6) % 360;
  const min = 53 * 6 + (t / 60) * 6;
  const hour = 7 * 30 + 53 * 0.5;
  const ticks: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) ticks.push(<line key={i} x1={0} y1={-34} x2={0} y2={-28} transform={`rotate(${i * 30})`} stroke={INK} strokeWidth={4} strokeLinecap="round" />);
  return (
    <g transform={`translate(${L.clock.x + shake} ${L.clock.y})`}>
      <circle r={46} fill="#ffffff" stroke={INK} strokeWidth={7} />
      {ticks}
      <line x1={0} y1={0} x2={0} y2={-20} transform={`rotate(${hour})`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      <line x1={0} y1={0} x2={0} y2={-30} transform={`rotate(${min})`} stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      <line x1={0} y1={6} x2={0} y2={-32} transform={`rotate(${sec})`} stroke="#e63946" strokeWidth={2.5} strokeLinecap="round" />
      <circle r={4} fill={INK} />
      <g transform="translate(0 74)">
        <rect x={-46} y={-20} width={92} height={40} fill="#ffe66d" stroke={INK} strokeWidth={4} />
        <text x={0} y={-3} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={13} fill={INK}>
          KULIAH
        </text>
        <text x={0} y={13} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={15} fill="#c1121f">
          08.00
        </text>
      </g>
    </g>
  );
};

export const Hook: React.FC<P> = ({t, T}) => {
  const taken = bagTakenAt(t, T);
  return (
    <g>
      <rect x={1046} y={950} width={18} height={10} rx={4} fill="#6b4a2f" stroke={INK} strokeWidth={4} />
      {!taken ? (
        <g transform={`rotate(${Math.sin(t * 2) * 1.5} 1055 960)`}>
          <rect x={1030} y={962} width={52} height={80} rx={14} fill="#e09f3e" stroke={INK} strokeWidth={6} />
          <rect x={1038} y={1000} width={36} height={28} rx={8} fill="#c27f26" stroke={INK} strokeWidth={4} />
          <path d="M 1042 964 Q 1055 946 1068 964" fill="none" stroke={INK} strokeWidth={5} />
        </g>
      ) : null}
    </g>
  );
};

export const SIRA: React.FC<P> = ({t, T}) => {
  const temp = tempAt(t, T);
  const aStart = T.s(9);
  const aEnd = T.at(12, 0.4);
  const active = smooth(prog(t, aStart, T.at(9, 0.35))) * (1 - smooth(prog(t, aEnd, aEnd + 1)));
  const sensing = smooth(prog(t, T.s(8), T.at(8, 0.25)));
  const h = lerp(0.18, 0.95, clamp((temp - 24) / 10)) * 66;
  const blink = Math.sin(t * 2.2) > 0.96 ? 0.2 : 1;
  const rings: React.ReactNode[] = [];
  if (active > 0.05) {
    for (let i = 0; i < 3; i++) {
      const ph = ((t - aStart) * 0.8 + i / 3) % 1;
      rings.push(<circle key={i} cx={0} cy={0} r={50 + ph * 80} fill="none" stroke="#5ee1ff" strokeWidth={5} opacity={(1 - ph) * 0.65 * active} />);
    }
  }
  const scans: React.ReactNode[] = [];
  const scanOn = bump(t, T.s(8), T.at(8, 1.0));
  if (scanOn > 0.05) {
    for (let i = 0; i < 3; i++) {
      const ph = ((t - T.s(8)) * 0.9 + i / 3) % 1;
      scans.push(<circle key={i} cx={L.therm.x + 8} cy={L.therm.y + 76} r={16 + ph * 46} fill="none" stroke="#ff7b54" strokeWidth={4} opacity={(1 - ph) * 0.7 * Math.min(1, scanOn * 3)} />);
    }
  }
  const mercuryColor = mix('#ff9f43', '#e63946', clamp((temp - 28) / 4));
  return (
    <g>
      {/* termometer sensor */}
      <g opacity={sensing > 0 ? 1 : 1}>
        <rect x={L.therm.x - 8} y={L.therm.y} width={16} height={72} rx={8} fill="#fff" stroke={INK} strokeWidth={5} />
        <rect x={L.therm.x - 4} y={L.therm.y + 68 - h} width={8} height={h} fill={mercuryColor} />
        <circle cx={L.therm.x} cy={L.therm.y + 78} r={13} fill={mercuryColor} stroke={INK} strokeWidth={5} />
      </g>
      {scans}
      {/* badan SI-RA */}
      <g transform={`translate(${L.sira.x} ${L.sira.y})`}>
        {rings}
        <circle r={50} fill="#243b55" stroke={INK} strokeWidth={7} />
        <circle r={38} fill="none" stroke="#5ee1ff" strokeWidth={5} opacity={0.35 + 0.65 * Math.max(active, sensing * 0.4)} />
        <g fill="#5ee1ff">
          <rect x={-22} y={-14} width={14} height={Math.max(3, 20 * blink)} rx={5} transform={`translate(0 ${(20 - Math.max(3, 20 * blink)) / 2})`} />
          <rect x={8} y={-14} width={14} height={Math.max(3, 20 * blink)} rx={5} transform={`translate(0 ${(20 - Math.max(3, 20 * blink)) / 2})`} />
        </g>
        <path d="M -10 14 Q 0 22 10 14" fill="none" stroke="#5ee1ff" strokeWidth={4.5} strokeLinecap="round" />
      </g>
    </g>
  );
};

export const SensorLabels: React.FC<P> = ({t, T}) => {
  const temp = tempAt(t, T);
  const kSensor = smooth(prog(t, T.at(8, 0.05), T.at(8, 0.2))) * (1 - smooth(prog(t, T.at(8, 0.97), T.at(9, 0.12))));
  const kSira = smooth(prog(t, T.at(9, 0.2), T.at(9, 0.4))) * (1 - smooth(prog(t, T.at(10, 0.0), T.at(10, 0.2))));
  const kTemp = smooth(prog(t, T.at(8, 0.15), T.at(8, 0.3))) * (1 - smooth(prog(t, T.at(12, 0.3), T.at(12, 0.5))));
  const hot = clamp((temp - 28) / 4);
  return (
    <g>
      <Pill x={330} y={712} text="SENSOR SUHU" k={kSensor} color="#ffe2d6" size={22} />
      <Pill x={330} y={712} text="SI-RA  •  AI" k={kSira} color="#d7f6ff" size={22} />
      <g opacity={kTemp} transform={`translate(498 790)`}>
        <rect x={-62} y={-26} width={124} height={50} rx={14} fill="#fff" stroke={INK} strokeWidth={5} />
        <text x={0} y={10} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill={mix('#2a9d8f', '#e63946', hot)}>
          {temp.toFixed(1)}°C
        </text>
      </g>
    </g>
  );
};

export const HoloCard: React.FC<P> = ({t, T}) => {
  const a = T.s(10);
  const k = easeOutBack(clamp(prog(t, a, a + 0.35))) * (1 - smooth(prog(t, T.at(11, 0.05), T.at(11, 0.25))));
  if (k <= 0.01) return null;
  const blink = Math.sin(t * 8) > 0 ? 1 : 0.4;
  const temp = tempAt(t, T);
  return (
    <g transform={`translate(380 676) scale(${k})`}>
      <path d="M 0 90 L -26 118 L 36 100 Z" fill="#d7f6ff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <rect x={0} y={0} width={310} height={104} rx={16} fill="#d7f6ff" stroke={INK} strokeWidth={6} />
      <text x={18} y={36} fontFamily={FONT} fontWeight={800} fontSize={24} fill={INK}>
        Suhu ruangan: {temp.toFixed(0)}°C
      </text>
      <text x={18} y={68} fontFamily={FONT} fontWeight={700} fontSize={20} fill="#c1121f" opacity={blink}>
        ⚠ Batas nyaman: 28°C
      </text>
      <rect x={18} y={80} width={274} height={8} rx={4} fill="#fff" stroke={INK} strokeWidth={3} />
      <rect x={18} y={80} width={274 * clamp(prog(t, a + 0.2, a + 1.0))} height={8} rx={4} fill="#e63946" />
    </g>
  );
};

/** Sinyal SI-RA -> AC, tergambar bertahap */
export const SiraSignal: React.FC<P> = ({t, T}) => {
  const a = T.at(11, 0.0);
  const b = T.at(11, 0.45);
  const k = prog(t, a, b);
  if (k <= 0 || t > T.at(12, 0.4)) return null;
  const fade = 1 - smooth(prog(t, T.at(11, 0.7), T.at(12, 0.4)));
  const pt = polyAt(PATH_SIRA_AC, k);
  return (
    <g opacity={fade}>
      <path d={polyPart(PATH_SIRA_AC, k)} fill="none" stroke={INK} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" />
      <path d={polyPart(PATH_SIRA_AC, k)} fill="none" stroke="#5ee1ff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="18 14" strokeDashoffset={-t * 90} />
      {k < 1 ? <circle cx={pt[0]} cy={pt[1]} r={11} fill="#ffe066" stroke={INK} strokeWidth={4} /> : null}
    </g>
  );
};

export const AirConditioner: React.FC<P> = ({t, T}) => {
  const st = acStage(t, T);
  const {x, y, w, h} = L.ac;
  const ledColor = st.led === 'off' ? '#9aa4b2' : st.led === 'blink' ? (Math.sin(t * 16) > 0 ? '#38bdf8' : '#1e4e6e') : '#4ade80';
  const slotH = 4 + 16 * st.open;
  const flapH = 6 + 20 * st.open;
  const blades: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    blades.push(<ellipse key={i} cx={0} cy={-11} rx={6} ry={12} transform={`rotate(${i * 90 + st.fanAngle})`} fill="#8fa3b8" stroke={INK} strokeWidth={3} />);
  }
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={16} fill="#f7f9fc" stroke={INK} strokeWidth={7} />
      <rect x={x + 16} y={y + 58} width={w - 32} height={slotH} fill="#2d3a4a" />
      <rect x={x + 16} y={y + 62} width={w - 32} height={flapH} rx={3} fill="#cfd8e3" stroke={INK} strokeWidth={4} />
      <circle cx={x + 20} cy={y + 22} r={6} fill={ledColor} stroke={INK} strokeWidth={3} />
      <g transform={`translate(${x + 80} ${y + 32})`}>
        <circle r={26} fill="#dfe7ef" stroke={INK} strokeWidth={5} />
        {blades}
        <circle r={4} fill={INK} />
      </g>
      <rect x={x + 142} y={y + 12} width={46} height={24} rx={5} fill="#12323f" stroke={INK} strokeWidth={3} />
      {st.on ? (
        <text x={x + 165} y={y + 30} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={16} fill="#7cffb2">
          24°
        </text>
      ) : null}
    </g>
  );
};

export const CoolAir: React.FC<P> = ({t, T}) => {
  const st = acStage(t, T);
  if (st.air <= 0.01) return null;
  const {x, y} = L.ac;
  const streams: React.ReactNode[] = [];
  [168, 132, 96, 60, 24].forEach((dx, i) => {
    const vx = x + dx;
    streams.push(
      <path
        key={i}
        d={`M ${vx} ${y + 90} C ${vx - 40} ${y + 160}, ${vx - 110} ${y + 210}, ${vx - 170} ${y + 290 + i * 10}`}
        fill="none"
        stroke="#7fd1f7"
        strokeWidth={7}
        strokeLinecap="round"
        strokeDasharray="30 22"
        strokeDashoffset={-t * 150 - i * 10}
        opacity={0.9 * st.air}
      />,
    );
  });
  const flakes: React.ReactNode[] = [];
  for (let i = 0; i < 18; i++) {
    const ph = (t * 0.32 + i / 18) % 1;
    const fx = x + 140 - ph * 480 + Math.sin(ph * 9 + i) * 22;
    const fy = y + 100 + ph * 330 + (i % 3) * 14;
    flakes.push(
      <g key={i} transform={`translate(${fx} ${fy}) rotate(${ph * 200})`} opacity={st.air * Math.sin(ph * Math.PI)}>
        <path d="M -9 0 H 9 M 0 -9 V 9 M -6 -6 L 6 6 M -6 6 L 6 -6" stroke="#ffffff" strokeWidth={3.5} strokeLinecap="round" />
        <path d="M -9 0 H 9 M 0 -9 V 9" stroke="#7fd1f7" strokeWidth={1.5} strokeLinecap="round" />
      </g>,
    );
  }
  return (
    <g>
      {streams}
      {flakes}
    </g>
  );
};

export const CoolTint: React.FC<P> = ({t, T}) => {
  const st = acStage(t, T);
  if (st.tint <= 0.01) return null;
  return <rect x={200} y={664} width={1000} height={586} fill="#4cc3ff" opacity={st.tint * 0.15} />;
};

export const Lamp: React.FC<P> = ({t, T}) => {
  const b = lampAt(t, T);
  const {x, y} = L.lamp;
  const rays: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const a = -80 + i * 20;
    rays.push(<line key={i} x1={0} y1={34} x2={0} y2={58} transform={`rotate(${a})`} stroke="#ffb703" strokeWidth={6} strokeLinecap="round" />);
  }
  return (
    <g>
      <g opacity={b}>
        <circle cx={x} cy={y} r={150} fill="#ffe27a" opacity={0.1} />
        <circle cx={x} cy={y} r={105} fill="#ffe27a" opacity={0.14} />
        <circle cx={x} cy={y} r={66} fill="#ffe27a" opacity={0.22} />
      </g>
      <line x1={x} y1={664} x2={x} y2={722} stroke={INK} strokeWidth={5} />
      <polygon points={`${x - 38},772 ${x + 38},772 ${x + 20},722 ${x - 20},722`} fill="#4aa3c7" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <circle cx={x} cy={y} r={17} fill={mix('#9aa0a6', '#fff176', b)} stroke={INK} strokeWidth={5} />
      <g transform={`translate(${x} ${y})`} opacity={b}>
        {rays}
      </g>
    </g>
  );
};

export const Desk: React.FC<P> = () => (
  <g>
    <rect x={838} y={1124} width={22} height={126} fill="#8a5a3b" stroke={INK} strokeWidth={6} />
    <rect x={1040} y={1124} width={22} height={126} fill="#8a5a3b" stroke={INK} strokeWidth={6} />
    <rect x={826} y={1100} width={248} height={26} rx={4} fill="#c68a52" stroke={INK} strokeWidth={6} />
  </g>
);

export const Iron: React.FC<P> = ({t, T}) => {
  const heat = ironAt(t, T);
  const on = ironOnAt(t, T);
  const sole = mix('#cfd6df', '#ff9a4d', heat * 0.75);
  const led = on ? (Math.sin(t * 5) > -0.2 ? '#ff3b30' : '#7a1c17') : '#5a5f66';
  const puffs: React.ReactNode[] = [];
  const lines: React.ReactNode[] = [];
  if (heat > 0.02) {
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.55 + i / 3) % 1;
      puffs.push(
        <circle key={i} cx={955 + Math.sin(ph * 7 + i) * 8} cy={1040 - ph * 90} r={9 + ph * 16} fill="#fff" stroke={INK} strokeWidth={3.5} opacity={heat * (1 - ph) * 0.95} />,
      );
    }
    for (let i = 0; i < 3; i++) {
      const x0 = 975 + i * 22;
      const ph = (t * 0.7 + i * 0.3) % 1;
      lines.push(
        <path
          key={i}
          d={`M ${x0} 1000 q 8 -14 0 -28 t 0 -28`}
          transform={`translate(0 ${-ph * 20})`}
          fill="none"
          stroke="#ff7b54"
          strokeWidth={4}
          strokeLinecap="round"
          opacity={heat * 0.7 * (1 - ph)}
        />,
      );
    }
  }
  return (
    <g>
      {/* kabel */}
      <path d="M 1048 1076 C 1090 1082, 1092 1140, 1110 1186" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d="M 1048 1076 C 1090 1082, 1092 1140, 1110 1186" fill="none" stroke="#e8e8e8" strokeWidth={4} strokeLinecap="round" />
      {/* setrika (ujung menghadap kiri) */}
      <path d="M 1050 1098 L 928 1098 Q 912 1098 924 1084 L 954 1052 L 1042 1052 Q 1054 1052 1054 1066 Z" fill={sole} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M 1042 1052 L 954 1052 Q 962 1018 998 1018 Q 1040 1018 1042 1052 Z" fill="#4a6fa5" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M 968 1028 Q 990 978 1026 1004 Q 1036 1012 1034 1028" fill="none" stroke={INK} strokeWidth={15} strokeLinecap="round" />
      <path d="M 968 1028 Q 990 978 1026 1004 Q 1036 1012 1034 1028" fill="none" stroke="#e8e8e8" strokeWidth={6} strokeLinecap="round" />
      <circle cx={1022} cy={1038} r={6} fill={led} stroke={INK} strokeWidth={3} />
      {puffs}
      {lines}
    </g>
  );
};

export const Router: React.FC<P> = ({t, T}) => {
  const {x, y} = L.router;
  const act = Math.max(
    bump(t, T.at(21, 0.55), T.at(22, 0.5)),
    bump(t, T.at(23, 0.55), T.at(24, 0.5)),
    bump(t, T.at(21, 0.0), T.at(21, 0.2)) * 0,
  );
  const arcs: React.ReactNode[] = [];
  if (act > 0.05) {
    for (let i = 0; i < 3; i++) {
      const ph = (t * 1.2 + i / 3) % 1;
      arcs.push(<circle key={i} cx={x - 4} cy={y - 46} r={10 + ph * 44} fill="none" stroke="#5ee1ff" strokeWidth={4} opacity={(1 - ph) * 0.8 * Math.min(1, act * 2)} />);
    }
  }
  return (
    <g>
      <rect x={x - 54} y={y + 16} width={110} height={10} rx={3} fill="#8a5a3b" stroke={INK} strokeWidth={4} />
      <path d={`M ${x - 40} ${y - 14} L ${x - 50} ${y - 52}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d={`M ${x + 38} ${y - 14} L ${x + 48} ${y - 52}`} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <rect x={x - 48} y={y - 16} width={100} height={32} rx={8} fill="#f5f5f5" stroke={INK} strokeWidth={5} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={x - 28 + i * 16} cy={y} r={4} fill={act > 0.1 && Math.sin(t * 14 + i * 2) > 0 ? '#4ade80' : '#2f9e5c'} />
      ))}
      {arcs}
    </g>
  );
};

export const SmartPlug: React.FC<P> = ({t, T}) => {
  const {x, y} = L.plug;
  const waiting = t > T.at(21, 0.97) && t < T.at(24, 0.0);
  const led = ironOnAt(t, T) ? (waiting ? (Math.sin(t * 10) > 0 ? '#fbbf24' : '#7c5a10') : '#4ade80') : '#5a5f66';
  return (
    <g>
      <rect x={x - 26} y={y - 28} width={52} height={56} rx={10} fill="#fff" stroke={INK} strokeWidth={5} />
      <rect x={x - 12} y={y - 12} width={6} height={14} fill={INK} />
      <rect x={x + 6} y={y - 12} width={6} height={14} fill={INK} />
      <circle cx={x} cy={y + 16} r={4.5} fill={led} stroke={INK} strokeWidth={2.5} />
    </g>
  );
};

/** Paket data router -> lampu / colokan (adegan 21, 22, 24) */
export const RouterPackets: React.FC<P> = ({t, T}) => {
  const out: React.ReactNode[] = [];
  const mk = (key: string, path: [number, number][], a: number, b: number): void => {
    const k = prog(t, a, b);
    if (k <= 0 || k >= 1) return;
    const [px, py] = polyAt(path, k);
    out.push(
      <g key={key}>
        <path d={polyPart(path, k)} fill="none" stroke="#5ee1ff" strokeWidth={5} strokeLinecap="round" strokeDasharray="12 10" opacity={0.85} />
        <circle cx={px} cy={py} r={10} fill="#ffe066" stroke={INK} strokeWidth={4} />
      </g>,
    );
  };
  mk('lamp', PATH_ROUTER_LAMP, T.at(21, 0.74), T.at(21, 0.98));
  mk('plug', PATH_ROUTER_PLUG, T.at(21, 0.74), T.at(21, 0.98));
  return <g>{out}</g>;
};

export const ModuleChips: React.FC<P> = ({t, T}) => {
  const ap = (i: number): number => prog(t, T.at(7, 0.1 + i * 0.2), T.at(7, 0.1 + i * 0.2) + 0.35);
  const lampOn = lampAt(t, T) > 0.5;
  const klik1 = bump(t, T.at(22, 0.05), T.at(22, 0.5));
  return (
    <g>
      <Chip x={L.ac.x + L.ac.w - 22} y={L.ac.y - 20} appear={ap(0)} t={t} />
      <Chip x={L.lamp.x} y={700} appear={ap(1)} t={t} led={lampOn ? (klik1 > 0.3 ? '#fbbf24' : '#4ade80') : '#5a5f66'} />
      <Chip x={L.plug.x} y={L.plug.y - 46} appear={ap(2)} t={t} led={ironOnAt(t, T) ? '#4ade80' : '#5a5f66'} />
      <Chip x={L.sira.x + 66} y={L.sira.y + 50} appear={ap(3)} t={t} />
    </g>
  );
};

export const Checks: React.FC<P> = ({t, T}) => {
  const one = (x: number, y: number, k: number, key: string): React.ReactNode => {
    if (k <= 0) return null;
    return (
      <g key={key} transform={`translate(${x} ${y}) scale(${easeOutBack(clamp(k))})`}>
        <circle r={26} fill="#4ade80" stroke={INK} strokeWidth={6} />
        <path d="M -12 2 L -3 12 L 14 -9" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  };
  return (
    <g>
      {one(L.lamp.x + 52, L.lamp.y - 48, prog(t, T.at(26, 0.15), T.at(26, 0.35)), 'a')}
      {one(L.iron.x + 20, 985, prog(t, T.at(26, 0.35), T.at(26, 0.55)), 'b')}
    </g>
  );
};

export const KlikText: React.FC<P> = ({t, T}) => {
  const items: {x: number; y: number; a: number; rot: number}[] = [
    {x: 822, y: 706, a: T.at(22, 0.08), rot: -8},
    {x: 1070, y: 1128, a: T.at(24, 0.08), rot: 7},
  ];
  return (
    <g>
      {items.map((it, i) => {
        const k = prog(t, it.a, it.a + 0.18);
        const fade = 1 - prog(t, it.a + 0.6, it.a + 0.9);
        if (k <= 0 || fade <= 0) return null;
        const s = easeOutBack(k);
        return (
          <g key={i} transform={`translate(${it.x} ${it.y}) rotate(${it.rot}) scale(${s})`} opacity={fade}>
            <polygon
              points="-70,0 -48,-22 -52,-50 -24,-34 0,-62 22,-34 52,-50 46,-22 72,0 46,20 52,48 22,32 0,60 -24,34 -52,48 -46,20"
              fill="#ffe066"
              stroke={INK}
              strokeWidth={5}
              strokeLinejoin="round"
            />
            <text x={0} y={11} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill="#e63946" stroke={INK} strokeWidth={1.5}>
              KLIK!
            </text>
          </g>
        );
      })}
    </g>
  );
};

export const Sparkles: React.FC<{cx: number; cy: number; t: number; n?: number; r?: number}> = ({cx, cy, t, n = 6, r = 120}) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const ph = (t * 0.9 + rnd(i) ) % 1;
    const a = rnd(i + 20) * Math.PI * 2;
    const rr = r * (0.5 + 0.7 * rnd(i + 40));
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr * 0.8;
    const s = Math.sin(ph * Math.PI) * (0.7 + 0.5 * rnd(i + 60));
    out.push(
      <path key={i} transform={`translate(${x} ${y}) scale(${s * 18})`} d="M 0 -1 Q 0.15 -0.15 1 0 Q 0.15 0.15 0 1 Q -0.15 0.15 -1 0 Q -0.15 -0.15 0 -1 Z" fill="#ffe066" stroke={INK} strokeWidth={0.28} />,
    );
  }
  return <g>{out}</g>;
};
