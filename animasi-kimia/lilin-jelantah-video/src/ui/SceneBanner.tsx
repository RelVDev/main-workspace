import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import {PALETTE} from '../data/palette';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';

export const SceneBanner: React.FC<{
  badge: string;
  title: string;
  accent?: string;
  startFrame?: number;
  endFrame?: number;
}> = ({badge, title, accent = PALETTE.amber, startFrame = 0, endFrame = 135}) => {
  const frame = useCurrentFrame();
  if (frame < startFrame || frame > endFrame) return null;

  const op = interpolate(frame, [startFrame, startFrame + 12, endFrame - 14, endFrame], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const tx = interpolate(frame, [startFrame, startFrame + 14], [-36, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: 'absolute',
        top: 38,
        left: 48,
        opacity: op,
        transform: `translate3d(${tx.toFixed(2)}px, 0, 0)`,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'inline-block',
          alignSelf: 'flex-start',
          backgroundColor: accent,
          color: PALETTE.ink,
          fontFamily: FONT_TITLE,
          fontSize: 16,
          padding: '8px 14px',
          border: `4px solid ${PALETTE.ink}`,
          boxShadow: `4px 4px 0 ${PALETTE.ink}`,
        }}
      >
        {badge}
      </div>
      <div
        style={{
          backgroundColor: 'rgba(27,16,32,0.88)',
          color: PALETTE.cream,
          fontFamily: FONT_BODY,
          fontSize: 32,
          fontWeight: 700,
          padding: '10px 20px',
          border: `4px solid ${PALETTE.cream}`,
          boxShadow: `6px 6px 0 ${PALETTE.ink}`,
        }}
      >
        {title}
      </div>
    </div>
  );
};
