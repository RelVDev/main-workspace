import React, {useMemo} from 'react';
import {noise2D} from '@remotion/noise';
import {random, useCurrentFrame} from 'remotion';
import {PALETTE} from '../data/palette';
import {ART_H, ART_W} from '../lib/pixel';

/**
 * Volumetric shafts radiating from a source (window, lamp, spotlight). Each shaft is a thin
 * wedge that slowly breathes; together they read as light through dusty air.
 */
export const GodRays: React.FC<{
  x: number;
  y: number;
  color?: string;
  opacity?: number;
  /** Centre direction in degrees (90 = straight down). */
  angle?: number;
  spread?: number;
  length?: number;
  count?: number;
  seed?: string;
}> = ({x, y, color = PALETTE.goldPale, opacity = 0.22, angle = 100, spread = 34, length = 300, count = 7, seed = 'rays'}) => {
  const frame = useCurrentFrame();
  const shafts = useMemo(
    () =>
      Array.from({length: count}, (_, i) => ({
        a: angle - spread / 2 + (spread * (i + 0.5)) / count + (random(`${seed}-a${i}`) - 0.5) * (spread / count),
        w: 2.2 + random(`${seed}-w${i}`) * 4.5,
        o: 0.45 + random(`${seed}-o${i}`) * 0.55,
        p: random(`${seed}-p${i}`) * 100,
      })),
    [angle, count, seed, spread],
  );
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, pointerEvents: 'none', mixBlendMode: 'screen'}}>
      {shafts.map((s, i) => {
        const breathe = 0.55 + 0.45 * (0.5 + 0.5 * noise2D(`${seed}-b${i}`, (frame + s.p) * 0.012, 0));
        const sway = noise2D(`${seed}-s${i}`, frame * 0.006, 1) * 1.2;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: length,
              height: s.w * 2,
              marginTop: -s.w,
              transformOrigin: '0 50%',
              transform: `rotate(${(s.a + sway).toFixed(2)}deg)`,
              clipPath: 'polygon(0% 45%, 100% 0%, 100% 100%, 0% 55%)',
              background: `linear-gradient(90deg, ${color}EE 0%, ${color}66 35%, ${color}18 75%, transparent 100%)`,
              opacity: opacity * s.o * breathe,
            }}
          />
        );
      })}
    </div>
  );
};

/** Low-lying drifting haze band (adds depth between floor and back wall). */
export const Fog: React.FC<{y?: number; height?: number; color?: string; opacity?: number; seed?: string}> = ({
  y = 150,
  height = 90,
  color = PALETTE.cream,
  opacity = 0.12,
  seed = 'fog',
}) => {
  const frame = useCurrentFrame();
  const blobs = useMemo(
    () =>
      Array.from({length: 7}, (_, i) => ({
        x: random(`${seed}-x${i}`) * ART_W,
        w: 110 + random(`${seed}-w${i}`) * 140,
        h: height * (0.45 + random(`${seed}-h${i}`) * 0.4),
        v: 0.05 + random(`${seed}-v${i}`) * 0.08,
        dy: random(`${seed}-y${i}`) * height * 0.5,
      })),
    [height, seed],
  );
  return (
    <div style={{position: 'absolute', left: -60, top: y, width: ART_W + 120, height, pointerEvents: 'none', mixBlendMode: 'screen'}}>
      {blobs.map((b, i) => {
        const x = ((b.x + frame * b.v) % (ART_W + 240)) - 120;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate3d(${x.toFixed(2)}px, ${b.dy.toFixed(2)}px, 0)`,
              width: b.w,
              height: b.h,
              borderRadius: '50%',
              background: `radial-gradient(ellipse, ${color} 0%, transparent 70%)`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
};

/** Out-of-focus foreground particles that drift close to the lens (strong depth cue). */
export const NearBokeh: React.FC<{count?: number; color?: string; opacity?: number; seed?: string}> = ({
  count = 7,
  color = PALETTE.goldPale,
  opacity = 0.32,
  seed = 'nb',
}) => {
  const frame = useCurrentFrame();
  const items = useMemo(
    () =>
      Array.from({length: count}, (_, i) => ({
        x: random(`${seed}-x${i}`) * ART_W,
        y: random(`${seed}-y${i}`) * ART_H,
        r: 6 + random(`${seed}-r${i}`) * 12,
        vx: (random(`${seed}-vx${i}`) - 0.5) * 0.22,
        vy: -0.05 - random(`${seed}-vy${i}`) * 0.1,
        p: random(`${seed}-p${i}`) * 100,
      })),
    [count, seed],
  );
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', mixBlendMode: 'screen', overflow: 'hidden'}}>
      {items.map((b, i) => {
        const x = ((((b.x + frame * b.vx) % (ART_W + 60)) + ART_W + 60) % (ART_W + 60)) - 30;
        const y = ((((b.y + frame * b.vy) % (ART_H + 60)) + ART_H + 60) % (ART_H + 60)) - 30;
        const tw = 0.55 + 0.45 * Math.sin((frame + b.p) * 0.05);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate3d(${(x - b.r).toFixed(2)}px, ${(y - b.r).toFixed(2)}px, 0)`,
              width: b.r * 2,
              height: b.r * 2,
              borderRadius: '50%',
              // hexagon-ish aperture ring = lens bokeh
              background: `radial-gradient(circle, ${color}55 0%, ${color}66 55%, ${color}AA 66%, transparent 72%)`,
              opacity: opacity * tw,
            }}
          />
        );
      })}
    </div>
  );
};

