import React from 'react';
import {useCurrentFrame} from 'remotion';
import {PALETTE} from '../../data/palette';
import {ART_H, ART_W} from '../../lib/pixel';
import {PottedPlant, WallWainscot} from './RoomDecor';

/**
 * S08 "Meja Kerja Tim" set: warm workroom wall with a sunset window and shelves (far),
 * cork board with polaroids + red string (mid), the long team table (subject, in front of the
 * characters) and defocused desk clutter (foreground).
 */

/** Far plane: wood-panel wall, tall window with evening sky, bookshelf. */
export const WorkroomWall: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', left: -30, top: -20, width: ART_W + 60, height: ART_H + 40}}>
      <div style={{position: 'absolute', left: 30, top: 20, width: ART_W, height: ART_H}}>
        <WallWainscot yFloor={210} wallTop="#4A2C24" wallBot={PALETTE.woodMid} wainscot={PALETTE.woodDark} trim={PALETTE.gold} gridAlpha={0.05} />
        {/* window (left) — the warm key source */}
        <div style={{position: 'absolute', left: 12, top: 26, width: 54, height: 110, backgroundColor: PALETTE.woodDark, border: `2px solid ${PALETTE.ink}`}}>
          <div style={{position: 'absolute', inset: 4, background: `linear-gradient(180deg, ${PALETTE.amber} 0%, ${PALETTE.gold} 55%, ${PALETTE.goldPale} 100%)`}}>
            {/* distant rooftops in the window */}
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 22, background: `linear-gradient(90deg, ${PALETTE.maroon} 0 30%, transparent 30% 36%, ${PALETTE.maroon} 36% 70%, transparent 70% 76%, ${PALETTE.maroon} 76%)`}} />
            <div style={{position: 'absolute', left: 14, top: 18, width: 10, height: 10, borderRadius: '50%', backgroundColor: PALETTE.cream, boxShadow: `0 0 10px ${PALETTE.goldPale}`}} />
          </div>
          <div style={{position: 'absolute', left: 25, top: 0, width: 3, bottom: 0, backgroundColor: PALETTE.woodDark}} />
          <div style={{position: 'absolute', left: 0, right: 0, top: 52, height: 3, backgroundColor: PALETTE.woodDark}} />
          {/* curtain */}
          <div style={{position: 'absolute', right: -6, top: -4, width: 10, height: 118, background: `repeating-linear-gradient(90deg, ${PALETTE.maroon} 0px, ${PALETTE.crimson} 3px, ${PALETTE.maroon} 6px)`}} />
        </div>
        {/* bookshelf (right) */}
        <div style={{position: 'absolute', left: 418, top: 34, width: 56, height: 132, backgroundColor: PALETTE.woodDark, border: `2px solid ${PALETTE.ink}`}}>
          {[0, 1, 2, 3].map((r) => (
            <div key={r} style={{position: 'absolute', left: 3, right: 3, top: 6 + r * 32, height: 26, display: 'flex', alignItems: 'flex-end', gap: 1}}>
              {Array.from({length: 8}, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: 5,
                    height: 16 + ((i * 7 + r * 3) % 9),
                    backgroundColor: [PALETTE.teal, PALETTE.amber, PALETTE.crimson, PALETTE.cream, PALETTE.green][(i + r) % 5],
                    border: `1px solid ${PALETTE.ink}`,
                  }}
                />
              ))}
              <div style={{position: 'absolute', left: -3, right: -3, bottom: -3, height: 3, backgroundColor: PALETTE.woodMid}} />
            </div>
          ))}
        </div>
        {/* wall clock */}
        <div style={{position: 'absolute', left: 384, top: 30, width: 18, height: 18, borderRadius: '50%', backgroundColor: PALETTE.cream, border: `2px solid ${PALETTE.ink}`}}>
          <div style={{position: 'absolute', left: 8, top: 3, width: 1, height: 6, backgroundColor: PALETTE.ink}} />
          <div
            style={{
              position: 'absolute',
              left: 8,
              top: 8,
              width: 5,
              height: 1,
              backgroundColor: PALETTE.red,
              transformOrigin: '0 50%',
              transform: `rotate(${Math.floor(frame / 30) * 6}deg)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const POLAROIDS = [
  {x: 22, y: 16, c: PALETTE.teal},
  {x: 78, y: 40, c: PALETTE.amber},
  {x: 136, y: 14, c: PALETTE.gold},
  {x: 192, y: 44, c: PALETTE.green},
  {x: 250, y: 18, c: PALETTE.crimson},
  {x: 306, y: 42, c: PALETTE.cyan},
  {x: 70, y: 82, c: PALETTE.blush},
  {x: 168, y: 86, c: PALETTE.amber},
  {x: 262, y: 84, c: PALETTE.teal},
];

/** Mid plane: cork board with 9 polaroids joined by red string (string draws in with `progress`). */
export const CorkBoard: React.FC<{x?: number; y?: number; progress?: number; pins?: number}> = ({x = 76, y = 30, progress = 1, pins = 9}) => {
  const frame = useCurrentFrame();
  const W = 340;
  const H = 124;
  const pts = POLAROIDS.slice(0, pins).map((p) => ({x: p.x + 17, y: p.y + 2}));
  const segs = pts.slice(1).map((p, i) => ({a: pts[i], b: p}));
  const shown = Math.max(0, Math.min(segs.length, progress * segs.length));
  return (
    <div style={{position: 'absolute', left: x, top: y, width: W, height: H}}>
      {/* frame + cork texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: PALETTE.woodLight,
          backgroundImage: `radial-gradient(${PALETTE.tan} 1px, transparent 1px), radial-gradient(${PALETTE.woodMid} 1px, transparent 1px)`,
          backgroundSize: '5px 5px, 7px 7px',
          backgroundPosition: '0 0, 2px 3px',
          border: `4px solid ${PALETTE.woodDark}`,
          outline: `2px solid ${PALETTE.ink}`,
          boxShadow: `4px 6px 0 rgba(16,10,20,0.45)`,
        }}
      />
      {/* polaroids */}
      {POLAROIDS.slice(0, pins).map((p, i) => {
        const sway = Math.sin(frame / 40 + i) * 0.5;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: 34,
              height: 32,
              backgroundColor: PALETTE.cream,
              border: `1px solid ${PALETTE.ink}`,
              boxShadow: `2px 2px 0 rgba(16,10,20,0.4)`,
              transform: `translate3d(0, ${sway.toFixed(2)}px, 0)`,
            }}
          >
            <div style={{position: 'absolute', left: 3, top: 3, right: 3, height: 20, backgroundColor: p.c}}>
              {/* tiny pixel person silhouette */}
              <div style={{position: 'absolute', left: 11, top: 4, width: 6, height: 6, backgroundColor: PALETTE.ink, opacity: 0.55}} />
              <div style={{position: 'absolute', left: 9, top: 11, width: 10, height: 9, backgroundColor: PALETTE.ink, opacity: 0.55}} />
            </div>
            <div style={{position: 'absolute', left: 6, bottom: 3, width: 20, height: 1, backgroundColor: PALETTE.slate}} />
          </div>
        );
      })}
      {/* red string */}
      {segs.map((s, i) => {
        const k = Math.max(0, Math.min(1, shown - i));
        if (k <= 0) return null;
        const dx = s.b.x - s.a.x;
        const dy = s.b.y - s.a.y;
        const len = Math.hypot(dx, dy) * k;
        return (
          <div
            key={`s${i}`}
            style={{
              position: 'absolute',
              left: s.a.x,
              top: s.a.y,
              width: len,
              height: 1,
              backgroundColor: PALETTE.red,
              transformOrigin: '0 50%',
              transform: `rotate(${Math.atan2(dy, dx)}rad)`,
            }}
          />
        );
      })}
      {/* pins */}
      {pts.map((p, i) => (
        <div key={`p${i}`} style={{position: 'absolute', left: p.x - 2, top: p.y - 2, width: 4, height: 4, backgroundColor: PALETTE.red, border: `1px solid ${PALETTE.ink}`}} />
      ))}
    </div>
  );
};

/** Small pixel task props on the table (index = ALL_CHAR_IDS order). */
const TaskProp: React.FC<{kind: number; x: number; y: number}> = ({kind, x, y}) => {
  const s: React.CSSProperties = {position: 'absolute', border: `1px solid ${PALETTE.ink}`};
  const k = kind % 9;
  return (
    <div style={{position: 'absolute', left: Math.round(x - 6), top: Math.round(y - 12), width: 12, height: 12}}>
      {k === 0 ? (
        // strainer
        <>
          <div style={{...s, left: 0, top: 5, width: 9, height: 5, borderRadius: '0 0 5px 5px', backgroundColor: PALETTE.silver}} />
          <div style={{...s, left: 8, top: 6, width: 4, height: 2, backgroundColor: PALETTE.slate}} />
        </>
      ) : k === 1 ? (
        // beaker
        <div style={{...s, left: 2, top: 1, width: 8, height: 11, backgroundColor: PALETTE.cyan}}>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 5, backgroundColor: PALETTE.gold}} />
        </div>
      ) : k === 2 ? (
        // pot
        <>
          <div style={{...s, left: 1, top: 4, width: 10, height: 8, backgroundColor: PALETTE.steel}} />
          <div style={{...s, left: 0, top: 3, width: 12, height: 2, backgroundColor: PALETTE.slate}} />
        </>
      ) : k === 3 ? (
        // jar
        <div style={{...s, left: 2, top: 2, width: 8, height: 10, backgroundColor: PALETTE.silver}}>
          <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 6, backgroundColor: PALETTE.cream}} />
        </div>
      ) : k === 4 ? (
        // wick spool
        <>
          <div style={{...s, left: 2, top: 4, width: 8, height: 8, backgroundColor: PALETTE.cream}} />
          <div style={{position: 'absolute', left: 5, top: 0, width: 1, height: 5, backgroundColor: PALETTE.ink}} />
        </>
      ) : k === 5 ? (
        // laptop
        <>
          <div style={{...s, left: 1, top: 1, width: 10, height: 7, backgroundColor: PALETTE.teal}} />
          <div style={{...s, left: 0, top: 8, width: 12, height: 3, backgroundColor: PALETTE.slate}} />
        </>
      ) : k === 6 ? (
        // notebook
        <div style={{...s, left: 1, top: 6, width: 10, height: 6, backgroundColor: PALETTE.amber}} />
      ) : k === 7 ? (
        // book stack
        <>
          <div style={{...s, left: 1, top: 8, width: 10, height: 4, backgroundColor: PALETTE.crimson}} />
          <div style={{...s, left: 2, top: 4, width: 9, height: 4, backgroundColor: PALETTE.tealMid}} />
        </>
      ) : (
        // camera
        <>
          <div style={{...s, left: 1, top: 4, width: 10, height: 7, backgroundColor: PALETTE.slate}} />
          <div style={{position: 'absolute', left: 4, top: 6, width: 4, height: 4, borderRadius: '50%', backgroundColor: PALETTE.cyan}} />
        </>
      )}
    </div>
  );
};

/** Long team table in front of the line-up (hides legs, grounds the group). */
export const TeamTable: React.FC<{y?: number; left?: number; right?: number; propXs?: number[]}> = ({y = 196, left = 22, right = 458, propXs = []}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: ART_W, height: ART_H, pointerEvents: 'none'}}>
    {/* top surface (slight perspective: lighter front lip) */}
    <div style={{position: 'absolute', left, top: y, width: right - left, height: 8, background: `linear-gradient(180deg, ${PALETTE.woodMid} 0%, ${PALETTE.woodLight} 100%)`, border: `2px solid ${PALETTE.ink}`}} />
    {/* front apron */}
    <div
      style={{
        position: 'absolute',
        left: left + 2,
        top: y + 9,
        width: right - left - 4,
        height: 22,
        background: `linear-gradient(180deg, ${PALETTE.woodDark} 0%, #3A200E 100%)`,
        borderLeft: `2px solid ${PALETTE.ink}`,
        borderRight: `2px solid ${PALETTE.ink}`,
      }}
    >
      {Array.from({length: 6}, (_, i) => (
        <div key={i} style={{position: 'absolute', left: 8 + i * 72, top: 4, width: 60, height: 12, border: `1px solid ${PALETTE.ink}`, backgroundColor: 'rgba(255,178,90,0.06)'}} />
      ))}
    </div>
    {/* legs */}
    <div style={{position: 'absolute', left: left + 6, top: y + 30, width: 6, height: 40, backgroundColor: '#3A200E', border: `1px solid ${PALETTE.ink}`}} />
    <div style={{position: 'absolute', left: right - 12, top: y + 30, width: 6, height: 40, backgroundColor: '#3A200E', border: `1px solid ${PALETTE.ink}`}} />
    {propXs.map((px, i) => (
      <TaskProp key={i} kind={i} x={px} y={y + 2} />
    ))}
  </div>
);

