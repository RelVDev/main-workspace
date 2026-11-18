import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
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
  bottomOffset = 40,
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

  const boxOpacity = interpolate(frame, [startFrame, startFrame + 6, endFrame - 6, endFrame], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const slideY = interpolate(frame, [startFrame, startFrame + 8], [12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: 140,
        right: 140,
        bottom: bottomOffset,
        opacity: boxOpacity,
        transform: `translate3d(0, ${slideY.toFixed(2)}px, 0)`,
        pointerEvents: 'none',
      }}
    >
      <div style={{marginBottom: -8, marginLeft: 18, position: 'relative', zIndex: 2}}>
        <NamePlate name={speakerName} color={speakerColor} />
      </div>
      <div
        style={{
          backgroundColor: 'rgba(27, 16, 32, 0.93)',
          border: `5px solid ${PALETTE.cream}`,
          outline: `4px solid ${PALETTE.ink}`,
          boxShadow: `0 10px 0 rgba(16,10,20,0.68)`,
          padding: '22px 32px 20px 32px',
          minHeight: 98,
        }}
      >
        <p
          style={{
            margin: 0,
            color: PALETTE.cream,
            fontFamily: FONT_BODY,
            fontSize: 30,
            fontWeight: 600,
            lineHeight: 1.38,
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
