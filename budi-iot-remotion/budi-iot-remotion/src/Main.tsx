import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {World} from './World';
import {Subtitles} from './Subtitles';
import {AudioLayer} from './AudioLayer';
import {makeTimeline} from './timeline';
import {VideoProps} from './types';
import {prog} from './util';

export const Main: React.FC<VideoProps> = ({scenes, narrationSec}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const total = durationInFrames / fps;
  // adegan terakhir menutup sampai akhir video (narasi + 1 detik)
  const T = React.useMemo(() => makeTimeline(scenes, total), [scenes, total]);
  const fade = prog(t, total - 0.8, total);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <World t={t} T={T} />
      <Subtitles scenes={scenes} t={t} />
      <AbsoluteFill style={{backgroundColor: '#0b1020', opacity: fade}} />
      <AudioLayer T={T} />
      <div style={{display: 'none'}}>{narrationSec}</div>
    </AbsoluteFill>
  );
};
