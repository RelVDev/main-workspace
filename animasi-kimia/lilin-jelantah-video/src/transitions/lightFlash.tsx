import React from 'react';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {PALETTE} from '../data/palette';

interface LightFlashProps extends Record<string, unknown> {
  color?: string;
}

/**
 * Light-burn flash: the outgoing shot over-exposes (brightness + bloom) into a warm white-out,
 * the incoming shot comes back down from over-exposure — like a lens catching a bright source.
 */
const LightFlashPresentation: React.FC<TransitionPresentationComponentProps<LightFlashProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const flashColor = passedProps.color ?? PALETTE.cream;
  const opts = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

  if (presentationDirection === 'exiting') {
    const burn = interpolate(p, [0, 0.5], [1, 2.6], {...opts, easing: Easing.in(Easing.cubic)});
    const op = interpolate(p, [0.4, 0.55], [1, 0], opts);
    const z = interpolate(p, [0, 0.55], [1, 1.08], {...opts, easing: Easing.in(Easing.quad)});
    return (
      <AbsoluteFill style={{opacity: op, filter: `brightness(${burn.toFixed(3)}) saturate(${(1 + (burn - 1) * 0.3).toFixed(3)})`, transform: `scale(${z.toFixed(4)})`}}>
        {children}
      </AbsoluteFill>
    );
  }

  const inOp = interpolate(p, [0.45, 0.6], [0, 1], opts);
  const burn = interpolate(p, [0.45, 1], [2.4, 1], {...opts, easing: Easing.out(Easing.cubic)});
  const z = interpolate(p, [0.45, 1], [1.06, 1], {...opts, easing: Easing.out(Easing.cubic)});
  const flashOpacity = interpolate(p, [0.25, 0.5, 0.62, 1], [0, 0.95, 0.85, 0], {...opts, easing: Easing.inOut(Easing.cubic)});
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: inOp, filter: burn > 1.01 ? `brightness(${burn.toFixed(3)})` : undefined, transform: `scale(${z.toFixed(4)})`}}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 45%, ${PALETTE.white} 0%, ${PALETTE.cream} 25%, ${flashColor} 60%, ${PALETTE.amber} 100%)`,
          mixBlendMode: 'screen',
          opacity: flashOpacity,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

export const lightFlash = (props: LightFlashProps = {}): TransitionPresentation<LightFlashProps> => ({
  component: LightFlashPresentation,
  props,
});
