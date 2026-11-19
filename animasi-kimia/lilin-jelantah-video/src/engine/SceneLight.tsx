import React, {createContext, useContext} from 'react';
import {noise2D} from '@remotion/noise';
import {useCurrentFrame} from 'remotion';
import {PALETTE} from '../data/palette';

/**
 * Scene-wide key light description. SceneShell provides it; Character / props read it so
 * cast shadows, rim-light colour and contact shadows always agree with the set lighting.
 */
export interface SceneLightInfo {
  /** Key light position in art-space (world). */
  keyX: number;
  keyY: number;
  /** Rim / key colour (tints the 1px rim layer of every character). */
  rimColor: string;
  /** 0..1 strength of the rim tint. */
  rimStrength: number;
  /** 0..1 darkness of cast shadows. */
  shadowStrength: number;
  /** Cast shadow colour (multiplied). */
  shadowColor: string;
  /** id of the SVG filter that tints rim sprites (set by SceneShell). */
  rimFilterId?: string;
}

export const DEFAULT_LIGHT: SceneLightInfo = {
  keyX: 240,
  keyY: 20,
  rimColor: PALETTE.goldPale,
  rimStrength: 0.85,
  shadowStrength: 0.55,
  shadowColor: PALETTE.void,
};

const Ctx = createContext<SceneLightInfo>(DEFAULT_LIGHT);
export const SceneLightProvider: React.FC<{value: SceneLightInfo; children: React.ReactNode}> = ({value, children}) => (
  <Ctx.Provider value={value}>{children}</Ctx.Provider>
);
export const useSceneLight = () => useContext(Ctx);

/** A light inside the LightMap (art-space world coordinates). */
export interface MapLight {
  x: number;
  y: number;
  /** Radius in art px. */
  r: number;
  color?: string;
  /** 0..1.5 */
  intensity?: number;
  /** Seeded flicker (fire, CRT). */
  flicker?: boolean | number;
  seed?: string;
  /** Hard pixel-art bands instead of a smooth falloff (default true). */
  banded?: boolean;
  /** Horizontal stretch (ellipse) e.g. 1.6 for spill on a floor. */
  sx?: number;
}

const toRgb = (h: string) => {
  const n = parseInt(h.replace('#', '').slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};
const rgba = (h: string, a: number) => {
  const [r, g, b] = toRgb(h);
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
};

/**
 * LightMap — the heart of the v2 lighting. A full-world "darkness" layer is MULTIPLIED over the
 * lit scene: everything that is not reached by a light falls off into the tinted ambient colour,
 * and every light punches a (banded, pixel-art style) hole of its own colour into it.
 * This produces real contrast and pools of light instead of the old milky additive haze.
 */
export const LightMap: React.FC<{
  ambient: string;
  /** 0..1 how dark the ambient is (0 = no effect). */
  darkness?: number;
  lights: MapLight[];
  /** Overscan around the 480x270 world. */
  pad?: number;
}> = ({ambient, darkness = 0.6, lights, pad = 120}) => {
  const frame = useCurrentFrame();
  if (darkness <= 0.001) return null;

  const layers = lights.map((l, i) => {
    const amt = typeof l.flicker === 'number' ? l.flicker : l.flicker ? 0.14 : 0;
    const f = amt > 0 ? 1 + amt * noise2D(l.seed ?? `lm-${i}`, frame * 0.21, i) : 1;
    const inten = Math.max(0, (l.intensity ?? 1) * f);
    const col = l.color ?? '#FFF3DC';
    const r = l.r * (amt > 0 ? 1 + amt * 0.25 * noise2D(`${l.seed ?? i}-r`, frame * 0.17, 3) : 1);
    const rx = r * (l.sx ?? 1);
    const cx = l.x + pad;
    const cy = l.y + pad;
    const a = (k: number) => rgba(col, inten * k);
    const stops =
      (l.banded ?? l.r <= 64) === false
        ? `${a(1)} 0%, ${a(0.75)} 30%, ${a(0.35)} 62%, ${a(0)} 100%`
        : // 5 hard bands = pixel-art light falloff
          `${a(1)} 0%, ${a(1)} 22%, ${a(0.78)} 22%, ${a(0.78)} 40%, ${a(0.55)} 40%, ${a(0.55)} 58%, ${a(0.32)} 58%, ${a(0.32)} 76%, ${a(0.14)} 76%, ${a(0.14)} 92%, ${a(0)} 92%`;
    return `radial-gradient(${rx.toFixed(1)}px ${r.toFixed(1)}px at ${cx.toFixed(1)}px ${cy.toFixed(1)}px, ${stops})`;
  });

  // Ambient is a blend between white (no darkening) and the ambient tint.
  const [ar, ag, ab] = toRgb(ambient);
  const k = darkness;
  const amb = `rgb(${Math.round(255 + (ar - 255) * k)},${Math.round(255 + (ag - 255) * k)},${Math.round(255 + (ab - 255) * k)})`;

  return (
    <div
      style={{
        position: 'absolute',
        left: -pad,
        top: -pad,
        width: 480 + pad * 2,
        height: 270 + pad * 2,
        pointerEvents: 'none',
        mixBlendMode: 'multiply',
        backgroundColor: amb,
        backgroundImage: layers.join(', ') || undefined,
        backgroundBlendMode: layers.length ? 'screen' : undefined,
      }}
    />
  );
};
