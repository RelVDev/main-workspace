import React from 'react';

/**
 * Cinematic colour grade v2 — numeric presets so two looks can be blended over time
 * (kitchen → river → kitchen, dusk → night …).
 *
 * Stack (screen-space, after the world is lit):
 *  1. `filter` on the world wrapper   → contrast / saturation / brightness (see gradeFilter)
 *  2. split-tone  (soft-light)        → cool/warm shadows vs highlights
 *  3. shadow lift (lighten)           → filmic milky-black lifted into a tinted floor
 *  4. highlight wash (screen)         → warm/cool sheen on the top end
 *  5. halation   (radial, screen)     → light glow around the key area
 */
export type GradePreset =
  | 'stage'
  | 'kitchen'
  | 'river'
  | 'lab'
  | 'workshop'
  | 'cinema'
  | 'showroom'
  | 'observatory'
  | 'library'
  | 'office'
  | 'rooftop'
  | 'night';

type RGB = [number, number, number];

export interface GradeSpec {
  contrast: number;
  saturate: number;
  brightness: number;
  shadowTint: RGB; // soft-light colour used in the lower part / shadows
  highTint: RGB; // soft-light colour used in the upper part / highlights
  splitAmt: number; // 0..1 opacity of split-tone layer
  lift: RGB; // lighten floor (lifted blacks)
  wash: RGB; // screen sheen colour
  washAmt: number;
  halo: RGB; // halation colour
  haloAmt: number;
  haloX: number; // 0..100 %
  haloY: number;
}

