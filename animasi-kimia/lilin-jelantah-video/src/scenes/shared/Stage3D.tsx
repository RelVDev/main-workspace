import React, {useMemo} from 'react';
import {noise2D} from '@remotion/noise';
import {random, useCurrentFrame} from 'remotion';
import {PALETTE} from '../../data/palette';
import {ART_H, ART_W} from '../../lib/pixel';

/**
 * HD-2D stage kit for the "Panggung Pintu Dunia" and other theatrical sets:
 * magical far backdrop, lighting truss, pleated velvet curtains with valance,
 * and out-of-focus foreground footlights.
 */

/** Far backdrop: deep gradient sky-wall, a soft portal moon, stars and floating bokeh. */
export const MagicBackdrop: React.FC<{
  top?: string;
  mid?: string;
  bottom?: string;
  moon?: string;
  seed?: string;
}> = ({top = '#140C24', mid = PALETTE.plumMid, bottom = PALETTE.magentaDark, moon = PALETTE.teal, seed = 'mb'}) => {
  const frame = useCurrentFrame();
  const stars = useMemo(
    () =>
      Array.from({length: 46}, (_, i) => ({
        x: random(`${seed}-sx${i}`) * ART_W,
        y: random(`${seed}-sy${i}`) * 150,
        p: random(`${seed}-sp${i}`) * 60,
        big: random(`${seed}-sb${i}`) > 0.85,
      })),
    [seed],
  );
  const bokeh = useMemo(
    () =>
      Array.from({length: 12}, (_, i) => ({
        x: random(`${seed}-bx${i}`) * ART_W,
        y: 30 + random(`${seed}-by${i}`) * 150,
        r: 8 + random(`${seed}-br${i}`) * 18,
        c: [PALETTE.gold, PALETTE.amber, PALETTE.teal, PALETTE.blush][i % 4],
        p: random(`${seed}-bp${i}`) * 100,
      })),
    [seed],
  );
  return (
    <div style={{position: 'absolute', inset: -20, background: `linear-gradient(180deg, ${top} 0%, ${mid} 55%, ${bottom} 100%)`}}>
      {/* portal moon */}
      <div
        style={{
          position: 'absolute',
          left: 240 + 20 - 70,
          top: 40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${moon}66 0%, ${moon}33 35%, ${moon}10 60%, transparent 72%)`,
          opacity: 0.75 + 0.25 * Math.sin(frame / 40),
        }}
      />
      {stars.map((s, i) => (
        <div
          key={`s${i}`}
          style={{
            position: 'absolute',
            left: Math.round(s.x),
            top: Math.round(s.y),
            width: s.big ? 2 : 1,
            height: s.big ? 2 : 1,
            backgroundColor: PALETTE.cream,
            opacity: 0.25 + 0.6 * (0.5 + 0.5 * Math.sin((frame + s.p) * 0.11)),
          }}
        />
      ))}
      {bokeh.map((b, i) => {
        const dx = Math.sin((frame + b.p) / 70) * 6;
        const dy = Math.cos((frame + b.p) / 90) * 4;
        return (
          <div
            key={`b${i}`}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate3d(${(b.x - b.r + dx).toFixed(2)}px, ${(b.y - b.r + dy).toFixed(2)}px, 0)`,
              width: b.r * 2,
              height: b.r * 2,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${b.c}55 0%, ${b.c}33 55%, ${b.c}66 64%, transparent 70%)`,
              opacity: 0.6,
            }}
          />
        );
      })}
    </div>
  );
};

/** Lighting truss across the top with par-can fixtures (mid plane). */
export const LightingTruss: React.FC<{y?: number; cans?: number[]; color?: string; on?: number[]}> = ({
  y = 10,
  cans = [70, 150, 240, 330, 410],
  color = PALETTE.goldPale,
  on,
}) => (
  <div style={{position: 'absolute', left: -20, top: y, width: ART_W + 40, height: 16, pointerEvents: 'none'}}>
    {/* truss beams with lattice */}
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 2, backgroundColor: PALETTE.slate}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 6, height: 2, backgroundColor: PALETTE.slate}} />
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 2,
        height: 4,
        background: `repeating-linear-gradient(60deg, transparent 0px, transparent 3px, ${PALETTE.steel} 3px, ${PALETTE.steel} 4px, transparent 4px, transparent 7px)`,
      }}
    />
    {cans.map((cx, i) => {
      const lit = on ? (on[i] ?? 0) : 1;
      return (
        <div key={i} style={{position: 'absolute', left: cx + 20 - 4, top: 8, width: 8, height: 8}}>
          <div style={{position: 'absolute', inset: 0, backgroundColor: PALETTE.ink, border: `1px solid ${PALETTE.slate}`}} />
          <div
            style={{
              position: 'absolute',
              left: 1,
              top: 6,
              width: 6,
              height: 2,
              backgroundColor: lit > 0.05 ? color : PALETTE.slate,
              boxShadow: lit > 0.05 ? `0 0 ${4 + 6 * lit}px ${color}` : undefined,
              opacity: 0.4 + 0.6 * lit,
            }}
          />
        </div>
      );
    })}
  </div>
);

const pleats = (base: string, dark: string, light: string, w: number) =>
  `repeating-linear-gradient(90deg, ${dark} 0px, ${base} ${w * 0.3}px, ${light} ${w * 0.5}px, ${base} ${w * 0.7}px, ${dark} ${w}px)`;

/** Pleated velvet curtains + scalloped valance with gold fringe. openProgress 0 (closed-ish) .. 1 (open). */
export const VelvetCurtainsV2: React.FC<{openProgress?: number; seed?: string}> = ({openProgress = 1, seed = 'cv'}) => {
  const frame = useCurrentFrame();
  const sideW = 150 - openProgress * 98;
  // Folds compress as the curtain gathers
  const foldW = 14 - openProgress * 4;
  const sway = (k: number) => noise2D(`${seed}-${k}`, frame * 0.01, 0) * 1.2;
  const valH = 30 - openProgress * 6;
  const curtain = (side: 'L' | 'R') => (
    <div
      style={{
        position: 'absolute',
        top: 0,
        bottom: -10,
        [side === 'L' ? 'left' : 'right']: -6,
        width: Math.max(0, sideW + 6 + sway(side === 'L' ? 1 : 2)),
        background: pleats(PALETTE.burgundy, PALETTE.magentaDark, PALETTE.crimson, foldW),
        boxShadow: side === 'L' ? `6px 0 10px rgba(16,10,20,0.7)` : `-6px 0 10px rgba(16,10,20,0.7)`,
        // gathered towards the tie-back: lower half narrows
        clipPath:
          side === 'L'
            ? `polygon(0% 0%, 100% 0%, ${(100 - openProgress * 22).toFixed(1)}% 58%, 100% 100%, 0% 100%)`
            : `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, ${(openProgress * 22).toFixed(1)}% 58%)`,
      }}
    >
      {/* vertical shading: top lit by stage, bottom sinks into shadow */}
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(255,178,90,0.18) 0%, transparent 35%, rgba(16,10,20,0.55) 100%)'}} />
      {/* gold edge trim */}
      <div style={{position: 'absolute', top: 0, bottom: 0, [side === 'L' ? 'right' : 'left']: 0, width: 2, backgroundColor: PALETTE.gold, opacity: 0.85}} />
      {/* tie-back tassel */}
      {openProgress > 0.4 ? (
        <div
          style={{
            position: 'absolute',
            top: 150,
            [side === 'L' ? 'right' : 'left']: 2,
            width: 6,
            height: 12,
            backgroundColor: PALETTE.gold,
            border: `1px solid ${PALETTE.ink}`,
            opacity: Math.min(1, (openProgress - 0.4) * 3),
          }}
        />
      ) : null}
    </div>
  );
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {curtain('L')}
      {curtain('R')}
      {/* valance */}
      <div style={{position: 'absolute', left: -10, right: -10, top: 0, height: valH, background: pleats(PALETTE.maroon, PALETTE.burgundy, PALETTE.crimson, 22)}}>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(16,10,20,0.45) 0%, transparent 60%)'}} />
      </div>
      {/* scallops */}
      <div
        style={{
          position: 'absolute',
          left: -10,
          right: -10,
          top: valH - 1,
          height: 8,
          background: `radial-gradient(circle at 11px 0px, ${PALETTE.maroon} 0px, ${PALETTE.maroon} 10px, ${PALETTE.gold} 10px, ${PALETTE.gold} 11.5px, transparent 11.5px)`,
          backgroundSize: '22px 12px',
        }}
      />
    </div>
  );
};

/** Out-of-focus footlights along the stage lip (foreground plane). */
export const Footlights: React.FC<{y?: number; color?: string; count?: number}> = ({y = 262, color = PALETTE.gold, count = 9}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: -60, top: y, width: ART_W + 120, height: 30, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 0, right: 0, top: 6, height: 30, backgroundColor: PALETTE.ink}} />
      {Array.from({length: count}, (_, i) => {
        const cx = ((i + 0.5) / count) * (ART_W + 120);
        const fl = 0.85 + 0.15 * Math.sin(frame * 0.07 + i * 1.7);
        return (
          <div key={i} style={{position: 'absolute', left: cx - 14, top: -10, width: 28, height: 22}}>
            <div style={{position: 'absolute', left: 6, top: 10, width: 16, height: 8, borderRadius: '8px 8px 0 0', backgroundColor: PALETTE.woodDark}} />
            <div
              style={{
                position: 'absolute',
                inset: -6,
                borderRadius: '50%',
                background: `radial-gradient(ellipse at 50% 70%, ${color}CC 0%, ${color}44 40%, transparent 70%)`,
                opacity: fl,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

/** Big blurred curtain edges framing the lens (foreground plane). */
export const ForegroundDrapes: React.FC<{color?: string; width?: number}> = ({color = PALETTE.magentaDark, width = 40}) => (
  <>
    <div style={{position: 'absolute', left: -30, top: -30, width: width + 30, height: ART_H + 60, background: pleats(color, PALETTE.ink, PALETTE.burgundy, 18), opacity: 0.95}} />
    <div style={{position: 'absolute', right: -30, top: -30, width: width + 30, height: ART_H + 60, background: pleats(color, PALETTE.ink, PALETTE.burgundy, 18), opacity: 0.95}} />
  </>
);
