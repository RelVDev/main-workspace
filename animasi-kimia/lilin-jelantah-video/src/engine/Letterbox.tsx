import React from 'react';
import {PALETTE} from '../data/palette';
import {ART_W, snap} from '../lib/pixel';

export const Letterbox: React.FC<{amount?: number}> = ({amount = 1}) => {
  // ±6% of 270 art-px = 16 px top & bottom
  const barH = snap(16 * Math.max(0, Math.min(1, amount)));
  if (barH <= 0) return null;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: ART_W,
          height: barH,
          backgroundColor: PALETTE.void,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: ART_W,
          height: barH,
          backgroundColor: PALETTE.void,
          pointerEvents: 'none',
        }}
      />
    </>
  );
};
