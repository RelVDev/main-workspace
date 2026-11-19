import React, {useLayoutEffect, useRef} from 'react';
import {random} from 'remotion';
import {PALETTE} from '../data/palette';
import {ART_W} from '../lib/pixel';

/**
 * HD-2D floor: a real 3D plane (CSS perspective) wearing a crisp pixel texture.
 * Its vanishing point follows the camera so pans produce true perspective parallax,
 * while every texel stays a sharp square pixel.
 */
export type FloorPattern = 'planks' | 'tiles' | 'stage' | 'roof' | 'carpet' | 'lab';

export interface FloorColors {
  a: string;
  b: string;
  c?: string;
  line: string;
}

const PRESET_COLORS: Record<FloorPattern, FloorColors> = {
  planks: {a: PALETTE.woodMid, b: PALETTE.woodDark, c: PALETTE.woodLight, line: PALETTE.ink},
  stage: {a: PALETTE.plumMid, b: PALETTE.plumDeep, c: PALETTE.magentaDark, line: PALETTE.ink},
  tiles: {a: PALETTE.silver, b: PALETTE.steel, c: PALETTE.white, line: PALETTE.slate},
  lab: {a: PALETTE.tealDark, b: PALETTE.navy, c: PALETTE.tealMid, line: PALETTE.ink},
  roof: {a: PALETTE.slate, b: PALETTE.slate, c: PALETTE.plumMid, line: PALETTE.ink},
  carpet: {a: PALETTE.burgundy, b: PALETTE.magentaDark, c: PALETTE.maroon, line: PALETTE.ink},
};

const textureCache = new Map<string, HTMLCanvasElement>();

const makeTexture = (pattern: FloorPattern, col: FloorColors, seed: string): HTMLCanvasElement | null => {
  const key = `${pattern}|${col.a}|${col.b}|${col.c}|${col.line}|${seed}`;
  const hit = textureCache.get(key);
  if (hit) return hit;
  const W = 64;
  const H = 32;
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d');
  if (!g) return null;
  const px = (x: number, y: number, c: string, w = 1, h = 1) => {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
  };
  const tone = [col.a, col.b, col.c ?? col.a];

  if (pattern === 'planks' || pattern === 'stage') {
    // 4 rows of planks, staggered joints, grain lines and knots
    const rowH = 8;
    for (let r = 0; r < H / rowH; r++) {
      const off = (r % 2) * 22 + Math.floor(random(`${seed}-o${r}`) * 8);
      for (let x = 0; x < W; x++) {
        const seg = Math.floor((x + off) / 32);
        const t = tone[Math.floor(random(`${seed}-t${r}-${seg}`) * 3)];
        for (let y = 0; y < rowH; y++) px(x, r * rowH + y, t);
      }
      // grain
      for (let k = 0; k < 6; k++) {
        const gx = Math.floor(random(`${seed}-gx${r}-${k}`) * W);
        const gy = r * rowH + 2 + Math.floor(random(`${seed}-gy${r}-${k}`) * 4);
        px(gx, gy, col.b, 5 + Math.floor(random(`${seed}-gl${r}-${k}`) * 8), 1);
      }
      // seam + joint
      px(0, r * rowH + rowH - 1, col.line, W, 1);
      const jx = (32 - (off % 32) + W) % W;
      px(jx, r * rowH, col.line, 1, rowH);
      px((jx + 32) % W, r * rowH, col.line, 1, rowH);
      // highlight edge
      px(0, r * rowH, col.c ?? col.a, W, 1);
    }
  } else if (pattern === 'tiles' || pattern === 'lab') {
    const s = 16;
    for (let ty = 0; ty < H / s; ty++)
      for (let tx = 0; tx < W / s; tx++) {
        const c = (tx + ty) % 2 === 0 ? col.a : col.b;
        px(tx * s, ty * s, c, s, s);
        px(tx * s + 1, ty * s + 1, col.c ?? c, s - 3, 1); // bevel highlight
        px(tx * s, ty * s, col.line, s, 1);
        px(tx * s, ty * s, col.line, 1, s);
      }
  } else if (pattern === 'roof') {
    const s = 16;
    for (let ty = 0; ty < H / 8; ty++)
      for (let tx = 0; tx < W / s; tx++) {
        const off = (ty % 2) * 8;
        const c = tone[Math.floor(random(`${seed}-r${tx}-${ty}`) * 3)];
        px(((tx * s + off) % W), ty * 8, c, s, 8);
        px(((tx * s + off) % W), ty * 8, col.line, 1, 8);
        px(0, ty * 8 + 7, col.line, W, 1);
      }
  } else {
    // carpet: diamonds
    px(0, 0, col.a, W, H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const d = Math.abs((x % 16) - 8) + Math.abs((y % 16) - 8);
        if (d === 6) px(x, y, col.c ?? col.b);
        else if (d < 3) px(x, y, col.b);
      }
  }
  textureCache.set(key, cv);
  return cv;
};

