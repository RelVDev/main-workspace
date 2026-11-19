import React from 'react';
import {noise2D} from '@remotion/noise';
import {Easing} from 'remotion';
import {ART_H, ART_W} from '../lib/pixel';

/**
 * Camera v2.
 *
 * A single virtual lens (x, y, zoom) is rendered through several DEPTH layers: far layers move
 * and scale less, the foreground layer more. That gives real multiplane parallax for pans,
 * dollies and zooms (the "HD-2D" diorama feeling) instead of a flat 2D scale.
 */
export interface CamState {
  x: number;
  y: number;
  zoom: number;
}

/** Minimum overscan so drift / handheld / intro moves never reveal the world edge. */
export const BASE_OVERSCAN = 1.06;

export type IntroMove = 'crane' | 'pull' | 'push' | 'truckL' | 'truckR' | 'rise' | 'none';
export type OutroMove = 'push' | 'left' | 'right' | 'up' | 'down' | 'pull' | 'none';

const easeOutExpo = Easing.out(Easing.exp);
const easeInCubic = Easing.in(Easing.cubic);
const easeInOutSine = Easing.inOut(Easing.sin);

/** Offsets applied on top of the scene's own camera for motivated scene entrances. */
export const introOffset = (move: IntroMove, t: number, dur = 2.6): CamState => {
  if (move === 'none' || t >= dur) return {x: 0, y: 0, zoom: 1};
  const u = Math.max(0, Math.min(1, t / dur));
  const k = 1 - easeOutExpo(u); // 1 → 0
  switch (move) {
    case 'crane':
      return {x: 0, y: -26 * k, zoom: 1 + 0.1 * k};
    case 'rise':
      return {x: 0, y: 24 * k, zoom: 1 + 0.08 * k};
    case 'pull':
      return {x: 0, y: -6 * k, zoom: 1 + 0.45 * k};
    case 'push':
      // starts wide-ish (as wide as overscan allows) and lands — feels like a dolly in
      return {x: 0, y: 4 * k, zoom: 1 - 0.05 * k};
    case 'truckL':
      return {x: -46 * k, y: 0, zoom: 1 + 0.08 * k};
    case 'truckR':
      return {x: 46 * k, y: 0, zoom: 1 + 0.08 * k};
  }
  return {x: 0, y: 0, zoom: 1};
};

/** Offsets for the last ~1s so every exit moves INTO the transition. */
export const outroOffset = (move: OutroMove, tToEnd: number, dur = 1.1): CamState => {
  if (move === 'none' || tToEnd >= dur) return {x: 0, y: 0, zoom: 1};
  const u = 1 - Math.max(0, Math.min(1, tToEnd / dur)); // 0 → 1
  const k = easeInCubic(u);
  switch (move) {
    case 'push':
      return {x: 0, y: 0, zoom: 1 + 0.32 * k};
    case 'pull':
      return {x: 0, y: -4 * k, zoom: 1 - 0.04 * k};
    case 'left':
      return {x: -40 * k, y: 0, zoom: 1 + 0.06 * k};
    case 'right':
      return {x: 40 * k, y: 0, zoom: 1 + 0.06 * k};
    case 'up':
      return {x: 0, y: -34 * k, zoom: 1 + 0.06 * k};
    case 'down':
      return {x: 0, y: 30 * k, zoom: 1 + 0.06 * k};
  }
  return {x: 0, y: 0, zoom: 1};
};

/** Slow organic "operator" drift: a camera that breathes, never a locked-off tripod. */
export const handheldOffset = (frame: number, amount: number, seed = 'hh'): CamState => {
  if (amount <= 0) return {x: 0, y: 0, zoom: 1};
  const s = frame * 0.011;
  return {
    x: (noise2D(`${seed}-x`, s, 0) * 1.6 + noise2D(`${seed}-x2`, s * 3.1, 2) * 0.35) * amount,
    y: (noise2D(`${seed}-y`, 0, s) * 1.1 + noise2D(`${seed}-y2`, 4, s * 2.7) * 0.25) * amount,
    zoom: 1 + noise2D(`${seed}-z`, s * 0.7, 7) * 0.006 * amount,
  };
};

