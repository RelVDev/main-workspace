import React, {useMemo} from 'react';
import {random, useCurrentFrame} from 'remotion';
import {PALETTE} from '../../data/palette';
import {ART_W} from '../../lib/pixel';

/**
 * S06 "Observatorium Data" HD-2D set: starfield dome (far), Indonesia hologram over a projector,
 * data consoles + railing + library doorway (mid), and near railing / telescope (foreground).
 */

/** Far plane: ribbed observatory dome with a slowly turning starfield + nebula band. */
export const ObservatoryDome: React.FC = () => {
  const frame = useCurrentFrame();
  const stars = useMemo(
    () =>
      Array.from({length: 90}, (_, i) => ({
        a: random(`s06st-a${i}`) * Math.PI * 2,
        r: 20 + random(`s06st-r${i}`) * 230,
        p: random(`s06st-p${i}`) * 80,
        big: random(`s06st-b${i}`) > 0.88,
        c: random(`s06st-c${i}`) > 0.8 ? PALETTE.cyan : random(`s06st-c2${i}`) > 0.85 ? PALETTE.goldPale : PALETTE.cream,
      })),
    [],
  );
  // the sky turns around a pole above the frame
  const rot = frame * 0.0009;
  const poleX = 240;
  const poleY = -40;
  return (
    <div style={{position: 'absolute', inset: -20, overflow: 'hidden', background: `linear-gradient(180deg, #060A18 0%, ${PALETTE.navy} 62%, ${PALETTE.tealDark} 100%)`}}>
      {/* nebula band */}
      <div
        style={{
          position: 'absolute',
          left: -60,
          top: 40,
          width: ART_W + 160,
          height: 70,
          transform: `rotate(${(-14 + Math.sin(frame / 400) * 1.5).toFixed(2)}deg)`,
          background: `radial-gradient(ellipse at 40% 50%, ${PALETTE.tealMid}55 0%, ${PALETTE.plumMid}44 40%, transparent 70%)`,
        }}
      />
      {stars.map((s, i) => {
        const a = s.a + rot;
        const x = poleX + Math.cos(a) * s.r * 1.6;
        const y = poleY + Math.sin(a) * s.r * 0.9 + 60;
        if (y < -10 || y > 230) return null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: Math.round(x + 20),
              top: Math.round(y + 20),
              width: s.big ? 2 : 1,
              height: s.big ? 2 : 1,
              backgroundColor: s.c,
              opacity: 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((frame + s.p) * 0.09)),
            }}
          />
        );
      })}
      {/* dome ribs (concentric arches) */}
      {[0, 1, 2].map((k) => (
        <div
          key={k}
          style={{
            position: 'absolute',
            left: 20 - 120 + k * 50,
            top: 20 - 30 + k * 18,
            width: ART_W + 240 - k * 100,
            height: 460,
            borderRadius: '50%',
            border: `${3 - k}px solid ${PALETTE.slate}`,
            opacity: 0.55 - k * 0.12,
          }}
        />
      ))}
      {/* meridian ribs */}
      {[-0.55, -0.25, 0.25, 0.55].map((m, k) => (
        <div
          key={`m${k}`}
          style={{
            position: 'absolute',
            left: 20 + 240 + m * 260,
            top: 0,
            width: 2,
            height: 260,
            backgroundColor: PALETTE.slate,
            opacity: 0.4,
            transformOrigin: '50% 0%',
            transform: `rotate(${(-m * 30).toFixed(1)}deg)`,
          }}
        />
      ))}
      {/* back wall + wainscot under the dome */}
      <div style={{position: 'absolute', left: 0, right: 0, top: 20 + 150, bottom: 0, background: `linear-gradient(180deg, ${PALETTE.tealDark} 0%, ${PALETTE.navy} 100%)`, borderTop: `3px solid ${PALETTE.tealMid}`}}>
        {Array.from({length: 14}, (_, i) => (
          <div key={i} style={{position: 'absolute', left: i * 40, top: 8, width: 30, height: 22, border: `1px solid ${PALETTE.tealMid}`, opacity: 0.45}} />
        ))}
      </div>
    </div>
  );
};

