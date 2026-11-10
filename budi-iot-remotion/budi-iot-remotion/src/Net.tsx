import React from 'react';
import {Timeline} from './timeline';
import {
  L,
  PATH_CLOUD_ROUTER,
  PATH_PHONE_CLOUD,
  PATH_ROUTER_LAMP,
  PATH_ROUTER_PLUG,
  lampAt,
  ironOnAt,
} from './state';
import {FONT, INK, bump, clamp, easeOutBack, lerp, polyAt, polyPart, prog, smooth} from './util';
import {Pill, Wifi} from './Room';

type P = {t: number; T: Timeline};

export const CloudNet: React.FC<P> = ({t, T}) => {
  const k = easeOutBack(prog(t, T.at(21, 0.2), T.at(21, 0.32)));
  if (k <= 0.01) return null;
  const pulse = Math.max(bump(t, T.at(21, 0.28), T.at(21, 0.4)), bump(t, T.at(21, 0.34), T.at(21, 0.46)));
  const circles: [number, number, number][] = [
    [-90, 18, 52],
    [-30, -22, 74],
    [50, -10, 64],
    [112, 20, 44],
    [10, 30, 60],
  ];
  return (
    <g transform={`translate(${L.cloud.x} ${L.cloud.y}) scale(${k})`}>
      {pulse > 0.02 ? <circle r={150 + pulse * 40} fill="#5ee1ff" opacity={0.22 * pulse} /> : null}
      <g fill={INK}>
        {circles.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r + 7} />
        ))}
      </g>
      <g fill="#cfe9ff">
        {circles.map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} />
        ))}
      </g>
      {/* ikon server */}
      <g transform="translate(5 8)">
        {[-34, -4, 26].map((y, i) => (
          <g key={i}>
            <rect x={-48} y={y} width={96} height={26} rx={6} fill="#ffffff" stroke={INK} strokeWidth={4.5} />
            <circle cx={-32} cy={y + 13} r={4.5} fill={i === 1 && Math.sin(t * 9) > 0 ? '#ffe066' : '#4ade80'} />
            <rect x={-18} y={y + 9} width={50} height={8} rx={4} fill="#bcd3ea" />
          </g>
        ))}
      </g>
    </g>
  );
};

const PhoneTitle: React.FC<{k: number}> = ({k}) => <Pill x={L.cloud.x} y={L.cloud.y + 118} text="CLOUD" k={k} color="#ffe66d" size={24} />;
export {PhoneTitle};

export const NetLinks: React.FC<P> = ({t, T}) => {
  const out: React.ReactNode[] = [];
  const draw = (key: string, path: [number, number][], a: number, b: number): void => {
    const k = prog(t, a, b);
    if (k <= 0) return;
    const [px, py] = polyAt(path, k);
    const done = k >= 1;
    const wave = t > T.at(27, 0.1) && t < T.at(28, 0.3);
    const alpha = done ? (wave ? 0.9 : 0.5) : 1;
    out.push(
      <g key={key} opacity={alpha}>
        <path d={polyPart(path, k)} fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" opacity={0.55} />
        <path d={polyPart(path, k)} fill="none" stroke="#5ee1ff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="16 14" strokeDashoffset={-t * 80} />
        {!done ? <circle cx={px} cy={py} r={13} fill="#ffe066" stroke={INK} strokeWidth={5} /> : null}
      </g>,
    );
  };
  draw('p1', PATH_PHONE_CLOUD, T.at(21, 0.1), T.at(21, 0.32));
  draw('p2', PATH_CLOUD_ROUTER, T.at(21, 0.36), T.at(21, 0.7));
  const lampWire = prog(t, T.at(21, 0.74), T.at(21, 0.98));
  if (lampWire >= 1 && t < T.at(28, 0.3)) {
    out.push(
      <g key="w1" opacity={0.45}>
        <path d={polyPart(PATH_ROUTER_LAMP, 1)} fill="none" stroke="#5ee1ff" strokeWidth={5} strokeDasharray="12 12" strokeDashoffset={-t * 60} strokeLinecap="round" />
        <path d={polyPart(PATH_ROUTER_PLUG, 1)} fill="none" stroke="#5ee1ff" strokeWidth={5} strokeDasharray="12 12" strokeDashoffset={-t * 60} strokeLinecap="round" />
      </g>,
    );
  }
  // aliran data berulang di adegan 27
  const w = prog(t, T.at(27, 0.1), T.at(27, 0.2)) * (1 - prog(t, T.at(28, 0.1), T.at(28, 0.3)));
  if (w > 0.01) {
    const all: [number, number][][] = [PATH_PHONE_CLOUD, PATH_CLOUD_ROUTER, PATH_ROUTER_LAMP, PATH_ROUTER_PLUG];
    all.forEach((p, i) => {
      const ph = (t * 0.6 + i * 0.25) % 1;
      const [x, y] = polyAt(p, ph);
      out.push(<circle key={`f${i}`} cx={x} cy={y} r={11} fill="#ffe066" stroke={INK} strokeWidth={4} opacity={w} />);
    });
  }
  return <g>{out}</g>;
};

