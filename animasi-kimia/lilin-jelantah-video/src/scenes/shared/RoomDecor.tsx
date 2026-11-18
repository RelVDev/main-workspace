import React from 'react';
import {PALETTE} from '../../data/palette';
import {ART_H, ART_W} from '../../lib/pixel';
import {useCurrentFrame} from 'remotion';

/** Warm/cool ceiling hanging industrial or studio lamp with glow shade & cone. */
export const HangingLamp: React.FC<{
  x: number;
  cordLen?: number;
  shadeColor?: string;
  bulbColor?: string;
  coneHeight?: number;
  coneWidth?: number;
  opacity?: number;
}> = ({
  x,
  cordLen = 22,
  shadeColor = PALETTE.slate,
  bulbColor = PALETTE.goldPale,
  coneHeight = 140,
  coneWidth = 110,
  opacity = 0.22,
}) => {
  const frame = useCurrentFrame();
  const sway = Math.sin(frame / 48 + x * 0.1) * 0.8;
  return (
    <div
      style={{
        position: 'absolute',
        left: Number((x + sway).toFixed(2)),
        top: 0,
        pointerEvents: 'none',
      }}
    >
      {/* Cord */}
      <div style={{position: 'absolute', left: -1, top: 0, width: 2, height: cordLen, backgroundColor: PALETTE.ink}} />
      {/* Volumetric cone below shade */}
      <div
        style={{
          position: 'absolute',
          left: -coneWidth / 2,
          top: cordLen + 5,
          width: coneWidth,
          height: coneHeight,
          clipPath: 'polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)',
          background: `linear-gradient(180deg, ${bulbColor}CC 0%, ${bulbColor}38 55%, transparent 100%)`,
          mixBlendMode: 'screen',
          opacity,
        }}
      />
      {/* Shade */}
      <div
        style={{
          position: 'absolute',
          left: -9,
          top: cordLen,
          width: 18,
          height: 7,
          backgroundColor: shadeColor,
          border: `1px solid ${PALETTE.ink}`,
          clipPath: 'polygon(22% 0%, 78% 0%, 100% 100%, 0% 100%)',
        }}
      />
      {/* Bulb */}
      <div
        style={{
          position: 'absolute',
          left: -3,
          top: cordLen + 6,
          width: 6,
          height: 3,
          backgroundColor: bulbColor,
          boxShadow: `0 0 8px ${bulbColor}`,
        }}
      />
    </div>
  );
};

