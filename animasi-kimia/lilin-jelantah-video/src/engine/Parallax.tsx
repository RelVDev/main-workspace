import React from 'react';

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
  const dx = camOffsetX * (1 - depth);
  const dy = camOffsetY * (1 - depth);
  const effectiveBlur = Math.max(0, blurPx * (0.25 + 0.75 * focus));

  return (
    <div
      style={{
        position: 'absolute',
        inset: -28,
        padding: 28,
        transform: `translate3d(${dx.toFixed(3)}px, ${dy.toFixed(3)}px, 0)`,
        filter: effectiveBlur > 0.1 ? `blur(${effectiveBlur.toFixed(2)}px)` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
};
