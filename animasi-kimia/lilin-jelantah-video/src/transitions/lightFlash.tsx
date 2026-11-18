import React from 'react';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {PALETTE} from '../data/palette';

interface LightFlashProps extends Record<string, unknown> {
  color?: string;
}

const LightFlashPresentation: React.FC<TransitionPresentationComponentProps<LightFlashProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const flashColor = passedProps.color ?? PALETTE.cream;
  const flashOpacity = interpolate(presentationProgress, [0, 0.45, 0.55, 1], [0, 0.92, 0.92, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  if (presentationDirection === 'exiting') {
    const outOp = interpolate(presentationProgress, [0.35, 0.65], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return <AbsoluteFill style={{opacity: outOp}}>{children}</AbsoluteFill>;
  }

  const inOp = interpolate(presentationProgress, [0.35, 0.65], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: inOp}}>{children}</AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 50%, ${PALETTE.cream} 0%, ${flashColor} 55%, ${PALETTE.amber}88 100%)`,
          opacity: flashOpacity,
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

export const lightFlash = (
  props: LightFlashProps = {},
): TransitionPresentation<LightFlashProps> => ({
  component: LightFlashPresentation,
  props,
});
