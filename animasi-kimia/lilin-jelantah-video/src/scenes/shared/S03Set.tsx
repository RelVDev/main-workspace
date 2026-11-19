import React from 'react';
import {useCurrentFrame} from 'remotion';
import {PALETTE} from '../../data/palette';
import {buildVoxels, type Voxel} from '../../engine/Voxel';

/** S03 lab kit — bench top (y 158), holo pedestals, filtering drips, foreground glassware. */

const abs: React.CSSProperties = {position: 'absolute', pointerEvents: 'none'};

/** Bench slab with a lit steel worktop edge (body x 170..394). */
export const LabBench: React.FC = () => (
  <>
    <div style={{...abs, left: 170, top: 158, width: 224, height: 44, backgroundColor: PALETTE.woodMid, border: `2px solid ${PALETTE.ink}`}}>
      <div style={{...abs, left: 0, right: 0, bottom: -1, height: 4, backgroundColor: PALETTE.ink, opacity: 0.55}} />
    </div>
    <div style={{...abs, left: 166, top: 154, width: 232, height: 6, backgroundColor: PALETTE.slate, border: `1px solid ${PALETTE.ink}`}}>
      <div style={{...abs, left: 0, right: 0, top: 0, height: 1, backgroundColor: PALETTE.silver}} />
    </div>
  </>
);

/** Floating holographic pedestal (teal ring + scanlines) used for 3D exhibits. */
export const HoloPedestal: React.FC<{x: number; y: number; color?: string; on?: number}> = ({x, y, color = PALETTE.teal, on = 1}) => {
  const frame = useCurrentFrame();
  if (on <= 0.01) return null;
  return (
    <div style={{...abs, left: x - 22, top: y - 4, width: 44, height: 50, opacity: on}}>
      <div style={{...abs, left: 0, top: 0, width: 44, height: 9, borderRadius: '50%', border: `1px solid ${color}`, backgroundColor: `${color}33`}} />
      <div
        style={{
          ...abs,
          left: 4,
          top: -40,
          width: 36,
          height: 44,
          background: `linear-gradient(0deg, ${color}55 0%, ${color}00 100%)`,
          clipPath: 'polygon(0% 100%, 100% 100%, 85% 0%, 15% 0%)',
          mixBlendMode: 'screen',
        }}
      />
      {[0, 1, 2].map((k) => {
        const u = ((frame * 0.02 + k / 3) % 1);
        return <div key={k} style={{...abs, left: 6, top: 2 - u * 40, width: 32, height: 1, backgroundColor: color, opacity: (1 - u) * 0.7}} />;
      })}
    </div>
  );
};

/** A block of solid paraffin / candle base (white wax) — distinct material from oil. */
export const paraffinBlockModel = (): Voxel[] =>
  buildVoxels(12, 10, 9, (x, y, z) => {
    const edge = x === 0 || x === 11 || y === 0 || y === 9;
    if (z === 8) return edge ? PALETTE.silver : PALETTE.white;
    return edge && z % 3 === 0 ? PALETTE.silver : PALETTE.white;
  });

/** Drips falling from the funnel tip into the beaker below; crumbs stay in the filter. */
export const FilterDrips: React.FC<{x: number; yTop: number; yBottom: number; on?: number}> = ({x, yTop, yBottom, on = 1}) => {
  const frame = useCurrentFrame();
  if (on <= 0.01) return null;
  return (
    <div style={{...abs, left: 0, top: 0, opacity: on}}>
      {[0, 1, 2].map((k) => {
        const u = ((frame * 0.035 + k / 3) % 1);
        return <div key={k} style={{...abs, left: x, top: Math.round(yTop + u * (yBottom - yTop)), width: 2, height: 3, backgroundColor: PALETTE.amberDeep}} />;
      })}
      {/* crumbs caught in the filter cone */}
      {[[-6, -9], [-2, -8], [3, -10], [6, -8], [0, -6]].map(([dx, dy], i) => (
        <div key={`c${i}`} style={{...abs, left: x + dx, top: yTop + dy, width: 2, height: 2, backgroundColor: PALETTE.woodDark}} />
      ))}
    </div>
  );
};

