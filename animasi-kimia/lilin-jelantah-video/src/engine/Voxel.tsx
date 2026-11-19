import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {PALETTE} from '../data/palette';

/**
 * 3D PIXEL renderer — "sprite stacking" voxels rasterised at true art resolution on a canvas,
 * then upscaled with nearest-neighbour. Rotating models keep perfectly square pixels, so they
 * sit naturally next to the 2D puppet sprites (HD-2D look).
 */

type RGB = [number, number, number];
const toRgb = (h: string): RGB => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const shade = (c: RGB, k: number) =>
  `rgb(${Math.max(0, Math.min(255, Math.round(c[0] * k)))},${Math.max(0, Math.min(255, Math.round(c[1] * k)))},${Math.max(0, Math.min(255, Math.round(c[2] * k)))})`;

export interface Voxel {
  x: number;
  y: number;
  z: number;
  c: string;
  /** Emissive voxels ignore shading (flame, screen). */
  e?: boolean;
}

/** Build a voxel list from a per-cell colour function over a bounding box. */
export const buildVoxels = (
  sx: number,
  sy: number,
  sz: number,
  fn: (x: number, y: number, z: number) => string | null | {c: string; e?: boolean},
): Voxel[] => {
  const out: Voxel[] = [];
  for (let z = 0; z < sz; z++)
    for (let y = 0; y < sy; y++)
      for (let x = 0; x < sx; x++) {
        const v = fn(x, y, z);
        if (!v) continue;
        if (typeof v === 'string') out.push({x: x - sx / 2 + 0.5, y: y - sy / 2 + 0.5, z, c: v});
        else out.push({x: x - sx / 2 + 0.5, y: y - sy / 2 + 0.5, z, c: v.c, e: v.e});
      }
  return out;
};

export const VoxelModel: React.FC<{
  voxels: Voxel[];
  /** World anchor (bottom-centre) in art-space. */
  x: number;
  y: number;
  /** Yaw in radians. */
  angle: number;
  /** Vertical squash of the top-down view (0.3..0.7). */
  tilt?: number;
  /** Art pixels per voxel (integer). */
  unit?: number;
  /** Canvas box size in art px. */
  box?: number;
  /** Light direction (yaw radians) for side shading. */
  lightYaw?: number;
  outline?: string | null;
  z?: number;
  style?: React.CSSProperties;
}> = ({voxels, x, y, angle, tilt = 0.5, unit = 1, box = 64, lightYaw = -0.8, outline = PALETTE.ink, z = 10, style}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const maxZ = useMemo(() => voxels.reduce((m, v) => Math.max(m, v.z), 0), [voxels]);
  const H = box + Math.ceil(maxZ * unit);
  const W = box;

  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext('2d');
    if (!g) return;
    g.clearRect(0, 0, W, H);
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const cx = W / 2;
    const baseY = H - box / 2;
    const proj = voxels.map((v) => {
      const rx = v.x * ca - v.y * sa;
      const ry = v.x * sa + v.y * ca;
      // facing factor: how much this voxel faces the light (side shading)
      const facing = Math.cos(Math.atan2(ry, rx) - lightYaw);
      return {
        sx: Math.round(cx + rx * unit - unit / 2),
        sy: Math.round(baseY + ry * unit * tilt - v.z * unit - unit / 2),
        depth: v.z * 1000 + ry,
        v,
        facing,
        ry,
      };
    });
    proj.sort((a, b) => a.depth - b.depth);
    // outline pass: draw every voxel 1px bigger in ink, then the colour pass on top
    if (outline) {
      g.fillStyle = outline;
      for (const p of proj) g.fillRect(p.sx - 1, p.sy - 1, unit + 2, unit + 2);
    }
    for (const p of proj) {
      const c = toRgb(p.v.c);
      if (p.v.e) {
        g.fillStyle = p.v.c;
      } else {
        // top faces brighter, front (+ry) mid, back darker, plus side light
        const k = 0.78 + 0.22 * p.facing + (p.ry > 0 ? 0.06 : -0.04);
        g.fillStyle = shade(c, k);
      }
      g.fillRect(p.sx, p.sy, unit, unit);
    }
  }, [angle, H, W, box, lightYaw, outline, tilt, unit, voxels]);

  return (
    <canvas
      ref={ref}
      width={W}
      height={H}
      style={{
        position: 'absolute',
        left: Math.round(x - W / 2),
        top: Math.round(y - (H - box / 2)),
        width: W,
        height: H,
        imageRendering: 'pixelated',
        zIndex: z,
        pointerEvents: 'none',
        ...style,
      }}
    />
  );
};