/** Impact shake (fast, decaying). */
export const shakeOffset = (frame: number, amount: number): CamState => {
  if (amount <= 0) return {x: 0, y: 0, zoom: 1};
  return {
    x: noise2D('cam-sx', frame * 0.55, 0) * amount * 2.2,
    y: noise2D('cam-sy', 0, frame * 0.55) * amount * 1.8,
    zoom: 1,
  };
};

export const composeCam = (base: CamState, ...offs: CamState[]): CamState =>
  offs.reduce((acc, o) => ({x: acc.x + o.x, y: acc.y + o.y, zoom: acc.zoom * o.zoom}), base);

/** Clamp the lens so the visible window stays inside the world (+ a small bleed). */
export const clampCam = (c: CamState, bleed = 0): CamState => {
  const halfW = ART_W / 2 / c.zoom;
  const halfH = ART_H / 2 / c.zoom;
  const minX = halfW - bleed;
  const maxX = ART_W - halfW + bleed;
  const minY = halfH - bleed;
  const maxY = ART_H - halfH + bleed;
  return {
    zoom: c.zoom,
    x: minX > maxX ? ART_W / 2 : Math.max(minX, Math.min(maxX, c.x)),
    y: minY > maxY ? ART_H / 2 : Math.max(minY, Math.min(maxY, c.y)),
  };
};

const layerParams = (cam: CamState, depth: number, bleed = 1) => {
  const z = (1 + (cam.zoom - 1) * depth) * bleed;
  const cx = ART_W / 2 + (cam.x - ART_W / 2) * depth;
  const cy = ART_H / 2 + (cam.y - ART_H / 2) * depth;
  return {z, tx: ART_W / 2 - cx * z, ty: ART_H / 2 - cy * z};
};

/** Transform for a layer at `depth` (1 = subject plane, <1 farther, >1 nearer). */
export const layerTransform = (cam: CamState, depth: number, bleed = 1): string => {
  const {z, tx, ty} = layerParams(cam, depth, bleed);
  return `translate3d(${tx.toFixed(3)}px, ${ty.toFixed(3)}px, 0) scale(${z.toFixed(5)})`;
};

/**
 * Transform for a depth plane nested INSIDE the subject-plane camera div. Nesting keeps every
 * plane in one compositing group so multiply/screen light layers blend across all depths.
 */
export const nestedLayerTransform = (cam: CamState, depth: number, bleed = 1): string => {
  const a = layerParams(cam, 1, 1);
  const b = layerParams(cam, depth, bleed);
  const s = b.z / a.z;
  const tx = (b.tx - a.tx) / a.z;
  const ty = (b.ty - a.ty) / a.z;
  return `translate3d(${tx.toFixed(3)}px, ${ty.toFixed(3)}px, 0) scale(${s.toFixed(5)})`;
};

/** A depth plane placed inside a <CameraLayer depth={1}>. */
export const DepthPlane: React.FC<{cam: CamState; depth: number; blur?: number; bleed?: number; children: React.ReactNode}> = ({
  cam,
  depth,
  blur = 0,
  bleed = 1,
  children,
}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: ART_W,
      height: ART_H,
      transformOrigin: '0 0',
      transform: nestedLayerTransform(cam, depth, bleed),
      filter: blur > 0.08 ? `blur(${blur.toFixed(2)}px)` : undefined,
    }}
  >
    {children}
  </div>
);

export const CameraLayer: React.FC<{
  cam: CamState;
  depth?: number;
  blur?: number;
  bleed?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({cam, depth = 1, blur = 0, bleed = 1, style, children}) => (
  <div
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      width: ART_W,
      height: ART_H,
      transformOrigin: '0 0',
      transform: layerTransform(cam, depth, bleed),
      filter: blur > 0.08 ? `blur(${blur.toFixed(2)}px)` : undefined,
      imageRendering: 'pixelated',
      ...style,
    }}
  >
    {children}
  </div>
);

/** Back-compat single-plane camera (used by a few legacy call sites). */
export const Camera: React.FC<{x?: number; y?: number; zoom?: number; shake?: number; children: React.ReactNode}> = ({
  x = ART_W / 2,
  y = ART_H / 2,
  zoom = 1,
  children,
}) => <CameraLayer cam={{x, y, zoom}}>{children}</CameraLayer>;

export {easeInOutSine};
