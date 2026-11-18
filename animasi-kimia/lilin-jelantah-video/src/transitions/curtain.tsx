import React from 'react';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {AbsoluteFill, interpolate} from 'remotion';
import {PALETTE} from '../data/palette';

const CurtainPresentation: React.FC<TransitionPresentationComponentProps<Record<string, never>>> = ({
  children,
  presentationDirection,
  presentationProgress,
}) => {
  if (presentationDirection === 'exiting') {
    const closePct = interpolate(presentationProgress, [0, 0.5], [0, 52], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return (
      <AbsoluteFill>
        {children}
        {closePct > 0 ? (
          <>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${closePct}%`,
                background: `repeating-linear-gradient(90deg, ${PALETTE.magentaDark} 0px, ${PALETTE.burgundy} 28px, ${PALETTE.maroon} 48px, ${PALETTE.magentaDark} 64px)`,
                borderRight: `8px solid ${PALETTE.gold}`,
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: `${closePct}%`,
                background: `repeating-linear-gradient(90deg, ${PALETTE.magentaDark} 0px, ${PALETTE.burgundy} 28px, ${PALETTE.maroon} 48px, ${PALETTE.magentaDark} 64px)`,
                borderLeft: `8px solid ${PALETTE.gold}`,
              }}
            />
          </>
        ) : null}
      </AbsoluteFill>
    );
  }

  const openPct = interpolate(presentationProgress, [0.45, 1], [52, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const revealOpacity = presentationProgress >= 0.45 ? 1 : 0;

  return (
    <AbsoluteFill style={{opacity: revealOpacity}}>
      {children}
      {openPct > 0 ? (
        <>
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${openPct}%`,
              background: `repeating-linear-gradient(90deg, ${PALETTE.magentaDark} 0px, ${PALETTE.burgundy} 28px, ${PALETTE.maroon} 48px, ${PALETTE.magentaDark} 64px)`,
              borderRight: `8px solid ${PALETTE.gold}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: `${openPct}%`,
              background: `repeating-linear-gradient(90deg, ${PALETTE.magentaDark} 0px, ${PALETTE.burgundy} 28px, ${PALETTE.maroon} 48px, ${PALETTE.magentaDark} 64px)`,
              borderLeft: `8px solid ${PALETTE.gold}`,
            }}
          />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

export const curtain = (): TransitionPresentation<Record<string, never>> => ({
  component: CurtainPresentation,
  props: {},
});