export const PerspectiveFloor: React.FC<{
  /** Horizon line (where floor meets the back wall) in art-space. */
  y: number;
  pattern?: FloorPattern;
  colors?: Partial<FloorColors>;
  /** Camera x (art-space) so the vanishing point tracks the lens. */
  camX?: number;
  /** Texture tile size in art px (bigger = closer feel). */
  tile?: number;
  /** Tilt of the plane in degrees (higher = flatter, more top-down). */
  tilt?: number;
  seed?: string;
  /** Darken toward the horizon (distance falloff). */
  depthFade?: number;
  fadeColor?: string;
  /** Glossy reflection band (0..1). */
  gloss?: number;
  glossColor?: string;
}> = ({
  y,
  pattern = 'planks',
  colors,
  camX = 240,
  tile = 32,
  tilt = 72,
  seed = 'floor',
  depthFade = 0.55,
  fadeColor = PALETTE.void,
  gloss = 0,
  glossColor = PALETTE.goldPale,
}) => {
  const col = {...PRESET_COLORS[pattern], ...colors};
  const depthH = 600;
  const planeW = 1400;
  // Texture is painted synchronously onto the plane canvas (no async image load → no flicker)
  const planeRef = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = planeRef.current;
    const g = cv?.getContext('2d');
    const tex = makeTexture(pattern, col as FloorColors, seed);
    if (!cv || !g || !tex) return;
    g.imageSmoothingEnabled = false;
    const pat = g.createPattern(tex, 'repeat');
    if (!pat) return;
    pat.setTransform(new DOMMatrix().scale(tile / 32, tile / 32));
    g.clearRect(0, 0, planeW, depthH);
    g.fillStyle = pat;
    g.fillRect(0, 0, planeW, depthH);
  }, [pattern, col.a, col.b, col.c, col.line, seed, tile]); // eslint-disable-line react-hooks/exhaustive-deps
  const visibleH = 270 - y + 40;
  return (
    <div
      style={{
        position: 'absolute',
        left: -40,
        top: y,
        width: ART_W + 80,
        height: visibleH,
        overflow: 'hidden',
        perspective: 120,
        perspectiveOrigin: `${(camX + 40).toFixed(1)}px -40px`,
        pointerEvents: 'none',
      }}
    >
      <canvas
        ref={planeRef}
        width={planeW}
        height={depthH}
        style={{
          position: 'absolute',
          left: (ART_W + 80) / 2 - planeW / 2,
          top: 0,
          width: planeW,
          height: depthH,
          transformOrigin: '50% 0%',
          transform: `rotateX(${tilt}deg)`,
          imageRendering: 'pixelated',
        }}
      />
      {/* contact line with the wall + distance falloff */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(180deg, ${fadeColor} 0px, ${fadeColor}00 2px, ${fadeColor}${Math.round(depthFade * 200)
            .toString(16)
            .padStart(2, '0')} 3px, ${fadeColor}00 ${Math.round(visibleH * 0.75)}px)`,
        }}
      />
      {gloss > 0 ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            mixBlendMode: 'screen',
            background: `linear-gradient(180deg, ${glossColor}00 0%, ${glossColor}${Math.round(gloss * 90)
              .toString(16)
              .padStart(2, '0')} 18%, ${glossColor}00 55%)`,
          }}
        />
      ) : null}
    </div>
  );
};
