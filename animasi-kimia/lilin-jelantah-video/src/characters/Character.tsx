import React from 'react';
import {Img, random, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import type {CharId} from '../data/script';
import {CHARACTERS} from './registry';
import {useMouth, type MouthShape} from './useMouth';
import {Emote, type EmoteType} from './Emote';
import {useSceneLight} from '../engine/SceneLight';

export type Pose = 'idle' | 'talk' | 'wave' | 'point' | 'think' | 'cheer' | 'walk' | 'sit' | 'hold';
export type Expr = 'neutral' | 'happy' | 'surprised' | 'worried' | 'determined' | 'sad';

export interface CharacterProps {
  id: CharId;
  /** Ground anchor X in 480x270 art-space (continuous fractional pan supported). */
  x: number;
  /** Ground anchor Y (feet level) in 480x270 art-space. */
  y: number;
  flip?: boolean;
  pose?: Pose;
  expr?: Expr;
  mouth?: MouthShape | 'auto';
  lineId?: string;
  scale?: 1 | 2;
  z?: number;
  /** 0 = full bright speaker; >0 dims non-speakers. */
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
  const light = useSceneLight();

  // Smooth continuous breathing & speaking bounce (no harsh 4px staircase steps)
  const phase = random(`breath-${id}`) * Math.PI * 2;
  const idleBob = Math.sin(frame / 13 + phase) * 0.65;

  // Seeded blink every 3.2-5s for 3 frames
  const blinkPeriod = Math.round((3.2 + random(`blink-p-${id}`) * 1.8) * fps);
  const blinkPhase = Math.round(random(`blink-off-${id}`) * blinkPeriod);
  const isBlinking = (frame + blinkPhase) % blinkPeriod < 3;

  // Mouth state (from lip-sync or placeholder)
  const activeMouth = useMouth(lineId, mouth);
  const isSpeaking = Boolean(lineId) && activeMouth !== 'closed';
  const talkBob = isSpeaking ? -Math.abs(Math.sin(frame * 0.55)) * 1.1 : 0;

  // Smooth cheer bounce instead of binary frame snap
  const cheerHop = pose === 'cheer' ? -Math.abs(Math.sin(frame * 0.42)) * 2.4 : 0;
  // Walk bob when walking
  const walkBob = pose === 'walk' ? -Math.abs(Math.sin(frame * 0.55)) * 1.4 : 0;

  const bodyOffsetY = idleBob + talkBob + cheerHop + walkBob - jumpY;
  // Squash & stretch: stretch while airborne, breathe subtly on idle
  const stretch = jumpY > 0.5 ? Math.min(0.08, jumpY * 0.006) : 0;
  const breathe = Math.sin(frame / 13 + phase) * 0.008;
  const sy = 1 + stretch + breathe;
  const sx = 1 - stretch * 0.6 - breathe * 0.5;

  // Cast shadow projected away from the scene key light
  const dxL = x - light.keyX;
  const dyL = Math.max(20, y - light.keyY);
  const skew = Math.max(-58, Math.min(58, Math.atan2(dxL, dyL) * (180 / Math.PI) * 1.1));
  const castLen = Math.max(0.22, Math.min(0.62, 0.32 + Math.abs(dxL) / 900));
  const castOp = light.shadowStrength * Math.max(0.25, 1 - jumpY * 0.05) * (dim > 0 ? 0.8 : 1);

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
  const left = x - 32 * scale;
  const top = y - 75 * scale;
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
        left: 0,
        top: 0,
        transform: `translate3d(${left.toFixed(2)}px, ${top.toFixed(2)}px, 0)`,
        width: w,
        height: h,
        zIndex: z,
        pointerEvents: 'none',
      }}
    >
      {/* Ground shadow stays anchored cleanly to floor */}
      <Img
        src={staticFile(`${base}/shadow.png`)}
        style={{
          ...layerStyle,
          opacity: Math.max(0.32, 1 - jumpY * 0.04),
        }}
      />

      {/* Projected cast shadow (silhouette flattened onto the floor, skewed away from the key) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: '50% 93.75%',
          transform: `translate3d(${(flip ? 0 : 0).toFixed(2)}px, 0, 0) skewX(${(-skew).toFixed(2)}deg) scaleY(${(-castLen).toFixed(3)}) scaleX(${flip ? -1 : 1})`,
          filter: 'brightness(0) blur(0.35px)',
          opacity: castOp * 0.62,
        }}
      >
        <Img src={staticFile(`${base}/hair_back.png`)} style={layerStyle} />
        <Img src={staticFile(`${base}/legs_${legsName}.png`)} style={layerStyle} />
        <Img src={staticFile(`${base}/body.png`)} style={layerStyle} />
        <Img src={staticFile(`${base}/head.png`)} style={layerStyle} />
        <Img src={staticFile(`${base}/hair_front.png`)} style={layerStyle} />
      </div>

      {/* Character sprite stack */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate3d(0, ${bodyOffsetY.toFixed(2)}px, 0) scale(${((flip ? -1 : 1) * sx).toFixed(4)}, ${sy.toFixed(4)})`,
          transformOrigin: '50% 93.75%',
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
          style={{...layerStyle, opacity: dim > 0 ? 0.15 : 0.4}}
        />
        {light.rimFilterId ? (
          <Img
            src={staticFile(`${base}/rim.png`)}
            style={{
              ...layerStyle,
              filter: `url(#${light.rimFilterId})`,
              opacity: (dim > 0 ? 0.12 : 0.45) * light.rimStrength,
              mixBlendMode: 'screen',
            }}
          />
        ) : null}
        <Img src={staticFile(`${base}/arm_r_${armR}.png`)} style={layerStyle} />
      </div>

      {/* Emote bubble */}
      {emote ? (
        <Emote
          type={emote.type}
          x={Math.round(w / 2)}
          y={Math.round(12 * scale + bodyOffsetY)}
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
  const hover = Math.sin(frame / 11) * 2.2;
  const tilt = Math.sin(frame / 18) * 3.5;
  const variant =
    mood === 'idle' ? (Math.floor(frame / 12) % 2 === 0 ? 'idle_a' : 'idle_b') : mood;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `translate3d(${(x - 12).toFixed(2)}px, ${(y - 12 + hover).toFixed(2)}px, 0) rotate(${tilt.toFixed(2)}deg)`,
        width: 24,
        height: 24,
        zIndex: z,
        pointerEvents: 'none',
      }}
    >
      <Img
        src={staticFile(`sprites/characters/jeli/${variant}.png`)}
        style={{
          width: 24,
          height: 24,
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};
