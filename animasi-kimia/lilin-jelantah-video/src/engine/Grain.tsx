import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {ART_H, ART_W} from '../lib/pixel';

export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.08}) => {
  const frame = useCurrentFrame();
  const idx = Math.floor(frame / 2) % 4;
  return (
    <Img
      src={staticFile(`sprites/fx/grain_${idx}.png`)}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: ART_W,
        height: ART_H,
        imageRendering: 'pixelated',
        mixBlendMode: 'overlay',
        opacity,
        pointerEvents: 'none',
      }}
    />
  );
};
