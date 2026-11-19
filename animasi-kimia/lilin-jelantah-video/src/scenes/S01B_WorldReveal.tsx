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
import {LensFlare} from '../engine/Atmosphere';
import {FloorGlow, Sparkle, SpotCone} from '../engine/Lighting';
import {SceneShell} from '../engine/SceneShell';
import type {MapLight} from '../engine/SceneLight';
import {VoxelModel, candleJarModel, extrudedText} from '../engine/Voxel';
import {clamp01, smoothKeyframes} from '../lib/easing';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {lineEnd, lineStart, lineStartSec} from '../lib/seconds';
import {NamePlate} from '../ui/NamePlate';
import {SceneSubtitles} from '../ui/Subtitles';
import {StringLights} from './shared/RoomDecor';
import {AnimatedFlame, PixelDoor} from './shared/StageElements';
import {Footlights, LightingTruss, MagicBackdrop, VelvetCurtainsV2} from './shared/Stage3D';

const SEMICIRCLE_POS: Array<{id: CharId; x: number; y: number}> = [
  {id: 'ais', x: 62, y: 214},
  {id: 'disa', x: 104, y: 210},
  {id: 'sofi', x: 148, y: 207},
  {id: 'farel', x: 193, y: 205},
  {id: 'malika', x: 240, y: 204},
  {id: 'noya', x: 287, y: 205},
  {id: 'marsha', x: 332, y: 207},
  {id: 'ayuya', x: 376, y: 210},
  {id: 'lovyta', x: 418, y: 214},
];

