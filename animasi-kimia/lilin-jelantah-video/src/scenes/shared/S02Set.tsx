import React, {useMemo} from 'react';
import {noise2D} from '@remotion/noise';
import {Img, random, staticFile, useCurrentFrame} from 'remotion';
import {PALETTE} from '../../data/palette';
import {ART_H, ART_W} from '../../lib/pixel';

/**
 * S02 set kit — morning kitchen (HD-2D) and the underwater river / soil cross-section.
 * Kitchen counter top = y 158, floor horizon = y 200.
 */

const abs: React.CSSProperties = {position: 'absolute', pointerEvents: 'none'};

// ───────────────────────────── Kitchen ─────────────────────────────

/** Mid plane: tiled backsplash behind the counter + window light patch on the wall. */
export const KitchenMid: React.FC<{sun?: number}> = ({sun = 1}) => (
  <div style={{...abs, inset: 0}}>
    {/* backsplash tiles (crisp pixel grid) */}
    <div
      style={{
        ...abs,
        left: 182,
        top: 112,
        width: 258,
        height: 48,
        backgroundColor: PALETTE.cream,
        backgroundImage: `linear-gradient(90deg, ${PALETTE.tan} 1px, transparent 1px), linear-gradient(0deg, ${PALETTE.tan} 1px, transparent 1px)`,
        backgroundSize: '8px 8px',
        borderTop: `2px solid ${PALETTE.woodLight}`,
      }}
    >
      <div style={{...abs, inset: 0, background: 'linear-gradient(180deg, rgba(42,21,48,0.0) 0%, rgba(42,21,48,0.45) 100%)'}} />
    </div>
    {/* slanted sun patch thrown by the window onto the wall */}
    <div
      style={{
        ...abs,
        left: 150,
        top: 40,
        width: 120,
        height: 90,
        background: `linear-gradient(180deg, ${PALETTE.goldPale}55, ${PALETTE.gold}22)`,
        clipPath: 'polygon(0% 0%, 45% 0%, 100% 100%, 50% 100%)',
        mixBlendMode: 'screen',
        opacity: sun,
      }}
    />
  </div>
);

