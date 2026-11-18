import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character, JeliMascot} from '../characters/Character';
import {ALL_CHAR_IDS, CHARACTERS} from '../characters/registry';
import {S01B_SFX} from '../data/cues/S01B.cues';
import {META} from '../data/meta';
import {PALETTE} from '../data/palette';
import type {CharId} from '../data/script';
import {SceneShell} from '../engine/SceneShell';
import {PointLight, Sparkle} from '../engine/Lighting';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {ART_H, ART_W, snap} from '../lib/pixel';
import {lineEnd, lineStart} from '../lib/seconds';
import {NamePlate} from '../ui/NamePlate';
import {SceneSubtitles} from '../ui/Subtitles';
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

  // Line anchors
  const l1Start = lineStart('S01B_L01');
  const l1End = lineEnd('S01B_L01');
  const l2Start = lineStart('S01B_L02');
  const l2End = lineEnd('S01B_L02');
  const l3Start = lineStart('S01B_L03');
  const l3End = lineEnd('S01B_L03');
  const l4Start = lineStart('S01B_L04');
  const l4End = lineEnd('S01B_L04');

  // Stage 3 hand opening (0..1.6s)
  const fingerPart = interpolate(t, [0.55, 1.5], [0, 260], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const palmDrop = interpolate(t, [0.55, 1.55], [0, 290], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  const seamBeam = interpolate(t, [0.25, 0.55, 1.15, 1.55], [0, 1, 0.9, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rackBlur = interpolate(t, [0.6, 1.6], [10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Camera choreography:
  // 0..6s: Close-up on Malika (zoom 2.3 -> 2.0)
  // 6..10s: Pull back wide (zoom 2.0 -> 1.0)
  // 24..31s: Pan slightly left toward glowing door
  const zoom =
    t < 6
      ? interpolate(t, [1.4, 6], [2.3, 2.0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
      : interpolate(t, [6, 9.5], [2.0, 1.0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.cubic),
        });

  const camX =
    t < 6
      ? 240
      : t < 24
        ? 240
        : interpolate(t, [24, 29], [240, 185], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
            easing: Easing.inOut(Easing.cubic),
          });

  const camY =
    t < 6
      ? 152
      : interpolate(t, [6, 9.5], [152, 135], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  const curtainOpen = interpolate(t, [5.8, 8.2], [0.25, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Active speaker line
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

  // Teal orb flight path: hovers over Malika shoulder -> flies into glowing door at 27.5..30s
  const orbX =
    t < 26.5
      ? 266 + Math.sin(frame / 18) * 3
      : interpolate(t, [26.5, 29.8], [266, 44], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.cubic),
        });
  const orbY =
    t < 26.5
      ? 136 + Math.cos(frame / 15) * 2
      : interpolate(t, [26.5, 29.8], [136, 152], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  // Group jump during L02 start
  const groupJump =
    t >= 10.1 && t <= 11.1 ? Math.max(0, Math.round(Math.sin(((t - 10.1) / 1.0) * Math.PI) * 14)) : 0;

  // Hero title reveal (10..18s)
  const titleOp = interpolate(t, [10.0, 10.6, 17.2, 18.2], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const hud = (
    <>
      {titleOp > 0.01 ? (
        <div
          style={{
            position: 'absolute',
            top: 96,
            left: 140,
            right: 140,
            textAlign: 'center',
            opacity: titleOp,
            transform: `translateY(${interpolate(t, [10, 10.8], [-24, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}).toFixed(0)}px)`,
          }}
        >
          <div
            style={{
              display: 'inline-block',
              backgroundColor: 'rgba(27,16,32,0.88)',
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

      {/* Character popup nameplate when 8 cast members pop in (6.4..9.8s) */}
      {t >= 6.4 && t <= 10.0 ? (
        <div style={{position: 'absolute', top: 100, right: 80}}>
          <NamePlate
            name={
              CHARACTERS[
                ALL_CHAR_IDS[1 + (Math.min(7, Math.floor((t - 6.4) / 0.42)))]
              ].displayName
            }
            color={
              CHARACTERS[
                ALL_CHAR_IDS[1 + (Math.min(7, Math.floor((t - 6.4) / 0.42)))]
              ].accentColor
            }
            sublabel={
              CHARACTERS[
                ALL_CHAR_IDS[1 + (Math.min(7, Math.floor((t - 6.4) / 0.42)))]
              ].role
            }
          />
        </div>
      ) : null}

      <SceneSubtitles sceneId="S01B" bottomOffset={84} />
    </>
  );

  return (
    <div style={{width: '100%', height: '100%', filter: rackBlur > 0.2 ? `blur(${rackBlur.toFixed(1)}px)` : undefined}}>
      <SceneShell
        grade="stage"
        camX={camX}
        camY={camY}
        zoom={zoom}
        farBlur={6}
        midBlur={2}
        farBg={<BokehBackdrop />}
        midBg={<VelvetCurtains openProgress={curtainOpen} />}
        floor={<StageFloor y={196} />}
        lights={
          <>
            <PointLight x={240} y={120} radius={110} color={PALETTE.amber} intensity={0.45} />
            {t >= 1.9 ? (
              <PointLight x={orbX} y={orbY} radius={44} color={PALETTE.teal} intensity={0.7} />
            ) : null}
            {t >= 22 ? (
              <PointLight x={44} y={160} radius={65} color={PALETTE.gold} intensity={0.65} />
            ) : null}
          </>
        }
        rays={{color: PALETTE.gold, opacity: 0.16, angleDeg: 20}}
        bloom={{intensity: 0.25, color: PALETTE.gold}}
        dust={{count: 42, color: PALETTE.cream, seed: 's01b-dust'}}
        vignette={0.4}
        grain={0.08}
        letterbox={1}
        hud={hud}
      >
        {/* Glowing wooden door on stage left */}
        {t >= 6 ? <PixelDoor x={26} y={132} glow={PALETTE.gold} label="LAB KIMIA" /> : null}

        {/* Cast semicircle */}
        {SEMICIRCLE_POS.map((pos, idx) => {
          // Malika appears from 1.2s; other 8 pop in sequentially 6.4..9.6s
          const popT = pos.id === 'malika' ? 0 : 6.4 + (idx > 4 ? idx - 1 : idx) * 0.4;
          if (pos.id !== 'malika' && t < popT) return null;

          const isMalikaTalk = activeLineId === 'S01B_L01' || activeLineId === 'S01B_L04';
          const isNoyaTalk = activeLineId === 'S01B_L03';
          const isAllTalk = activeLineId === 'S01B_L02';

          let pose: 'idle' | 'wave' | 'point' | 'cheer' | 'talk' = 'idle';
          const expr: 'neutral' | 'happy' = 'happy';
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
              expr={expr}
              lineId={charLine}
              dim={dim}
              jumpY={groupJump}
              z={pos.id === 'malika' ? 20 : 12}
            />
          );
        })}

        {/* Mascot Jeli cameo */}
        {META.showMascotJeli && t >= 10.2 ? (
          <JeliMascot x={315} y={196 - groupJump} mood="happy" z={22} />
        ) : null}

        {/* Teal portal orb */}
        {t >= 1.9 ? <Sparkle x={orbX} y={orbY} size="md" color={PALETTE.teal} glowRadius={24} /> : null}

        {/* Stage 3 Giant Pixel Hand reveal overlay (0..1.7s) */}
        {t < 1.7 ? (
          <div style={{position: 'absolute', inset: 0, zIndex: 90, pointerEvents: 'none'}}>
            <Img
              src={staticFile('sprites/fx/giant_palm.png')}
              style={{
                position: 'absolute',
                left: 0,
                top: snap(palmDrop),
                width: ART_W,
                height: ART_H,
                imageRendering: 'pixelated',
              }}
            />
            <Img
              src={staticFile('sprites/fx/giant_fingers_left.png')}
              style={{
                position: 'absolute',
                left: snap(-fingerPart),
                top: 0,
                width: ART_W,
                height: ART_H,
                imageRendering: 'pixelated',
              }}
            />
            <Img
              src={staticFile('sprites/fx/giant_fingers_right.png')}
              style={{
                position: 'absolute',
                left: snap(fingerPart),
                top: 0,
                width: ART_W,
                height: ART_H,
                imageRendering: 'pixelated',
              }}
            />
            {/* Warm vertical light beam leaking between parting fingers */}
            {seamBeam > 0 ? (
              <div
                style={{
                  position: 'absolute',
                  left: snap(236 - seamBeam * 14),
                  top: 0,
                  width: snap(8 + seamBeam * 28),
                  height: ART_H,
                  background: `linear-gradient(90deg, transparent 0%, ${PALETTE.gold} 40%, ${PALETTE.cream} 50%, ${PALETTE.gold} 60%, transparent 100%)`,
                  mixBlendMode: 'screen',
                  opacity: seamBeam,
                }}
              />
            ) : null}
          </div>
        ) : null}
      </SceneShell>
      <DubLayer sceneId="S01B" />
      <SfxLayer cues={S01B_SFX} />
    </div>
  );
};