const hex = (h: string): RGB => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const GRADES: Record<GradePreset, GradeSpec> = {
  stage: {
    contrast: 1.12, saturate: 1.12, brightness: 1.0,
    shadowTint: hex('#3A1B5C'), highTint: hex('#FFB25A'), splitAmt: 0.55,
    lift: hex('#1E0F26'), wash: hex('#FF9A4A'), washAmt: 0.05,
    halo: hex('#FFB25A'), haloAmt: 0.16, haloX: 50, haloY: 42,
  },
  kitchen: {
    contrast: 1.08, saturate: 1.1, brightness: 1.03,
    shadowTint: hex('#3B2A55'), highTint: hex('#FFD38A'), splitAmt: 0.5,
    lift: hex('#21141C'), wash: hex('#FFCF8A'), washAmt: 0.06,
    halo: hex('#FFD97D'), haloAmt: 0.14, haloX: 30, haloY: 25,
  },
  river: {
    contrast: 1.1, saturate: 0.78, brightness: 0.96,
    shadowTint: hex('#0B2A3E'), highTint: hex('#7FD6C8'), splitAmt: 0.62,
    lift: hex('#0A1C26'), wash: hex('#4FD1C5'), washAmt: 0.04,
    halo: hex('#9FF3EE'), haloAmt: 0.1, haloX: 50, haloY: 0,
  },
  lab: {
    contrast: 1.08, saturate: 1.05, brightness: 1.02,
    shadowTint: hex('#103446'), highTint: hex('#FFF0D0'), splitAmt: 0.5,
    lift: hex('#0E1A24'), wash: hex('#9FF3EE'), washAmt: 0.05,
    halo: hex('#CFFAF5'), haloAmt: 0.1, haloX: 55, haloY: 30,
  },
  workshop: {
    contrast: 1.1, saturate: 1.1, brightness: 1.02,
    shadowTint: hex('#2C1C44'), highTint: hex('#FFB25A'), splitAmt: 0.55,
    lift: hex('#1C1018'), wash: hex('#FFB25A'), washAmt: 0.05,
    halo: hex('#FFB25A'), haloAmt: 0.14, haloX: 50, haloY: 30,
  },
  cinema: {
    contrast: 1.16, saturate: 1.02, brightness: 0.94,
    shadowTint: hex('#1A1640'), highTint: hex('#7FE3D8'), splitAmt: 0.6,
    lift: hex('#120C1C'), wash: hex('#4FD1C5'), washAmt: 0.04,
    halo: hex('#9FF3EE'), haloAmt: 0.12, haloX: 50, haloY: 36,
  },
  showroom: {
    contrast: 1.14, saturate: 1.12, brightness: 1.0,
    shadowTint: hex('#3A1440'), highTint: hex('#FFD38A'), splitAmt: 0.58,
    lift: hex('#1C0D1E'), wash: hex('#FFD97D'), washAmt: 0.05,
    halo: hex('#FFD97D'), haloAmt: 0.18, haloX: 50, haloY: 40,
  },
  observatory: {
    contrast: 1.14, saturate: 1.06, brightness: 0.98,
    shadowTint: hex('#0A2040'), highTint: hex('#FFB25A'), splitAmt: 0.55,
    lift: hex('#0A1220'), wash: hex('#4FD1C5'), washAmt: 0.05,
    halo: hex('#4FD1C5'), haloAmt: 0.12, haloX: 50, haloY: 30,
  },
  library: {
    contrast: 1.1, saturate: 1.06, brightness: 1.0,
    shadowTint: hex('#2E1A3A'), highTint: hex('#FFD97D'), splitAmt: 0.55,
    lift: hex('#1C1210'), wash: hex('#FFD97D'), washAmt: 0.06,
    halo: hex('#FFD97D'), haloAmt: 0.16, haloX: 50, haloY: 22,
  },
  office: {
    contrast: 1.08, saturate: 1.08, brightness: 1.02,
    shadowTint: hex('#33204A'), highTint: hex('#FFE2B0'), splitAmt: 0.5,
    lift: hex('#1E1416'), wash: hex('#FFD9A0'), washAmt: 0.06,
    halo: hex('#FFD97D'), haloAmt: 0.14, haloX: 50, haloY: 25,
  },
  rooftop: {
    contrast: 1.12, saturate: 1.16, brightness: 1.0,
    shadowTint: hex('#3A1850'), highTint: hex('#FF9A50'), splitAmt: 0.62,
    lift: hex('#1E0F24'), wash: hex('#FF8A4A'), washAmt: 0.07,
    halo: hex('#FFB25A'), haloAmt: 0.18, haloX: 70, haloY: 45,
  },
  night: {
    contrast: 1.16, saturate: 0.98, brightness: 0.92,
    shadowTint: hex('#0C1A44'), highTint: hex('#FFB25A'), splitAmt: 0.66,
    lift: hex('#0A0C1C'), wash: hex('#3A5AA0'), washAmt: 0.05,
    halo: hex('#FFB25A'), haloAmt: 0.16, haloX: 50, haloY: 55,
  },
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpRgb = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const rgba = (c: RGB, a: number) =>
  `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a.toFixed(3)})`;

export const mixGrades = (a: GradeSpec, b: GradeSpec, t: number): GradeSpec => {
  const u = Math.max(0, Math.min(1, t));
  return {
    contrast: lerp(a.contrast, b.contrast, u),
    saturate: lerp(a.saturate, b.saturate, u),
    brightness: lerp(a.brightness, b.brightness, u),
    shadowTint: lerpRgb(a.shadowTint, b.shadowTint, u),
    highTint: lerpRgb(a.highTint, b.highTint, u),
    splitAmt: lerp(a.splitAmt, b.splitAmt, u),
    lift: lerpRgb(a.lift, b.lift, u),
    wash: lerpRgb(a.wash, b.wash, u),
    washAmt: lerp(a.washAmt, b.washAmt, u),
    halo: lerpRgb(a.halo, b.halo, u),
    haloAmt: lerp(a.haloAmt, b.haloAmt, u),
    haloX: lerp(a.haloX, b.haloX, u),
    haloY: lerp(a.haloY, b.haloY, u),
  };
};

export const resolveGrade = (preset: GradePreset, mixTo?: GradePreset, mix = 0): GradeSpec =>
  mixTo && mix > 0 ? mixGrades(GRADES[preset], GRADES[mixTo], mix) : GRADES[preset];

/** CSS filter string applied to the lit world before the overlay layers. */
export const gradeFilter = (g: GradeSpec): string =>
  `contrast(${g.contrast.toFixed(3)}) saturate(${g.saturate.toFixed(3)}) brightness(${g.brightness.toFixed(3)})`;

const fill: React.CSSProperties = {position: 'absolute', inset: 0, pointerEvents: 'none'};

export const Grade: React.FC<{spec: GradeSpec}> = ({spec: g}) => {
  return (
    <>
      {/* Split-tone: cool shadows at the bottom/edges, warm key up top */}
      <div
        style={{
          ...fill,
          mixBlendMode: 'soft-light',
          opacity: g.splitAmt,
          background: `linear-gradient(180deg, ${rgba(g.highTint, 0.9)} 0%, ${rgba(g.highTint, 0.35)} 38%, ${rgba(g.shadowTint, 0.55)} 70%, ${rgba(g.shadowTint, 0.95)} 100%)`,
        }}
      />
      {/* Lifted blacks: nothing goes pure black, shadows sit in a tinted floor */}
      <div style={{...fill, mixBlendMode: 'lighten', background: rgba(g.lift, 1)}} />
      {/* Highlight sheen */}
      <div style={{...fill, mixBlendMode: 'screen', background: rgba(g.wash, g.washAmt)}} />
      {/* Halation around the key area */}
      <div
        style={{
          ...fill,
          mixBlendMode: 'screen',
          background: `radial-gradient(ellipse 60% 55% at ${g.haloX.toFixed(1)}% ${g.haloY.toFixed(1)}%, ${rgba(g.halo, g.haloAmt)} 0%, ${rgba(g.halo, g.haloAmt * 0.35)} 45%, transparent 100%)`,
        }}
      />
    </>
  );
};
