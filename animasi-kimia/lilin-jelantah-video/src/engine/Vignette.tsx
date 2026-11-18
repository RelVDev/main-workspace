import React from 'react';

export const Vignette: React.FC<{strength?: number}> = ({strength = 0.36}) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 48%, transparent 48%, rgba(27,16,32,${(strength * 0.7).toFixed(2)}) 82%, rgba(16,10,20,${strength.toFixed(2)}) 100%)`,
      }}
    />
  );
};