// Very simplified Indonesia archipelago (art-px rect clusters), centred around 0,0
const ISLANDS: Array<[number, number, number, number]> = [
  // Sumatra (diagonal)
  [-62, -12, 8, 5], [-56, -8, 9, 5], [-50, -4, 9, 5], [-44, 0, 9, 5], [-38, 4, 8, 4],
  // Java + Nusa Tenggara
  [-30, 12, 22, 3], [-6, 13, 8, 2], [4, 14, 5, 2], [11, 14, 5, 2], [18, 15, 4, 2],
  // Kalimantan
  [-22, -14, 20, 14], [-18, -18, 12, 4],
  // Sulawesi
  [8, -14, 4, 12], [10, -16, 10, 3], [10, -6, 9, 3], [12, -2, 3, 6],
  // Maluku
  [28, -10, 3, 4], [30, -2, 3, 3],
  // Papua
  [38, -8, 26, 9], [40, -11, 8, 3],
];

/** Mid plane: rotating Indonesia hologram projected above a pedestal. */
export const IndonesiaHologram: React.FC<{x?: number; y?: number; glow?: number}> = ({x = 240, y = 108, glow = 1}) => {
  const frame = useCurrentFrame();
  const yaw = Math.sin(frame / 120) * 28;
  const scan = (frame * 0.8) % 40;
  return (
    <div style={{position: 'absolute', left: x - 80, top: y - 40, width: 160, height: 110, pointerEvents: 'none'}}>
      {/* projector beam */}
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 40,
          width: 80,
          height: 66,
          clipPath: 'polygon(0% 0%, 100% 0%, 58% 100%, 42% 100%)',
          background: `linear-gradient(0deg, ${PALETTE.cyan}88 0%, ${PALETTE.teal}22 100%)`,
          opacity: 0.55 * glow,
          mixBlendMode: 'screen',
        }}
      />
      {/* map plane with 3D yaw / pitch */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 160, height: 80, perspective: 160}}>
        <div
          style={{
            position: 'absolute',
            left: 80,
            top: 40,
            width: 0,
            height: 0,
            transformStyle: 'preserve-3d',
            transform: `rotateX(28deg) rotateY(${yaw.toFixed(2)}deg)`,
          }}
        >
          {/* grid disk */}
          <div style={{position: 'absolute', left: -70, top: -34, width: 140, height: 68, borderRadius: '50%', border: `1px solid ${PALETTE.teal}`, opacity: 0.5 * glow, background: `repeating-linear-gradient(90deg, ${PALETTE.teal}22 0px, ${PALETTE.teal}22 1px, transparent 1px, transparent 8px)`}} />
          {ISLANDS.map(([ix, iy, w, h], i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: ix,
                top: iy,
                width: w,
                height: h,
                backgroundColor: PALETTE.cyan,
                boxShadow: `0 0 4px ${PALETTE.teal}`,
                opacity: (0.75 + 0.25 * Math.sin(frame * 0.1 + i)) * glow,
              }}
            />
          ))}
          {/* scanline sweep */}
          <div style={{position: 'absolute', left: -70, top: -34 + scan * 1.7, width: 140, height: 2, backgroundColor: PALETTE.cream, opacity: 0.35 * glow}} />
        </div>
      </div>
      {/* pedestal */}
      <div style={{position: 'absolute', left: 64, top: 104, width: 32, height: 6, backgroundColor: PALETTE.slate, border: `1px solid ${PALETTE.ink}`}} />
      <div style={{position: 'absolute', left: 70, top: 100, width: 20, height: 4, backgroundColor: PALETTE.cyan, opacity: 0.9 * glow}} />
    </div>
  );
};

