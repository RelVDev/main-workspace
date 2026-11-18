import React, {useMemo} from 'react';
import {random, useCurrentFrame} from 'remotion';
import {ART_H, ART_W, snap} from '../lib/pixel';
import {PALETTE} from '../data/palette';

export const Dust: React.FC<{
  count?: number;
  color?: string;
  seed?: string;
  opacity?: number;
}> = ({count = 36, color = PALETTE.cream, seed = 'dust', opacity = 0.65}) => {
  const frame = useCurrentFrame();

  const motes = useMemo(
    () =>
      Array.from({length: count}, (_, i) => ({
        x0: random(`${seed}-x-${i}`) * ART_W,
        y0: random(`${seed}-y-${i}`) * ART_H,
        vx: (random(`${seed}-vx-${i}`) - 0.5) * 0.14,
        vy: -0.05 - random(`${seed}-vy-${i}`) * 0.14,
        phase: random(`${seed}-p-${i}`) * 40,
        big: random(`${seed}-s-${i}`) > 0.8,
      })),
    [count, seed],
  );

  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden'}}>
      {motes.map((m, i) => {
        const x = snap(((m.x0 + frame * m.vx) % ART_W + ART_W) % ART_W);
        const y = snap(((m.y0 + frame * m.vy) % ART_H + ART_H) % ART_H);
        const twinkle = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin((frame + m.phase) * 0.12));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: m.big ? 2 : 1,
              height: m.big ? 2 : 1,
              backgroundColor: color,
              opacity: opacity * twinkle,
            }}
          />
        );
      })}
    </div>
  );
};
