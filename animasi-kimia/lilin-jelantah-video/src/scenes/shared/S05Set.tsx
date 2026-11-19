import React from 'react';
import {useCurrentFrame} from 'remotion';
import {PALETTE} from '../../data/palette';
import {ART_W} from '../../lib/pixel';

/** S05 "Showroom / Pameran" set kit: gallery wall, display niches, rope stanchions. */

export const ShowroomBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: -30, top: -20, width: ART_W + 60, height: 260}}>
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${PALETTE.void} 0%, ${PALETTE.plumDeep} 40%, ${PALETTE.plumMid} 100%)`}} />
      {/* vertical wall panels */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(90deg, ${PALETTE.ink}AA 1px, transparent 1px)`,
          backgroundSize: '40px 100%',
          opacity: 0.6,
        }}
      />
      {/* central arch niche glowing behind the podium */}
      <div
        style={{
          position: 'absolute',
          left: 270 - 46,
          top: 60,
          width: 92,
          height: 170,
          borderRadius: '46px 46px 0 0',
          background: `radial-gradient(ellipse at 50% 30%, ${PALETTE.burgundy} 0%, ${PALETTE.magentaDark} 60%, ${PALETTE.plumDeep} 100%)`,
          border: `2px solid ${PALETTE.gold}`,
          boxShadow: `0 0 18px ${PALETTE.gold}44`,
        }}
      />
      {/* framed exhibits on the wall */}
      {[
        {x: 70, y: 70, w: 44, h: 34, c: PALETTE.gold},
        {x: 132, y: 60, w: 30, h: 44, c: PALETTE.blush},
        {x: 380, y: 64, w: 44, h: 36, c: PALETTE.teal},
        {x: 440, y: 74, w: 28, h: 30, c: PALETTE.amber},
      ].map((f, i) => (
        <div key={i} style={{position: 'absolute', left: f.x, top: f.y, width: f.w, height: f.h, backgroundColor: PALETTE.ink, border: `2px solid ${f.c}`, padding: 3}}>
          <div style={{width: '100%', height: '100%', background: `linear-gradient(160deg, ${f.c}AA 0%, ${PALETTE.plumMid} 100%)`}} />
          {/* picture light */}
          <div style={{position: 'absolute', left: f.w / 2 - 12, top: -14, width: 24, height: 22, background: `radial-gradient(ellipse at 50% 0%, ${PALETTE.goldPale}88 0%, transparent 70%)`, opacity: 0.85 + 0.15 * Math.sin(frame / 30 + i)}} />
        </div>
      ))}
    </div>
  );
};

/** Velvet-rope stanchions for the foreground plane. */
export const RopeStanchions: React.FC<{y?: number}> = ({y = 222}) => {
  const post = (x: number) => (
    <div style={{position: 'absolute', left: x - 4, top: y, width: 8, height: 70}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: 8, height: 8, borderRadius: '50%', backgroundColor: PALETTE.goldPale, border: `1px solid ${PALETTE.ink}`}} />
      <div style={{position: 'absolute', left: 2, top: 6, width: 4, height: 60, backgroundColor: PALETTE.gold, border: `1px solid ${PALETTE.ink}`}} />
    </div>
  );
  const rope = (x0: number, x1: number) => (
    <div
      style={{
        position: 'absolute',
        left: x0,
        top: y + 2,
        width: x1 - x0,
        height: 18,
        borderBottom: `4px solid ${PALETTE.crimson}`,
        borderRadius: '0 0 50% 50%',
      }}
    />
  );
  return (
    <>
      {rope(-40, 40)}
      {post(40)}
      {rope(440, 520)}
      {post(440)}
    </>
  );
};
