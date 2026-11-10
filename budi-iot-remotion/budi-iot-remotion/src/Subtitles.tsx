import React from 'react';
import {Scene} from './types';
import {FONT, clamp} from './util';

/** Subtitle lengkap: satu kalimat SRT tampil selama kalimat itu diucapkan. */
export const Subtitles: React.FC<{scenes: Scene[]; t: number}> = ({scenes, t}) => {
  const cur = scenes.find((s) => t >= s.start - 0.05 && t <= s.end + 0.3);
  if (!cur) return null;
  const fadeIn = clamp((t - (cur.start - 0.05)) / 0.18);
  const fadeOut = clamp((cur.end + 0.3 - t) / 0.2);
  const o = Math.min(fadeIn, fadeOut);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 190,
        display: 'flex',
        justifyContent: 'center',
        opacity: o,
        transform: `translateY(${(1 - fadeIn) * 14}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 940,
          padding: '22px 38px',
          borderRadius: 30,
          background: 'rgba(12, 22, 38, 0.76)',
          color: '#fff',
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 56,
          lineHeight: 1.26,
          textAlign: 'center',
          textShadow: '0 3px 0 rgba(0,0,0,0.35)',
        }}
      >
        {cur.text}
      </div>
    </div>
  );
};
