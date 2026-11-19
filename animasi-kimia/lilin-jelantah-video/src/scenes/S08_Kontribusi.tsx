import React from 'react';
import {Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character, type Pose} from '../characters/Character';
import {ALL_CHAR_IDS, CHARACTERS} from '../characters/registry';
import contributionsJson from '../data/contributions.json';
import {S08_SFX} from '../data/cues/S08.cues';
import {PALETTE} from '../data/palette';
import type {CharId} from '../data/script';
import {FloorGlow, Sparkle} from '../engine/Lighting';
import {SceneShell} from '../engine/SceneShell';
import type {MapLight} from '../engine/SceneLight';
import {VoxelModel, candleJarModel} from '../engine/Voxel';
import {RealFootage} from '../footage/RealFootage';
import {clamp01, smoothKeyframes} from '../lib/easing';
import {FONT_BODY} from '../lib/fonts';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {HangingLamp, StringLights} from './shared/RoomDecor';
import {CorkBoard, DeskForeground, TeamTable, WorkroomWall} from './shared/S08Set';

const CONTRIB_MAP = contributionsJson as Record<CharId, {role: string; tasks: string[]; prop: string}>;

const CHAR_X = ALL_CHAR_IDS.map((_, idx) => 52 + idx * 47);
const CHAR_Y = 208;
const TABLE_Y = 194;