/** Counter with drawers, a sink + faucet on the right and a stove top. */
export const KitchenCounter: React.FC<{stoveOn?: number}> = ({stoveOn = 0}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{...abs, inset: 0}}>
      {/* counter body */}
      <div style={{...abs, left: 186, top: 158, width: 250, height: 44, backgroundColor: PALETTE.woodMid, border: `2px solid ${PALETTE.ink}`}}>
        {[10, 66, 122, 178].map((cx) => (
          <div key={cx} style={{...abs, left: cx, top: 8, width: 46, height: 28, backgroundColor: PALETTE.woodDark, border: `1px solid ${PALETTE.ink}`}}>
            <div style={{...abs, left: 18, top: 4, width: 10, height: 2, backgroundColor: PALETTE.gold}} />
            <div style={{...abs, left: 1, top: 1, width: 44, height: 1, backgroundColor: PALETTE.woodLight, opacity: 0.6}} />
          </div>
        ))}
        {/* toe-kick shadow */}
        <div style={{...abs, left: 0, right: 0, bottom: -1, height: 4, backgroundColor: PALETTE.ink, opacity: 0.6}} />
      </div>
      {/* worktop slab with lit front edge */}
      <div style={{...abs, left: 182, top: 154, width: 258, height: 6, backgroundColor: PALETTE.silver, border: `1px solid ${PALETTE.ink}`}}>
        <div style={{...abs, left: 0, right: 0, top: 0, height: 1, backgroundColor: PALETTE.white}} />
      </div>
      {/* sink basin + faucet */}
      <div style={{...abs, left: 364, top: 154, width: 46, height: 5, backgroundColor: PALETTE.slate, border: `1px solid ${PALETTE.ink}`}}>
        <div style={{...abs, left: 20, top: 1, width: 5, height: 2, backgroundColor: PALETTE.ink}} />
      </div>
      <div style={{...abs, left: 396, top: 136, width: 3, height: 18, backgroundColor: PALETTE.steel, border: `1px solid ${PALETTE.ink}`}} />
      <div style={{...abs, left: 386, top: 134, width: 13, height: 3, backgroundColor: PALETTE.steel, border: `1px solid ${PALETTE.ink}`}} />
      {/* stove burner glow under the pan */}
      {stoveOn > 0.01 ? (
        <div style={{...abs, left: 294, top: 150, width: 32, height: 4, opacity: stoveOn}}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                ...abs,
                left: 3 + i * 6,
                top: -2 - Math.round(1.5 + 1.5 * Math.sin(frame * 0.8 + i * 1.7)),
                width: 3,
                height: 4,
                backgroundColor: i % 2 ? PALETTE.teal : PALETTE.cyan,
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

/** Sizzle: oil droplets jumping + steam wisps above the pan. */
export const PanSizzle: React.FC<{x: number; y: number; amount?: number; seed?: string}> = ({x, y, amount = 1, seed = 'siz'}) => {
  const frame = useCurrentFrame();
  if (amount <= 0.01) return null;
  return (
    <div style={{...abs, left: 0, top: 0}}>
      {Array.from({length: 7}, (_, i) => {
        const period = 14 + Math.floor(random(`${seed}-p${i}`) * 10);
        const ph = (frame + Math.floor(random(`${seed}-o${i}`) * period)) % period;
        const u = ph / period;
        const dx = (random(`${seed}-x${i}`) - 0.5) * 30;
        const h = 6 + random(`${seed}-h${i}`) * 8;
        return (
          <div
            key={i}
            style={{
              ...abs,
              left: Math.round(x + dx * u),
              top: Math.round(y - Math.sin(u * Math.PI) * h),
              width: 1,
              height: 1,
              backgroundColor: PALETTE.goldPale,
              opacity: amount,
            }}
          />
        );
      })}
      {[0, 1, 2].map((w) => {
        const prog = (frame * 0.02 + w * 0.33) % 1;
        return (
          <div
            key={`w${w}`}
            style={{
              ...abs,
              left: x - 8 + w * 7 + Math.sin(prog * 7 + w) * 3,
              top: y - 6 - prog * 30,
              width: 5,
              height: 5,
              borderRadius: '50%',
              backgroundColor: PALETTE.cream,
              opacity: (1 - prog) * 0.4 * amount,
            }}
          />
        );
      })}
    </div>
  );
};

/** Thin pixel stream of oil pouring from (x0,y0) down to (x1,y1). */
export const OilStream: React.FC<{x0: number; y0: number; x1: number; y1: number; color?: string; flow?: number}> = ({
  x0,
  y0,
  x1,
  y1,
  color = PALETTE.amberDeep,
  flow = 1,
}) => {
  const frame = useCurrentFrame();
  if (flow <= 0.01) return null;
  const n = 18;
  return (
    <div style={{...abs, left: 0, top: 0}}>
      {Array.from({length: n}, (_, i) => {
        const u = i / (n - 1);
        // gentle parabola
        const px = x0 + (x1 - x0) * u;
        const py = y0 + (y1 - y0) * u * u;
        const wob = Math.sin(frame * 0.9 + i) * 0.4;
        return <div key={i} style={{...abs, left: Math.round(px + wob), top: Math.round(py), width: 2, height: 2, backgroundColor: i % 4 === (frame >> 1) % 4 ? PALETTE.gold : color, opacity: flow}} />;
      })}
    </div>
  );
};

/** Hanging herbs / pot rail silhouettes, used as an out-of-focus foreground plane. */
export const KitchenForeground: React.FC = () => (
  <div style={{...abs, inset: 0}}>
    {/* corner of a dining table in the extreme foreground */}
    <div style={{...abs, left: -40, top: 236, width: 150, height: 60, backgroundColor: PALETTE.woodDark, borderTop: `3px solid ${PALETTE.woodLight}`}} />
    <div style={{...abs, left: 70, top: 214, width: 18, height: 24, backgroundColor: PALETTE.amberDeep, border: `2px solid ${PALETTE.ink}`, borderRadius: '3px 3px 0 0'}} />
    {/* herb bundle hanging from the top right */}
    <div style={{...abs, left: 420, top: -10, width: 2, height: 30, backgroundColor: PALETTE.ink}} />
    <div style={{...abs, left: 410, top: 18, width: 22, height: 26, backgroundColor: PALETTE.greenDark, borderRadius: '40% 40% 50% 50%'}} />
  </div>
);

// ───────────────────────────── River ─────────────────────────────

/**
 * River cross-section. Surface at y=92; oil film spreads from the left (filmCover 0..1);
 * bubbles rise and get trapped under the film; caustic light bands dim where oil covers.
 */
export const RiverWorld: React.FC<{filmCover?: number; soilStain?: number; seed?: string}> = ({
  filmCover = 1,
  soilStain = 0,
  seed = 'riv',
}) => {
  const frame = useCurrentFrame();
  const SURF = 92;
  const filmRight = Math.round(-20 + filmCover * 420);
  const caustics = useMemo(
    () =>
      Array.from({length: 9}, (_, i) => ({
        x: random(`${seed}-c${i}`) * ART_W,
        w: 6 + random(`${seed}-cw${i}`) * 10,
        sp: 0.15 + random(`${seed}-cs${i}`) * 0.2,
      })),
    [seed],
  );
  const fish = [
    {x0: 40, y: 150, v: 0.45, c: PALETTE.amber, s: 1},
    {x0: 300, y: 188, v: -0.32, c: PALETTE.gold, s: 1},
    {x0: 180, y: 206, v: 0.26, c: PALETTE.blush, s: 0.8},
  ];
  return (
    <div style={{...abs, left: 0, top: 0, width: ART_W, height: ART_H}}>
      {/* sky band above the surface */}
      <div style={{...abs, left: -40, right: -40, top: -40, height: SURF + 40, background: `linear-gradient(180deg, ${PALETTE.tealMid} 0%, ${PALETTE.cyan} 100%)`}} />
      {/* far river bank silhouettes above water */}
      <div style={{...abs, left: -40, right: -40, top: SURF - 18, height: 18, background: `linear-gradient(180deg, ${PALETTE.greenDark}, ${PALETTE.green})`, clipPath: 'polygon(0% 60%, 10% 30%, 22% 55%, 35% 20%, 50% 50%, 64% 25%, 78% 55%, 90% 30%, 100% 50%, 100% 100%, 0% 100%)'}} />
      {/* water body */}
      <div style={{...abs, left: -40, right: -40, top: SURF, bottom: -40, background: `linear-gradient(180deg, ${PALETTE.tealMid} 0%, ${PALETTE.tealDark} 35%, ${PALETTE.navy} 75%, ${PALETTE.ink} 100%)`}} />
      {/* caustic light bands from the surface (dimmed under the oil film) */}
      <div style={{...abs, left: 0, top: SURF, width: ART_W, height: 160, overflow: 'hidden', mixBlendMode: 'screen'}}>
        {caustics.map((c, i) => {
          const x = ((c.x + frame * c.sp) % (ART_W + 60)) - 30;
          const under = x < filmRight;
          return (
            <div
              key={i}
              style={{
                ...abs,
                left: Math.round(x),
                top: 0,
                width: c.w,
                height: 160,
                transform: 'skewX(-14deg)',
                background: `linear-gradient(180deg, ${PALETTE.cyan}AA, ${PALETTE.cyan}00)`,
                opacity: (under ? 0.12 : 0.5) * (0.6 + 0.4 * Math.sin(frame * 0.07 + i)),
              }}
            />
          );
        })}
      </div>
      {/* surface ripple line */}
      <div style={{...abs, left: -40, right: -40, top: SURF, height: 2, backgroundColor: PALETTE.cyan, opacity: 0.8}} />
      {/* OIL FILM: thick amber layer with iridescent highlight, spreading from the left */}
      <div style={{...abs, left: -40, top: SURF - 3, width: filmRight + 40, height: 9}}>
        <div style={{...abs, inset: 0, backgroundColor: PALETTE.amberDeep, borderTop: `1px solid ${PALETTE.ink}`, borderBottom: `1px solid ${PALETTE.ink}`}} />
        <div
          style={{
            ...abs,
            left: 0,
            right: 0,
            top: 1,
            height: 2,
            background: `repeating-linear-gradient(90deg, ${PALETTE.gold} 0px, ${PALETTE.teal} 6px, ${PALETTE.blush} 12px, ${PALETTE.gold} 18px)`,
            backgroundPositionX: `${(frame * 0.4) % 18}px`,
            opacity: 0.7,
          }}
        />
        {/* leading edge blob */}
        <div style={{...abs, right: -6, top: 1, width: 10, height: 6, borderRadius: '50%', backgroundColor: PALETTE.amberDeep, border: `1px solid ${PALETTE.ink}`}} />
      </div>
      {/* sandy riverbed + rocks */}
      <div style={{...abs, left: -40, right: -40, top: 236, bottom: -40, backgroundColor: PALETTE.woodDark, borderTop: `2px solid ${PALETTE.ink}`}}>
        <div style={{...abs, left: 0, right: 0, top: 0, height: 3, backgroundColor: PALETTE.woodMid}} />
      </div>
      {[60, 150, 250, 330].map((rx, i) => (
        <div key={rx} style={{...abs, left: rx, top: 228 + (i % 2) * 3, width: 14 + (i % 3) * 4, height: 10, borderRadius: '50% 50% 20% 20%', backgroundColor: PALETTE.slate, border: `1px solid ${PALETTE.ink}`}} />
      ))}
      {/* seaweed */}
      {[34, 92, 140, 212, 288, 352].map((sx, idx) => {
        const h = 26 + (idx % 3) * 12;
        return (
          <div key={sx} style={{...abs, left: sx, top: 236 - h, width: 6, height: h}}>
            {Array.from({length: Math.floor(h / 4)}, (_, k) => {
              const sway = Math.sin(frame / 20 + idx + k * 0.4) * (k * 0.35);
              return <div key={k} style={{...abs, left: Math.round(sway), bottom: k * 4, width: 4, height: 5, backgroundColor: k % 2 ? PALETTE.green : PALETTE.greenDark}} />;
            })}
          </div>
        );
      })}
      {/* fish (worried, slow) */}
      {fish.map((f, i) => {
        const span = ART_W + 40;
        const x = ((((f.x0 + frame * f.v) % span) + span) % span) - 20;
        const y = f.y + Math.sin(frame / 12 + i) * 2;
        const flip = f.v < 0;
        return (
          <div key={i} style={{...abs, left: Math.round(x), top: Math.round(y), width: 14 * f.s, height: 7 * f.s, transform: flip ? 'scaleX(-1)' : undefined}}>
            <div style={{...abs, left: 3, top: 0, width: 11 * f.s, height: 7 * f.s, backgroundColor: f.c, border: `1px solid ${PALETTE.ink}`, borderRadius: '45%'}} />
            <div style={{...abs, left: 0, top: 1, width: 4, height: 5 * f.s, backgroundColor: PALETTE.amberDeep, clipPath: 'polygon(0 0, 100% 50%, 0 100%)'}} />
            <div style={{...abs, left: 10 * f.s, top: 2, width: 2, height: 2, backgroundColor: PALETTE.ink}} />
          </div>
        );
      })}
      {/* O2 bubbles: rise, then get trapped & flatten under the film */}
      {[60, 110, 170, 230, 280, 330, 380].map((bx, i) => {
        const period = 110 + i * 9;
        const u = ((frame + i * 37) % period) / period;
        const y = 232 - u * 150;
        const trapped = bx < filmRight;
        const yy = trapped ? Math.max(SURF + 8, y) : y;
        const flat = trapped && y < SURF + 8;
        if (!trapped && y < SURF) return null;
        return (
          <div
            key={bx}
            style={{
              ...abs,
              left: Math.round(bx + Math.sin(frame / 9 + i) * 2),
              top: Math.round(yy),
              width: flat ? 8 : 5,
              height: flat ? 3 : 5,
              borderRadius: '50%',
              border: `1px solid ${PALETTE.cyan}`,
              backgroundColor: `${PALETTE.white}55`,
            }}
          />
        );
      })}
      {/* permanently trapped, flattened O2 bubbles clinging to the underside of the film */}
      {[40, 66, 98, 124, 150, 172, 206, 236, 262, 300, 330].map((bx, i) =>
        bx < filmRight - 6 ? (
          <div
            key={`tb${i}`}
            style={{
              ...abs,
              left: bx + Math.round(Math.sin(frame / 15 + i) * 1.5),
              top: SURF + 7 + (i % 3),
              width: 7 + (i % 3) * 2,
              height: 3,
              borderRadius: '50%',
              border: `1px solid ${PALETTE.cyan}`,
              backgroundColor: `${PALETTE.white}44`,
            }}
          />
        ) : null,
      )}
      {/* SOIL BANK on the left (where the oil was dumped): layered earth, oil seeping down */}
      <div
        style={{
          ...abs,
          left: -60,
          top: 74,
          width: 190,
          height: 240,
          background: `linear-gradient(180deg, ${PALETTE.green} 0px, ${PALETTE.green} 5px, ${PALETTE.greenDark} 5px, ${PALETTE.greenDark} 7px, ${PALETTE.tan} 7px, ${PALETTE.tan} 52px, ${PALETTE.woodLight} 52px, ${PALETTE.woodLight} 110px, ${PALETTE.woodMid} 110px)`,
          clipPath: 'polygon(0% 0%, 78% 0%, 86% 22%, 92% 48%, 100% 100%, 0% 100%)',
        }}
      >
        {[[70, 26], [110, 60], [92, 90], [130, 40], [60, 120], [120, 140], [40, 70]].map(([px, py], i) => (
          <div key={i} style={{...abs, left: px, top: py, width: 5, height: 3, backgroundColor: i % 2 ? PALETTE.woodDark : PALETTE.cream, opacity: 0.7}} />
        ))}
        {/* puddle on the surface + drips seeping through the layers */}
        <div style={{...abs, left: 84, top: 4, width: 44, height: 4, borderRadius: '50%', backgroundColor: PALETTE.amberDeep, opacity: Math.min(1, soilStain * 3)}} />
        {[[90, 14, 0], [100, 22, 0.15], [112, 10, 0.3], [120, 18, 0.1]].map(([dx, w, delay], i) => {
          const g = Math.max(0, Math.min(1, (soilStain - delay) / (1 - delay)));
          return (
            <div
              key={`d${i}`}
              style={{
                ...abs,
                left: dx - w / 2,
                top: 6,
                width: w,
                height: Math.round(4 + g * (60 + i * 18)),
                borderRadius: '0 0 50% 50%',
                backgroundColor: PALETTE.ink,
                opacity: 0.5 * Math.min(1, g * 3),
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

/** Sun shimmer just under the surface (rendered in lights layer). */
export const SurfaceShimmer: React.FC<{y?: number; cover?: number}> = ({y = 94, cover = 0}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{...abs, left: -20, top: y, width: ART_W + 40, height: 8, mixBlendMode: 'screen', overflow: 'hidden'}}>
      {Array.from({length: 24}, (_, i) => {
        const x = (i * 21 + frame * 0.6 + noise2D('shim', i, frame * 0.02) * 6) % (ART_W + 40);
        return <div key={i} style={{...abs, left: Math.round(x), top: (i % 3) * 2, width: 6, height: 1, backgroundColor: PALETTE.white, opacity: x < cover * 420 ? 0.1 : 0.6}} />;
      })}
    </div>
  );
};

/** Pixel "heat" thermometer next to the pan. */
export const Thermometer: React.FC<{x: number; y: number; level: number}> = ({x, y, level}) => (
  <div style={{...abs, left: x, top: y, width: 6, height: 34}}>
    <div style={{...abs, left: 1, top: 0, width: 4, height: 28, backgroundColor: PALETTE.white, border: `1px solid ${PALETTE.ink}`}} />
    <div style={{...abs, left: 2, bottom: 6, width: 2, height: Math.round(4 + level * 20), backgroundColor: PALETTE.red}} />
    <div style={{...abs, left: 0, bottom: 0, width: 6, height: 6, borderRadius: '50%', backgroundColor: PALETTE.red, border: `1px solid ${PALETTE.ink}`}} />
  </div>
);

/** Thought bubble with a little lit candle icon (Malika's idea). */
export const IdeaBubble: React.FC<{x: number; y: number; progress: number}> = ({x, y, progress}) => {
  const frame = useCurrentFrame();
  if (progress <= 0.01) return null;
  const s = Math.min(1, progress);
  const fl = frame % 6 < 3;
  return (
    <div style={{...abs, left: x, top: y, width: 0, height: 0, opacity: s}}>
      <div style={{...abs, left: -4, top: 22, width: 4, height: 4, borderRadius: '50%', backgroundColor: PALETTE.cream, border: `1px solid ${PALETTE.ink}`}} />
      <div style={{...abs, left: 2, top: 14, width: 6, height: 6, borderRadius: '50%', backgroundColor: PALETTE.cream, border: `1px solid ${PALETTE.ink}`}} />
      <div style={{...abs, left: 6, top: -18, width: 32, height: 30, borderRadius: '45%', backgroundColor: PALETTE.cream, border: `1px solid ${PALETTE.ink}`, transform: `scale(${s.toFixed(3)})`, transformOrigin: '0% 100%'}}>
        {/* candle */}
        <div style={{...abs, left: 11, top: 13, width: 10, height: 11, backgroundColor: PALETTE.amber, border: `1px solid ${PALETTE.ink}`}} />
        <div style={{...abs, left: 15, top: 10, width: 1, height: 3, backgroundColor: PALETTE.ink}} />
        <div style={{...abs, left: 14, top: fl ? 4 : 5, width: 3, height: fl ? 6 : 5, backgroundColor: PALETTE.gold, borderRadius: '50% 50% 40% 40%'}} />
      </div>
    </div>
  );
};

export const PropImg: React.FC<{src: string; x: number; y: number; w: number; h: number; style?: React.CSSProperties}> = ({src, x, y, w, h, style}) => (
  <Img src={staticFile(src)} style={{position: 'absolute', left: Math.round(x), top: Math.round(y), width: w, height: h, imageRendering: 'pixelated', ...style}} />
);
