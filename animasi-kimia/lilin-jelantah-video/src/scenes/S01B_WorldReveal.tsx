import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character, JeliMascot} from '../characters/Character';
import {ALL_CHAR_IDS, CHARACTERS} from '../characters/registry';
import {S01B_SFX} from '../data/cues/S01B.cues';
import {META} from '../data/meta';
import {PALETTE} from '../data/palette';
import type {CharId} from '../data/script';
import {FloorGlow, PointLight, Sparkle, SpotCone} from '../engine/Lighting';
import {SceneShell} from '../engine/SceneShell';
import {smoothKeyframes} from '../lib/easing';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {lineEnd, lineStart} from '../lib/seconds';
import {NamePlate} from '../ui/NamePlate';
import {SceneSubtitles} from '../ui/Subtitles';
import {HangingLamp, StringLights} from './shared/RoomDecor';
import {BokehBackdrop, PixelDoor, StageFloor, VelvetCurtains} from './shared/StageElements';

const SEMICIRCLE_POS: Array<{id: CharId; x: number; y: number}> = [
  {id: 'ais', x: 56, y: 214},
  {id: 'disa', x: 100, y: 210},
  {id: 'sofi', x: 146, y: 207},
  {id: 'farel', x: 192, y: 205},
  {id: 'malika', x: 240, y: 204},
  {id: 'noya', x: 288, y: 205},
  {id: 'marsha', x: 334, y: 207},
  {id: 'ayuya', x: 380, y: 210},
  {id: 'lovyta', x: 424, y: 214},
];

