import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {PALETTE} from '../data/palette';
import {FONT_BODY} from '../lib/fonts';
import {RealFootage} from './RealFootage';

export const EvidenceFrame: React.FC<{
  footageId: string;
  label?: string;
  width?: number;
  height?: number;
  badge?: 'PENGAMATAN KELOMPOK' | 'DOKUMENTASI PRODUK';
}> = ({
  footageId,
  label,
  width = 760,
  height = 440,
  badge = 'PENGAMATAN KELOMPOK',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const op = interpolate(frame, [0, Math.round(fps * 0.45)], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const scale = interpolate(frame, [0, Math.round(fps * 0.5)], [0.96, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        width,
        backgroundColor: PALETTE.plumDeep,
        border: `6px solid ${PALETTE.teal}`,
        outline: `4px solid ${PALETTE.ink}`,
        boxShadow: `10px 10px 0 ${PALETTE.ink}`,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        opacity: op,
        transform: `scale(${scale.toFixed(3)})`,
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12}}>
        <span
          style={{
            backgroundColor: PALETTE.teal,
            color: PALETTE.ink,
            fontFamily: FONT_BODY,
            fontSize: 19,
            fontWeight: 700,
            letterSpacing: 0.6,
            padding: '4px 12px',
            border: `3px solid ${PALETTE.ink}`,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {badge}
        </span>
        {label ? (
          <span
            style={{
              fontFamily: FONT_BODY,
              fontSize: 20,
              fontWeight: 700,
              color: PALETTE.cream,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {label}
          </span>
        ) : null}
      </div>
      <div
        style={{
          width: '100%',
          height,
          backgroundColor: PALETTE.void,
          border: `4px solid ${PALETTE.ink}`,
          overflow: 'hidden',
        }}
      >
        <RealFootage id={footageId} variant="natural" loop fit="cover" />
      </div>
    </div>
  );
};
