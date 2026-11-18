import React from 'react';
import {noise2D} from '@remotion/noise';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {PALETTE} from '../data/palette';

export const LightRays: React.FC<{
  color?: string;
  opacity?: number;
  angleDeg?: number;
}> = ({color = PALETTE.gold, opacity = 0.16, angleDeg = 24}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 55) * 8;
  const breathe = 0.85 + 0.15 * Math.sin(frame / 42);
  return (
    <div
      style={{
        position: 'absolute',
        inset: -50,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        opacity: opacity * breathe,
        transform: `translate3d(${drift.toFixed(2)}px, 0, 0) rotate(${angleDeg}deg)`,
        background: `repeating-linear-gradient(90deg, transparent 0px, transparent 32px, ${color}88 48px, ${color}33 62px, transparent 78px, transparent 114px)`,
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
      }}
    />
  );
};

export const PointLight: React.FC<{
  x: number;
  y: number;
  radius?: number;
  color?: string;
  intensity?: number;
  flicker?: boolean;
  banded?: boolean;
  seed?: string;
}> = ({
  x,
  y,
  radius = 70,
  color = PALETTE.amber,
  intensity = 0.75,
  flicker = false,
  banded = false,
  seed = 'lamp',
}) => {
  const frame = useCurrentFrame();
  const flk = flicker ? 0.88 + 0.16 * noise2D(seed, frame * 0.22, 0) : 1;
  const r = radius * (flicker ? 0.95 + 0.06 * noise2D(`${seed}-r`, frame * 0.18, 1) : 1);
  const op = Math.max(0, Math.min(1, intensity * flk));

  const bg = banded
    ? `radial-gradient(circle, ${color} 0%, ${color}CC 18%, ${color}77 32%, ${color}40 52%, ${color}18 74%, transparent 92%)`
    : `radial-gradient(circle, ${color}F0 0%, ${color}99 28%, ${color}38 58%, ${color}12 80%, transparent 100%)`;

  return (
    <div
      style={{
        position: 'absolute',
        left: Number((x - r).toFixed(2)),
        top: Number((y - r).toFixed(2)),
        width: Number((r * 2).toFixed(2)),
        height: Number((r * 2).toFixed(2)),
        borderRadius: '50%',
        background: bg,
        mixBlendMode: 'plus-lighter',
        opacity: op,
        pointerEvents: 'none',
      }}
    />
  );
};

/** Overhead cone spotlight cast down onto a stage zone or workbench. */
export const SpotCone: React.FC<{
  x: number;
  topY?: number;
  bottomY?: number;
  spreadW?: number;
  color?: string;
  opacity?: number;
}> = ({
  x,
  topY = 8,
  bottomY = 212,
  spreadW = 90,
  color = PALETTE.goldPale,
  opacity = 0.2,
}) => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame / 70) * 1.5;
  return (
    <div
      style={{
        position: 'absolute',
        left: Number((x - spreadW + sway).toFixed(2)),
        top: topY,
        width: spreadW * 2,
        height: Math.max(20, bottomY - topY),
        clipPath: 'polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)',
        background: `linear-gradient(180deg, ${color}CC 0%, ${color}55 55%, transparent 100%)`,
        mixBlendMode: 'screen',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};

/** Soft elliptical warm/cool bounce pool resting on the floor surface. */
export const FloorGlow: React.FC<{
  x: number;
  y: number;
  rx?: number;
  ry?: number;
  color?: string;
  opacity?: number;
}> = ({x, y, rx = 56, ry = 14, color = PALETTE.amber, opacity = 0.34}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: Number((x - rx).toFixed(2)),
        top: Number((y - ry).toFixed(2)),
        width: rx * 2,
        height: ry * 2,
        borderRadius: '50%',
        background: `radial-gradient(ellipse, ${color}AA 0%, ${color}40 48%, transparent 80%)`,
        mixBlendMode: 'plus-lighter',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};

export const Bloom: React.FC<{
  intensity?: number;
  color?: string;
}> = ({intensity = 0.24, color = PALETTE.gold}) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        opacity: intensity,
        background: `radial-gradient(ellipse at 50% 42%, ${color}99 0%, ${color}28 48%, transparent 82%)`,
      }}
    />
  );
};

export const Sparkle: React.FC<{
  x: number;
  y: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  glowRadius?: number;
  phase?: number;
}> = ({x, y, size = 'md', color = PALETTE.teal, glowRadius = 28, phase = 0}) => {
  const frame = useCurrentFrame();
  const pulse = 0.72 + 0.28 * Math.sin((frame + phase) * 0.16);
  const floatY = Math.sin((frame + phase) / 14) * 2.2;
  const dim = size === 'sm' ? 9 : size === 'lg' ? 21 : 15;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `translate3d(${(x - dim / 2).toFixed(2)}px, ${(y - dim / 2 + floatY).toFixed(2)}px, 0)`,
        width: dim,
        height: dim,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: Math.round(dim / 2 - glowRadius),
          top: Math.round(dim / 2 - glowRadius),
          width: glowRadius * 2,
          height: glowRadius * 2,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}CC 0%, ${color}44 45%, transparent 75%)`,
          mixBlendMode: 'plus-lighter',
          opacity: pulse,
        }}
      />
      <Img
        src={staticFile(`sprites/fx/sparkle_${size}.png`)}
        style={{
          width: dim,
          height: dim,
          imageRendering: 'pixelated',
          opacity: pulse,
        }}
      />
    </div>
  );
};
