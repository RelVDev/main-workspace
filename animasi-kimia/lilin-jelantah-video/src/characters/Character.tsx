import React from 'react';
import {Img, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CharId} from '../data/script';
import {stepFrame} from '../lib/easing';
import {snap} from '../lib/pixel';
import {CHARACTERS} from './registry';
import {useMouth, type MouthShape} from './useMouth';
import {Emote, type EmoteType} from './Emote';

export type Pose = 'idle' | 'talk' | 'wave' | 'point' | 'think' | 'cheer' | 'walk' | 'sit' | 'hold';
export type Expr = 'neutral' | 'happy' | 'surprised' | 'worried' | 'determined' | 'sad';

export interface CharacterProps {
  id: CharId;
  /** Ground anchor X in 480x270 art-space (integer). */
  x: number;
  /** Ground anchor Y (feet level) in 480x270 art-space (integer). */
  y: number;
  flip?: boolean;
  pose?: Pose;
  expr?: Expr;
  mouth?: MouthShape | 'auto';
  lineId?: string;
  scale?: 1 | 2;
  z?: number;
  /** 0 = full bright speaker; >0 dims non-speakers (PLAN 5.3 recommends 0.35). */
  dim?: number;
  /** Jump height in art pixels (positive lifts up, shadow stays grounded). */
  jumpY?: number;
  emote?: {type: EmoteType; startFrame?: number; durationFrames?: number};
}

