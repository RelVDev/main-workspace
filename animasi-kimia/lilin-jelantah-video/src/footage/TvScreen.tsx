import React from 'react';
import {Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import footageLightJson from '../data/footage-light.json';
import {PALETTE} from '../data/palette';
import {snap} from '../lib/pixel';
import {RealFootage} from './RealFootage';

const LIGHT_MAP = footageLightJson as Record<string, string[]>;

export const useFootageLightColor = (id: string): string => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const samples = LIGHT_MAP[id] ?? [PALETTE.gold];
  const idx = Math.floor((frame / fps) * 2) % samples.length;
  return samples[idx] ?? PALETTE.gold;
};

export interface TvClipItem {
  id: string;
  startSec: number;
  endSec: number;
}

export const TvScreen: React.FC<{
  clips: TvClipItem[];
  activeId: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
}> = ({clips, activeId, x, y, w = 160, h = 128}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const glowColor = useFootageLightColor(activeId);

  const screenX = snap(w * 0.15);
  const screenY = snap(h * 0.28);
  const screenW = snap(w * 0.56);
  const screenH = snap(h * 0.5);

  const fadeDur = 0.65; // smooth 0.65s (~20 frame) dissolve between documentation clips

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
      {/* Dynamic ambient screen spill glow behind CRT bezel */}
      <div
        style={{
          position: 'absolute',
          left: screenX - 20,
          top: screenY - 20,
          width: screenW + 40,
          height: screenH + 40,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${glowColor}70 0%, transparent 74%)`,
          mixBlendMode: 'plus-lighter',
          pointerEvents: 'none',
        }}
      />

      {/* Retro CRT Bezel */}
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

      {/* Smooth dual-layer crossfading TV screen viewport */}
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
        {clips.map((clip, idx) => {
          const isFirst = idx === 0;
          const visibleStart = isFirst ? clip.startSec : clip.startSec - fadeDur * 0.5;
          const visibleEnd = clip.endSec + fadeDur * 0.5;
          if (t < visibleStart || t > visibleEnd) return null;

          const fadeIn = isFirst
            ? interpolate(t, [clip.startSec, clip.startSec + 0.35], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.cubic),
              })
            : interpolate(t, [clip.startSec - fadeDur * 0.5, clip.startSec + fadeDur * 0.5], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.inOut(Easing.cubic),
              });
          const fadeOut =
            idx === clips.length - 1
              ? 1
              : interpolate(t, [clip.endSec - fadeDur * 0.5, clip.endSec + fadeDur * 0.5], [1, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
                  easing: Easing.inOut(Easing.cubic),
                });
          const opacity = Math.min(fadeIn, fadeOut);
          const zoomSettle = interpolate(fadeIn, [0, 1], [1.05, 1.0]);
          const seqFrom = Math.max(0, Math.round(clip.startSec * fps));

          return (
            <div
              key={clip.id}
              style={{
                position: 'absolute',
                inset: 0,
                opacity,
                transform: `scale(${zoomSettle.toFixed(3)})`,
              }}
            >
              <Sequence from={seqFrom} layout="none">
                <RealFootage id={clip.id} variant="pixel" loop fit="cover" compactPlaceholder />
              </Sequence>
            </div>
          );
        })}

        {/* Subtle CRT scanline sheen */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(16,10,20,0.22) 0px, rgba(16,10,20,0.22) 1px, transparent 1px, transparent 3px)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};
