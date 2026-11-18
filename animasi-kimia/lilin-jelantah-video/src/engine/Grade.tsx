import React from 'react';

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
    overlay: 'linear-gradient(180deg, rgba(255,178,90,0.22) 0%, rgba(42,21,48,0.34) 100%)',
    blend: 'soft-light',
    opacity: 0.75,
  },
  kitchen: {
    overlay: 'linear-gradient(165deg, rgba(255,217,125,0.22) 0%, rgba(196,106,44,0.18) 100%)',
    blend: 'soft-light',
    opacity: 0.7,
  },
  river: {
    overlay: 'linear-gradient(180deg, rgba(30,77,92,0.45) 0%, rgba(21,50,67,0.52) 100%)',
    blend: 'multiply',
    opacity: 0.55,
  },
  lab: {
    overlay: 'linear-gradient(180deg, rgba(159,243,238,0.14) 0%, rgba(255,243,220,0.12) 100%)',
    blend: 'soft-light',
    opacity: 0.65,
  },
  workshop: {
    overlay: 'linear-gradient(180deg, rgba(240,138,60,0.2) 0%, rgba(90,52,24,0.25) 100%)',
    blend: 'soft-light',
    opacity: 0.7,
  },
  cinema: {
    overlay: 'linear-gradient(180deg, rgba(27,16,32,0.32) 0%, rgba(42,21,48,0.45) 100%)',
    blend: 'multiply',
    opacity: 0.5,
  },
  showroom: {
    overlay: 'radial-gradient(circle at 50% 35%, rgba(255,178,90,0.24) 0%, rgba(42,21,48,0.38) 100%)',
    blend: 'soft-light',
    opacity: 0.78,
  },
  observatory: {
    overlay: 'linear-gradient(180deg, rgba(21,50,67,0.35) 0%, rgba(79,209,197,0.14) 100%)',
    blend: 'soft-light',
    opacity: 0.8,
  },
  library: {
    overlay: 'linear-gradient(180deg, rgba(255,217,125,0.24) 0%, rgba(122,74,34,0.25) 100%)',
    blend: 'soft-light',
    opacity: 0.72,
  },
  office: {
    overlay: 'linear-gradient(180deg, rgba(255,243,220,0.16) 0%, rgba(240,138,60,0.18) 100%)',
    blend: 'soft-light',
    opacity: 0.65,
  },
  rooftop: {
    overlay: 'linear-gradient(180deg, rgba(240,138,60,0.28) 0%, rgba(42,21,48,0.42) 100%)',
    blend: 'soft-light',
    opacity: 0.75,
  },
  night: {
    overlay: 'linear-gradient(180deg, rgba(21,50,67,0.48) 0%, rgba(27,16,32,0.55) 100%)',
    blend: 'multiply',
    opacity: 0.6,
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