export const S08_Kontribusi: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const tL1 = lineStartSec('S08_L01');
  const tL2 = lineStartSec('S08_L02');
  const tL3 = lineStartSec('S08_L03');

  const activeLineId = ['S08_L01', 'S08_L02', 'S08_L03'].find(
    (id) => frame >= Math.round(lineStartSec(id) * fps) && frame <= lineEnd(id),
  );

  // Which member card is currently being introduced during L02 (cards light at tL2 + i*1.3)
  const cardIdx = Math.max(0, Math.min(8, Math.floor((t - tL2) / 1.3)));
  const inCards = t >= tL2 && t < tL3;
  const cheer = t >= tL3 + 6.6;

  // ── Camera ────────────────────────────────────────────────────────────
  // L01: open tight on the cork board (focus on the wall), string draws, then zoom out to the team.
  // L02: slow "orbit" — truck + gentle zoom following each member as their card lights up.
  // L03: pull back for the relay line; outro pushes into the light-flash.
  const followX = smoothKeyframes(
    t,
    Array.from({length: 9}, (_, i) => [tL2 + i * 1.3 + 0.2, CHAR_X[i]] as [number, number]),
  );
  const orbitX = 240 + (followX - 240) * 0.55;
  const ease = Easing.inOut(Easing.cubic);
  const preX = smoothKeyframes(t, [
    [0, 246],
    [tL1 + 3.2, 246],
    [tL1 + 6.6, 240],
  ]);
  const postX = smoothKeyframes(t, [
    [tL3 + 1.4, 240],
    [tL3 + 6.4, 236],
  ]);
  const w1 = ease(clamp01((t - (tL2 - 0.6)) / 1.4));
  const w2 = ease(clamp01((t - (tL3 - 0.6)) / 2.0));
  const camX = (preX * (1 - w1) + orbitX * w1) * (1 - w2) + postX * w2;
  const camY = smoothKeyframes(t, [
    [0, 60],
    [tL1 + 3.2, 64],
    [tL1 + 6.8, 150],
    [tL2 + 0.6, 158],
    [tL3 - 0.6, 158],
    [tL3 + 1.4, 146],
    [tL3 + 6.4, 142],
  ]);
  const camZoom = smoothKeyframes(t, [
    [0, 1.78],
    [tL1 + 3.2, 1.72],
    [tL1 + 6.8, 1.0],
    [tL2 + 0.6, 1.24],
    [tL2 + 6.0, 1.3],
    [tL3 - 0.6, 1.22],
    [tL3 + 1.4, 1.0],
    [tL3 + 6.4, 1.04],
  ]);
  const focus = smoothKeyframes(t, [
    [0, 0],
    [tL1 + 3.4, 0],
    [tL1 + 6.4, 1],
  ]);
  const stringProgress = interpolate(t, [tL1 + 0.4, tL1 + 6.0], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // Relay line: a candle jar passes hand to hand along the table during L03
  const relayU = clamp01((t - (tL3 + 0.3)) / 6.0);
  const relayX = CHAR_X[0] + (CHAR_X[8] - CHAR_X[0]) * Easing.inOut(Easing.sin)(relayU);
  const relayHolder = Math.round((relayX - CHAR_X[0]) / 47);
  const relayHop = Math.abs(Math.sin(relayU * Math.PI * 8)) * 6;
  const relayJar = React.useMemo(() => candleJarModel(PALETTE.cream, PALETTE.teal, 0.7), []);

  const btsProgress = Math.max(0, Math.min(1, (t - tL3) / 0.45));
  const btsEase = 1 - (1 - btsProgress) ** 3;
  const highFive = t >= tL3 + 6.6 && t <= tL3 + 7.6 ? Math.sin(((t - tL3 - 6.6) / 1.0) * Math.PI) * 10 : 0;

  const hud = (
    <>
      <SceneBanner
        badge="BAGIAN 8 · KONTRIBUSI TIM"
        title="Kerja Sama 9 Anggota Kelompok"
        accent={PALETTE.tan}
        startFrame={6}
        endFrame={105}
      />

      {t >= tL2 - 1 && t < tL3 ? (
        <div
          style={{
            position: 'absolute',
            top: 112,
            left: 84,
            right: 84,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
          }}
        >
          {ALL_CHAR_IDS.map((cid, i) => {
            const lit = t >= tL2 + i * 1.3;
            const current = inCards && i === cardIdx;
            const info = CONTRIB_MAP[cid];
            const meta = CHARACTERS[cid];
            return (
              <div
                key={cid}
                style={{
                  background: lit
                    ? 'linear-gradient(180deg, rgba(58,32,24,0.94) 0%, rgba(27,16,32,0.94) 100%)'
                    : 'rgba(27,16,32,0.68)',
                  border: `4px solid ${lit ? meta.accentColor : PALETTE.woodMid}`,
                  boxShadow: current
                    ? `0 0 26px ${meta.accentColor}88, 6px 6px 0 ${PALETTE.ink}`
                    : lit
                      ? `0 0 12px ${meta.accentColor}33, 6px 6px 0 ${PALETTE.ink}`
                      : `6px 6px 0 ${PALETTE.ink}`,
                  padding: '10px 14px',
                  opacity: lit ? 1 : 0.48,
                }}
              >
                <div style={{fontFamily: FONT_BODY, fontSize: 20, fontWeight: 700, color: meta.accentColor, letterSpacing: 0.4}}>
                  {meta.displayName}
                </div>
                <div style={{fontFamily: FONT_BODY, fontSize: 19, color: PALETTE.cream, marginTop: 2, lineHeight: 1.2}}>
                  {info.tasks[0]}
                </div>
                <div style={{fontFamily: FONT_BODY, fontSize: 17, color: PALETTE.gold, marginTop: 2, lineHeight: 1.2}}>
                  {info.tasks[1]}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {t >= tL3 ? (
        <div
          style={{
            position: 'absolute',
            top: 112,
            left: 120,
            right: 120,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            alignItems: 'center',
            opacity: btsEase,
            transform: `scale(${0.95 + 0.05 * btsEase})`,
          }}
        >
          <div style={{display: 'flex', gap: 24}}>
            {[0, 1, 2].map((tv) => (
              <div
                key={tv}
                style={{
                  width: 380,
                  height: 220,
                  border: `6px solid ${PALETTE.woodMid}`,
                  outline: `4px solid ${PALETTE.ink}`,
                  boxShadow: `0 0 30px rgba(255,178,90,0.25), 8px 8px 0 ${PALETTE.ink}`,
                  backgroundColor: PALETTE.void,
                  overflow: 'hidden',
                }}
              >
                <Sequence from={Math.max(0, Math.round((tL3 - tv * 2) * fps))} layout="none">
                  <RealFootage id="F08" variant="natural" loop fit="cover" compactPlaceholder />
                </Sequence>
              </div>
            ))}
          </div>
          <div
            style={{
              backgroundColor: 'rgba(27,16,32,0.92)',
              border: `4px solid ${PALETTE.gold}`,
              boxShadow: `6px 6px 0 ${PALETTE.ink}`,
              padding: '12px 26px',
              fontFamily: FONT_BODY,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 0.8,
              color: PALETTE.cream,
            }}
          >
            SARING → CAMPUR → CETAK → PASANG SUMBU → DEKOR → DOKUMENTASI
          </div>
        </div>
      ) : null}

      <SceneSubtitles sceneId="S08" bottomOffset={44} />
    </>
  );

  // ── Lighting: warm sunset window key from the left + two desk/pendant lamps ──
  const mapLights: MapLight[] = [
    {x: 40, y: 90, r: 150, sx: 1.3, color: PALETTE.gold, intensity: 0.85, banded: false},
    {x: 250, y: 92, r: 150, sx: 1.4, color: PALETTE.goldPale, intensity: 0.55 * (1 - focus * 0.4), banded: false},
    {x: 140, y: 170, r: 62, color: PALETTE.goldPale, intensity: 0.8, seed: 'lampA'},
    {x: 340, y: 170, r: 62, color: PALETTE.goldPale, intensity: 0.8, seed: 'lampB'},
    {x: 240, y: 196, r: 150, sx: 2.0, color: PALETTE.amber, intensity: 0.5, banded: false},
    ...(inCards ? [{x: CHAR_X[cardIdx], y: 172, r: 40, color: CHARACTERS[ALL_CHAR_IDS[cardIdx]].accentColor, intensity: 0.7} as MapLight] : []),
    ...(t >= tL3 && relayU < 1 ? [{x: relayX, y: TABLE_Y - 10, r: 34, color: PALETTE.teal, intensity: 0.55} as MapLight] : []),
  ];

  return (
    <SceneShell
      grade="office"
      camX={camX}
      camY={camY}
      zoom={camZoom}
      focus={focus}
      farBlur={2.4}
      midBlur={1}
      intro="none"
      outro="push"
      handheld={1}
      farBg={<WorkroomWall />}
      midBg={
        <>
          <CorkBoard x={76} y={30} progress={stringProgress} />
          <StringLights y={10} count={16} sag={8} />
        </>
      }
      floor3d={{y: 206, pattern: 'planks', tile: 30, gloss: 0.25, glossColor: PALETTE.gold, seed: 's08'}}
      lightMap={{ambient: '#3A1E2C', darkness: 0.5, lights: mapLights}}
      keyLight={{keyX: 30, keyY: 80, rimColor: PALETTE.gold, rimStrength: 0.85, shadowStrength: 0.5}}
      lights={
        <>
          <HangingLamp x={140} cordLen={14} bulbColor={PALETTE.cream} coneHeight={150} opacity={0.14} />
          <HangingLamp x={340} cordLen={14} bulbColor={PALETTE.cream} coneHeight={150} opacity={0.14} />
          <FloorGlow x={240} y={210} rx={150} ry={12} color={PALETTE.goldPale} opacity={0.22} />
        </>
      }
      rays={{color: PALETTE.goldPale, opacity: 0.17, x: 40, y: 40, angleDeg: 20, spread: 36, length: 360}}
      bloom={{intensity: 0.26}}
      dust={{count: 34, color: PALETTE.goldPale, seed: 's08-dust', opacity: 0.55}}
      nearBokeh={{count: 5, color: PALETTE.gold, opacity: 0.22}}
      fog={{y: 150, height: 70, color: PALETTE.goldPale, opacity: 0.05}}
      foreground={<DeskForeground />}
      foregroundBlur={3}
      vignette={0.4}
      hud={hud}
    >
      {ALL_CHAR_IDS.map((cid, idx) => {
        const isAis = cid === 'ais';
        const isCurrentCard = inCards && idx === cardIdx;
        const holdsRelay = t >= tL3 + 0.3 && relayU < 1 && idx === relayHolder;
        let pose: Pose = isAis ? 'talk' : 'idle';
        if (isCurrentCard && !isAis) pose = 'wave';
        if (holdsRelay) pose = 'hold';
        if (cheer) pose = 'cheer';
        const cardFrame = Math.round((tL2 + idx * 1.3) * fps);
        return (
          <Character
            key={cid}
            id={cid}
            x={CHAR_X[idx]}
            y={CHAR_Y}
            flip={!cheer && idx > 4 && !isAis}
            pose={pose}
            expr="happy"
            lineId={isAis ? activeLineId : undefined}
            dim={isAis || isCurrentCard || cheer ? 0 : inCards ? 0.3 : 0.12}
            jumpY={highFive + (isCurrentCard ? Math.max(0, Math.sin(((t - tL2 - idx * 1.3) / 0.5) * Math.PI)) * 5 * (t - tL2 - idx * 1.3 < 0.5 ? 1 : 0) : 0)}
            z={isAis ? 22 : 14}
            emote={
              inCards && !isAis
                ? {type: 'sparkle', startFrame: cardFrame, durationFrames: 26}
                : cheer
                  ? {type: idx % 2 === 0 ? 'heart' : 'sparkle', startFrame: Math.round((tL3 + 6.7 + idx * 0.05) * fps), durationFrames: 30}
                  : undefined
            }
          />
        );
      })}

      {/* Table sits in front of the line-up */}
      <div style={{position: 'absolute', inset: 0, zIndex: 30}}>
        <TeamTable y={TABLE_Y} propXs={CHAR_X} />
        {t >= tL3 ? (
          <>
            <VoxelModel
              voxels={relayJar}
              x={relayX}
              y={TABLE_Y + 2 - relayHop}
              angle={frame * 0.06}
              unit={1}
              box={22}
              tilt={0.5}
              z={31}
            />
            {relayU >= 1 ? <Sparkle x={relayX} y={TABLE_Y - 22} size="sm" color={PALETTE.gold} /> : null}
          </>
        ) : null}
      </div>

      <DubLayer sceneId="S08" />
      <SfxLayer cues={S08_SFX} />
    </SceneShell>
  );
};
