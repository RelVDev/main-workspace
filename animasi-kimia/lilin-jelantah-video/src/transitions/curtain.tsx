import React from 'react';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
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
      easing: Easing.inOut(Easing.cubic),
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
                width: `${closePct.toFixed(2)}%`,
                background: `linear-gradient(180deg, rgba(255,178,90,0.22) 0%, transparent 30%, rgba(16,10,20,0.55) 100%), repeating-linear-gradient(90deg, ${PALETTE.ink} 0px, ${PALETTE.magentaDark} 12px, ${PALETTE.burgundy} 30px, ${PALETTE.crimson} 44px, ${PALETTE.burgundy} 56px, ${PALETTE.magentaDark} 72px, ${PALETTE.ink} 84px)`,
                borderRight: `8px solid ${PALETTE.gold}`,
                boxShadow: '24px 0 60px rgba(16,10,20,0.8), inset -10px 0 24px rgba(255,178,90,0.25)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: `${closePct.toFixed(2)}%`,
                background: `linear-gradient(180deg, rgba(255,178,90,0.22) 0%, transparent 30%, rgba(16,10,20,0.55) 100%), repeating-linear-gradient(90deg, ${PALETTE.ink} 0px, ${PALETTE.magentaDark} 12px, ${PALETTE.burgundy} 30px, ${PALETTE.crimson} 44px, ${PALETTE.burgundy} 56px, ${PALETTE.magentaDark} 72px, ${PALETTE.ink} 84px)`,
                borderLeft: `8px solid ${PALETTE.gold}`,
                boxShadow: '-24px 0 60px rgba(16,10,20,0.8), inset 10px 0 24px rgba(255,178,90,0.25)',
              }}
            />
          </>
        ) : null}
      </AbsoluteFill>
    );
  }

  const openPct = interpolate(presentationProgress, [0.42, 1], [52, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const revealOpacity = presentationProgress >= 0.42 ? 1 : 0;

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
              width: `${openPct.toFixed(2)}%`,
              background: `linear-gradient(180deg, rgba(255,178,90,0.22) 0%, transparent 30%, rgba(16,10,20,0.55) 100%), repeating-linear-gradient(90deg, ${PALETTE.ink} 0px, ${PALETTE.magentaDark} 12px, ${PALETTE.burgundy} 30px, ${PALETTE.crimson} 44px, ${PALETTE.burgundy} 56px, ${PALETTE.magentaDark} 72px, ${PALETTE.ink} 84px)`,
              borderRight: `8px solid ${PALETTE.gold}`,
              boxShadow: '24px 0 60px rgba(16,10,20,0.8), inset -10px 0 24px rgba(255,178,90,0.25)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: `${openPct.toFixed(2)}%`,
              background: `linear-gradient(180deg, rgba(255,178,90,0.22) 0%, transparent 30%, rgba(16,10,20,0.55) 100%), repeating-linear-gradient(90deg, ${PALETTE.ink} 0px, ${PALETTE.magentaDark} 12px, ${PALETTE.burgundy} 30px, ${PALETTE.crimson} 44px, ${PALETTE.burgundy} 56px, ${PALETTE.magentaDark} 72px, ${PALETTE.ink} 84px)`,
              borderLeft: `8px solid ${PALETTE.gold}`,
              boxShadow: '-24px 0 60px rgba(16,10,20,0.8), inset 10px 0 24px rgba(255,178,90,0.25)',
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
