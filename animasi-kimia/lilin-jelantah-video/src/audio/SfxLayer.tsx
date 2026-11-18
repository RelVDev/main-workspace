import React from 'react';
import {Audio} from '@remotion/media';
import {Sequence, staticFile, useVideoConfig} from 'remotion';

export interface SfxCue {
  id: string;
  t: number; // detik relatif ke awal scene
  dur?: number; // durasi dalam detik (default 1.5)
  vol?: number;
  loop?: boolean;
}

export const SfxLayer: React.FC<{cues: SfxCue[]}> = ({cues}) => {
  const {fps} = useVideoConfig();
  return (
    <>
      {cues.map((c, idx) => {
        const from = Math.max(0, Math.round(c.t * fps));
        const durationInFrames = Math.max(1, Math.ceil((c.dur ?? 1.5) * fps));
        return (
          <Sequence key={`${c.id}-${idx}`} from={from} durationInFrames={durationInFrames} layout="none">
            <Audio
              src={staticFile(`sfx/${c.id}.wav`)}
              volume={c.vol ?? 0.45}
              loop={c.loop}
            />
          </Sequence>
        );
      })}
    </>
  );
};
