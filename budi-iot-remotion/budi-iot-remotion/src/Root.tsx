import React from 'react';
import {CalculateMetadataFunction, Composition, staticFile} from 'remotion';
import {getAudioDurationInSeconds} from '@remotion/media-utils';
import {Main} from './Main';
import {FPS, HEIGHT, SCENE_COUNT, Scene, VideoProps, WIDTH} from './types';

type TimingFile = {audioDurationSec?: number; scenes: Scene[]};

const defaultProps: VideoProps = {scenes: [], narrationSec: 104};

/** Durasi video = durasi narasi.mp3 + 1 detik; timing adegan dibaca dari public/timing.json */
const calculateMetadata: CalculateMetadataFunction<VideoProps> = async () => {
  const res = await fetch(staticFile('timing.json'));
  const json = (await res.json()) as TimingFile;
  let narration = json.audioDurationSec ?? 0;
  try {
    narration = await getAudioDurationInSeconds(staticFile('narasi.mp3'));
  } catch (e) {
    // pakai audioDurationSec dari timing.json bila MP3 tidak terbaca
  }
  if (!narration || narration <= 0) throw new Error('Durasi narasi tidak terbaca (cek public/narasi.mp3).');
  if (!Array.isArray(json.scenes) || json.scenes.length !== SCENE_COUNT) {
    throw new Error(`public/timing.json harus berisi ${SCENE_COUNT} adegan (satu kalimat = satu adegan), sekarang: ${json.scenes?.length ?? 0}`);
  }
  const scenes = json.scenes.map((s, i) => ({id: s.id ?? i + 1, text: s.text, start: s.start, end: s.end}));
  return {
    durationInFrames: Math.ceil((narration + 1) * FPS),
    props: {scenes, narrationSec: narration},
  };
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Cerita"
    component={Main}
    width={WIDTH}
    height={HEIGHT}
    fps={FPS}
    durationInFrames={Math.ceil(105 * FPS)}
    defaultProps={defaultProps}
    calculateMetadata={calculateMetadata}
  />
);
