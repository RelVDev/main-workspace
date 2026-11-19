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
}> = ({badge, title, accent = PALETTE.amber, startFrame = 0, endFrame = 108}) => {
  const frame = useCurrentFrame();
  if (frame < startFrame || frame > endFrame) return null;

  const op = interpolate(frame, [startFrame, startFrame + 10, endFrame - 12, endFrame], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const tx = interpolate(frame, [startFrame, startFrame + 14], [-28, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Pixel wipe-in from the left (stepped in 8 increments for a retro feel)
  const wipe = Math.floor(interpolate(frame, [startFrame, startFrame + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) * 8) / 8;

  // Compact single-row bar at top (y=26..80) so content cards below top>=112 never collide
  return (
    <div
      style={{
        position: 'absolute',
        top: 26,
        left: 48,
        opacity: op,
        transform: `translate3d(${tx.toFixed(2)}px, 0, 0)`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        background: 'linear-gradient(180deg, rgba(48,26,58,0.94) 0%, rgba(27,16,32,0.94) 100%)',
        border: `4px solid ${accent}`,
        boxShadow: `6px 6px 0 ${PALETTE.ink}, 0 0 36px ${accent}33, inset 0 3px 0 rgba(255,243,220,0.1)`,
        clipPath: `inset(0 ${((1 - wipe) * 100).toFixed(2)}% -20px 0)`,
        padding: '8px 18px 8px 10px',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          backgroundColor: accent,
          color: PALETTE.ink,
          fontFamily: FONT_TITLE,
          fontSize: 13,
          padding: '7px 12px',
          border: `3px solid ${PALETTE.ink}`,
          boxShadow: `inset 0 -3px 0 rgba(16,10,20,0.25), inset 0 3px 0 rgba(255,255,255,0.3)`,
          letterSpacing: 0.5,
        }}
      >
        {badge}
      </span>
      <span
        style={{
          color: PALETTE.cream,
          fontFamily: FONT_BODY,
          fontSize: 27,
          fontWeight: 700,
          letterSpacing: 0.3,
        }}
      >
        {title}
      </span>
    </div>
  );
};
