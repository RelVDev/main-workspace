import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {PALETTE} from '../data/palette';
import {FONT_BODY} from '../lib/fonts';
import {NamePlate} from './NamePlate';

export interface DialogueBoxProps {
  speakerName: string;
  speakerColor: string;
  text: string;
  startFrame: number;
  endFrame: number;
  bottomOffset?: number;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  speakerName,
  speakerColor,
  text,
  startFrame,
  endFrame,
  bottomOffset = 48,
}) => {
  const frame = useCurrentFrame();
  if (frame < startFrame || frame > endFrame) return null;

  const total = Math.max(1, endFrame - startFrame);
  const progress = interpolate(frame - startFrame, [0, Math.max(8, total * 0.78)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const charCount = Math.max(1, Math.ceil(text.length * progress));
  const shown = text.slice(0, charCount);
  const cursorVisible = frame % 16 < 8 && charCount >= text.length;

  const boxOpacity = interpolate(frame, [startFrame, startFrame + 4, endFrame - 4, endFrame], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 160,
        right: 160,
        bottom: bottomOffset,
        opacity: boxOpacity,
        pointerEvents: 'none',
      }}
    >
      <div style={{marginBottom: -8, marginLeft: 18, position: 'relative', zIndex: 2}}>
        <NamePlate name={speakerName} color={speakerColor} />
      </div>
      <div
        style={{
          backgroundColor: 'rgba(27, 16, 32, 0.90)',
          border: `6px solid ${PALETTE.cream}`,
          outline: `4px solid ${PALETTE.ink}`,
          boxShadow: `0 12px 0 rgba(16,10,20,0.65)`,
          padding: '26px 34px 24px 34px',
          minHeight: 112,
        }}
      >
        <p
          style={{
            margin: 0,
            color: PALETTE.cream,
            fontFamily: FONT_BODY,
            fontSize: 34,
            fontWeight: 500,
            lineHeight: 1.32,
            letterSpacing: 0.4,
            textShadow: `2px 2px 0 ${PALETTE.ink}`,
          }}
        >
          {shown}
          {cursorVisible ? (
            <span style={{color: speakerColor, marginLeft: 8}}>▼</span>
          ) : null}
        </p>
      </div>
    </div>
  );
};