/** Little cyan arrows climbing the wick (capillary action). */
export const CapillaryArrows: React.FC<{x: number; y: number; on?: number}> = ({x, y, on = 1}) => {
  const frame = useCurrentFrame();
  if (on <= 0.01) return null;
  return (
    <div style={{...abs, left: 0, top: 0, opacity: on}}>
      {[0, 1].map((k) => {
        const u = ((frame * 0.03 + k * 0.5) % 1);
        const yy = Math.round(y - u * 14);
        return (
          <div key={k} style={{...abs, left: x + 5, top: yy, width: 5, height: 4, opacity: 1 - u * 0.6}}>
            <div style={{...abs, left: 2, top: 1, width: 1, height: 3, backgroundColor: PALETTE.cyan}} />
            <div style={{...abs, left: 0, top: 1, width: 5, height: 1, backgroundColor: PALETTE.cyan, clipPath: 'polygon(50% 0, 100% 100%, 0 100%)'}} />
            <div style={{...abs, left: 1, top: 0, width: 3, height: 1, backgroundColor: PALETTE.cyan}} />
          </div>
        );
      })}
    </div>
  );
};

/** Out-of-focus glassware in the extreme foreground (left & right corners). */
export const LabForeground: React.FC = () => (
  <div style={{...abs, inset: 0}}>
    {/* erlenmeyer flask, left */}
    <div style={{...abs, left: -14, top: 196, width: 54, height: 80, backgroundColor: PALETTE.silver, opacity: 0.85, clipPath: 'polygon(38% 0%, 62% 0%, 62% 30%, 100% 100%, 0% 100%, 38% 30%)'}} />
    <div style={{...abs, left: -14, top: 240, width: 54, height: 40, backgroundColor: PALETTE.teal, opacity: 0.8, clipPath: 'polygon(18% 0%, 82% 0%, 100% 100%, 0% 100%)'}} />
    {/* tall graduated cylinder, right */}
    <div style={{...abs, left: 448, top: 178, width: 22, height: 100, backgroundColor: PALETTE.silver, opacity: 0.8}} />
    <div style={{...abs, left: 448, top: 220, width: 22, height: 60, backgroundColor: PALETTE.gold, opacity: 0.85}} />
  </div>
);

/** Wall-mounted lamp hardware for the mid plane (no cones — light comes from the light-map). */
export const LabLampHardware: React.FC<{xs: number[]; colors: string[]}> = ({xs, colors}) => (
  <>
    {xs.map((x, i) => (
      <div key={x} style={{...abs, left: x - 9, top: 0, width: 18, height: 26}}>
        <div style={{...abs, left: 8, top: 0, width: 2, height: 16, backgroundColor: PALETTE.ink}} />
        <div style={{...abs, left: 0, top: 16, width: 18, height: 7, backgroundColor: PALETTE.slate, border: `1px solid ${PALETTE.ink}`, clipPath: 'polygon(22% 0%, 78% 0%, 100% 100%, 0% 100%)'}} />
        <div style={{...abs, left: 5, top: 22, width: 8, height: 3, backgroundColor: colors[i % colors.length], boxShadow: `0 0 6px ${colors[i % colors.length]}`}} />
      </div>
    ))}
  </>
);

/**
 * Glass candle jar with see-through walls (emissive rgba voxels, render with outline={null}),
 * so the wax level / colour inside is readable. Smaller than the engine default jar.
 */
export const glassJarModel = (waxLevel: number, wax: string, label: string = PALETTE.amber): Voxel[] => {
  const R = 6;
  const H = 13;
  const fillTo = Math.round(1 + (H - 3) * waxLevel);
  return buildVoxels(13, 13, H + 3, (x, y, z) => {
    const dx = x - 6;
    const dy = y - 6;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (z < H) {
      if (d > R + 0.5) return null;
      const wall = d > R - 0.8;
      if (z === 0) return PALETTE.steel;
      if (wall) {
        if (z === H - 1) return PALETTE.white; // lip
        if (z >= 4 && z <= 6 && dy > 1) return label; // front label band
        return {c: dy > 2 && dx < -1 ? 'rgba(247,250,252,0.55)' : 'rgba(159,243,238,0.22)', e: true};
      }
      if (waxLevel > 0.02 && z <= fillTo) return z === fillTo ? PALETTE.white : wax;
      return null;
    }
    if (dx === 0 && dy === 0 && z < H + 2) return PALETTE.ink; // wick
    return null;
  });
};
