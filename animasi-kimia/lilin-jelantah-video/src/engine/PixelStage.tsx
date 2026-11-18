import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ART_H, ART_W, PX} from '../lib/pixel';
import {PALETTE} from '../data/palette';

export const PixelStage: React.FC<{
  children: React.ReactNode;
  hud?: React.ReactNode;
  background?: string;
}> = ({children, hud, background = PALETTE.void}) => {
  return (
    <AbsoluteFill style={{background, overflow: 'hidden'}}>
      {/* 480x270 art-space scaled x4 to 1920x1080 with crisp nearest-neighbor pixels */}
      <div
        style={{
          width: ART_W,
          height: ART_H,
          transform: `scale(${PX})`,
          transformOrigin: 'top left',
          imageRendering: 'pixelated',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
      {/* 1920x1080 crisp HUD / subtitle / UI overlay layer */}
      {hud ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>{hud}</AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
