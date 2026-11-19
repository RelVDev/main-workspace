import React from 'react';
import {random, useCurrentFrame} from 'remotion';
import {PALETTE} from '../../data/palette';
import {ART_W} from '../../lib/pixel';

/**
 * S07 "Perpustakaan" HD-2D set: a tall library hall (far), near shelf flanks + rolling ladder
 * (mid/subject), book stacks (foreground), floating glowing reference cards and the two buckets.
 */

const SPINES = [PALETTE.crimson, PALETTE.teal, PALETTE.gold, PALETTE.green, PALETTE.amber, PALETTE.plumMid, PALETTE.cream, PALETTE.navy, PALETTE.maroon];

const BookRow: React.FC<{w: number; seed: string; h?: number}> = ({w, seed, h = 14}) => {
  const books: React.ReactNode[] = [];
  let x = 0;
  let i = 0;
  while (x < w - 3) {
    const bw = 2 + Math.floor(random(`${seed}-w${i}`) * 3);
    const bh = h - 4 + Math.floor(random(`${seed}-h${i}`) * 5);
    const lean = random(`${seed}-l${i}`) > 0.93;
    books.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x,
          bottom: 0,
          width: bw,
          height: lean ? bh - 2 : bh,
          backgroundColor: SPINES[Math.floor(random(`${seed}-c${i}`) * SPINES.length)],
          borderRight: `1px solid ${PALETTE.ink}`,
          transform: lean ? 'skewX(-12deg)' : undefined,
        }}
      >
        {random(`${seed}-b${i}`) > 0.6 ? <div style={{position: 'absolute', left: 0, right: 0, top: 3, height: 1, backgroundColor: PALETTE.goldPale, opacity: 0.6}} /> : null}
      </div>,
    );
    x += bw + 1;
    i++;
  }
  return <div style={{position: 'absolute', left: 2, right: 2, bottom: 3, height: h + 2}}>{books}</div>;
};

const Shelf: React.FC<{x: number; top: number; w: number; h: number; rowH?: number; seed: string; shade?: number}> = ({x, top, w, h, rowH = 22, seed, shade = 0}) => {
  const rows = Math.floor(h / rowH);
  return (
    <div style={{position: 'absolute', left: x, top, width: w, height: h, backgroundColor: PALETTE.woodDark, border: `2px solid ${PALETTE.ink}`}}>
      {Array.from({length: rows}, (_, r) => (
        <div key={r} style={{position: 'absolute', left: 2, right: 2, top: r * rowH + 2, height: rowH - 2, backgroundColor: PALETTE.ink}}>
          <BookRow w={w - 4} seed={`${seed}-${r}`} h={rowH - 8} />
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: PALETTE.woodMid, borderTop: `1px solid ${PALETTE.woodLight}`}} />
        </div>
      ))}
      {shade > 0 ? <div style={{position: 'absolute', inset: 0, backgroundColor: PALETTE.void, opacity: shade}} /> : null}
    </div>
  );
};