export const PhoneWifi: React.FC<P> = ({t, T}) => {
  const a = T.at(21, 0.1);
  const k = bump(t, a, a + 0.5);
  if (k <= 0.02) return null;
  return <Wifi x={L.phoneTip.x - 10} y={L.phoneTip.y - 60} s={1.5 + k} color="#5ee1ff" w={4} />;
};

export const PhonePanel: React.FC<P> = ({t, T}) => {
  const pop = easeOutBack(prog(t, T.at(20, 0.55), T.at(20, 0.78)));
  if (pop <= 0.01) return null;
  const x0 = L.panel.cx - L.panel.w / 2;
  const y0 = L.panel.cy - L.panel.h / 2;
  const tx = L.phoneTip.x;
  const ty = L.phoneTip.y;
  const tapT = T.at(21, 0.06);
  const lampOn = lampAt(t, T) > 0.5;
  const ironOn = ironOnAt(t, T);
  const sent = t > tapT;
  const press = bump(t, tapT - 0.05, tapT + 0.25);
  const fingerK = bump(t, tapT - 0.5, tapT + 0.5);
  const dots = '.'.repeat(1 + (Math.floor(t * 4) % 3));
  const done = t > T.at(25, 0.3) + 0.6;
  const rows: {label: string; on: boolean}[] = [
    {label: 'Lampu Kamar', on: lampOn},
    {label: 'Setrika', on: ironOn},
  ];
  return (
    <g>
      <path d={`M ${x0 + 150} ${y0 + L.panel.h} L ${tx} ${ty} L ${x0 + 200} ${y0 + L.panel.h - 20} Z`} fill="#22262e" stroke={INK} strokeWidth={5} strokeLinejoin="round" opacity={pop} />
      <g transform={`translate(${tx} ${ty}) scale(${pop}) translate(${-tx} ${-ty})`}>
        <g transform={`translate(${x0} ${y0})`}>
          <rect x={0} y={0} width={L.panel.w} height={L.panel.h} rx={32} fill="#22262e" stroke={INK} strokeWidth={7} />
          <rect x={12} y={14} width={216} height={402} rx={22} fill="#f4f7fb" />
          <path d="M 12 76 V 36 Q 12 14 34 14 H 206 Q 228 14 228 36 V 76 Z" fill="#2f6fed" />
          <text x={120} y={54} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={22} fill="#fff">
            Rumah Pintar
          </text>
          {rows.map((r, i) => {
            const y = 94 + i * 88;
            return (
              <g key={r.label}>
                <rect x={26} y={y} width={188} height={76} rx={16} fill="#fff" stroke={INK} strokeWidth={4} />
                <text x={40} y={y + 34} fontFamily={FONT} fontWeight={800} fontSize={19} fill={INK}>
                  {r.label}
                </text>
                <text x={40} y={y + 60} fontFamily={FONT} fontWeight={700} fontSize={15} fill={r.on ? (sent ? '#b7791f' : '#2f9e5c') : '#6b7280'}>
                  {r.on ? (sent ? `Mengirim${dots}` : 'Menyala') : 'Mati'}
                </text>
                <rect x={154} y={y + 26} width={50} height={28} rx={14} fill={r.on ? '#4ade80' : '#cbd5e1'} stroke={INK} strokeWidth={3.5} />
                <circle cx={r.on ? 190 : 168} cy={y + 40} r={10} fill="#fff" stroke={INK} strokeWidth={3} />
              </g>
            );
          })}
          <g transform={`translate(120 ${318}) scale(${1 - 0.06 * press}) translate(-120 -318)`}>
            <rect x={26} y={284} width={188} height={68} rx={20} fill="#e63946" stroke={INK} strokeWidth={5} />
            <text x={120} y={325} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={20} fill="#fff">
              MATIKAN SEMUA
            </text>
          </g>
          {done ? (
            <text x={120} y={392} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={20} fill="#2f9e5c">
              Berhasil ✓
            </text>
          ) : null}
          {fingerK > 0.02 ? (
            <g transform={`translate(${lerp(190, 120, smooth(fingerK))} ${lerp(420, 326, smooth(fingerK))})`} opacity={clamp(fingerK * 3)}>
              <circle r={22} fill="#f2c48d" stroke={INK} strokeWidth={5} />
              <circle r={36 + press * 10} fill="none" stroke="#fff" strokeWidth={4} opacity={press} />
            </g>
          ) : null}
        </g>
      </g>
    </g>
  );
};