// ───────────────────────── Model library ─────────────────────────

/** Aromatic candle in a glass jar (wax level 0..1, wax colour configurable). */
export const candleJarModel = (wax: string = PALETTE.cream, label: string = PALETTE.amber, waxLevel = 0.8): Voxel[] => {
  const R = 7;
  const Hh = 16;
  const fillTo = Math.round(2 + (Hh - 3) * waxLevel);
  return buildVoxels(17, 17, Hh + 4, (x, y, z) => {
    const dx = x - 8;
    const dy = y - 8;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (z < Hh) {
      if (d > R + 0.5) return null;
      const rim = d > R - 0.8;
      if (z === 0) return PALETTE.steel;
      if (rim) {
        if (z >= 5 && z <= 8) return label; // label band
        return z === Hh - 1 ? PALETTE.white : PALETTE.silver; // glass wall
      }
      if (z <= fillTo) return z === fillTo ? PALETTE.white : wax;
      return null;
    }
    // wick
    if (dx === 0 && dy === 0 && z < Hh + 2 && z > fillTo) return PALETTE.ink;
    return null;
  });
};

export const oilDrumModel = (body: string = PALETTE.amberDeep, band: string = PALETTE.ink): Voxel[] =>
  buildVoxels(15, 15, 20, (x, y, z) => {
    const d = Math.hypot(x - 7, y - 7);
    if (d > 6.6) return null;
    if (d < 5.6 && z < 19) return null; // hollow
    if (z === 19) return d < 1.5 ? PALETTE.slate : PALETTE.steel;
    if (z === 3 || z === 10 || z === 16) return band;
    return body;
  }).concat(
    buildVoxels(15, 15, 20, (x, y, z) => (z === 19 && Math.hypot(x - 7, y - 7) <= 6.6 ? PALETTE.steel : null)),
  );

export const podiumModel = (top: string = PALETTE.gold, body: string = PALETTE.woodMid): Voxel[] =>
  buildVoxels(20, 20, 10, (x, y, z) => {
    const edge = x === 0 || y === 0 || x === 19 || y === 19;
    if (z === 9) return edge ? PALETTE.goldPale : top;
    if (z === 0) return PALETTE.woodDark;
    return edge && (x + y + z) % 5 === 0 ? PALETTE.woodLight : body;
  });

/** Oil bottle (fresh = gold, used = dark amber). */
export const bottleModel = (oil: string = PALETTE.gold): Voxel[] =>
  buildVoxels(9, 9, 22, (x, y, z) => {
    const d = Math.hypot(x - 4, y - 4);
    if (z < 15) return d <= 4 ? (d > 3.3 ? PALETTE.silver : z < 13 ? oil : PALETTE.white) : null;
    if (z < 19) return d <= 1.6 ? PALETTE.silver : null;
    if (z < 21) return d <= 1.8 ? PALETTE.red : null;
    return null;
  });

// ───────────────────────── Molecule (ball & stick) ─────────────────────────

export interface Atom {
  x: number;
  y: number;
  z: number;
  el: 'C' | 'O' | 'H';
}

const EL: Record<Atom['el'], {r: number; c: string}> = {
  C: {r: 3, c: PALETTE.slate},
  O: {r: 3, c: PALETTE.red},
  H: {r: 2, c: PALETTE.white},
};

/** Simplified triglyceride skeleton: glycerol backbone + 3 ester-linked zig-zag fatty chains. */
export const triglycerideAtoms = (chainLen = 7, snap: [number, number, number] = [1, 1, 1]): {atoms: Atom[]; bonds: [number, number][]} => {
  const atoms: Atom[] = [];
  const bonds: [number, number][] = [];
  const add = (a: Atom) => atoms.push(a) - 1;
  const back = [-10, 0, 10].map((y) => add({x: -16, y, z: 0, el: 'C'}));
  bonds.push([back[0], back[1]], [back[1], back[2]]);
  back.forEach((c, i) => {
    const s = snap[i];
    const off = (1 - s) * 30; // chain slides in from the right while snapping
    const o = add({x: -9 + off, y: (i - 1) * 10, z: 0, el: 'O'});
    bonds.push([c, o]);
    const carb = add({x: -2 + off, y: (i - 1) * 10, z: 3, el: 'C'});
    const dbl = add({x: -2 + off, y: (i - 1) * 10, z: 9, el: 'O'});
    bonds.push([o, carb], [carb, dbl]);
    let prev = carb;
    for (let k = 1; k <= chainLen; k++) {
      const a = add({x: -2 + off + k * 6, y: (i - 1) * 10, z: k % 2 === 0 ? 3 : -2, el: 'C'});
      bonds.push([prev, a]);
      prev = a;
    }
  });
  return {atoms, bonds};
};

