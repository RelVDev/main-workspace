import React from 'react';
import {Audio} from '@remotion/media';
import {interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {getSceneDubRangesFrames, getSceneStartFrame, sceneFrames, SCENES} from '../data/timeline';
import type {SceneId} from '../data/script';
import {bgmVolume} from './ducking';

const SceneBgmTrack: React.FC<{
  sceneId: SceneId;
  durationInFrames: number;
  fadeInFrames?: number;
  fadeOutFrames?: number;
  baseVol?: number;
  duckedVol?: number;
}> = ({
  sceneId,
  durationInFrames,
  fadeInFrames = 30,
  fadeOutFrames = 30,
  baseVol = 0.2,
  duckedVol = 0.08,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const dubRanges = getSceneDubRangesFrames(sceneId);
  if (sceneId === 'S09') {
    // Duck softly under live-action closing clip (~33s..42s)
    dubRanges.push([Math.round(33 * fps), Math.round(42 * fps)]);
  }
  const duck = bgmVolume(frame, dubRanges, baseVol, duckedVol);
  const fade = interpolate(
    frame,
    [0, fadeInFrames, Math.max(fadeInFrames + 1, durationInFrames - fadeOutFrames), durationInFrames],
    [0, 1, 1, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // S01A stays subtle under real voices, rising gently over final 6 seconds before S01B
  const s01aGate =
    sceneId === 'S01A'
      ? interpolate(frame, [Math.max(0, durationInFrames - 180), durationInFrames - 15], [0.22, 0.75], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;

  return (
    <Audio
      src={staticFile(`music/bgm_${sceneId}.wav`)}
      loop
      volume={duck * fade * s01aGate}
    />
  );
};

export const GlobalBgm: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <>
      {SCENES.map((s) => {
        const start = getSceneStartFrame(s.id);
        const dur = sceneFrames(s);
        return (
          <Sequence key={s.id} from={start} durationInFrames={dur} layout="none">
            <SceneBgmTrack
              sceneId={s.id}
              durationInFrames={dur}
              fadeInFrames={fps}
              fadeOutFrames={s.id === 'S09' ? fps * 3 : fps}
              baseVol={s.id === 'S01A' ? 0.14 : 0.2}
              duckedVol={s.id === 'S01A' ? 0.05 : 0.08}
            />
          </Sequence>
        );
      })}
    </>
  );
};
