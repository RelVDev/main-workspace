import React from 'react';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {AbsoluteFill, Easing, random} from 'remotion';
import {PALETTE} from '../data/palette';

interface WhipProps extends Record<string, unknown> {
  direction?: 'left' | 'right';
  /** Paper-like page slide (soft shadow edge, no streaks). */
  page?: boolean;
}

const ease = Easing.inOut(Easing.exp);

/** Whip-pan: both shots travel together at high speed with pixel speed-streaks at the seam. */
const WhipPresentation: React.FC<TransitionPresentationComponentProps<WhipProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const dir = passedProps.direction === 'right' ? 1 : -1; // -1: content moves left (camera pans right)
  const p = ease(presentationProgress);
  const page = Boolean(passedProps.page);

  if (presentationDirection === 'exiting') {
    const x = page ? dir * p * 30 : dir * p * 100;
    return (
      <AbsoluteFill style={{transform: `translateX(${x.toFixed(3)}%)`, filter: page ? `brightness(${(1 - p * 0.45).toFixed(3)})` : undefined}}>
        {children}
      </AbsoluteFill>
    );
  }
  const x = -dir * (1 - p) * 100;
  const seamX = 50 + x; // % of the incoming left/right edge
  const speed = Math.sin(presentationProgress * Math.PI); // 0..1..0
  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          transform: `translateX(${x.toFixed(3)}%)`,
          boxShadow: page ? `${dir * 40}px 0 60px rgba(16,10,20,0.75)` : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
      {!page && speed > 0.05 ? (
        <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen', opacity: speed * 0.85}}>
          {Array.from({length: 26}, (_, i) => {
            const y = random(`whip-y${i}`) * 1080;
            const len = 200 + random(`whip-l${i}`) * 700;
            const h = 4 * (1 + Math.floor(random(`whip-h${i}`) * 3));
            const cx = (dir < 0 ? seamX + 50 : seamX - 50) / 100 * 1920;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: Math.round(y / 4) * 4,
                  left: cx - len / 2 + (random(`whip-o${i}`) - 0.5) * 400,
                  width: len,
                  height: h,
                  background: `linear-gradient(90deg, transparent, ${i % 3 === 0 ? PALETTE.goldPale : PALETTE.cream}, transparent)`,
                }}
              />
            );
          })}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export const whipPan = (props: WhipProps = {}): TransitionPresentation<WhipProps> => ({
  component: WhipPresentation,
  props,
});
