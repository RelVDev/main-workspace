import React from 'react';
import {Audio, Sequence, staticFile, useVideoConfig} from 'remotion';
import {Timeline} from './timeline';
import {SFX_DUR, buildCues} from './cues';

export const AudioLayer: React.FC<{T: Timeline}> = ({T}) => {
  const {fps, durationInFrames} = useVideoConfig();
  const cues = React.useMemo(() => buildCues(T), [T]);
  const musicVol = (f: number): number => {
    const sec = f / fps;
    const total = durationInFrames / fps;
    const fadeIn = Math.min(1, sec / 1.5);
    const fadeOut = Math.min(1, Math.max(0, (total - sec) / 2.5));
    return 0.2 * fadeIn * fadeOut;
  };
  return (
    <>
      <Audio src={staticFile('narasi.mp3')} volume={1} />
      <Audio src={staticFile('music.wav')} volume={musicVol} />
      {cues.map((c, i) => (
        <Sequence key={i} from={Math.round(c.t * fps)} durationInFrames={Math.max(1, Math.ceil((SFX_DUR[c.file] ?? 1) * fps))}>
          <Audio src={staticFile(`sfx/${c.file}.wav`)} volume={c.vol} />
        </Sequence>
      ))}
    </>
  );
};
