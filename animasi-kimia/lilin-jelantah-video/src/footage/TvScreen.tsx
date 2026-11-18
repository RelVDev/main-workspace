import React from 'react';
import {Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import footageLightJson from '../data/footage-light.json';
import {PALETTE} from '../data/palette';
import {snap} from '../lib/pixel';
import {FOOTAGE_MAP, RealFootage} from './RealFootage';

const LIGHT_MAP = footageLightJson as Record<string, string[]>;

export const useFootageLightColor = (id: string): string => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const samples = LIGHT_MAP[id] ?? [PALETTE.gold];
  const idx = Math.floor((frame / fps) * 2) % samples.length;
  return samples[idx] ?? PALETTE.gold;
};

export const TvScreen: React.FC<{
  footageId: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  staticBurst?: boolean;
}> = ({footageId, x, y, w = 160, h = 128, staticBurst = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const glowColor = useFootageLightColor(footageId);
  const entry = FOOTAGE_MAP[footageId];
  const screenX = snap(w * 0.15);
  const screenY = snap(h * 0.28);
  const screenW = snap(w * 0.56);
  const screenH = snap(h * 0.50);

  const activeNote = entry?.annotations?.find((a) => {
    const t = frame / fps;
    return t >= a.t0 && t <= a.t1;
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: snap(x),
        top: snap(y),
        width: w,
        height: h,
      }}
    >
      {/* Dynamic screen spill glow behind TV */}
      <div
        style={{
          position: 'absolute',
          left: screenX - 18,
          top: screenY - 18,
          width: screenW + 36,
          height: screenH + 36,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${glowColor}66 0%, transparent 72%)`,
          mixBlendMode: 'plus-lighter',
          pointerEvents: 'none',
        }}
      />

      {/* Retro CRT Bezel sprite behind screen viewport */}
      <Img
        src={staticFile('sprites/props/crt_tv.png')}
        style={{
          position: 'absolute',
          inset: 0,
          width: w,
          height: h,
          imageRendering: 'pixelated',
          zIndex: 1,
        }}
      />

      {/* Screen viewport inside CRT bezel */}
      <div
        style={{
          position: 'absolute',
          left: screenX,
          top: screenY,
          width: screenW,
          height: screenH,
          overflow: 'hidden',
          backgroundColor: PALETTE.void,
          borderRadius: 3,
          zIndex: 2,
          border: `2px solid ${PALETTE.ink}`,
          boxSizing: 'border-box',
        }}
      >
        {staticBurst ? (
          <div
            style={{
              width: '100%',
              height: '100%',
              background: `repeating-linear-gradient(0deg, ${PALETTE.silver} 0px, ${PALETTE.ink} 2px, ${PALETTE.steel} 4px)`,
              opacity: 0.9,
            }}
          />
        ) : (
          <RealFootage id={footageId} variant="pixel" compactPlaceholder />
        )}

        {/* Scanline overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(16,10,20,0.32) 0px, rgba(16,10,20,0.32) 1px, transparent 1px, transparent 3px)',
            pointerEvents: 'none',
          }}
        />

        {/* In-screen annotation marker dot */}
        {activeNote ? (
          <div
            style={{
              position: 'absolute',
              left: `${(activeNote.x * 100).toFixed(1)}%`,
              top: `${(activeNote.y * 100).toFixed(1)}%`,
              width: 5,
              height: 5,
              backgroundColor: PALETTE.gold,
              border: `1px solid ${PALETTE.ink}`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ) : null}
      </div>
    </div>
  );
};