export const Character: React.FC<CharacterProps> = ({
  id,
  x,
  y,
  flip = false,
  pose = 'idle',
  expr = 'neutral',
  mouth = 'auto',
  lineId,
  scale = 1,
  z = 10,
  dim = 0,
  jumpY = 0,
  emote,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const meta = CHARACTERS[id];

  // Stepped 6 fps idle bob (PLAN 5.3: 1 px up/down, 1.2s cycle)
  const bobStep = stepFrame(frame, 6, fps) % 7;
  const idleBob = bobStep === 2 || bobStep === 3 ? -1 : 0;

  // Seeded blink every 3-5 seconds for 3 frames
  const blinkPeriod = Math.round((3.2 + random(`blink-p-${id}`) * 1.8) * fps);
  const blinkPhase = Math.round(random(`blink-off-${id}`) * blinkPeriod);
  const isBlinking = (frame + blinkPhase) % blinkPeriod < 3;

  // Mouth state (from lip-sync or placeholder)
  const activeMouth = useMouth(lineId, mouth);
  const isSpeaking = Boolean(lineId) && activeMouth !== 'closed';
  const talkBob = isSpeaking && frame % 8 < 4 ? -1 : 0;

  // Cheer hop
  const cheerHop = pose === 'cheer' ? (Math.floor(frame / 5) % 2 === 0 ? -2 : 0) : 0;

  const bodyOffsetY = snap(idleBob + talkBob + cheerHop - jumpY);

  // Resolve eyes sprite
  let eyesName: string = expr === 'neutral' ? 'open' : expr;
  if (isBlinking && expr !== 'happy') {
    eyesName = 'blink';
  }

  // Resolve arm poses
  let armL = 'down';
  let armR = 'down';
  if (pose === 'wave') {
    armL = Math.floor(frame / 6) % 2 === 0 ? 'wave_a' : 'wave_b';
    armR = 'down';
  } else if (pose === 'point') {
    armL = 'down';
    armR = 'point';
  } else if (pose === 'think') {
    armL = 'down';
    armR = 'think';
  } else if (pose === 'cheer') {
    armL = 'up';
    armR = 'up';
  } else if (pose === 'hold') {
    armL = 'hold';
    armR = 'hold';
  } else if (pose === 'talk') {
    armR = Math.floor(frame / 10) % 2 === 0 ? 'hold' : 'down';
  }

  // Resolve leg pose
  let legsName = 'idle';
  if (pose === 'walk') {
    legsName = Math.floor(frame / 4) % 2 === 0 ? 'walk_a' : 'walk_b';
  } else if (pose === 'sit') {
    legsName = 'sit';
  }

  // Resolve final mouth (smile when happy and silent)
  const finalMouth: MouthShape =
    activeMouth === 'closed' && expr === 'happy' ? 'smile' : activeMouth;

  const w = 64 * scale;
  const h = 80 * scale;
  const left = snap(x - 32 * scale);
  const top = snap(y - 75 * scale);
  const base = `sprites/characters/${id}`;

  const layerStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: w,
    height: h,
    imageRendering: 'pixelated',
  };

  const dimFilter =
    dim > 0
      ? `brightness(${(1 - dim * 0.45).toFixed(2)}) saturate(${(1 - dim * 0.5).toFixed(2)})`
      : undefined;

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: w,
        height: h,
        zIndex: z,
        pointerEvents: 'none',
      }}
    >
      {/* Ground shadow stays fixed on floor even when jumping */}
      <Img
        src={staticFile(`${base}/shadow.png`)}
        style={{
          ...layerStyle,
          opacity: Math.max(0.35, 1 - jumpY * 0.04),
        }}
      />

      {/* Character sprite stack */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateY(${bodyOffsetY}px) scaleX(${flip ? -1 : 1})`,
          transformOrigin: 'center center',
          filter: dimFilter,
        }}
      >
        <Img src={staticFile(`${base}/hair_back.png`)} style={layerStyle} />
        <Img src={staticFile(`${base}/legs_${legsName}.png`)} style={layerStyle} />
        <Img src={staticFile(`${base}/arm_l_${armL}.png`)} style={layerStyle} />
        <Img src={staticFile(`${base}/body.png`)} style={layerStyle} />
        <Img src={staticFile(`${base}/head.png`)} style={layerStyle} />
        <Img src={staticFile(`${base}/blush.png`)} style={layerStyle} />
        <Img src={staticFile(`${base}/eyes_${eyesName}.png`)} style={layerStyle} />
        <Img src={staticFile(`${base}/mouth_${finalMouth}.png`)} style={layerStyle} />
        <Img src={staticFile(`${base}/hair_front.png`)} style={layerStyle} />
        {meta.glasses ? (
          <Img src={staticFile(`${base}/glasses.png`)} style={layerStyle} />
        ) : null}
        <Img src={staticFile(`${base}/accessory.png`)} style={layerStyle} />
        <Img
          src={staticFile(`${base}/rim.png`)}
          style={{...layerStyle, opacity: dim > 0 ? 0.25 : 0.92}}
        />
        <Img src={staticFile(`${base}/arm_r_${armR}.png`)} style={layerStyle} />
      </div>

      {/* Emote bubble */}
      {emote ? (
        <Emote
          type={emote.type}
          x={snap(w / 2)}
          y={snap(12 * scale + bodyOffsetY)}
          startFrame={emote.startFrame}
          durationFrames={emote.durationFrames}
        />
      ) : null}
    </div>
  );
};

export const JeliMascot: React.FC<{
  x: number;
  y: number;
  mood?: 'idle' | 'happy' | 'worried' | 'flame';
  z?: number;
}> = ({x, y, mood = 'idle', z = 20}) => {
  const frame = useCurrentFrame();
  const hover = snap(Math.sin(frame / 10) * 2);
  const variant =
    mood === 'idle' ? (Math.floor(frame / 12) % 2 === 0 ? 'idle_a' : 'idle_b') : mood;

  return (
    <Img
      src={staticFile(`sprites/characters/jeli/${variant}.png`)}
      style={{
        position: 'absolute',
        left: snap(x - 12),
        top: snap(y - 12) + hover,
        width: 24,
        height: 24,
        zIndex: z,
        imageRendering: 'pixelated',
        pointerEvents: 'none',
      }}
    />
  );
};