export const IronIcon: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r={80} fill="#ff7b54" opacity={0.18 + 0.1 * Math.sin(t * 9)} />
    <path d="M 52 28 L -52 28 Q -68 28 -56 14 L -26 -18 L 40 -18 Q 54 -18 54 -4 Z" fill="#ff9a4d" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M 40 -18 L -26 -18 Q -18 -52 14 -52 Q 38 -52 40 -18 Z" fill="#4a6fa5" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -12 -40 Q 6 -84 34 -62 Q 42 -54 40 -40" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" />
    <path d="M -12 -40 Q 6 -84 34 -62 Q 42 -54 40 -40" fill="none" stroke="#e8e8e8" strokeWidth={5} strokeLinecap="round" />
    {[0, 1].map((i) => {
      const ph = (t * 0.6 + i * 0.5) % 1;
      return <circle key={i} cx={-30 + i * 14} cy={-30 - ph * 50} r={7 + ph * 9} fill="#fff" stroke={INK} strokeWidth={4} opacity={1 - ph} />;
    })}
  </g>
);

export const LampIcon: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => {
  const rays: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) rays.push(<line key={i} x1={0} y1={46} x2={0} y2={74} transform={`rotate(${-80 + i * 20})`} stroke="#ffb703" strokeWidth={8} strokeLinecap="round" />);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={78} fill="#ffe27a" opacity={0.3 + 0.1 * Math.sin(t * 9)} />
      <line x1={0} y1={-86} x2={0} y2={-48} stroke={INK} strokeWidth={6} />
      <polygon points="-46,-8 46,-8 24,-48 -24,-48" fill="#4aa3c7" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <circle cx={0} cy={14} r={22} fill="#fff176" stroke={INK} strokeWidth={6} />
      <g transform="translate(0 14)">{rays}</g>
    </g>
  );
};

export const ThoughtBubble: React.FC<P> = ({t, T}) => {
  const a = T.s(16);
  const b = T.s(19);
  const k = easeOutBack(prog(t, a, a + 0.3)) * (1 - smooth(prog(t, b, b + 0.25)));
  if (k <= 0.01) return null;
  const cx = 1680;
  const cy = 790;
  const circles: [number, number, number][] = [
    [-96, 8, 62],
    [-30, -44, 86],
    [60, -28, 80],
    [104, 20, 56],
    [0, 36, 70],
  ];
  const which = t < T.s(17) ? 'q' : t < T.s(18) ? 'iron' : 'lamp';
  const pop = (s0: number): number => easeOutBack(prog(t, s0, s0 + 0.22));
  return (
    <g transform={`translate(${cx} ${cy}) scale(${k})`}>
      <g fill={INK}>
        {circles.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r + 7} />
        ))}
        <circle cx={78} cy={150} r={22} />
        <circle cx={104} cy={196} r={14} />
      </g>
      <g fill="#fff">
        {circles.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} />
        ))}
        <circle cx={78} cy={150} r={15} />
        <circle cx={104} cy={196} r={8} />
      </g>
      {which === 'q' ? (
        <text x={0} y={34} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={110} fill="#2f6fed" stroke={INK} strokeWidth={3} transform={`rotate(${Math.sin(t * 5) * 6})`}>
          ?
        </text>
      ) : null}
      {which === 'iron' ? <IronIcon x={0} y={10} s={0.9 * pop(T.s(17))} t={t} /> : null}
      {which === 'lamp' ? <LampIcon x={0} y={10} s={0.85 * pop(T.s(18))} t={t} /> : null}
    </g>
  );
};