/** Festoon fairy/bistro string lights draped softly across the ceiling/parapet. */
export const StringLights: React.FC<{
  y?: number;
  count?: number;
  sag?: number;
  colorA?: string;
  colorB?: string;
}> = ({y = 14, count = 16, sag = 10, colorA = PALETTE.goldPale, colorB = PALETTE.amber}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {Array.from({length: count}, (_, i) => {
        const u = (i + 0.5) / count;
        const bx = u * ART_W;
        const curve = Math.sin(u * Math.PI) * sag;
        const by = y + curve;
        const twinkle = 0.65 + 0.35 * Math.sin(frame * 0.12 + i * 1.4);
        const col = i % 2 === 0 ? colorA : colorB;
        return (
          <React.Fragment key={i}>
            <div
              style={{
                position: 'absolute',
                left: bx - 1.5,
                top: by,
                width: 3,
                height: 3,
                borderRadius: '50%',
                backgroundColor: col,
                opacity: twinkle,
                boxShadow: `0 0 6px ${col}`,
              }}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
};

/** Detailed wood wainscoting + subtle checkerboard wall panels. */
export const WallWainscot: React.FC<{
  yFloor?: number;
  wallTop?: string;
  wallBot?: string;
  wainscot?: string;
  trim?: string;
  gridAlpha?: number;
}> = ({
  yFloor = 200,
  wallTop = PALETTE.navy,
  wallBot = PALETTE.tealDark,
  wainscot = PALETTE.woodDark,
  trim = PALETTE.woodMid,
  gridAlpha = 0.09,
}) => (
  <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: yFloor,
        background: `linear-gradient(180deg, ${wallTop} 0%, ${wallBot} 100%)`,
      }}
    />
    {/* Subtle vertical/horizontal wall grid */}
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: yFloor - 44,
        backgroundImage: `linear-gradient(90deg, rgba(255,243,220,${gridAlpha}) 1px, transparent 1px), linear-gradient(0deg, rgba(255,243,220,${gridAlpha}) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    />
    {/* Wainscoting panel at lower wall */}
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: yFloor - 44,
        height: 44,
        backgroundColor: wainscot,
        borderTop: `2px solid ${trim}`,
      }}
    >
      {Array.from({length: 12}, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 12 + i * 39,
            top: 6,
            width: 30,
            height: 30,
            border: `1px solid ${PALETTE.ink}`,
            backgroundColor: 'rgba(16,10,20,0.16)',
          }}
        />
      ))}
    </div>
  </div>
);

/** Potted pixel greenery adding warmth to rooms. */
export const PottedPlant: React.FC<{x: number; y: number; h?: number}> = ({x, y, h = 24}) => (
  <div style={{position: 'absolute', left: Math.round(x - 8), top: Math.round(y - h), width: 16, height: h, pointerEvents: 'none'}}>
    {/* Foliage leaves */}
    <div style={{position: 'absolute', left: 3, top: 0, width: 10, height: h - 10, backgroundColor: PALETTE.greenDark, border: `1px solid ${PALETTE.ink}`}} />
    <div style={{position: 'absolute', left: 1, top: 3, width: 14, height: h - 14, backgroundColor: PALETTE.green, border: `1px solid ${PALETTE.ink}`}} />
    <div style={{position: 'absolute', left: 5, top: 2, width: 6, height: 6, backgroundColor: PALETTE.teal}} />
    {/* Terracotta pot */}
    <div style={{position: 'absolute', left: 3, bottom: 0, width: 10, height: 10, backgroundColor: PALETTE.amberDeep, border: `1px solid ${PALETTE.ink}`}} />
    <div style={{position: 'absolute', left: 2, bottom: 9, width: 12, height: 3, backgroundColor: PALETTE.amber, border: `1px solid ${PALETTE.ink}`}} />
  </div>
);

/** Lab Reagent Shelf stocked with glowing chemical flasks & amber jars. */
export const ReagentShelf: React.FC<{x: number; y: number; w?: number}> = ({x, y, w = 110}) => {
  const frame = useCurrentFrame();
  const bottles = [
    {dx: 8, bw: 9, bh: 16, col: PALETTE.teal, neck: true},
    {dx: 22, bw: 11, bh: 14, col: PALETTE.amber, neck: false},
    {dx: 38, bw: 8, bh: 18, col: PALETTE.cyan, neck: true},
    {dx: 52, bw: 12, bh: 15, col: PALETTE.gold, neck: false},
    {dx: 70, bw: 10, bh: 17, col: PALETTE.crimson, neck: true},
    {dx: 86, bw: 12, bh: 13, col: PALETTE.green, neck: false},
  ];
  return (
    <div style={{position: 'absolute', left: x, top: y, width: w, height: 26, pointerEvents: 'none'}}>
      {/* Wooden shelf */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: PALETTE.woodMid, border: `1px solid ${PALETTE.ink}`}} />
      {/* Shelf brackets */}
      <div style={{position: 'absolute', left: 8, bottom: -5, width: 3, height: 5, backgroundColor: PALETTE.woodDark}} />
      <div style={{position: 'absolute', right: 8, bottom: -5, width: 3, height: 5, backgroundColor: PALETTE.woodDark}} />
      {/* Bottles */}
      {bottles.map((b, idx) => {
        const shimmer = 0.72 + 0.25 * Math.sin(frame * 0.1 + idx * 1.3);
        return (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: b.dx,
              bottom: 4,
              width: b.bw,
              height: b.bh,
              backgroundColor: PALETTE.silver,
              border: `1px solid ${PALETTE.ink}`,
            }}
          >
            {/* Liquid inside */}
            <div
              style={{
                position: 'absolute',
                left: 1,
                right: 1,
                bottom: 1,
                height: Math.round(b.bh * 0.62),
                backgroundColor: b.col,
                opacity: shimmer,
              }}
            />
            {b.neck ? (
              <div
                style={{
                  position: 'absolute',
                  left: Math.floor(b.bw / 2) - 2,
                  top: -3,
                  width: 4,
                  height: 3,
                  backgroundColor: PALETTE.cream,
                  border: `1px solid ${PALETTE.ink}`,
                }}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

/** Detailed Chemistry Lab Backdrop + Workbench + Glassware props for S03. */
export const LabBackdrop: React.FC = () => (
  <div style={{position: 'absolute', width: ART_W, height: ART_H}}>
    <WallWainscot yFloor={200} wallTop={PALETTE.navy} wallBot={PALETTE.tealDark} wainscot={PALETTE.woodDark} trim={PALETTE.woodMid} />

    {/* Lab chalkboard with chalk markings */}
    <div
      style={{
        position: 'absolute',
        left: 162,
        top: 24,
        width: 226,
        height: 108,
        backgroundColor: PALETTE.greenDark,
        border: `5px solid ${PALETTE.woodMid}`,
        outline: `2px solid ${PALETTE.ink}`,
      }}
    >
      {/* Drawn schematic diagram lines in pale chalk */}
      <div style={{position: 'absolute', left: 16, top: 18, width: 58, height: 2, backgroundColor: 'rgba(255,243,220,0.45)'}} />
      <div style={{position: 'absolute', left: 16, top: 28, width: 42, height: 2, backgroundColor: 'rgba(159,243,238,0.45)'}} />
      <div style={{position: 'absolute', left: 138, top: 22, width: 64, height: 24, border: '1px dashed rgba(255,217,125,0.45)'}} />
      {/* Chalk ledge */}
      <div style={{position: 'absolute', left: 8, right: 8, bottom: 4, height: 3, backgroundColor: PALETTE.woodLight}} />
      <div style={{position: 'absolute', left: 26, bottom: 7, width: 10, height: 3, backgroundColor: PALETTE.cream}} />
      <div style={{position: 'absolute', left: 42, bottom: 7, width: 14, height: 4, backgroundColor: PALETTE.amber}} />
    </div>

    {/* Upper reagent shelves */}
    <ReagentShelf x={28} y={32} w={118} />
    <ReagentShelf x={28} y={76} w={118} />

    {/* Safety & Periodic chart poster on right wall */}
    <div
      style={{
        position: 'absolute',
        left: 396,
        top: 34,
        width: 56,
        height: 44,
        backgroundColor: PALETTE.cream,
        border: `2px solid ${PALETTE.ink}`,
        padding: 3,
      }}
    >
      <div style={{width: '100%', height: 6, backgroundColor: PALETTE.teal, marginBottom: 3}} />
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2}}>
        {[PALETTE.amber, PALETTE.teal, PALETTE.gold, PALETTE.blush, PALETTE.green, PALETTE.cyan, PALETTE.crimson, PALETTE.woodLight].map((c, i) => (
          <div key={i} style={{height: 8, backgroundColor: c, border: `1px solid ${PALETTE.ink}`}} />
        ))}
      </div>
    </div>
  </div>
);

/** Foreground animated lab bench gadgets (test tube rack, flasks, steam wisps). */
export const LabBenchExtras: React.FC<{heated?: boolean}> = ({heated = false}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {/* Cabinet doors under wooden lab bench (x:170..394, y:158..202) */}
      {[178, 224, 294, 340].map((dx) => (
        <div
          key={dx}
          style={{
            position: 'absolute',
            left: dx,
            top: 168,
            width: 38,
            height: 28,
            backgroundColor: PALETTE.woodDark,
            border: `1px solid ${PALETTE.ink}`,
          }}
        >
          <div style={{position: 'absolute', right: 4, top: 10, width: 2, height: 5, backgroundColor: PALETTE.gold}} />
        </div>
      ))}

      {/* Bubbling test tube rack at right edge of bench */}
      <div style={{position: 'absolute', left: 300, top: 136, width: 28, height: 22}}>
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: PALETTE.woodLight, border: `1px solid ${PALETTE.ink}`}} />
        <div style={{position: 'absolute', left: 2, bottom: 3, width: 2, height: 14, backgroundColor: PALETTE.woodDark}} />
        <div style={{position: 'absolute', right: 2, bottom: 3, width: 2, height: 14, backgroundColor: PALETTE.woodDark}} />
        {[6, 12, 18].map((tx, idx) => {
          const cols = [PALETTE.teal, PALETTE.amber, PALETTE.crimson];
          const bubbleOffset = ((frame * 0.4 + idx * 5) % 8);
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: tx,
                bottom: 3,
                width: 4,
                height: 17,
                backgroundColor: PALETTE.silver,
                border: `1px solid ${PALETTE.ink}`,
              }}
            >
              <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 10, backgroundColor: cols[idx]}} />
              <div
                style={{
                  position: 'absolute',
                  left: 1,
                  bottom: 2 + bubbleOffset,
                  width: 1.5,
                  height: 1.5,
                  backgroundColor: PALETTE.white,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Microscope prop on far-left corner of bench */}
      <div style={{position: 'absolute', left: 174, top: 134, width: 12, height: 24}}>
        <div style={{position: 'absolute', left: 1, bottom: 0, width: 10, height: 3, backgroundColor: PALETTE.slate, border: `1px solid ${PALETTE.ink}`}} />
        <div style={{position: 'absolute', left: 7, bottom: 3, width: 3, height: 14, backgroundColor: PALETTE.steel}} />
        <div style={{position: 'absolute', left: 2, top: 4, width: 5, height: 10, backgroundColor: PALETTE.silver, border: `1px solid ${PALETTE.ink}`, transform: 'rotate(-16deg)'}} />
      </div>

      {/* Animated steam wisps over melting pot (x=272) when heated */}
      {heated ? (
        <>
          {[0, 1, 2].map((w) => {
            const prog = ((frame * 0.025 + w * 0.33) % 1);
            const wy = 116 - prog * 24;
            const wx = 266 + w * 6 + Math.sin(prog * 8 + w) * 3;
            return (
              <div
                key={w}
                style={{
                  position: 'absolute',
                  left: wx,
                  top: wy,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: PALETTE.cream,
                  opacity: (1 - prog) * 0.55,
                }}
              />
            );
          })}
        </>
      ) : null}

      {/* Potted plant on lab corner floor */}
      <PottedPlant x={410} y={200} h={28} />
    </div>
  );
};

/** Detailed Kitchen wall + rack + utensils + window + cabinet for S02. */
export const KitchenBackdrop: React.FC = () => (
  <div style={{position: 'absolute', width: ART_W, height: ART_H}}>
    <WallWainscot yFloor={200} wallTop={PALETTE.woodDark} wallBot={PALETTE.plumMid} wainscot={PALETTE.woodMid} trim={PALETTE.woodLight} />

    {/* Tall sunlit kitchen window with frame crossbars */}
    <div
      style={{
        position: 'absolute',
        left: 42,
        top: 26,
        width: 102,
        height: 82,
        background: `linear-gradient(180deg, ${PALETTE.goldPale} 0%, ${PALETTE.amber} 100%)`,
        border: `4px solid ${PALETTE.woodLight}`,
        outline: `2px solid ${PALETTE.ink}`,
      }}
    >
      <div style={{position: 'absolute', left: '49%', top: 0, bottom: 0, width: 3, backgroundColor: PALETTE.woodLight}} />
      <div style={{position: 'absolute', top: '48%', left: 0, right: 0, height: 3, backgroundColor: PALETTE.woodLight}} />
    </div>

    {/* Upper wall cabinet + spice jars */}
    <div
      style={{
        position: 'absolute',
        left: 204,
        top: 22,
        width: 150,
        height: 42,
        backgroundColor: PALETTE.woodMid,
        border: `3px solid ${PALETTE.ink}`,
      }}
    >
      {[8, 56, 104].map((dx) => (
        <div
          key={dx}
          style={{
            position: 'absolute',
            left: dx,
            top: 6,
            width: 38,
            height: 28,
            backgroundColor: PALETTE.woodDark,
            border: `1px solid ${PALETTE.ink}`,
          }}
        />
      ))}
    </div>

    {/* Hanging ladle / spatula utensil rack */}
    <div style={{position: 'absolute', left: 220, top: 76, width: 112, height: 2, backgroundColor: PALETTE.silver}} />
    {[234, 260, 288, 314].map((ux, idx) => (
      <div
        key={ux}
        style={{
          position: 'absolute',
          left: ux,
          top: 78,
          width: idx === 2 ? 12 : 4,
          height: idx === 2 ? 18 : 22,
          borderRadius: idx === 2 ? '50%' : 0,
          backgroundColor: idx % 2 === 0 ? PALETTE.silver : PALETTE.woodLight,
          border: `1px solid ${PALETTE.ink}`,
        }}
      />
    ))}

    {/* Kitchen shelf on right */}
    <ReagentShelf x={370} y={54} w={86} />
  </div>
);

/** Rich aquatic cross-section with swaying seaweed & worried little fish under oil film (S02 River). */
export const RiverDioramaExtras: React.FC = () => {
  const frame = useCurrentFrame();
  const fishX1 = ((frame * 0.55) % 440);
  const fishX2 = 420 - ((frame * 0.4) % 400);
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {/* Sandy river bed */}
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 34, backgroundColor: PALETTE.woodDark, borderTop: `2px solid ${PALETTE.ink}`}} />
      {/* Swaying green algae/seaweed */}
      {[42, 96, 156, 224, 310, 384].map((sx, idx) => {
        const sway = Math.sin(frame / 18 + idx) * 2.5;
        return (
          <div
            key={sx}
            style={{
              position: 'absolute',
              left: sx,
              bottom: 34,
              width: 5,
              height: 28 + (idx % 3) * 10,
              backgroundColor: PALETTE.greenDark,
              border: `1px solid ${PALETTE.ink}`,
              transform: `skewX(${sway.toFixed(1)}deg)`,
              transformOrigin: 'bottom center',
            }}
          />
        );
      })}
      {/* Tiny pixel fish */}
      {[{x: fishX1, y: 158, flip: false}, {x: fishX2, y: 186, flip: true}].map((f, idx) => (
        <div
          key={idx}
          style={{
            position: 'absolute',
            left: f.x,
            top: f.y + Math.sin(frame / 10 + idx) * 2,
            width: 12,
            height: 6,
            backgroundColor: PALETTE.amber,
            border: `1px solid ${PALETTE.ink}`,
            transform: f.flip ? 'scaleX(-1)' : undefined,
          }}
        >
          <div style={{position: 'absolute', left: -4, top: 1, width: 4, height: 4, backgroundColor: PALETTE.gold}} />
          <div style={{position: 'absolute', right: 2, top: 1, width: 2, height: 2, backgroundColor: PALETTE.ink}} />
        </div>
      ))}
    </div>
  );
};

/** Cinema Screening Room Lounge decor for S04. */
export const CinemaLoungeDecor: React.FC = () => (
  <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
    <WallWainscot yFloor={202} wallTop={PALETTE.plumDeep} wallBot={PALETTE.magentaDark} wainscot={PALETTE.woodDark} trim={PALETTE.woodMid} gridAlpha={0.05} />
    {/* Cinema wall posters */}
    <div style={{position: 'absolute', left: 46, top: 44, width: 44, height: 60, backgroundColor: PALETTE.navy, border: `3px solid ${PALETTE.gold}`, padding: 4}}>
      <div style={{width: '100%', height: 28, backgroundColor: PALETTE.amber}} />
      <div style={{width: '80%', height: 4, backgroundColor: PALETTE.cream, marginTop: 6}} />
      <div style={{width: '60%', height: 3, backgroundColor: PALETTE.teal, marginTop: 4}} />
    </div>
    <div style={{position: 'absolute', right: 44, top: 48, width: 44, height: 56, backgroundColor: PALETTE.greenDark, border: `3px solid ${PALETTE.cream}`, padding: 4}}>
      <div style={{width: '100%', height: 22, backgroundColor: PALETTE.goldPale}} />
      <div style={{width: '90%', height: 4, backgroundColor: PALETTE.cream, marginTop: 6}} />
    </div>
    {/* Side shelves with VCR tapes & props */}
    <div style={{position: 'absolute', left: 32, top: 158, width: 46, height: 44, backgroundColor: PALETTE.woodMid, border: `2px solid ${PALETTE.ink}`}}>
      <div style={{position: 'absolute', left: 6, top: 6, width: 34, height: 6, backgroundColor: PALETTE.slate}} />
      <div style={{position: 'absolute', left: 6, top: 16, width: 28, height: 6, backgroundColor: PALETTE.crimson}} />
    </div>
    <PottedPlant x={442} y={202} h={28} />
  </div>
);

/** Observatory backdrop with arched starry night window & brass telescope for S06. */
export const ObservatoryDecor: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', width: ART_W, height: ART_H, pointerEvents: 'none'}}>
      <WallWainscot yFloor={204} wallTop={PALETTE.navy} wallBot={PALETTE.tealDark} wainscot={PALETTE.plumDeep} trim={PALETTE.tealMid} />
      {/* Center Arched Star Window */}
      <div
        style={{
          position: 'absolute',
          left: 165,
          top: 18,
          width: 150,
          height: 118,
          borderRadius: '75px 75px 0 0',
          background: `linear-gradient(180deg, ${PALETTE.void} 0%, ${PALETTE.navy} 100%)`,
          border: `4px solid ${PALETTE.gold}`,
          overflow: 'hidden',
        }}
      >
        {/* Crescent moon & twinkling stars */}
        <div style={{position: 'absolute', left: 32, top: 26, width: 14, height: 14, borderRadius: '50%', backgroundColor: PALETTE.goldPale}} />
        <div style={{position: 'absolute', left: 37, top: 24, width: 12, height: 12, borderRadius: '50%', backgroundColor: PALETTE.void}} />
        {[
          [78, 22], [112, 36], [56, 56], [96, 68], [128, 52], [24, 78],
        ].map(([sx, sy], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: sx,
              top: sy,
              width: 2,
              height: 2,
              backgroundColor: PALETTE.cream,
              opacity: 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.08 + i * 2)),
            }}
          />
        ))}
        {/* Window mullions */}
        <div style={{position: 'absolute', left: '49%', top: 0, bottom: 0, width: 2, backgroundColor: PALETTE.woodMid}} />
        <div style={{position: 'absolute', left: 0, right: 0, top: '55%', height: 2, backgroundColor: PALETTE.woodMid}} />
      </div>
      {/* Brass telescope silhouetted on left */}
      <div style={{position: 'absolute', left: 54, top: 156, width: 34, height: 48}}>
        <div style={{position: 'absolute', left: 6, top: 2, width: 26, height: 6, backgroundColor: PALETTE.gold, border: `1px solid ${PALETTE.ink}`, transform: 'rotate(-24deg)'}} />
        <div style={{position: 'absolute', left: 14, top: 10, width: 2, height: 38, backgroundColor: PALETTE.woodMid, transform: 'rotate(-15deg)'}} />
        <div style={{position: 'absolute', left: 20, top: 10, width: 2, height: 38, backgroundColor: PALETTE.woodMid, transform: 'rotate(15deg)'}} />
      </div>
      {/* Pixel Brass Banker Lamp on side pedestal */}
      <div style={{position: 'absolute', left: 406, top: 168, width: 24, height: 36}}>
        <div style={{position: 'absolute', left: 5, top: 0, width: 14, height: 8, backgroundColor: PALETTE.gold, border: `1px solid ${PALETTE.ink}`, clipPath: 'polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)'}} />
        <div style={{position: 'absolute', left: 10, top: 8, width: 3, height: 18, backgroundColor: PALETTE.amberDeep, border: `1px solid ${PALETTE.ink}`}} />
        <div style={{position: 'absolute', left: 4, top: 24, width: 16, height: 12, backgroundColor: PALETTE.woodMid, border: `1px solid ${PALETTE.ink}`}} />
      </div>
    </div>
  );
};

/** Library bookshelves filled with multicolored pixel spines + brass banker lamp for S07. */
export const LibraryDecor: React.FC = () => {
  const spineColors = [PALETTE.crimson, PALETTE.teal, PALETTE.gold, PALETTE.green, PALETTE.amber, PALETTE.plumMid, PALETTE.cream, PALETTE.navy];
  return (
    <div style={{position: 'absolute', width: ART_W, height: ART_H, pointerEvents: 'none'}}>
      <WallWainscot yFloor={202} wallTop={PALETTE.woodDark} wallBot={PALETTE.plumDeep} wainscot={PALETTE.woodMid} trim={PALETTE.gold} />
      {[36, 134, 264, 362].map((bx, sIdx) => (
        <div
          key={bx}
          style={{
            position: 'absolute',
            left: bx,
            top: 24,
            width: 84,
            height: 178,
            backgroundColor: PALETTE.woodMid,
            border: `3px solid ${PALETTE.ink}`,
          }}
        >
          {[34, 72, 110, 148].map((sy, rIdx) => (
            <div key={sy} style={{position: 'absolute', left: 4, right: 4, top: sy - 26, height: 29}}>
              {/* Row of books */}
              <div style={{display: 'flex', alignItems: 'flex-end', gap: 2, height: 26, paddingLeft: 2}}>
                {Array.from({length: 10}, (_, bi) => (
                  <div
                    key={bi}
                    style={{
                      width: 6,
                      height: 17 + ((bi + rIdx + sIdx) % 4) * 2,
                      backgroundColor: spineColors[(bi + rIdx * 3 + sIdx) % spineColors.length],
                      border: `1px solid ${PALETTE.ink}`,
                    }}
                  />
                ))}
              </div>
              {/* Shelf board */}
              <div style={{height: 3, backgroundColor: PALETTE.woodDark, borderTop: `1px solid ${PALETTE.ink}`}} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