/** Data console with a flickering teal screen (mid / subject plane). */
export const DataConsole: React.FC<{x: number; y: number; flip?: boolean; seed?: string; accent?: string}> = ({x, y, flip, seed = 'dc', accent = PALETTE.teal}) => {
  const frame = useCurrentFrame();
  const bars = Array.from({length: 6}, (_, i) => 3 + Math.round((0.5 + 0.5 * Math.sin(frame * 0.07 + i * 1.3 + (seed.length % 5))) * 9));
  return (
    <div style={{position: 'absolute', left: x, top: y - 40, width: 44, height: 40, transform: flip ? 'scaleX(-1)' : undefined}}>
      <div style={{position: 'absolute', left: 2, top: 0, width: 40, height: 24, backgroundColor: PALETTE.ink, border: `2px solid ${PALETTE.slate}`}}>
        <div style={{position: 'absolute', inset: 2, backgroundColor: PALETTE.navy}}>
          {bars.map((h, i) => (
            <div key={i} style={{position: 'absolute', left: 3 + i * 5, bottom: 2, width: 3, height: h, backgroundColor: i % 3 === 2 ? PALETTE.amber : accent}} />
          ))}
        </div>
      </div>
      <div style={{position: 'absolute', left: 0, top: 24, width: 44, height: 16, backgroundColor: PALETTE.slate, border: `2px solid ${PALETTE.ink}`}}>
        {[0, 1, 2, 3].map((k) => (
          <div key={k} style={{position: 'absolute', left: 5 + k * 9, top: 4, width: 4, height: 3, backgroundColor: (Math.floor(frame / 12) + k) % 3 === 0 ? PALETTE.gold : PALETTE.tealDark}} />
        ))}
      </div>
    </div>
  );
};

/** Library doorway on the right edge — warm light spills in (motivates the final pan). */
export const LibraryDoorway: React.FC<{x?: number; y?: number; open?: number}> = ({x = 438, y = 204, open = 0.4}) => (
  <div style={{position: 'absolute', left: x, top: y - 78, width: 40, height: 78}}>
    <div style={{position: 'absolute', inset: 0, backgroundColor: PALETTE.ink, border: `3px solid ${PALETTE.woodDark}`}} />
    <div style={{position: 'absolute', left: 3, top: 3, right: 3, bottom: 0, background: `linear-gradient(180deg, ${PALETTE.goldPale} 0%, ${PALETTE.gold} 60%, ${PALETTE.amber} 100%)`, opacity: 0.35 + 0.65 * open}}>
      {[10, 26, 42, 58].map((sy) => (
        <div key={sy} style={{position: 'absolute', left: 2, right: 2, top: sy, height: 3, backgroundColor: PALETTE.woodMid, opacity: 0.8}} />
      ))}
    </div>
    <div style={{position: 'absolute', left: -6, top: -10, width: 52, height: 9, backgroundColor: PALETTE.ink, color: PALETTE.goldPale, fontSize: 5, fontFamily: 'monospace', textAlign: 'center', lineHeight: '9px'}}>PERPUSTAKAAN</div>
  </div>
);

/** Low railing along the observation deck (mid plane). */
export const DeckRailing: React.FC<{y?: number}> = ({y = 172}) => (
  <div style={{position: 'absolute', left: -20, top: y, width: ART_W + 40, height: 34, pointerEvents: 'none'}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 3, backgroundColor: PALETTE.gold, borderBottom: `1px solid ${PALETTE.ink}`}} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 14, height: 2, backgroundColor: PALETTE.slate}} />
    {Array.from({length: 26}, (_, i) => (
      <div key={i} style={{position: 'absolute', left: i * 20, top: 3, width: 2, height: 31, backgroundColor: PALETTE.slate}} />
    ))}
  </div>
);

/** Foreground: near brass railing posts + big telescope silhouette (blurred by the shell). */
export const S06Foreground: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: -40, top: 236, width: ART_W + 80, height: 6, backgroundColor: PALETTE.gold, opacity: 0.9}} />
    {[-10, 120, 360, 470].map((px) => (
      <div key={px} style={{position: 'absolute', left: px, top: 236, width: 8, height: 60, backgroundColor: PALETTE.woodDark}} />
    ))}
    {/* telescope tube poking in from the left */}
    <div style={{position: 'absolute', left: -70, top: 150, width: 120, height: 22, backgroundColor: PALETTE.plumDeep, border: `2px solid ${PALETTE.ink}`, transformOrigin: '0 50%', transform: 'rotate(-28deg)'}} />
    <div style={{position: 'absolute', left: -20, top: 190, width: 10, height: 90, backgroundColor: PALETTE.woodDark, transform: 'rotate(12deg)'}} />
  </>
);

