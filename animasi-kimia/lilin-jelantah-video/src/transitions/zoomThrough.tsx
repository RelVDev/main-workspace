import React from 'react';
import type {TransitionPresentation, TransitionPresentationComponentProps} from '@remotion/transitions';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {PALETTE} from '../data/palette';

interface IrisGlowProps extends Record<string, unknown> {
  /** Centre of the iris in % of the frame. */
  cx?: number;
  cy?: number;
  color?: string;
}

/**
 * Iris-glow: the outgoing shot keeps pushing in while a glowing ring closes on a point, then
 * the incoming shot blooms open from that same point (pulling back).
 */
const IrisGlowPresentation: React.FC<TransitionPresentationComponentProps<IrisGlowProps>> = ({
  children,
  presentationDirection,
  presentationProgress: p,
  passedProps,
}) => {
  const cx = passedProps.cx ?? 50;
  const cy = passedProps.cy ?? 50;
  const color = passedProps.color ?? PALETTE.teal;
  const maxR = 2300;
  if (presentationDirection === 'exiting') {
    const u = Easing.in(Easing.cubic)(Math.min(1, p / 0.5));
    const r = (1 - u) * maxR;
    const z = 1 + u * 0.35;
    return (
      <AbsoluteFill>
        <AbsoluteFill
          style={{
            transform: `scale(${z.toFixed(4)})`,
            transformOrigin: `${cx}% ${cy}%`,
            clipPath: `circle(${r.toFixed(1)}px at ${cx}% ${cy}%)`,
          }}
        >
          {children}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  const u = Easing.out(Easing.cubic)(Math.max(0, (p - 0.5) / 0.5));
  const r = u * maxR;
  const z = 1.25 - u * 0.25;
  const ring = interpolate(p, [0.3, 0.5, 0.75, 1], [0, 1, 0.6, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ringR = p < 0.5 ? (1 - Easing.in(Easing.cubic)(p / 0.5)) * maxR : r;
  return (
    <AbsoluteFill>
      {p >= 0.5 ? (
        <AbsoluteFill
          style={{
            transform: `scale(${z.toFixed(4)})`,
            transformOrigin: `${cx}% ${cy}%`,
            clipPath: `circle(${r.toFixed(1)}px at ${cx}% ${cy}%)`,
          }}
        >
          {children}
        </AbsoluteFill>
      ) : null}
      {ring > 0.01 ? (
        <AbsoluteFill
          style={{
            pointerEvents: 'none',
            mixBlendMode: 'screen',
            opacity: ring,
            background: `radial-gradient(circle at ${cx}% ${cy}%, transparent ${Math.max(0, ringR - 40).toFixed(0)}px, ${color} ${ringR.toFixed(0)}px, ${PALETTE.cream} ${(ringR + 6).toFixed(0)}px, ${color}66 ${(ringR + 40).toFixed(0)}px, transparent ${(ringR + 120).toFixed(0)}px)`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export const irisGlow = (props: IrisGlowProps = {}): TransitionPresentation<IrisGlowProps> => ({
  component: IrisGlowPresentation,
  props,
});
