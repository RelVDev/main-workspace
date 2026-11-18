import React from 'react';
import {noise2D} from '@remotion/noise';
import {useCurrentFrame} from 'remotion';
import {ART_H, ART_W} from '../lib/pixel';

export interface CameraProps {
  /** Target point X in art-space (0..480). Default center 240. */
  x?: number;
  /** Target point Y in art-space (0..270). Default center 135. */
  y?: number;
  /** Zoom factor (1 = full stage, fractional smooth interpolation supported). */
  zoom?: number;
  /** Shake amplitude 0..1 (in art pixels, smooth organic tremor). */
  shake?: number;
  children: React.ReactNode;
}

export const Camera: React.FC<CameraProps> = ({
  x = ART_W / 2,
  y = ART_H / 2,
  zoom = 1,
  shake = 0,
  children,
}) => {
  const frame = useCurrentFrame();
  // Smooth continuous sub-art-pixel translation/scale prevents 4px staircase jitter
  const sx = shake > 0 ? noise2D('cam-sx', frame * 0.42, 0) * shake * 1.8 : 0;
  const sy = shake > 0 ? noise2D('cam-sy', 0, frame * 0.42) * shake * 1.8 : 0;

  const tx = ART_W / 2 - x * zoom + sx;
  const ty = ART_H / 2 - y * zoom + sy;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transformOrigin: '0 0',
        transform: `translate3d(${tx.toFixed(3)}px, ${ty.toFixed(3)}px, 0) scale(${zoom.toFixed(4)})`,
        imageRendering: 'pixelated',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
};
