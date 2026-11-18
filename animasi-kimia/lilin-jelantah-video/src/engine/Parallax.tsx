import React from 'react';
import {snap} from '../lib/pixel';

export interface ParallaxProps {
  depth?: number; // 0.2 far, 0.5 mid, 1.0 foreground
  blurPx?: number; // art-space blur radius
  focus?: number; // 0 (background sharp) .. 1 (foreground sharp, bg blurred)
  camOffsetX?: number;
  camOffsetY?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const Parallax: React.FC<ParallaxProps> = ({
  depth = 0.5,
  blurPx = 0,
  focus = 1,
  camOffsetX = 0,
  camOffsetY = 0,
  style,
  children,
}) => {
  const dx = snap(camOffsetX * (1 - depth));
  const dy = snap(camOffsetY * (1 - depth));
  const effectiveBlur = Math.max(0, blurPx * (0.25 + 0.75 * focus));

  return (
    <div
      style={{
        position: 'absolute',
        inset: -24,
        padding: 24,
        transform: `translate(${dx}px, ${dy}px)`,
        filter: effectiveBlur > 0.1 ? `blur(${effectiveBlur.toFixed(1)}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
