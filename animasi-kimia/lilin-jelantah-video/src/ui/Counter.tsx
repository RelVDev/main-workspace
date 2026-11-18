import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {PALETTE} from '../data/palette';
import {FONT_TITLE} from '../lib/fonts';

export const Counter: React.FC<{
  target: number;
  decimals?: number;
  suffix?: string;
  startFrame: number;
  durationFrames: number;
  color?: string;
  fontSize?: number;
}> = ({
  target,
  decimals = 0,
  suffix = '',
  startFrame,
  durationFrames,
  color = PALETTE.gold,
  fontSize = 64,
}) => {
  const frame = useCurrentFrame();
  const val = interpolate(frame, [startFrame, startFrame + durationFrames], [0, target], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const formatted =
    decimals > 0
      ? val.toFixed(decimals).replace('.', ',')
      : Math.round(val)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return (
    <span
      style={{
        fontFamily: FONT_TITLE,
        fontSize,
        color,
        textShadow: `4px 4px 0 ${PALETTE.ink}`,
        letterSpacing: 2,
      }}
    >
      {formatted}
      {suffix}
    </span>
  );
};
