import React from 'react';
import {Video} from '@remotion/media';
import {staticFile, useVideoConfig} from 'remotion';
import footageJson from '../data/footage.json';
import {FootageSlot} from './FootageSlot';

export interface FootageAnnotation {
  t0: number;
  t1: number;
  x: number;
  y: number;
  text: string;
  arrow?: 'left' | 'right' | 'up' | 'down';
}

export interface FootageRecord {
  id: string;
  title: string;
  scene: string;
  file: string;
  pix: string;
  present: boolean;
  durationSec: number;
  fps: number;
  hasAudio: boolean;
  use: {
    from: number;
    to: number;
    audio: 'mute' | 'duck' | 'full';
    playbackRate?: number;
  };
  annotations: FootageAnnotation[];
}

export const FOOTAGE_MAP = footageJson as Record<string, FootageRecord>;

export const RealFootage: React.FC<{
  id: string;
  variant?: 'natural' | 'pixel';
  compactPlaceholder?: boolean;
  loop?: boolean;
  fit?: 'contain' | 'cover';
  style?: React.CSSProperties;
}> = ({id, variant = 'natural', compactPlaceholder = false, loop, fit, style}) => {
  const {fps} = useVideoConfig();
  const entry = FOOTAGE_MAP[id];

  if (!entry || !entry.present) {
    return <FootageSlot id={id} durationSec={entry?.durationSec ?? 10} compact={compactPlaceholder} />;
  }

  const srcFile = variant === 'pixel' && entry.pix ? entry.pix : entry.file;
  const playbackRate = entry.use.playbackRate ?? 1;
  const trimBefore = Math.round(entry.use.from * fps);
  const trimAfter = Math.round(entry.use.to * fps);
  const volume = entry.use.audio === 'full' ? 1 : entry.use.audio === 'duck' ? 0.25 : 0;
  // Auto-loop silent documentation B-roll (F01..F08) so longer beat windows never fade out to black
  const shouldLoop = loop ?? (id !== 'F00' && id !== 'F09');
  const objectFit = fit ?? (id === 'F00' || id === 'F09' ? 'contain' : 'cover');

  return (
    <Video
      src={staticFile(srcFile)}
      trimBefore={trimBefore}
      trimAfter={trimAfter}
      playbackRate={playbackRate}
      loop={shouldLoop}
      muted={entry.use.audio === 'mute'}
      volume={volume}
      objectFit={objectFit}
      style={{
        width: '100%',
        height: '100%',
        ...style,
      }}
    />
  );
};
