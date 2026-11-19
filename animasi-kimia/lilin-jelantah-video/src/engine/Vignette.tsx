import React from 'react';

/** Filmic vignette: soft oval falloff + darker corners + subtle plum floor tint. */
export const Vignette: React.FC<{strength?: number}> = ({strength = 0.36}) => {
  const s = strength;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(ellipse 75% 70% at 50% 46%, transparent 55%, rgba(27,16,32,${(s * 0.55).toFixed(2)}) 80%, rgba(16,10,20,${(s * 1.05).toFixed(2)}) 100%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `linear-gradient(180deg, rgba(16,10,20,${(s * 0.35).toFixed(2)}) 0%, transparent 18%, transparent 78%, rgba(42,21,48,${(s * 0.5).toFixed(2)}) 100%)`,
        }}
      />
    </>
  );
};
