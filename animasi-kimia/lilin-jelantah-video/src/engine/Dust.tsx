import React, {useMemo} from 'react';
import {random, useCurrentFrame} from 'remotion';
import {ART_H, ART_W} from '../lib/pixel';
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
        vx: (random(`${seed}-vx-${i}`) - 0.5) * 0.16,
        vy: -0.04 - random(`${seed}-vy-${i}`) * 0.14,
        phase: random(`${seed}-p-${i}`) * 50,
        swayAmp: 0.8 + random(`${seed}-sw-${i}`) * 1.8,
        big: random(`${seed}-s-${i}`) > 0.78,
        bokeh: random(`${seed}-bk-${i}`) > 0.88,
      })),
    [count, seed],
  );

  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden'}}>
      {motes.map((m, i) => {
        const swayX = Math.sin((frame + m.phase) * 0.045) * m.swayAmp;
        const x = (((m.x0 + frame * m.vx + swayX) % ART_W) + ART_W) % ART_W;
        const y = (((m.y0 + frame * m.vy) % ART_H) + ART_H) % ART_H;
        const twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((frame + m.phase) * 0.09));
        const size = m.bokeh ? 4 : m.big ? 2 : 1.2;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              transform: `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`,
              width: size,
              height: size,
              borderRadius: m.bokeh ? '50%' : 0,
              backgroundColor: color,
              boxShadow: m.bokeh ? `0 0 6px ${color}` : undefined,
              opacity: (m.bokeh ? 0.38 : 1) * opacity * twinkle,
            }}
          />
        );
      })}
    </div>
  );
};