export const PixelMolecule3D: React.FC<{
  atoms: Atom[];
  bonds: [number, number][];
  x: number;
  y: number;
  yaw: number;
  pitch?: number;
  w?: number;
  h?: number;
  /** extra "heat" jiggle amplitude in art px */
  jiggle?: number;
  frame?: number;
  z?: number;
  alpha?: number[];
}> = ({atoms, bonds, x, y, yaw, pitch = 0.35, w = 120, h = 70, jiggle = 0, frame = 0, z = 15, alpha}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    const g = cv?.getContext('2d');
    if (!cv || !g) return;
    g.clearRect(0, 0, w, h);
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const P = atoms.map((a, i) => {
      const jx = jiggle ? Math.sin(frame * 0.9 + i * 2.1) * jiggle : 0;
      const jy = jiggle ? Math.cos(frame * 0.7 + i * 1.3) * jiggle : 0;
      const ax = a.x + jx;
      const ay = a.y + jy;
      const rx = ax * cy + a.z * sy;
      const rz = -ax * sy + a.z * cy;
      const ry = ay * cp - rz * sp;
      const rz2 = ay * sp + rz * cp;
      return {x: Math.round(w / 2 + rx), y: Math.round(h / 2 + ry), d: rz2, a, i};
    });
    // bonds (pixel lines)
    g.fillStyle = PALETTE.cream;
    for (const [a, b] of bonds) {
      const A = P[a];
      const B = P[b];
      const op = Math.min(alpha?.[a] ?? 1, alpha?.[b] ?? 1);
      if (op <= 0.05) continue;
      g.globalAlpha = op * 0.85;
      const n = Math.max(Math.abs(B.x - A.x), Math.abs(B.y - A.y));
      for (let k = 0; k <= n; k++) {
        const t = n === 0 ? 0 : k / n;
        g.fillRect(Math.round(A.x + (B.x - A.x) * t), Math.round(A.y + (B.y - A.y) * t), 1, 1);
      }
    }
    // atoms back-to-front, pixel discs with a 1px specular
    const order = [...P].sort((p, q) => q.d - p.d);
    for (const p of order) {
      const op = alpha?.[p.i] ?? 1;
      if (op <= 0.05) continue;
      g.globalAlpha = op;
      const e = EL[p.a.el];
      const base = toRgb(e.c);
      const near = 0.85 + Math.max(-0.25, Math.min(0.25, -p.d / 60));
      for (let dy = -e.r; dy <= e.r; dy++)
        for (let dx = -e.r; dx <= e.r; dx++) {
          const dd = dx * dx + dy * dy;
          if (dd > e.r * e.r + 1) continue;
          const edge = dd > (e.r - 1) * (e.r - 1) + 1;
          const lit = dx + dy < -1 ? 1.25 : dx + dy > 1 ? 0.7 : 1;
          g.fillStyle = edge ? PALETTE.ink : shade(base, lit * near);
          g.fillRect(p.x + dx, p.y + dy, 1, 1);
        }
      g.fillStyle = PALETTE.white;
      g.fillRect(p.x - 1, p.y - 1, 1, 1);
    }
    g.globalAlpha = 1;
  }, [atoms, bonds, w, h, yaw, pitch, jiggle, frame, alpha]);
  return (
    <canvas
      ref={ref}
      width={w}
      height={h}
      style={{position: 'absolute', left: Math.round(x - w / 2), top: Math.round(y - h / 2), width: w, height: h, imageRendering: 'pixelated', zIndex: z, pointerEvents: 'none'}}
    />
  );
};

/**
 * Extruded 3D pixel title (stacked hard text-shadows = voxel depth), with a lit top face.
 * Use in HUD space (1920x1080).
 */
export const extrudedText = (depth: number, side: string, edge: string, step = 4): string => {
  const parts: string[] = [];
  for (let i = 1; i <= depth; i++) parts.push(`${i * step * 0.5}px ${i * step}px 0 ${i === depth ? edge : side}`);
  parts.push(`${depth * step * 0.5 + 6}px ${depth * step + 10}px 0 rgba(16,10,20,0.55)`);
  return parts.join(', ');
};
