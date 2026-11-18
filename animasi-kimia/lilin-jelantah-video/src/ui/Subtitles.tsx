import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {getSpeakerInfo} from '../characters/registry';
import {S01A_LIVE_LINES, SCRIPT_LINES, type SceneId} from '../data/script';
import {dubMap} from '../data/timeline';
import {DialogueBox} from './DialogueBox';

export const SceneSubtitles: React.FC<{
  sceneId: SceneId;
  bottomOffset?: number;
}> = ({sceneId, bottomOffset = 48}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  if (sceneId === 'S01A') {
    const active = S01A_LIVE_LINES.find(
      (l) => frame >= Math.round(l.startSec * fps) && frame <= Math.round(l.endSec * fps),
    );
    if (!active) return null;
    const sp = getSpeakerInfo(active.speaker);
    return (
      <DialogueBox
        speakerName={sp.name}
        speakerColor={sp.color}
        text={active.text}
        startFrame={Math.round(active.startSec * fps)}
        endFrame={Math.round(active.endSec * fps)}
        bottomOffset={bottomOffset}
      />
    );
  }

  const sceneLines = SCRIPT_LINES.filter((l) => l.scene === sceneId);
  for (const line of sceneLines) {
    const entry = dubMap[line.id];
    if (!entry) continue;
    const sF = Math.round(entry.startSec * fps);
    const eF = Math.round(entry.endSec * fps);
    if (frame >= sF && frame <= eF) {
      const sp = getSpeakerInfo(line.speaker);
      return (
        <DialogueBox
          speakerName={sp.name}
          speakerColor={sp.color}
          text={entry.text}
          startFrame={sF}
          endFrame={eF}
          bottomOffset={bottomOffset}
        />
      );
    }
  }
  return null;
};
