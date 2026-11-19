import React, {useMemo} from 'react';
import {random, useCurrentFrame} from 'remotion';
import {PALETTE} from '../../data/palette';
import {ART_H, ART_W} from '../../lib/pixel';

/**
 * S09 "Atap senja" set: dusk → night sky with sun/moon and stars, two depth layers of
 * skyline whose windows switch on as night falls, rooftop parapet + railing, candle table,
 * and a defocused railing/plants foreground.
 */

const hexToRgb = (h: string) => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mixHex = (a: string, b: string, t: number) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  const u = Math.max(0, Math.min(1, t));
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * u)).join(',')})`;
};

/** Far plane: sky gradient (dusk→night), setting sun, rising moon, stars, distant skyline. */
export const DuskSky: React.FC<{night: number; seed?: string}> = ({night, seed = 'sky'}) => {
  const frame = useCurrentFrame();
  const top = mixHex('#3A1850', '#070B1E', night);
  const mid = mixHex('#B23A5A', '#152446', night);
  const low = mixHex('#FFB25A', '#2A2050', night);
  const stars = useMemo(
    () =>
      Array.from({length: 70}, (_, i) => ({
        x: random(`${seed}-x${i}`) * (ART_W + 40) - 20,
        y: random(`${seed}-y${i}`) * 140,
        p: random(`${seed}-p${i}`) * 80,
        big: random(`${seed}-b${i}`) > 0.88,
      })),
    [seed],
  );
  const sunY = 150 + night * 70;
  return (
    <div style={{position: 'absolute', left: -30, top: -30, width: ART_W + 60, height: ART_H + 60, background: `linear-gradient(180deg, ${top} 0%, ${mid} 55%, ${low} 82%)`}}>
      <div style={{position: 'absolute', left: 30, top: 30, width: ART_W, height: ART_H}}>
        {/* stars */}
        {stars.map((s, i) => {
          const tw = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin((frame + s.p) * 0.09));
          const op = Math.max(0, night * 1.3 - 0.3 - s.y / 400) * tw;
          if (op < 0.02) return null;
          return (
            <div
              key={i}
              style={{position: 'absolute', left: Math.round(s.x), top: Math.round(s.y), width: s.big ? 2 : 1, height: s.big ? 2 : 1, backgroundColor: PALETTE.cream, opacity: op}}
            />
          );
        })}
        {/* setting sun (banded pixel disc + halo) */}
        {night < 0.95 ? (
          <div style={{position: 'absolute', left: 372, top: sunY - 22, width: 44, height: 44, opacity: 1 - night}}>
            <div style={{position: 'absolute', inset: -40, borderRadius: '50%', background: `radial-gradient(circle, ${PALETTE.goldPale}88 0%, ${PALETTE.amber}44 35%, transparent 70%)`}} />
            <div style={{position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: PALETTE.gold}} />
            <div style={{position: 'absolute', inset: 6, borderRadius: '50%', backgroundColor: PALETTE.goldPale}} />
            {[14, 22, 28].map((y) => (
              <div key={y} style={{position: 'absolute', left: -2, right: -2, top: y, height: 2, backgroundColor: mid}} />
            ))}
          </div>
        ) : null}
        {/* moon */}
        <div style={{position: 'absolute', left: 70, top: 46 - night * 12, width: 18, height: 18, opacity: Math.max(0, night * 1.4 - 0.4)}}>
          <div style={{position: 'absolute', inset: -14, borderRadius: '50%', background: `radial-gradient(circle, ${PALETTE.cyan}44 0%, transparent 70%)`}} />
          <div style={{position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: PALETTE.cream}} />
          <div style={{position: 'absolute', left: 6, top: -2, width: 16, height: 16, borderRadius: '50%', backgroundColor: top}} />
        </div>
        {/* thin cloud bands lit by the sun */}
        {[
          [40, 96, 120],
          [230, 112, 150],
          [320, 84, 90],
        ].map(([x, y, w], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x + Math.sin(frame / 200 + i) * 4,
              top: y,
              width: w,
              height: 4,
              backgroundColor: mixHex('#F4A3B0', '#2C3A66', night),
              boxShadow: `10px 4px 0 ${mixHex('#F08A3C', '#1E2A50', night)}`,
              opacity: 0.8,
            }}
          />
        ))}
      </div>
    </div>
  );
};

/** One skyline layer. Windows light up progressively with `night`. */
export const Skyline: React.FC<{
  baseY: number;
  minH: number;
  maxH: number;
  color: string;
  night: number;
  seed: string;
  windowColor?: string;
  count?: number;
}> = ({baseY, minH, maxH, color, night, seed, windowColor = PALETTE.gold, count = 16}) => {
  const frame = useCurrentFrame();
  const bld = useMemo(() => {
    let x = -30;
    const out: Array<{x: number; w: number; h: number; ant: boolean; i: number}> = [];
    for (let i = 0; i < count; i++) {
      const w = 22 + Math.floor(random(`${seed}-w${i}`) * 26);
      out.push({x, w, h: minH + Math.floor(random(`${seed}-h${i}`) * (maxH - minH)), ant: random(`${seed}-a${i}`) > 0.75, i});
      x += w + Math.floor(random(`${seed}-g${i}`) * 4);
      if (x > ART_W + 30) break;
    }
    return out;
  }, [count, maxH, minH, seed]);
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: ART_W, height: ART_H}}>
      {bld.map((b) => (
        <div key={b.i} style={{position: 'absolute', left: b.x, top: baseY - b.h, width: b.w, height: b.h + 80, backgroundColor: color}}>
          {b.ant ? (
            <>
              <div style={{position: 'absolute', left: Math.round(b.w / 2), top: -10, width: 1, height: 10, backgroundColor: color}} />
              <div style={{position: 'absolute', left: Math.round(b.w / 2) - 1, top: -12, width: 3, height: 2, backgroundColor: PALETTE.red, opacity: (frame + b.i * 9) % 50 < 25 ? 1 : 0.2}} />
            </>
          ) : null}
          {/* window grid */}
          {Array.from({length: Math.floor((b.h - 6) / 8)}, (_, r) =>
            Array.from({length: Math.floor((b.w - 4) / 6)}, (_, c) => {
              const th = random(`${seed}-win-${b.i}-${r}-${c}`);
              const on = night > th * 0.9 + 0.05 && th < 0.72;
              if (!on) return null;
              const flick = (frame + Math.floor(th * 300)) % 220 < 4 ? 0.3 : 1;
              return (
                <div
                  key={`${r}-${c}`}
                  style={{position: 'absolute', left: 3 + c * 6, top: 5 + r * 8, width: 3, height: 3, backgroundColor: th > 0.55 ? PALETTE.cyan : windowColor, opacity: flick * Math.min(1, (night - th * 0.9) * 3)}}
                />
              );
            }),
          )}
        </div>
      ))}
    </div>
  );
};

/** Subject plane: rooftop parapet wall + railing behind the group, water tank, string light poles. */
export const RooftopParapet: React.FC<{y?: number}> = ({y = 182}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: ART_W, height: ART_H, pointerEvents: 'none'}}>
    {/* water tank (left back) */}
    <div style={{position: 'absolute', left: 6, top: y - 46, width: 30, height: 30, backgroundColor: PALETTE.slate, border: `2px solid ${PALETTE.ink}`, borderRadius: '4px 4px 0 0'}}>
      {[8, 18].map((yy) => (
        <div key={yy} style={{position: 'absolute', left: 0, right: 0, top: yy, height: 2, backgroundColor: PALETTE.steel}} />
      ))}
    </div>
    <div style={{position: 'absolute', left: 10, top: y - 16, width: 3, height: 16, backgroundColor: PALETTE.ink}} />
    <div style={{position: 'absolute', left: 29, top: y - 16, width: 3, height: 16, backgroundColor: PALETTE.ink}} />
    {/* railing */}
    <div style={{position: 'absolute', left: -10, right: -10, top: y - 14, height: 2, backgroundColor: PALETTE.steel, borderBottom: `1px solid ${PALETTE.ink}`}} />
    {Array.from({length: 25}, (_, i) => (
      <div key={i} style={{position: 'absolute', left: i * 20, top: y - 14, width: 2, height: 14, backgroundColor: PALETTE.slate}} />
    ))}
    {/* parapet wall */}
    <div style={{position: 'absolute', left: -10, right: -10, top: y, height: 24, background: `linear-gradient(180deg, ${PALETTE.steel} 0%, ${PALETTE.slate} 30%, ${PALETTE.plumMid} 100%)`, borderTop: `2px solid ${PALETTE.silver}`}}>
      {Array.from({length: 26}, (_, i) => (
        <div key={i} style={{position: 'absolute', left: i * 20 + (i % 2) * 10, top: 6, width: 1, height: 8, backgroundColor: PALETTE.ink, opacity: 0.4}} />
      ))}
    </div>
  </div>
);

/** Little round table for the hero candle. */
export const CandleTable: React.FC<{x: number; y: number}> = ({x, y}) => (
  <div style={{position: 'absolute', left: x - 24, top: y, width: 48, height: 28, pointerEvents: 'none'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 48, height: 8, borderRadius: '50%', backgroundColor: PALETTE.woodLight, border: `2px solid ${PALETTE.ink}`}} />
    <div style={{position: 'absolute', left: 2, top: 4, width: 44, height: 5, borderRadius: '0 0 50% 50%', backgroundColor: PALETTE.woodMid}} />
    <div style={{position: 'absolute', left: 21, top: 9, width: 6, height: 17, backgroundColor: PALETTE.woodDark, border: `1px solid ${PALETTE.ink}`}} />
    <div style={{position: 'absolute', left: 12, top: 24, width: 24, height: 4, backgroundColor: PALETTE.woodDark, border: `1px solid ${PALETTE.ink}`}} />
  </div>
);

/** Foreground plane: defocused railing posts and potted plants at the lens corners. */
export const RooftopForeground: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: -40, right: -40, top: 252, height: 4, backgroundColor: PALETTE.ink}} />
    {[-20, 90, 400, 500].map((x) => (
      <div key={x} style={{position: 'absolute', left: x, top: 240, width: 10, height: 60, backgroundColor: PALETTE.ink}} />
    ))}
    <div style={{position: 'absolute', left: -30, top: 196, width: 70, height: 110}}>
      <div style={{position: 'absolute', left: 6, top: 0, width: 56, height: 60, borderRadius: '50%', backgroundColor: PALETTE.greenDark}} />
      <div style={{position: 'absolute', left: 16, top: 52, width: 40, height: 60, backgroundColor: PALETTE.amberDeep}} />
    </div>
    <div style={{position: 'absolute', right: -26, top: 206, width: 60, height: 100}}>
      <div style={{position: 'absolute', left: 4, top: 0, width: 50, height: 50, borderRadius: '50%', backgroundColor: PALETTE.greenDark}} />
      <div style={{position: 'absolute', left: 12, top: 44, width: 36, height: 60, backgroundColor: PALETTE.woodDark}} />
    </div>
  </>
);