/** Foreground plane: defocused desk lamp + mug at left, plant at right. */
export const DeskForeground: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: -24, top: 214, width: 120, height: 90, backgroundColor: '#2A170C', borderTop: `3px solid ${PALETTE.woodMid}`}} />
    {/* lamp */}
    <div style={{position: 'absolute', left: 24, top: 176, width: 4, height: 40, backgroundColor: PALETTE.slate}} />
    <div style={{position: 'absolute', left: 10, top: 168, width: 30, height: 14, borderRadius: '14px 14px 2px 2px', backgroundColor: PALETTE.amberDeep}} />
    <div style={{position: 'absolute', left: 14, top: 180, width: 22, height: 5, borderRadius: '50%', backgroundColor: PALETTE.goldPale, boxShadow: `0 0 18px ${PALETTE.gold}`}} />
    {/* mug */}
    <div style={{position: 'absolute', left: 60, top: 200, width: 16, height: 16, backgroundColor: PALETTE.cream, borderRadius: 2}} />
    {/* plant right */}
    <div style={{position: 'absolute', right: -10, top: 150, width: 60, height: 140}}>
      <div style={{position: 'absolute', left: 10, top: 0, width: 40, height: 80, borderRadius: '50% 50% 40% 40%', backgroundColor: PALETTE.greenDark}} />
      <div style={{position: 'absolute', left: 0, top: 20, width: 30, height: 50, borderRadius: '50%', backgroundColor: PALETTE.green}} />
      <div style={{position: 'absolute', left: 14, top: 76, width: 34, height: 60, backgroundColor: PALETTE.amberDeep}} />
    </div>
  </>
);

export {PottedPlant};
