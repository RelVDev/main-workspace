import React from 'react';
import {PALETTE} from '../data/palette';
import {FONT_TITLE} from '../lib/fonts';
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
      }}
    >
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <span
          style={{
            backgroundColor: PALETTE.teal,
            color: PALETTE.ink,
            fontFamily: FONT_TITLE,
            fontSize: 14,
            padding: '6px 12px',
            border: `3px solid ${PALETTE.ink}`,
          }}
        >
          {badge}
        </span>
        {label ? (
          <span style={{fontFamily: FONT_TITLE, fontSize: 13, color: PALETTE.cream}}>
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
        <RealFootage id={footageId} variant="natural" />
      </div>
    </div>
  );
};
