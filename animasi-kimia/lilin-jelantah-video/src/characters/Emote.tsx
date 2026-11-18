import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {snap} from '../lib/pixel';

export type EmoteType = 'exclaim' | 'question' | 'heart' | 'sparkle' | 'idea';

export const Emote: React.FC<{
  type: EmoteType;
  x: number;
  y: number;
  startFrame?: number;
  durationFrames?: number;
}> = ({type, x, y, startFrame = 0, durationFrames = 24}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0 || local > durationFrames) return null;

  const popY = snap(
    interpolate(local, [0, Math.round(0.15 * fps), durationFrames], [4, -3, -5], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const opacity = interpolate(local, [0, 3, durationFrames - 4, durationFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <Img
      src={staticFile(`sprites/fx/emote_${type}.png`)}
      style={{
        position: 'absolute',
        left: snap(x - 8),
        top: snap(y - 16) + popY,
        width: 16,
        height: 16,
        imageRendering: 'pixelated',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};
