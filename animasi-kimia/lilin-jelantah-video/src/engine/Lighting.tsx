import React from 'react';
import {noise2D} from '@remotion/noise';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {PALETTE} from '../data/palette';
import {snap} from '../lib/pixel';

export const LightRays: React.FC<{
  color?: string;
  opacity?: number;
  angleDeg?: number;
}> = ({color = PALETTE.gold, opacity = 0.14, angleDeg = 24}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 45) * 6;
  return (
    <div
      style={{
        position: 'absolute',
        inset: -40,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        opacity,
        transform: `translateX(${drift.toFixed(1)}px) rotate(${angleDeg}deg)`,
        background: `repeating-linear-gradient(90deg, transparent 0px, transparent 36px, ${color} 54px, transparent 74px, transparent 118px)`,
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
  const flk = flicker ? 0.85 + 0.2 * noise2D(seed, frame * 0.25, 0) : 1;
  const r = radius * (flicker ? 0.94 + 0.08 * noise2D(`${seed}-r`, frame * 0.2, 1) : 1);
  const op = Math.max(0, Math.min(1, intensity * flk));

  const bg = banded
    ? `radial-gradient(circle, ${color} 0%, ${color}CC 22%, ${color}66 23%, ${color}66 48%, ${color}26 49%, ${color}26 75%, transparent 76%)`
    : `radial-gradient(circle, ${color}E6 0%, ${color}80 35%, ${color}22 68%, transparent 100%)`;

  return (
    <div
      style={{
        position: 'absolute',
        left: snap(x - r),
        top: snap(y - r),
        width: snap(r * 2),
        height: snap(r * 2),
        borderRadius: '50%',
        background: bg,
        mixBlendMode: 'plus-lighter',
        opacity: op,
        pointerEvents: 'none',
      }}
    />
  );
};

export const Bloom: React.FC<{
  intensity?: number;
  color?: string;
}> = ({intensity = 0.22, color = PALETTE.gold}) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        mixBlendMode: 'screen',
        opacity: intensity,
        background: `radial-gradient(ellipse at 50% 42%, ${color}88 0%, ${color}22 45%, transparent 80%)`,
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
}> = ({x, y, size = 'md', color = PALETTE.teal, glowRadius = 26, phase = 0}) => {
  const frame = useCurrentFrame();
  const step = Math.floor((frame + phase) / 4);
  const pulse = 0.72 + 0.28 * Math.sin(step * 0.7);
  const floatY = snap(Math.sin((frame + phase) / 14) * 2);
  const dim = size === 'sm' ? 9 : size === 'lg' ? 21 : 15;

  return (
    <div
      style={{
        position: 'absolute',
        left: snap(x - dim / 2),
        top: snap(y - dim / 2) + floatY,
        width: dim,
        height: dim,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: snap(dim / 2 - glowRadius),
          top: snap(dim / 2 - glowRadius),
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
