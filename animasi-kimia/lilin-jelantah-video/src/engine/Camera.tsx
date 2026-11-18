import React from 'react';
import {noise2D} from '@remotion/noise';
import {useCurrentFrame} from 'remotion';
import {ART_H, ART_W, snap} from '../lib/pixel';

export interface CameraProps {
  /** Target point X in art-space (0..480). Default center 240. */
  x?: number;
  /** Target point Y in art-space (0..270). Default center 135. */
  y?: number;
  /** Zoom factor (1 = full stage, 2 or 3 for integer close-up). */
  zoom?: number;
  /** Shake amplitude 0..1 (in art pixels, stepped cleanly). */
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
  const sx = shake > 0 ? snap(noise2D('cam-sx', frame * 0.45, 0) * shake * 2) : 0;
  const sy = shake > 0 ? snap(noise2D('cam-sy', 0, frame * 0.45) * shake * 2) : 0;

  const tx = snap(ART_W / 2 - x * zoom) + sx;
  const ty = snap(ART_H / 2 - y * zoom) + sy;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        transformOrigin: '0 0',
        transform: `translate(${tx}px, ${ty}px) scale(${zoom})`,
        imageRendering: 'pixelated',
      }}
    >
      {children}
    </div>
  );
};
