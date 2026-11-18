import React from 'react';
import {Audio} from '@remotion/media';
import {Sequence, staticFile, useVideoConfig} from 'remotion';
import type {SceneId} from '../data/script';
import {dubMap} from '../data/timeline';

// Memutar rekaman dubbing manual user untuk setiap baris di scene yang memiliki WAV.
// Jika user belum merekam WAV (hasAudio === false), komponen ini tidak merender audio TTS apa pun.
export const DubLayer: React.FC<{sceneId: SceneId}> = ({sceneId}) => {
  const {fps} = useVideoConfig();
  const entries = Object.values(dubMap).filter(
    (d) => d.scene === sceneId && d.hasAudio && d.file,
  );

  return (
    <>
      {entries.map((d) => (
        <Sequence
          key={d.lineId}
          from={Math.round(d.startSec * fps)}
          durationInFrames={Math.ceil(d.durationSec * fps)}
          layout="none"
        >
          <Audio src={staticFile(d.file!)} volume={1} />
        </Sequence>
      ))}
    </>
  );
};
