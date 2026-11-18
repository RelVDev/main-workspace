import React from 'react';
import {Img, staticFile, useCurrentFrame} from 'remotion';
import {PALETTE} from '../../data/palette';
import {ART_H, ART_W} from '../../lib/pixel';

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
  const drift = Math.sin(frame / 55) * 6;
  const orbs = [
    {x: 68, y: 54, r: 30, c: orbColorA, op: 0.45},
    {x: 150, y: 82, r: 20, c: orbColorB, op: 0.35},
    {x: 340, y: 48, r: 36, c: orbColorA, op: 0.4},
    {x: 412, y: 95, r: 24, c: orbColorB, op: 0.34},
    {x: 245, y: 65, r: 18, c: PALETTE.cream, op: 0.28},
  ];
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `linear-gradient(180deg, ${topColor} 0%, ${bottomColor} 100%)`,
      }}
    >
      {orbs.map((o, i) => {
        const dx = o.x - o.r + drift * (i % 2 === 0 ? 1 : -1);
        const dy = o.y - o.r + Math.cos(frame / 65 + i) * 2;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`,
              width: o.r * 2,
              height: o.r * 2,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${o.c} 0%, ${o.c}66 55%, transparent 100%)`,
              opacity: o.op,
            }}
          />
        );
      })}
    </div>
  );
};

export const VelvetCurtains: React.FC<{openProgress?: number}> = ({openProgress = 1}) => {
  const sideW = 140 - openProgress * 82;
  const topDrop = 36 - openProgress * 12;
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: Number(sideW.toFixed(2)),
          background: `repeating-linear-gradient(90deg, ${PALETTE.magentaDark} 0px, ${PALETTE.burgundy} 10px, ${PALETTE.maroon} 18px, ${PALETTE.magentaDark} 24px)`,
          borderRight: `2px solid ${PALETTE.gold}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: Number(sideW.toFixed(2)),
          background: `repeating-linear-gradient(90deg, ${PALETTE.magentaDark} 0px, ${PALETTE.burgundy} 10px, ${PALETTE.maroon} 18px, ${PALETTE.magentaDark} 24px)`,
          borderLeft: `2px solid ${PALETTE.gold}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: Number(topDrop.toFixed(2)),
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
  const pulse = 0.96 + 0.08 * Math.sin(frame * 0.45);
  const w = 16 * scale;
  const h = 24 * scale;
  return (
    <div
      style={{
        position: 'absolute',
        left: Number((x - w / 2).toFixed(2)),
        top: Number((y - h).toFixed(2)),
        width: w,
        height: h,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -10 * scale,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${PALETTE.goldPale}AA 0%, ${PALETTE.amber}44 45%, transparent 75%)`,
          mixBlendMode: 'plus-lighter',
          opacity: 0.8 + 0.2 * Math.sin(frame * 0.35),
        }}
      />
      <Img
        src={staticFile(`sprites/fx/flame_${variant}.png`)}
        style={{
          width: w,
          height: h,
          transform: `scale(${pulse.toFixed(3)})`,
          transformOrigin: 'bottom center',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};

export const PixelDoor: React.FC<{
  x: number;
  y: number;
  glow?: string;
  label?: string;
}> = ({x, y, glow = PALETTE.gold, label}) => {
  const frame = useCurrentFrame();
  const glowPulse = 0.85 + 0.15 * Math.sin(frame / 18);
  return (
    <div
      style={{
        position: 'absolute',
        left: Math.round(x),
        top: Math.round(y),
        width: 34,
        height: 68,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -14,
          background: `radial-gradient(circle, ${glow}77 0%, transparent 74%)`,
          mixBlendMode: 'plus-lighter',
          opacity: glowPulse,
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
            opacity: 0.92,
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