export const Burst: React.FC<{x: number; y: number; k: number; rot: number; r?: number; color?: string}> = ({x, y, k, rot, r = 150, color = '#ffd166'}) => {
  if (k <= 0.01) return null;
  const pts: string[] = [];
  const n = 14;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.66;
    pts.push(`${Math.cos(a) * rr},${Math.sin(a) * rr}`);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${easeOutBack(clamp(k))})`}>
      <polygon points={pts.join(' ')} fill={color} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    </g>
  );
};

export const Puff: React.FC<{x: number; y: number; k: number; r?: number}> = ({x, y, k, r = 70}) => {
  if (k <= 0 || k >= 1) return null;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.4;
    const d = r * (0.3 + k * 0.9);
    out.push(<circle key={i} cx={x + Math.cos(a) * d} cy={y + Math.sin(a) * d * 0.8} r={(r * 0.35) * (0.6 + k * 0.6)} fill="#fff" stroke={INK} strokeWidth={4} opacity={1 - k * k} />);
  }
  return <g>{out}</g>;
};

export const ExclMark: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => {
  if (k <= 0.01) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${easeOutBack(clamp(k))}) rotate(${Math.sin(k * 20) * 4})`}>
      <path d="M -14 -50 Q 0 -60 14 -50 L 8 -8 Q 0 -2 -8 -8 Z" fill="#e63946" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <circle cx={0} cy={18} r={10} fill="#e63946" stroke={INK} strokeWidth={5} />
    </g>
  );
};

/** Label & judul IoT di adegan 27, lencana di adegan 28 */
export const IotLabels: React.FC<P> = ({t, T}) => {
  const out = 1 - smooth(prog(t, T.at(28, 0.05), T.at(28, 0.25)));
  const k = (f: number): number => prog(t, T.at(27, f), T.at(27, f + 0.1)) * out;
  return (
    <g>
      <Pill x={880} y={575} text="PERANGKAT (THINGS)" k={k(0.16)} color="#ffe2d6" size={26} />
      <Pill x={L.cloud.x} y={L.cloud.y - 135} text="INTERNET" k={k(0.4)} color="#d7f6ff" size={26} />
      <Pill x={L.panel.cx - 40} y={L.panel.cy - L.panel.h / 2 - 50} text="APLIKASI (GENGGAMAN)" k={k(0.62)} color="#d9f7c9" size={26} />
      <Pill x={1190} y={250} text="INTERNET OF THINGS  •  IoT" k={k(0.82)} color="#ffe066" size={44} />
    </g>
  );
};

const Shield: React.FC = () => (
  <g>
    <path d="M 0 -34 L 30 -22 Q 30 20 0 38 Q -30 20 -30 -22 Z" fill="#4ade80" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -12 2 L -3 12 L 14 -10" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
  </g>
);
const Bolt: React.FC = () => (
  <g>
    <circle r={34} fill="#ffe066" stroke={INK} strokeWidth={6} />
    <path d="M 6 -24 L -14 4 H -1 L -6 24 L 14 -6 H 1 Z" fill="#fb8500" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
  </g>
);

export const BenefitBadges: React.FC<P & {anchorX: number}> = ({t, T, anchorX}) => {
  const items = [
    {label: 'AMAN', a: T.at(28, 0.2), dx: -10, dy: 0, icon: <Shield />},
    {label: 'EFISIEN', a: T.at(28, 0.45), dx: 190, dy: 70, icon: <Bolt />},
  ];
  return (
    <g>
      {items.map((it, i) => {
        const k = easeOutBack(prog(t, it.a, it.a + 0.3));
        if (k <= 0.01) return null;
        const bob = Math.sin(t * 2 + i) * 6;
        return (
          <g key={it.label} transform={`translate(${anchorX + it.dx} ${690 + it.dy + bob}) scale(${k})`}>
            <rect x={-120} y={-44} width={240} height={88} rx={44} fill="#fff" stroke={INK} strokeWidth={6} />
            <g transform="translate(-76 0)">{it.icon}</g>
            <text x={20} y={11} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={32} fill={INK}>
              {it.label}
            </text>
          </g>
        );
      })}
    </g>
  );
};
