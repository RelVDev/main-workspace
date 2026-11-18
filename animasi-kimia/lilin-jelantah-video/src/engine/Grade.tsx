import React from 'react';

// Enhance Cinema Grade presets with rich dual-tone depth and gentle vignette harmony.
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

const GRADE_STYLE: Record<
  GradePreset,
  {overlay: string; blend: React.CSSProperties['mixBlendMode']; opacity: number}
> = {
  stage: {
    overlay:
      'radial-gradient(ellipse at 50% 40%, rgba(255,178,90,0.28) 0%, rgba(138,42,74,0.22) 55%, rgba(27,16,32,0.45) 100%)',
    blend: 'soft-light',
    opacity: 0.8,
  },
  kitchen: {
    overlay:
      'linear-gradient(155deg, rgba(255,217,125,0.28) 0%, rgba(240,138,60,0.16) 52%, rgba(90,52,24,0.28) 100%)',
    blend: 'soft-light',
    opacity: 0.78,
  },
  river: {
    overlay:
      'linear-gradient(180deg, rgba(21,50,67,0.42) 0%, rgba(30,77,92,0.48) 55%, rgba(16,10,20,0.6) 100%)',
    blend: 'multiply',
    opacity: 0.52,
  },
  lab: {
    overlay:
      'radial-gradient(ellipse at 55% 42%, rgba(159,243,238,0.18) 0%, rgba(79,209,197,0.12) 48%, rgba(21,50,67,0.34) 100%)',
    blend: 'soft-light',
    opacity: 0.75,
  },
  workshop: {
    overlay:
      'linear-gradient(170deg, rgba(255,178,90,0.24) 0%, rgba(240,138,60,0.16) 50%, rgba(90,52,24,0.3) 100%)',
    blend: 'soft-light',
    opacity: 0.76,
  },
  cinema: {
    overlay:
      'radial-gradient(ellipse at 52% 45%, rgba(79,209,197,0.14) 0%, rgba(42,21,48,0.36) 58%, rgba(16,10,20,0.56) 100%)',
    blend: 'multiply',
    opacity: 0.48,
  },
  showroom: {
    overlay:
      'radial-gradient(circle at 50% 38%, rgba(255,217,125,0.32) 0%, rgba(244,163,176,0.14) 45%, rgba(42,21,48,0.46) 100%)',
    blend: 'soft-light',
    opacity: 0.84,
  },
  observatory: {
    overlay:
      'radial-gradient(ellipse at 50% 35%, rgba(79,209,197,0.22) 0%, rgba(21,50,67,0.35) 55%, rgba(16,10,20,0.48) 100%)',
    blend: 'soft-light',
    opacity: 0.82,
  },
  library: {
    overlay:
      'radial-gradient(ellipse at 50% 45%, rgba(255,217,125,0.26) 0%, rgba(160,104,52,0.22) 55%, rgba(42,21,48,0.4) 100%)',
    blend: 'soft-light',
    opacity: 0.78,
  },
  office: {
    overlay:
      'linear-gradient(180deg, rgba(255,243,220,0.2) 0%, rgba(240,138,60,0.16) 60%, rgba(90,52,24,0.28) 100%)',
    blend: 'soft-light',
    opacity: 0.72,
  },
  rooftop: {
    overlay:
      'linear-gradient(180deg, rgba(240,138,60,0.3) 0%, rgba(138,42,74,0.24) 50%, rgba(42,21,48,0.45) 100%)',
    blend: 'soft-light',
    opacity: 0.78,
  },
  night: {
    overlay:
      'radial-gradient(ellipse at 50% 52%, rgba(255,178,90,0.16) 0%, rgba(21,50,67,0.46) 52%, rgba(16,10,20,0.62) 100%)',
    blend: 'multiply',
    opacity: 0.56,
  },
};

export const Grade: React.FC<{preset: GradePreset}> = ({preset}) => {
  const cfg = GRADE_STYLE[preset];
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: cfg.overlay,
        mixBlendMode: cfg.blend,
        opacity: cfg.opacity,
      }}
    />
  );
};