/** Anamorphic streak + ghost for bright practical sources (orb, flame, spotlight). */
export const LensFlare: React.FC<{
  x: number;
  y: number;
  color?: string;
  intensity?: number;
  width?: number;
  seed?: string;
}> = ({x, y, color = PALETTE.goldPale, intensity = 0.6, width = 180, seed = 'lf'}) => {
  const frame = useCurrentFrame();
  const pulse = 0.85 + 0.15 * noise2D(seed, frame * 0.08, 0);
  const op = Math.max(0, intensity * pulse);
  if (op < 0.01) return null;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 0, height: 0, pointerEvents: 'none', mixBlendMode: 'screen'}}>
      <div
        style={{
          position: 'absolute',
          left: x - width / 2,
          top: y - 1,
          width,
          height: 2,
          background: `linear-gradient(90deg, transparent 0%, ${color}66 30%, ${PALETTE.cream} 50%, ${color}66 70%, transparent 100%)`,
          opacity: op,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x - width * 0.3,
          top: y - 3,
          width: width * 0.6,
          height: 6,
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${color}55 0%, transparent 70%)`,
          opacity: op,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x - 9,
          top: y - 9,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${PALETTE.cream} 0%, ${color}AA 30%, transparent 70%)`,
          opacity: op,
        }}
      />
    </div>
  );
};

/**
 * Screen-space bloom: the element samples what is behind it, blurs + overexposes it, and screens
 * it back on top — highlights glow, darks stay dark (no milky haze).
 */
export const ScreenBloom: React.FC<{intensity?: number; radius?: number}> = ({intensity = 0.35, radius = 14}) => {
  if (intensity <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        opacity: intensity,
        // brightness+contrast = threshold: only the top ~30% of luminance survives and glows
        backdropFilter: `brightness(0.55) contrast(3.4) saturate(1.25) blur(${radius}px)`,
        WebkitBackdropFilter: `brightness(0.55) contrast(3.4) saturate(1.25) blur(${radius}px)`,
      }}
    />
  );
};

/** Subtle lens edge darkening + chroma fringe tint (screen-space). */
export const LensEdge: React.FC<{strength?: number}> = ({strength = 1}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      boxShadow: `inset 0 0 ${Math.round(60 * strength)}px rgba(16,10,20,${(0.55 * strength).toFixed(2)})`,
    }}
  />
);