export const S01B_WorldReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const l1Start = lineStart('S01B_L01');
  const l1End = lineEnd('S01B_L01');
  const l2Start = lineStart('S01B_L02');
  const l2End = lineEnd('S01B_L02');
  const l3Start = lineStart('S01B_L03');
  const l3End = lineEnd('S01B_L03');
  const l4Start = lineStart('S01B_L04');
  const l4End = lineEnd('S01B_L04');

  // Clean cinematic portal entrance (rack-focus + warm fade-in — hand transition left free for manual edit)
  const enterOpacity = interpolate(t, [0, 0.45], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rackBlur = interpolate(t, [0, 1.3], [9, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Buttery-smooth camera choreography
  const zoom = smoothKeyframes(t, [
    [0, 2.25],
    [1.4, 2.1],
    [5.8, 1.98],
    [9.4, 1.0],
    [24.5, 1.0],
    [29.5, 1.12],
  ]);

  const camX = smoothKeyframes(t, [
    [0, 240],
    [24.0, 240],
    [29.5, 192],
  ]);

  const camY = smoothKeyframes(t, [
    [0, 152],
    [5.8, 152],
    [9.4, 135],
  ]);

  const curtainOpen = smoothKeyframes(t, [
    [0, 0.2],
    [5.6, 0.28],
    [8.6, 1.0],
  ]);

  const activeLineId =
    frame >= l1Start && frame <= l1End
      ? 'S01B_L01'
      : frame >= l2Start && frame <= l2End
        ? 'S01B_L02'
        : frame >= l3Start && frame <= l3End
          ? 'S01B_L03'
          : frame >= l4Start && frame <= l4End
            ? 'S01B_L04'
            : undefined;

  // Teal orb flight path: glides smoothly over Malika's shoulder -> enters LAB KIMIA door
  const orbX = smoothKeyframes(t, [
    [0, 266],
    [26.2, 266],
    [30.0, 44],
  ]) + (t < 26.2 ? Math.sin(frame / 18) * 3 : 0);

  const orbY = smoothKeyframes(t, [
    [0, 136],
    [26.2, 136],
    [28.0, 124],
    [30.0, 154],
  ]) + (t < 26.2 ? Math.cos(frame / 15) * 2 : 0);

  const groupJump =
    t >= 10.1 && t <= 11.1 ? Math.max(0, Math.sin(((t - 10.1) / 1.0) * Math.PI) * 14) : 0;

  const titleOp = interpolate(t, [10.0, 10.7, 17.2, 18.2], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const titleY = interpolate(t, [10.0, 10.8], [-22, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  const hud = (
    <>
      {titleOp > 0.01 ? (
        <div
          style={{
            position: 'absolute',
            top: 92,
            left: 140,
            right: 140,
            textAlign: 'center',
            opacity: titleOp,
            transform: `translate3d(0, ${titleY.toFixed(2)}px, 0)`,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(27,16,32,0.9)',
              border: `6px solid ${PALETTE.gold}`,
              boxShadow: `10px 10px 0 ${PALETTE.ink}`,
              padding: '22px 40px',
            }}
          >
            <div
              style={{
                fontFamily: FONT_TITLE,
                fontSize: 34,
                color: PALETTE.gold,
                textShadow: `4px 4px 0 ${PALETTE.ink}`,
                marginBottom: 14,
                lineHeight: 1.35,
              }}
            >
              KIMIA DALAM KEHIDUPAN SEHARI-HARI
            </div>
            <div
              style={{
                fontFamily: FONT_BODY,
                fontSize: 38,
                fontWeight: 700,
                color: PALETTE.cream,
              }}
            >
              Lilin Aromatis dari Minyak Jelantah
            </div>
          </div>
        </div>
      ) : null}

      {t >= 6.4 && t <= 10.0 ? (
        <div style={{position: 'absolute', top: 100, right: 80}}>
          <NamePlate
            name={CHARACTERS[ALL_CHAR_IDS[1 + Math.min(7, Math.floor((t - 6.4) / 0.42))]].displayName}
            color={CHARACTERS[ALL_CHAR_IDS[1 + Math.min(7, Math.floor((t - 6.4) / 0.42))]].accentColor}
            sublabel={CHARACTERS[ALL_CHAR_IDS[1 + Math.min(7, Math.floor((t - 6.4) / 0.42))]].role}
          />
        </div>
      ) : null}

      <SceneSubtitles sceneId="S01B" bottomOffset={84} />
    </>
  );

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        opacity: enterOpacity,
        filter: rackBlur > 0.15 ? `blur(${rackBlur.toFixed(2)}px)` : undefined,
      }}
    >
      <SceneShell
        grade="stage"
        camX={camX}
        camY={camY}
        zoom={zoom}
        farBlur={5.5}
        midBlur={2}
        farBg={<BokehBackdrop />}
        midBg={
          <>
            <VelvetCurtains openProgress={curtainOpen} />
            <StringLights y={16} count={14} sag={12} />
          </>
        }
        floor={<StageFloor y={196} />}
        lights={
          <>
            <SpotCone x={240} topY={0} bottomY={214} spreadW={96} color={PALETTE.goldPale} opacity={0.24} />
            <FloorGlow x={240} y={206} rx={95} ry={16} color={PALETTE.amber} opacity={0.36} />
            <HangingLamp x={120} cordLen={18} bulbColor={PALETTE.goldPale} coneHeight={170} opacity={0.18} />
            <HangingLamp x={360} cordLen={18} bulbColor={PALETTE.goldPale} coneHeight={170} opacity={0.18} />
            <PointLight x={240} y={120} radius={125} color={PALETTE.amber} intensity={0.48} />
            {t >= 1.5 ? (
              <PointLight x={orbX} y={orbY} radius={46} color={PALETTE.teal} intensity={0.72} />
            ) : null}
            {t >= 20 ? (
              <PointLight x={44} y={160} radius={72} color={PALETTE.gold} intensity={0.7} />
            ) : null}
          </>
        }
        rays={{color: PALETTE.gold, opacity: 0.18, angleDeg: 18}}
        bloom={{intensity: 0.28, color: PALETTE.gold}}
        dust={{count: 46, color: PALETTE.cream, seed: 's01b-dust'}}
        vignette={0.4}
        grain={0.075}
        letterbox={1}
        hud={hud}
      >
        {t >= 5.5 ? <PixelDoor x={26} y={132} glow={PALETTE.gold} label="LAB KIMIA" /> : null}

        {SEMICIRCLE_POS.map((pos, idx) => {
          const popT = pos.id === 'malika' ? 0 : 6.4 + (idx > 4 ? idx - 1 : idx) * 0.4;
          if (pos.id !== 'malika' && t < popT) return null;

          const popBounce =
            pos.id === 'malika'
              ? 0
              : Math.max(
                  0,
                  (1 - spring({fps, frame: Math.max(0, Math.round((t - popT) * fps)), config: {damping: 12}})) * 12,
                );

          const isMalikaTalk = activeLineId === 'S01B_L01' || activeLineId === 'S01B_L04';
          const isNoyaTalk = activeLineId === 'S01B_L03';
          const isAllTalk = activeLineId === 'S01B_L02';

          let pose: 'idle' | 'wave' | 'point' | 'cheer' | 'talk' = 'idle';
          let charLine: string | undefined;
          let dim = 0;

          if (isMalikaTalk) {
            dim = pos.id === 'malika' ? 0 : 0.35;
            if (pos.id === 'malika') {
              pose = activeLineId === 'S01B_L04' ? 'point' : 'wave';
              charLine = activeLineId;
            }
          } else if (isNoyaTalk) {
            dim = pos.id === 'noya' ? 0 : 0.35;
            if (pos.id === 'noya') {
              pose = 'talk';
              charLine = 'S01B_L03';
            }
          } else if (isAllTalk) {
            pose = 'cheer';
            charLine = 'S01B_L02';
          } else if (pos.id === 'malika' && t < 3.0) {
            pose = 'wave';
          }

          return (
            <Character
              key={pos.id}
              id={pos.id}
              x={pos.x}
              y={pos.id === 'noya' && isNoyaTalk ? pos.y + 4 : pos.y}
              flip={pos.id === 'malika' && t >= 24}
              pose={pose}
              expr="happy"
              lineId={charLine}
              dim={dim}
              jumpY={groupJump + popBounce}
              z={pos.id === 'malika' ? 20 : 12}
            />
          );
        })}

        {META.showMascotJeli && t >= 10.2 ? (
          <JeliMascot x={315} y={196 - groupJump} mood="happy" z={22} />
        ) : null}

        {t >= 1.5 ? <Sparkle x={orbX} y={orbY} size="md" color={PALETTE.teal} glowRadius={24} /> : null}
      </SceneShell>
      <DubLayer sceneId="S01B" />
      <SfxLayer cues={S01B_SFX} />
    </div>
  );
};
