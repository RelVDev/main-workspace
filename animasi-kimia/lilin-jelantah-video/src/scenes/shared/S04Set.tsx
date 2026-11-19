import React from 'react';
import {useCurrentFrame} from 'remotion';
import {PALETTE} from '../../data/palette';
import {ART_W} from '../../lib/pixel';
import {CinemaLoungeDecor} from './RoomDecor';

/**
 * S04 set kit — "Workshop Praktikum" (warm, practical, 4 numbered stations) and the
 * "Ruang Nonton" lounge (dim, the CRT is the key light).
 */

/** Far plane of the workshop: brick wall, high window, pegboard with tool silhouettes, shelves. */
export const WorkshopBackdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: -30, top: -20, width: ART_W + 60, height: 260}}>
      {/* brick wall */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: PALETTE.woodDark,
          backgroundImage: `linear-gradient(0deg, ${PALETTE.ink}88 1px, transparent 1px), linear-gradient(90deg, ${PALETTE.ink}66 1px, transparent 1px), linear-gradient(90deg, ${PALETTE.ink}66 1px, transparent 1px)`,
          backgroundSize: '100% 8px, 16px 16px, 16px 16px',
          backgroundPosition: '0 0, 0 0, 8px 8px',
        }}
      />
      <div style={{position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${PALETTE.plumDeep}CC 0%, transparent 45%, ${PALETTE.plumDeep}AA 100%)`}} />
      {/* high window with warm afternoon light */}
      {[60, 380].map((wx) => (
        <div key={wx} style={{position: 'absolute', left: wx, top: 34, width: 60, height: 50, backgroundColor: PALETTE.ink, padding: 3}}>
          <div style={{width: '100%', height: '100%', background: `linear-gradient(180deg, ${PALETTE.goldPale} 0%, ${PALETTE.gold} 60%, ${PALETTE.amber} 100%)`}} />
          <div style={{position: 'absolute', left: 31, top: 0, width: 2, height: 50, backgroundColor: PALETTE.ink}} />
          <div style={{position: 'absolute', left: 0, top: 24, width: 60, height: 2, backgroundColor: PALETTE.ink}} />
        </div>
      ))}
      {/* pegboard with tools */}
      <div
        style={{
          position: 'absolute',
          left: 170,
          top: 46,
          width: 150,
          height: 70,
          backgroundColor: PALETTE.tan,
          border: `2px solid ${PALETTE.ink}`,
          backgroundImage: `radial-gradient(${PALETTE.woodDark} 0.8px, transparent 1px)`,
          backgroundSize: '6px 6px',
        }}
      >
        {[
          {l: 10, t: 8, w: 4, h: 30, c: PALETTE.slate},
          {l: 22, t: 10, w: 14, h: 4, c: PALETTE.steel},
          {l: 44, t: 6, w: 6, h: 34, c: PALETTE.woodMid},
          {l: 60, t: 12, w: 18, h: 18, c: PALETTE.silver},
          {l: 86, t: 8, w: 4, h: 26, c: PALETTE.red},
          {l: 100, t: 10, w: 20, h: 6, c: PALETTE.slate},
          {l: 126, t: 6, w: 10, h: 30, c: PALETTE.steel},
        ].map((tl, i) => (
          <div key={i} style={{position: 'absolute', left: tl.l, top: tl.t, width: tl.w, height: tl.h, backgroundColor: tl.c, border: `1px solid ${PALETTE.ink}`}} />
        ))}
      </div>
      {/* shelves with jars */}
      {[132, 350].map((sx) => (
        <div key={sx} style={{position: 'absolute', left: sx - 12, top: 110, width: 70, height: 4, backgroundColor: PALETTE.woodLight, border: `1px solid ${PALETTE.ink}`}}>
          {[0, 1, 2, 3].map((j) => (
            <div
              key={j}
              style={{
                position: 'absolute',
                left: 4 + j * 16,
                top: -12,
                width: 10,
                height: 12,
                backgroundColor: [PALETTE.gold, PALETTE.cream, PALETTE.amberDeep, PALETTE.blush][j],
                border: `1px solid ${PALETTE.ink}`,
                opacity: 0.9,
              }}
            />
          ))}
        </div>
      ))}
      {/* warm wall-washer flicker from the window */}
      <div style={{position: 'absolute', left: 30, top: 80, width: 120, height: 80, background: `radial-gradient(ellipse, ${PALETTE.gold}33 0%, transparent 70%)`, opacity: 0.8 + 0.2 * Math.sin(frame / 40)}} />
    </div>
  );
};

/** One numbered workbench station. `lit` 0..1 fades its sign + lamp on. */
export const WorkStation: React.FC<{x: number; n: string; lit: number; children?: React.ReactNode}> = ({x, n, lit, children}) => {
  const frame = useCurrentFrame();
  const on = lit > 0.05;
  const flick = on ? 0.9 + 0.1 * Math.sin(frame * 0.3 + x) : 0;
  return (
    <div style={{position: 'absolute', left: x - 34, top: 120, width: 68, height: 86}}>
      {/* props on bench */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 68, height: 50}}>{children}</div>
      {/* bench top */}
      <div style={{position: 'absolute', left: 0, top: 48, width: 68, height: 5, backgroundColor: PALETTE.woodLight, border: `1px solid ${PALETTE.ink}`}} />
      <div style={{position: 'absolute', left: 1, top: 54, width: 66, height: 2, backgroundColor: PALETTE.woodDark}} />
      {/* legs + cabinet */}
      <div style={{position: 'absolute', left: 3, top: 56, width: 5, height: 28, backgroundColor: PALETTE.woodMid, border: `1px solid ${PALETTE.ink}`}} />
      <div style={{position: 'absolute', right: 3, top: 56, width: 5, height: 28, backgroundColor: PALETTE.woodMid, border: `1px solid ${PALETTE.ink}`}} />
      <div style={{position: 'absolute', left: 12, top: 58, width: 44, height: 20, backgroundColor: PALETTE.woodDark, border: `1px solid ${PALETTE.ink}`}}>
        {/* station number plate lights up with the station */}
        <div
          style={{
            position: 'absolute',
            left: 12,
            top: 4,
            width: 18,
            height: 11,
            backgroundColor: on ? PALETTE.amber : PALETTE.plumMid,
            border: `1px solid ${PALETTE.ink}`,
            boxShadow: on ? `0 0 ${6 * lit}px ${PALETTE.amber}` : undefined,
            color: on ? PALETTE.ink : PALETTE.steel,
            fontFamily: 'monospace',
            fontSize: 7,
            lineHeight: '11px',
            textAlign: 'center',
            fontWeight: 700,
            opacity: on ? flick : 0.8,
          }}
        >
          {n}
        </div>
      </div>
    </div>
  );
};

/** Far plane of the lounge: existing lounge decor + acoustic panels + sconces. */
export const LoungeBackdrop: React.FC<{sconce?: number}> = ({sconce = 1}) => (
  <div style={{position: 'absolute', inset: 0}}>
    <CinemaLoungeDecor />
    {/* acoustic panels behind the TV */}
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: 150 + i * 32,
          top: 20,
          width: 28,
          height: 150,
          background: `repeating-linear-gradient(0deg, ${PALETTE.plumDeep} 0px, ${PALETTE.plumDeep} 6px, ${PALETTE.magentaDark} 6px, ${PALETTE.magentaDark} 8px)`,
          border: `1px solid ${PALETTE.ink}`,
          opacity: 0.85,
        }}
      />
    ))}
    {/* wall sconces */}
    {[118, 362].map((sx) => (
      <div key={sx} style={{position: 'absolute', left: sx - 5, top: 70, width: 10, height: 12}}>
        <div style={{position: 'absolute', inset: 0, backgroundColor: PALETTE.woodMid, border: `1px solid ${PALETTE.ink}`, clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)'}} />
        <div style={{position: 'absolute', left: -14, top: -24, width: 38, height: 40, borderRadius: '50%', background: `radial-gradient(ellipse, ${PALETTE.amber}88 0%, transparent 70%)`, opacity: sconce}} />
      </div>
    ))}
  </div>
);

/** Foreground: back of a front-row seat (bottom-left) + popcorn bucket (bottom-right). */
export const LoungeForeground: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: -50, top: 232, width: 170, height: 70, backgroundColor: PALETTE.magentaDark, borderRadius: '22px 22px 0 0', border: `2px solid ${PALETTE.ink}`}}>
      <div style={{position: 'absolute', left: 10, right: 10, top: 6, height: 4, backgroundColor: PALETTE.crimson, opacity: 0.6, borderRadius: 4}} />
    </div>
    <div
      style={{
        position: 'absolute',
        left: 400,
        top: 214,
        width: 40,
        height: 60,
        background: `repeating-linear-gradient(90deg, ${PALETTE.red} 0px, ${PALETTE.red} 6px, ${PALETTE.cream} 6px, ${PALETTE.cream} 12px)`,
        clipPath: 'polygon(0 0, 100% 0, 88% 100%, 12% 100%)',
      }}
    />
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: 402 + (i % 3) * 12,
          top: 204 + Math.floor(i / 3) * 6,
          width: 10,
          height: 9,
          borderRadius: '50%',
          backgroundColor: i % 2 ? PALETTE.goldPale : PALETTE.cream,
        }}
      />
    ))}
  </>
);

/** Foreground for the workshop: blurred pipe + toolbox edge. */
export const WorkshopForeground: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: -40, top: -30, width: 22, height: 340, backgroundColor: PALETTE.slate, border: `2px solid ${PALETTE.ink}`}} />
    <div style={{position: 'absolute', left: 410, top: 236, width: 110, height: 60, backgroundColor: PALETTE.red, border: `2px solid ${PALETTE.ink}`}}>
      <div style={{position: 'absolute', left: 8, right: 8, top: 10, height: 4, backgroundColor: PALETTE.ink, opacity: 0.6}} />
    </div>
  </>
);