const TITLE_1 = 'KIMIA DALAM KEHIDUPAN SEHARI-HARI';
const DOOR_X = 66; // door left edge (art px)

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
  const tL2 = lineStartSec('S01B_L02');
  const tL3 = lineStartSec('S01B_L03');
  const tL4 = lineStartSec('S01B_L04');

  // Opening: the world materialises out of a warm defocus (hand-reveal is edited manually)
  const enterOpacity = interpolate(t, [0, 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rackBlur = interpolate(t, [0, 1.6], [10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // ── Camera choreography ────────────────────────────────────────────────
  // 0-2   tight on Malika, rack focus     2-4.5 slow push-in (L01)
  // 5.6-9.6 crane/pull back to the wide stage as the curtains rise
  // 10-20 title: slow arc across the line-up      20.3+ dolly to Noya, punch-in at 24
  // 27.8+ whip toward the glowing door, outro pushes through it
  const zoom = smoothKeyframes(t, [
    [0, 2.55],
    [1.6, 2.35],
    [4.8, 2.5],
    [5.6, 2.5],
    [9.8, 1.0],
    [tL2 + 0.4, 1.0],
    [tL2 + 9.5, 1.1],
    [tL3 + 1.0, 1.55],
    [23.9, 1.6],
    [24.4, 1.95],
    [tL4 - 0.1, 1.95],
    [tL4 + 1.3, 1.7],
    [31.3, 1.85],
  ]);
  const camX = smoothKeyframes(t, [
    [0, 240],
    [5.6, 240],
    [9.8, 240],
    [tL2 + 0.4, 226],
    [tL2 + 9.5, 254],
    [tL3 + 1.0, 284],
    [24.4, 287],
    [tL4 - 0.1, 287],
    [tL4 + 1.3, 150],
    [31.3, 132],
  ]);
  const camY = smoothKeyframes(t, [
    [0, 168],
    [4.8, 170],
    [5.6, 170],
    [9.8, 134],
    [tL2 + 9.5, 132],
    [tL3 + 1.0, 174],
    [24.4, 178],
    [tL4 - 0.1, 178],
    [tL4 + 1.3, 172],
    [31.3, 170],
  ]);
  const focus = smoothKeyframes(t, [
    [0, 1],
    [5.6, 1],
    [9.8, 0.45],
    [tL3, 0.45],
    [tL3 + 1.0, 1],
  ]);

  const curtainOpen = smoothKeyframes(t, [
    [0, 0.12],
    [5.6, 0.18],
    [9.0, 1.0],
  ]);
  const letterbox = smoothKeyframes(t, [
    [0, 1.25],
    [5.6, 1.25],
    [9.8, 1.0],
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

  // Teal orb: floats over Malika's shoulder, then arcs into the door
  const orbX =
    smoothKeyframes(t, [
      [0, 266],
      [tL4 + 0.8, 266],
      [31.0, DOOR_X + 17],
    ]) + (t < tL4 + 0.8 ? Math.sin(frame / 18) * 3 : 0);
  const orbY =
    smoothKeyframes(t, [
      [0, 132],
      [tL4 + 0.8, 132],
      [tL4 + 1.8, 104],
      [31.0, 158],
    ]) + (t < tL4 + 0.8 ? Math.cos(frame / 15) * 2 : 0);

  const groupJump = t >= tL2 + 0.1 && t <= tL2 + 1.1 ? Math.max(0, Math.sin(((t - tL2 - 0.1) / 1.0) * Math.PI) * 14) : 0;

  // Spotlights switch on one by one while the line-up settles (14-22 s in the plan)
  const spotOn = (idx: number) => clamp01((t - (tL2 + 2.2 + idx * 0.35)) / 0.25);
  const doorOn = clamp01((t - (tL4 - 0.6)) / 0.6);

  // Hero voxel candle spins above the line-up while the title is up
  const heroOp = interpolate(t, [tL2 + 0.6, tL2 + 1.4, tL2 + 8.6, tL2 + 9.4], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const heroCandle = React.useMemo(() => candleJarModel(PALETTE.cream, PALETTE.amber, 0.78), []);

  // ── Title: 3D extruded pixel letters dropping one by one ──────────────
  const titleOp = interpolate(t, [tL2 - 0.1, tL2 + 0.4, tL2 + 7.6, tL2 + 8.4], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subOp = interpolate(t, [tL2 + 1.6, tL2 + 2.2], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  const hud = (
    <>
      {titleOp > 0.01 ? (
        <div style={{position: 'absolute', top: 120, left: 0, right: 0, textAlign: 'center', opacity: titleOp}}>
          <div style={{fontFamily: FONT_TITLE, fontSize: 52, lineHeight: 1.25, letterSpacing: 2, whiteSpace: 'nowrap'}}>
            {TITLE_1.split('').map((ch, i) => {
              const f = frame - Math.round((tL2 + i * 0.035) * fps);
              const s = spring({frame: Math.max(0, f), fps, config: {damping: 11, stiffness: 170, mass: 0.6}});
              const y = (1 - s) * -160;
              return (
                <span
                  key={i}
                  style={{
                    display: 'inline-block',
                    color: PALETTE.goldPale,
                    opacity: f < 0 ? 0 : 1,
                    transform: `translate3d(0, ${y.toFixed(1)}px, 0)`,
                    textShadow: extrudedText(5, PALETTE.amberDeep, PALETTE.woodDark, 3),
                    minWidth: ch === ' ' ? 26 : undefined,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
          <div
            style={{
              display: 'inline-block',
              marginTop: 34,
              opacity: subOp,
              transform: `translate3d(0, ${((1 - subOp) * 16).toFixed(1)}px, 0)`,
              background: 'linear-gradient(180deg, rgba(42,21,48,0.92) 0%, rgba(27,16,32,0.94) 100%)',
              border: `4px solid ${PALETTE.gold}`,
              outline: `4px solid ${PALETTE.ink}`,
              boxShadow: `0 0 40px rgba(255,178,90,0.35), 8px 8px 0 ${PALETTE.ink}`,
              padding: '14px 34px',
              fontFamily: FONT_BODY,
              fontSize: 40,
              fontWeight: 700,
              color: PALETTE.cream,
              textShadow: `3px 3px 0 ${PALETTE.ink}`,
            }}
          >
            Lilin Aromatis dari Minyak Jelantah
          </div>
        </div>
      ) : null}

      {t >= 6.4 && t <= 10.0 ? (
        <div style={{position: 'absolute', top: 120, right: 80}}>
          <NamePlate
            name={CHARACTERS[ALL_CHAR_IDS[1 + Math.min(7, Math.floor((t - 6.4) / 0.42))]].displayName}
            color={CHARACTERS[ALL_CHAR_IDS[1 + Math.min(7, Math.floor((t - 6.4) / 0.42))]].accentColor}
            sublabel={CHARACTERS[ALL_CHAR_IDS[1 + Math.min(7, Math.floor((t - 6.4) / 0.42))]].role}
          />
        </div>
      ) : null}

      <SceneSubtitles sceneId="S01B" bottomOffset={92} />
    </>
  );

  // ── Light-map: plum darkness with pools from spotlights, orb and door ──
  const mapLights: MapLight[] = [
    {x: 240, y: 168, r: 92, sx: 1.4, color: PALETTE.goldPale, intensity: 0.9, seed: 'main'},
    // backlight halo behind Malika's head: separates dark hair from the dark stage
    {x: 244, y: 128, r: 54, sx: 1.3, color: PALETTE.gold, intensity: 0.7 * (1 - clamp01((t - 6) / 3)) + 0.25, banded: false},
    {x: 240, y: 70, r: 170, sx: 1.7, color: PALETTE.amber, intensity: 0.3, banded: false},
    // footlight wash from the stage lip — lifts faces without killing the contrast
    {x: 240, y: 250, r: 150, sx: 2.2, color: PALETTE.gold, intensity: 0.55, banded: false},
    {x: orbX, y: orbY, r: 70, color: PALETTE.teal, intensity: 0.9, flicker: 0.06, seed: 'orb'},
    ...SEMICIRCLE_POS.filter((p) => p.id !== 'malika').map((p, i) => ({
      x: p.x,
      y: p.y - 22,
      r: 40,
      sx: 0.9,
      color: PALETTE.goldPale,
      intensity: 0.75 * spotOn(i),
    })),
    {x: DOOR_X + 17, y: 166, r: 90, color: PALETTE.gold, intensity: 0.2 + 0.8 * doorOn, flicker: 0.08, seed: 'door'},
  ];

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
        focus={focus}
        farBlur={3}
        midBlur={1.2}
        intro="none"
        outro="push"
        handheld={1}
        farBg={<MagicBackdrop />}
        midBg={
          <>
            {/* warm spot splash on the back of the stage — silhouettes the cast against light */}
            <div
              style={{
                position: 'absolute',
                left: 240 - 110,
                top: 40,
                width: 220,
                height: 190,
                borderRadius: '50%',
                background: `radial-gradient(ellipse, ${PALETTE.amber}AA 0%, ${PALETTE.crimson}55 45%, transparent 72%)`,
                opacity: 0.85,
              }}
            />
            <LightingTruss y={4} on={[spotOn(1), spotOn(3), 1, spotOn(5), spotOn(7)]} />
            <StringLights y={26} count={16} sag={14} />
            <VelvetCurtainsV2 openProgress={curtainOpen} />
          </>
        }
        floor3d={{y: 196, pattern: 'stage', tile: 28, gloss: 0.5, glossColor: PALETTE.gold, seed: 's01b'}}
        lightMap={{ambient: '#2A1240', darkness: 0.5, lights: mapLights}}
        keyLight={{keyX: 240, keyY: 10, rimColor: PALETTE.gold, rimStrength: 0.9, shadowStrength: 0.6}}
        lights={
          <>
            <SpotCone x={240} topY={10} bottomY={214} spreadW={92} color={PALETTE.goldPale} opacity={0.2} />
            {SEMICIRCLE_POS.filter((p) => p.id !== 'malika').map((p, i) =>
              spotOn(i) > 0.02 ? (
                <SpotCone key={p.id} x={p.x} topY={14} bottomY={p.y + 4} spreadW={26} color={PALETTE.goldPale} opacity={0.12 * spotOn(i)} />
              ) : null,
            )}
            <FloorGlow x={240} y={206} rx={80} ry={12} color={PALETTE.amber} opacity={0.3} />
            {doorOn > 0 ? <FloorGlow x={DOOR_X + 30} y={204} rx={50} ry={9} color={PALETTE.gold} opacity={0.4 * doorOn} /> : null}
            {t >= 1.5 ? <LensFlare x={orbX} y={orbY} color={PALETTE.teal} intensity={0.55} width={150} seed="orb-lf" /> : null}
          </>
        }
        rays={{color: PALETTE.goldPale, opacity: 0.16, x: 240, y: -6, spread: 40}}
        bloom={{intensity: 0.3}}
        dust={{count: 46, color: PALETTE.cream, seed: 's01b-dust', opacity: 0.55}}
        nearBokeh={{count: 6, color: PALETTE.gold, opacity: 0.28}}
        foreground={<Footlights y={262} />}
        foregroundBlur={2.5}
        vignette={0.42}
        grain={0.07}
        letterbox={letterbox}
        hud={hud}
      >
        {t >= 5.5 ? <PixelDoor x={DOOR_X} y={132} glow={PALETTE.gold} label="LAB KIMIA" /> : null}

        {heroOp > 0.01 ? (
          <div style={{opacity: heroOp}}>
            <VoxelModel voxels={heroCandle} x={240} y={124 + Math.sin(frame / 14) * 2} angle={frame * 0.045} unit={2} box={44} tilt={0.5} z={8} />
            <AnimatedFlame x={240} y={124 - 40 + Math.sin(frame / 14) * 2} scale={1} />
          </div>
        ) : null}

        {SEMICIRCLE_POS.map((pos, idx) => {
          const popT = pos.id === 'malika' ? 0 : 6.4 + (idx > 4 ? idx - 1 : idx) * 0.4;
          if (pos.id !== 'malika' && t < popT) return null;

          const popBounce =
            pos.id === 'malika'
              ? 0
              : Math.max(0, (1 - spring({fps, frame: Math.max(0, Math.round((t - popT) * fps)), config: {damping: 12}})) * 12);

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
              flip={pos.id === 'malika' && t >= tL4 - 0.2}
              pose={pose}
              expr="happy"
              lineId={charLine}
              dim={dim}
              jumpY={groupJump + popBounce}
              z={pos.id === 'malika' ? 20 : 12}
            />
          );
        })}

        {META.showMascotJeli && t >= tL2 + 0.2 ? <JeliMascot x={312} y={196 - groupJump} mood="happy" z={22} /> : null}

        {t >= 1.5 ? <Sparkle x={orbX} y={orbY} size="md" color={PALETTE.teal} glowRadius={20} /> : null}
      </SceneShell>
      <DubLayer sceneId="S01B" />
      <SfxLayer cues={S01B_SFX} />
    </div>
  );
};
