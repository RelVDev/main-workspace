import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {PALETTE} from '../data/palette';
import {FONT_BODY} from '../lib/fonts';

export const Callout: React.FC<{
  text: string;
  x: number;
  y: number;
  arrow?: 'left' | 'right' | 'up' | 'down';
  startFrame?: number;
  endFrame?: number;
  accent?: string;
}> = ({
  text,
  x,
  y,
  arrow = 'left',
  startFrame = 0,
  endFrame = 999999,
  accent = PALETTE.gold,
}) => {
  const frame = useCurrentFrame();
  if (frame < startFrame || frame > endFrame) return null;

  const op = interpolate(frame, [startFrame, startFrame + 6, endFrame - 6, endFrame], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const arrowChar =
    arrow === 'left' ? '◀ ' : arrow === 'right' ? ' ▶' : arrow === 'up' ? '▲ ' : '▼ ';

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity: op,
        backgroundColor: 'rgba(27, 16, 32, 0.92)',
        color: PALETTE.cream,
        fontFamily: FONT_BODY,
        fontSize: 24,
        fontWeight: 700,
        padding: '8px 16px',
        border: `4px solid ${accent}`,
        boxShadow: `4px 4px 0 ${PALETTE.ink}`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{color: accent}}>{arrow !== 'right' ? arrowChar : ''}</span>
      {text}
      <span style={{color: accent}}>{arrow === 'right' ? arrowChar : ''}</span>
    </div>
  );
};
