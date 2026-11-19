import React from 'react';
import {PALETTE} from '../data/palette';
import {FONT_TITLE} from '../lib/fonts';
import {getAccentTextColor} from '../characters/registry';

export const NamePlate: React.FC<{
  name: string;
  color: string;
  sublabel?: string;
  size?: 'sm' | 'md';
}> = ({name, color, sublabel, size = 'md'}) => {
  const textColor = getAccentTextColor(color);
  const fontSize = size === 'sm' ? 16 : 22;
  const padX = size === 'sm' ? 14 : 20;
  const padY = size === 'sm' ? 8 : 10;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
        backgroundColor: color,
        color: textColor,
        fontFamily: FONT_TITLE,
        fontSize,
        lineHeight: 1.2,
        padding: `${padY}px ${padX}px`,
        border: `4px solid ${PALETTE.ink}`,
        boxShadow: `4px 4px 0 ${PALETTE.ink}, inset 0 -4px 0 rgba(16,10,20,0.22), inset 0 4px 0 rgba(255,255,255,0.32)`,
        letterSpacing: 1,
      }}
    >
      <span>{name}</span>
      {sublabel ? (
        <span style={{fontSize: fontSize * 0.65, opacity: 0.85}}>{sublabel}</span>
      ) : null}
    </div>
  );
};
