import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {PALETTE} from '../../data/palette';
import {ART_H, ART_W, snap} from '../../lib/pixel';

export const BokehBackdrop: React.FC<{
  topColor?: string;
  bottomColor?: string;
  orbColorA?: string;
  orbColorB?: string;
}> = ({
  topColor = PALETTE.plumDeep,
  bottomColor = PALETTE.magentaDark,
  orbColorA = PALETTE.gold,
  orbColorB = PALETTE.amber,
}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 50) * 4;
  const orbs = [
    {x: 68, y: 54, r: 28, c: orbColorA, op: 0.45},
    {x: 150, y: 82, r: 18, c: orbColorB, op: 0.35},
    {x: 340, y: 48, r: 34, c: orbColorA, op: 0.4},
    {x: 412, y: 95, r: 22, c: orbColorB, op: 0.32},
    {x: 245, y: 65, r: 16, c: PALETTE.cream, op: 0.25},
  ];
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${topColor} 0%, ${bottomColor} 100%)`,
      }}
    >
      {orbs.map((o, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: snap(o.x - o.r + drift * (i % 2 === 0 ? 1 : -1)),
            top: snap(o.y - o.r),
            width: o.r * 2,
            height: o.r * 2,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${o.c} 0%, ${o.c}66 55%, transparent 100%)`,
            opacity: o.op,
          }}
        />
      ))}
    </div>
  );
};

export const VelvetCurtains: React.FC<{openProgress?: number}> = ({openProgress = 1}) => {
  // openProgress 0 = closed, 1 = parted to edges
  const sideW = snap(140 - openProgress * 82);
  const topDrop = snap(36 - openProgress * 12);
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {/* Left curtain */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: sideW,
          background: `repeating-linear-gradient(90deg, ${PALETTE.magentaDark} 0px, ${PALETTE.burgundy} 10px, ${PALETTE.maroon} 18px, ${PALETTE.magentaDark} 24px)`,
          borderRight: `2px solid ${PALETTE.gold}`,
        }}
      />
      {/* Right curtain */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: sideW,
          background: `repeating-linear-gradient(90deg, ${PALETTE.magentaDark} 0px, ${PALETTE.burgundy} 10px, ${PALETTE.maroon} 18px, ${PALETTE.magentaDark} 24px)`,
          borderLeft: `2px solid ${PALETTE.gold}`,
        }}
      />
      {/* Top valence */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: topDrop,
          background: `repeating-linear-gradient(90deg, ${PALETTE.burgundy} 0px, ${PALETTE.maroon} 14px, ${PALETTE.magentaDark} 26px)`,
          borderBottom: `2px solid ${PALETTE.gold}`,
        }}
      />
    </div>
  );
};

export const StageFloor: React.FC<{
  y?: number;
  topColor?: string;
  bottomColor?: string;
  plankColor?: string;
}> = ({
  y = 198,
  topColor = PALETTE.plumMid,
  bottomColor = PALETTE.plumDeep,
  plankColor = PALETTE.ink,
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: y,
        bottom: 0,
        background: `linear-gradient(180deg, ${topColor} 0%, ${bottomColor} 100%)`,
        borderTop: `2px solid ${plankColor}`,
      }}
    >
      {/* Horizontal plank lines */}
      {[14, 34, 56].map((dy) => (
        <div
          key={dy}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: dy,
            height: 1,
            backgroundColor: plankColor,
            opacity: 0.35,
          }}
        />
      ))}
    </div>
  );
};

export const AnimatedFlame: React.FC<{
  x: number;
  y: number;
  scale?: number;
}> = ({x, y, scale = 1}) => {
  const frame = useCurrentFrame();
  const variant = frame % 9 < 3 ? 'a' : frame % 9 < 6 ? 'b' : 'c';
  const w = 16 * scale;
  const h = 24 * scale;
  return (
    <Img
      src={staticFile(`sprites/fx/flame_${variant}.png`)}
      style={{
        position: 'absolute',
        left: snap(x - w / 2),
        top: snap(y - h),
        width: w,
        height: h,
        imageRendering: 'pixelated',
        pointerEvents: 'none',
      }}
    />
  );
};

export const PixelDoor: React.FC<{
  x: number;
  y: number;
  glow?: string;
  label?: string;
}> = ({x, y, glow = PALETTE.gold, label}) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: snap(x),
        top: snap(y),
        width: 34,
        height: 68,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -10,
          background: `radial-gradient(circle, ${glow}66 0%, transparent 72%)`,
          mixBlendMode: 'plus-lighter',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: PALETTE.woodMid,
          border: `2px solid ${PALETTE.ink}`,
          boxShadow: `inset 0 0 0 2px ${PALETTE.woodDark}`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 6,
            top: 8,
            width: 20,
            height: 22,
            backgroundColor: glow,
            border: `1px solid ${PALETTE.ink}`,
            opacity: 0.9,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 6,
            top: 36,
            width: 20,
            height: 24,
            backgroundColor: PALETTE.woodDark,
            border: `1px solid ${PALETTE.ink}`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 4,
            top: 34,
            width: 3,
            height: 3,
            backgroundColor: PALETTE.gold,
          }}
        />
      </div>
      {label ? (
        <div
          style={{
            position: 'absolute',
            top: -12,
            left: -10,
            width: 54,
            textAlign: 'center',
            fontSize: 5,
            fontFamily: 'monospace',
            color: PALETTE.cream,
            backgroundColor: PALETTE.ink,
            padding: '1px 2px',
          }}
        >
          {label}
        </div>
      ) : null}
    </div>
  );
};

export const FullArtFill: React.FC<{color: string; children?: React.ReactNode}> = ({color, children}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: ART_W, height: ART_H, backgroundColor: color}}>
    {children}
  </div>
);
