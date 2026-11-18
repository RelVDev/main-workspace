import React from 'react';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {AbsoluteFill, interpolate} from 'remotion';
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
  const flashOpacity = interpolate(presentationProgress, [0, 0.48, 0.55, 1], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  if (presentationDirection === 'exiting') {
    return (
      <AbsoluteFill style={{opacity: presentationProgress < 0.5 ? 1 : 0}}>
        {children}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: presentationProgress >= 0.48 ? 1 : 0}}>
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          backgroundColor: flashColor,
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
