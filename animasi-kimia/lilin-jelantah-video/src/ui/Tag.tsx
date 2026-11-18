import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {PALETTE} from '../data/palette';
import {FONT_TITLE} from '../lib/fonts';

export type TagKind = 'FISIKA' | 'KIMIA' | 'DATA_PUSTAKA' | 'PENGAMATAN' | 'OPSIONAL';

const TAG_CFG: Record<TagKind, {bg: string; fg: string; label: string}> = {
  FISIKA: {bg: PALETTE.teal, fg: PALETTE.ink, label: 'PERUBAHAN FISIKA'},
  KIMIA: {bg: PALETTE.amber, fg: PALETTE.ink, label: 'PERUBAHAN KIMIA'},
  DATA_PUSTAKA: {bg: PALETTE.gold, fg: PALETTE.ink, label: 'DATA PUSTAKA'},
  PENGAMATAN: {bg: PALETTE.teal, fg: PALETTE.ink, label: 'PENGAMATAN KELOMPOK'},
  OPSIONAL: {bg: PALETTE.plumMid, fg: PALETTE.cream, label: 'OPSIONAL'},
};

export const Tag: React.FC<{
  kind: TagKind;
  label?: string;
  startFrame?: number;
  x?: number;
  y?: number;
  style?: React.CSSProperties;
}> = ({kind, label, startFrame = 0, x, y, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - startFrame;
  if (local < 0) return null;

  const cfg = TAG_CFG[kind];
  const scale = interpolate(local, [0, Math.round(0.22 * fps)], [0.4, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.6)),
  });
  const shakeX = local < 8 ? (local % 2 === 0 ? -3 : 3) : 0;

  return (
    <div
      style={{
        position: x !== undefined || y !== undefined ? 'absolute' : 'relative',
        left: x,
        top: y,
        display: 'inline-block',
        backgroundColor: cfg.bg,
        color: cfg.fg,
        fontFamily: FONT_TITLE,
        fontSize: 20,
        padding: '12px 20px',
        border: `4px solid ${PALETTE.ink}`,
        boxShadow: `6px 6px 0 ${PALETTE.ink}`,
        transform: `translateX(${shakeX}px) scale(${scale.toFixed(3)})`,
        transformOrigin: 'center center',
        letterSpacing: 1,
        ...style,
      }}
    >
      {label ?? cfg.label}
    </div>
  );
};