/** Far plane: tall hall — shelves running up out of frame, arched windows, upper gallery. */
export const LibraryHall: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', inset: -20, background: `linear-gradient(180deg, ${PALETTE.plumDeep} 0%, ${PALETTE.woodDark} 70%, ${PALETTE.plumDeep} 100%)`}}>
      {/* arched windows (light source of the god rays) */}
      {[96, 384].map((wx, k) => (
        <div
          key={k}
          style={{
            position: 'absolute',
            left: 20 + wx - 26,
            top: 20 + 8,
            width: 52,
            height: 104,
            borderRadius: '26px 26px 0 0',
            border: `3px solid ${PALETTE.woodMid}`,
            background: `linear-gradient(180deg, ${PALETTE.cream} 0%, ${PALETTE.goldPale} 45%, ${PALETTE.gold} 100%)`,
            overflow: 'hidden',
          }}
        >
          <div style={{position: 'absolute', left: 24, top: 0, bottom: 0, width: 3, backgroundColor: PALETTE.woodMid}} />
          {[30, 60].map((my) => (
            <div key={my} style={{position: 'absolute', left: 0, right: 0, top: my, height: 2, backgroundColor: PALETTE.woodMid}} />
          ))}
          <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 30%, ${PALETTE.white}AA 0%, transparent 60%)`, opacity: 0.7 + 0.3 * Math.sin(frame / 50 + k)}} />
        </div>
      ))}
      {/* tall shelves between and beside the windows */}
      <Shelf x={20 + 140} top={20 - 30} w={200} h={230} rowH={20} seed="hall-c" shade={0.25} />
      <Shelf x={20 - 10} top={20 - 30} w={60} h={230} rowH={20} seed="hall-l" shade={0.3} />
      <Shelf x={20 + 430} top={20 - 30} w={60} h={230} rowH={20} seed="hall-r" shade={0.3} />
      {/* upper gallery balcony */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 20 + 112, height: 6, backgroundColor: PALETTE.woodMid, borderTop: `2px solid ${PALETTE.gold}`, borderBottom: `2px solid ${PALETTE.ink}`}} />
      {Array.from({length: 32}, (_, i) => (
        <div key={i} style={{position: 'absolute', left: i * 17, top: 20 + 98, width: 2, height: 14, backgroundColor: PALETTE.woodLight, opacity: 0.8}} />
      ))}
      <div style={{position: 'absolute', left: 0, right: 0, top: 20 + 96, height: 2, backgroundColor: PALETTE.gold}} />
    </div>
  );
};

/** Mid plane: hanging brass chandelier lamps. */
export const LibraryLamps: React.FC<{xs?: number[]}> = ({xs = [150, 330]}) => {
  const frame = useCurrentFrame();
  return (
    <>
      {xs.map((lx, i) => {
        const sway = Math.sin(frame / 60 + i) * 0.8;
        return (
          <div key={lx} style={{position: 'absolute', left: lx + sway - 9, top: 0, width: 18, height: 40}}>
            <div style={{position: 'absolute', left: 8, top: 0, width: 2, height: 24, backgroundColor: PALETTE.ink}} />
            <div style={{position: 'absolute', left: 1, top: 22, width: 16, height: 8, backgroundColor: PALETTE.gold, border: `1px solid ${PALETTE.ink}`, clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)'}} />
            <div style={{position: 'absolute', left: 4, top: 30, width: 10, height: 3, backgroundColor: PALETTE.cream, boxShadow: `0 0 8px ${PALETTE.goldPale}`}} />
          </div>
        );
      })}
    </>
  );
};

/** Subject plane: near shelf flanks at both edges (sharp, give depth to the floor). */
export const NearShelves: React.FC = () => (
  <>
    <Shelf x={-14} top={66} w={58} h={138} rowH={23} seed="near-l" />
    <Shelf x={436} top={66} w={58} h={138} rowH={23} seed="near-r" />
  </>
);

/** Rolling library ladder leaning on the right shelf. */
export const RollingLadder: React.FC<{x: number; floorY?: number; topY?: number}> = ({x, floorY = 204, topY = 70}) => {
  const h = floorY - topY;
  return (
    <div style={{position: 'absolute', left: x, top: topY, width: 24, height: h, pointerEvents: 'none'}}>
      <div style={{position: 'absolute', left: 2, top: 0, width: 3, height: h, backgroundColor: PALETTE.woodLight, border: `1px solid ${PALETTE.ink}`, transformOrigin: '50% 100%', transform: 'skewX(-8deg)'}} />
      <div style={{position: 'absolute', left: 19, top: 0, width: 3, height: h, backgroundColor: PALETTE.woodLight, border: `1px solid ${PALETTE.ink}`, transformOrigin: '50% 100%', transform: 'skewX(-8deg)'}} />
      {Array.from({length: Math.floor(h / 12)}, (_, i) => {
        const ry = 6 + i * 12;
        const off = ((h - ry) / h) * h * Math.tan((8 * Math.PI) / 180);
        return <div key={i} style={{position: 'absolute', left: 3 + off, top: ry, width: 18, height: 2, backgroundColor: PALETTE.woodMid, borderBottom: `1px solid ${PALETTE.ink}`}} />;
      })}
      {/* top rail hook + wheels */}
      <div style={{position: 'absolute', left: 2 + h * 0.14, top: -4, width: 22, height: 3, backgroundColor: PALETTE.gold}} />
      <div style={{position: 'absolute', left: 0, top: h - 3, width: 5, height: 5, borderRadius: '50%', backgroundColor: PALETTE.ink}} />
      <div style={{position: 'absolute', left: 17, top: h - 3, width: 5, height: 5, borderRadius: '50%', backgroundColor: PALETTE.ink}} />
    </div>
  );
};

/** A small glowing reference card floating through the air (world space). */
export const FloatingCard: React.FC<{x: number; y: number; glow?: string; tilt?: number; opacity?: number; label?: string}> = ({
  x,
  y,
  glow = PALETTE.gold,
  tilt = 0,
  opacity = 1,
  label,
}) => (
  <div
    style={{
      position: 'absolute',
      left: Math.round(x - 8),
      top: Math.round(y - 6),
      width: 16,
      height: 12,
      opacity,
      transform: tilt ? `skewY(${tilt.toFixed(1)}deg)` : undefined,
      pointerEvents: 'none',
      zIndex: 26,
    }}
  >
    <div style={{position: 'absolute', inset: -6, borderRadius: '50%', background: `radial-gradient(circle, ${glow}88 0%, transparent 70%)`}} />
    <div style={{position: 'absolute', inset: 0, backgroundColor: PALETTE.cream, border: `1px solid ${PALETTE.ink}`}}>
      <div style={{position: 'absolute', left: 2, top: 2, width: 10, height: 1, backgroundColor: glow}} />
      <div style={{position: 'absolute', left: 2, top: 5, width: 11, height: 1, backgroundColor: PALETTE.slate}} />
      <div style={{position: 'absolute', left: 2, top: 7, width: 8, height: 1, backgroundColor: PALETTE.slate}} />
    </div>
    {label ? (
      <div style={{position: 'absolute', left: -2, top: -7, fontSize: 4, fontFamily: 'monospace', color: glow, whiteSpace: 'nowrap'}}>{label}</div>
    ) : null}
  </div>
);

/** One of the two sorting buckets (amber = pustaka, teal = pengamatan). */
export const SortBucket: React.FC<{x: number; y: number; color: string; label: string; glow?: number}> = ({x, y, color, label, glow = 1}) => (
  <div style={{position: 'absolute', left: x - 16, top: y - 24, width: 32, height: 24, zIndex: 18}}>
    <div style={{position: 'absolute', inset: -10, borderRadius: '50%', background: `radial-gradient(ellipse, ${color}66 0%, transparent 70%)`, opacity: glow}} />
    <div style={{position: 'absolute', left: 0, top: 4, width: 32, height: 20, backgroundColor: color, border: `2px solid ${PALETTE.ink}`, clipPath: 'polygon(0% 0%, 100% 0%, 88% 100%, 12% 100%)'}} />
    <div style={{position: 'absolute', left: -1, top: 2, width: 34, height: 4, backgroundColor: PALETTE.cream, border: `1px solid ${PALETTE.ink}`}} />
    <div style={{position: 'absolute', left: 6, top: 10, width: 20, textAlign: 'center', fontSize: 5, fontFamily: 'monospace', color: PALETTE.ink, fontWeight: 700}}>{label}</div>
  </div>
);

/** Foreground: out-of-focus book stacks + a reading lamp at the frame corners. */
export const S07Foreground: React.FC = () => (
  <>
    {[0, 1, 2, 3].map((k) => (
      <div key={`l${k}`} style={{position: 'absolute', left: -30 + k * 3, top: 250 - k * 9, width: 70 - k * 6, height: 9, backgroundColor: SPINES[k + 1], border: `1px solid ${PALETTE.ink}`}} />
    ))}
    {[0, 1, 2].map((k) => (
      <div key={`r${k}`} style={{position: 'absolute', left: ART_W - 40 - k * 4, top: 252 - k * 10, width: 76 - k * 8, height: 10, backgroundColor: SPINES[k + 4], border: `1px solid ${PALETTE.ink}`}} />
    ))}
    <div style={{position: 'absolute', left: ART_W - 20, top: 196, width: 4, height: 36, backgroundColor: PALETTE.gold}} />
    <div style={{position: 'absolute', left: ART_W - 34, top: 188, width: 30, height: 12, backgroundColor: PALETTE.green, border: `2px solid ${PALETTE.ink}`, clipPath: 'polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)'}} />
  </>
);
