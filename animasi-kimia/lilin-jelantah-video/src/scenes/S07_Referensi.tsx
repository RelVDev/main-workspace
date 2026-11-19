import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character, JeliMascot} from '../characters/Character';
import {S07_SFX} from '../data/cues/S07.cues';
import {META} from '../data/meta';
import {PALETTE} from '../data/palette';
import referencesJson from '../data/references.json';
import {GodRays, LensFlare} from '../engine/Atmosphere';
import {FloorGlow, Sparkle} from '../engine/Lighting';
import type {MapLight} from '../engine/SceneLight';
import {SceneShell} from '../engine/SceneShell';
import {clamp01, smoothKeyframes} from '../lib/easing';
import {FONT_BODY} from '../lib/fonts';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {PottedPlant} from './shared/RoomDecor';
import {FloatingCard, LibraryHall, LibraryLamps, NearShelves, RollingLadder, S07Foreground, SortBucket} from './shared/S07Set';

const FEET_Y = 202;
const camYFor = (zoom: number, screenY = 206) => FEET_Y - (screenY - 135) / (zoom * 1.06);
const LADDER_X = 322;

export const S07_Referensi: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const tL2 = lineStartSec('S07_L02');
  const tL3 = lineStartSec('S07_L03');
  const tL4 = lineStartSec('S07_L04');
  const tL5 = lineStartSec('S07_L05');
  const tL6 = lineStartSec('S07_L06');

  const activeLineId = ['S07_L01', 'S07_L02', 'S07_L03', 'S07_L04', 'S07_L05', 'S07_L06', 'S07_L07'].find(
    (id) => frame >= Math.round(lineStartSec(id) * fps) && frame <= lineEnd(id),
  );

  const activeIndices =
    t >= tL2 && t < tL3
      ? [0, 1]
      : t >= tL3 && t < tL4
        ? [2, 3, 4]
        : t >= tL4 && t < tL5
          ? [5, 6]
          : t >= tL5 && t < tL6
            ? [7, 8]
            : [];

  const showBuckets = t >= tL6;

  const tL1 = lineStartSec('S07_L01');
  const tL7 = lineStartSec('S07_L07');

  // ── Disa: starts up on the rolling ladder, hops down, then walks between card beats ──
  const hopStart = tL2 - 1.1;
  const hopEnd = tL2 - 0.3;
  const hopU = clamp01((t - hopStart) / (hopEnd - hopStart));
  const disaY = t < hopStart ? 150 : t < hopEnd ? 150 + (FEET_Y - 150) * hopU : FEET_Y;
  const disaHop = t >= hopStart && t < hopEnd ? Math.sin(hopU * Math.PI) * 12 : 0;
  const disaX = smoothKeyframes(t, [
    [0, LADDER_X + 18],
    [hopStart, LADDER_X + 18],
    [hopEnd, 300],
    [tL2 + 1.2, 190],
    [tL3 - 0.2, 190],
    [tL3 + 1.4, 290],
    [tL6 - 0.6, 290],
    [tL6 + 0.8, 240],
  ]);
  const disaWalking = (t > hopEnd && t < tL2 + 1.2) || (t > tL3 - 0.2 && t < tL3 + 1.4) || (t > tL6 - 0.6 && t < tL6 + 0.8);

  // ── Camera ──
  // tilt-down from the gallery onto Disa on the ladder → follow her and the flying cards →
  // parallax drift → zoom 2× on the last cards → wide static on the two buckets
  const camZoom = smoothKeyframes(t, [
    [0, 1.3],
    [tL1 + 3.6, 1.32],
    [hopStart, 1.36],
    [tL2 + 1.2, 1.22],
    [tL3 - 0.2, 1.14],
    [tL4, 1.16],
    [tL5 - 0.4, 1.18],
    [tL5 + 1.0, 1.9],
    [tL6 - 0.6, 1.85],
    [tL6 + 0.8, 1.04],
    [tL7 + 5, 1.12],
  ]);
  const camX = smoothKeyframes(t, [
    [0, 300],
    [hopStart, 316],
    [tL2 + 1.2, 200],
    [tL3 - 0.2, 196],
    [tL3 + 1.6, 286],
    [tL5 - 0.4, 288],
    [tL5 + 1.0, 290],
    [tL6 - 0.6, 290],
    [tL6 + 0.8, 240],
  ]);
  // ladder framing keeps her (feet at y≈150) in frame; afterwards keep feet above the subtitles
  const tiltDown = smoothKeyframes(t, [
    [0, -70],
    [tL1 + 3.4, 0],
  ]);
  const onLadder = 1 - hopU;
  const camY =
    camYFor(camZoom) - onLadder * (FEET_Y - 150) * 0.85 + tiltDown -
    (t >= tL2 && t < tL3 ? Math.sin(clamp01((t - tL2) / 3) * Math.PI) * 10 : 0);
  const focus = smoothKeyframes(t, [
    [0, 0.3],
    [tL1 + 3.4, 0.9],
    [tL5 - 0.4, 0.9],
    [tL5 + 1.0, 1],
    [tL6 + 0.8, 0.5],
  ]);

  const hud = (
    <>
      <SceneBanner
        badge="BAGIAN 7 · REFERENSI ILMIAH"
        title="9 Pustaka Ilmiah & Pemisahan Sumber Data"
        accent={PALETTE.goldPale}
        startFrame={6}
        endFrame={108}
      />

      {!showBuckets && t >= tL2 - 1 ? (
        <div
          style={{
            position: 'absolute',
            top: 112,
            left: 110,
            right: 110,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          {referencesJson.map((ref, idx) => {
            const isHighlighted = activeIndices.includes(idx);
            const revealed = t >= tL2 - 0.5;
            return (
              <div
                key={ref.id}
                style={{
                  backgroundColor: isHighlighted ? 'rgba(42,21,48,0.96)' : 'rgba(27,16,32,0.82)',
                  border: `4px solid ${isHighlighted ? PALETTE.gold : PALETTE.woodLight}`,
                  boxShadow: isHighlighted ? `0 0 16px ${PALETTE.gold}55, 8px 8px 0 ${PALETTE.ink}` : `4px 4px 0 ${PALETTE.ink}`,
                  padding: '12px 16px',
                  opacity: revealed ? (isHighlighted ? 1 : 0.7) : 0,
                  transform: `scale(${isHighlighted ? 1.03 : 1})`,
                }}
              >
                <div style={{fontFamily: FONT_BODY, fontSize: 22, fontWeight: 700, color: PALETTE.gold, marginBottom: 4}}>
                  [{ref.id}] {ref.short}
                </div>
                <div style={{fontFamily: FONT_BODY, fontSize: 21, color: PALETTE.cream, lineHeight: 1.22}}>
                  {ref.topic}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {showBuckets ? (
        <div
          style={{
            position: 'absolute',
            top: 114,
            left: 180,
            right: 180,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 36,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(27,16,32,0.94)',
              border: `6px solid ${PALETTE.gold}`,
              boxShadow: `10px 10px 0 ${PALETTE.ink}`,
              padding: '26px 30px',
            }}
          >
            <div style={{fontFamily: FONT_BODY, fontSize: 24, fontWeight: 700, color: PALETTE.gold, marginBottom: 10}}>
              EMBER A · DATA PUSTAKA
            </div>
            <div style={{fontFamily: FONT_BODY, fontSize: 26, color: PALETTE.cream, lineHeight: 1.3}}>
              9 referensi jurnal, prosiding & buku ajar (898 ribu ton, 64,3%, konsep trigliserida & parafin).
            </div>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(27,16,32,0.94)',
              border: `6px solid ${PALETTE.teal}`,
              boxShadow: `10px 10px 0 ${PALETTE.ink}`,
              padding: '26px 30px',
            }}
          >
            <div style={{fontFamily: FONT_BODY, fontSize: 24, fontWeight: 700, color: PALETTE.teal, marginBottom: 10}}>
              EMBER B · PENGAMATAN KELOMPOK
            </div>
            <div style={{fontFamily: FONT_BODY, fontSize: 26, color: PALETTE.cream, lineHeight: 1.3}}>
              Dokumentasi video praktikum & catatan pengamatan kelompok sendiri — tidak tercampur!
            </div>
          </div>
        </div>
      ) : null}

      <SceneSubtitles sceneId="S07" bottomOffset={44} />
    </>
  );

  // ── Floating cards: each highlighted reference flies out of Disa's book up into the HUD ──
  const groupStart =
    t >= tL5 ? tL5 : t >= tL4 ? tL4 : t >= tL3 ? tL3 : t >= tL2 ? tL2 : Infinity;
  const flying = activeIndices.map((idx, k) => {
    const st = groupStart + 0.6 + k * 1.1;
    const u = clamp01((t - st) / 2.4);
    const tx = 60 + (idx % 3) * 180;
    const ty = 30 + Math.floor(idx / 3) * 18;
    const x0 = disaX + 8;
    const y0 = disaY - 34;
    const e = u * u * (3 - 2 * u);
    return {
      idx,
      x: x0 + (tx - x0) * e + Math.sin(u * Math.PI * 2 + idx) * 10 * (1 - u),
      y: y0 + (ty - y0) * e - Math.sin(u * Math.PI) * 20,
      op: t < st ? 0 : u < 0.85 ? 1 : 1 - (u - 0.85) / 0.15,
    };
  });
  // ambient drifting cards (magic library)
  const ambientCards = [0, 1, 2, 3, 4, 5].map((i) => ({
    x: 60 + i * 72 + Math.sin(frame / 70 + i * 2) * 12,
    y: 70 + (i % 3) * 22 + Math.cos(frame / 55 + i) * 6,
    tilt: Math.sin(frame / 40 + i) * 8,
  }));

  // Buckets: reference cards fall into amber, observation photos into teal
  const bucketOn = clamp01((t - (tL6 + 0.6)) / 0.6);
  const drop = (start: number, fromX: number, toX: number) => {
    const u = clamp01((t - start) / 1.0);
    return {x: fromX + (toX - fromX) * u, y: 40 + (190 - 40) * u * u, op: t < start ? 0 : u < 0.92 ? 1 : 0};
  };
  const drops = [
    {...drop(tL6 + 1.0, 120, 170), c: PALETTE.gold},
    {...drop(tL6 + 1.6, 210, 172), c: PALETTE.gold},
    {...drop(tL6 + 2.6, 360, 310), c: PALETTE.teal},
    {...drop(tL6 + 3.2, 270, 308), c: PALETTE.teal},
  ];

  const mapLights: MapLight[] = [
    {x: 96, y: 70, r: 96, color: PALETTE.goldPale, intensity: 0.8, banded: false},
    {x: 384, y: 70, r: 96, color: PALETTE.goldPale, intensity: 0.75, banded: false},
    {x: 150, y: 44, r: 62, color: PALETTE.gold, intensity: 0.8, flicker: 0.05, seed: 'l1'},
    {x: 330, y: 44, r: 62, color: PALETTE.gold, intensity: 0.8, flicker: 0.05, seed: 'l2'},
    {x: disaX, y: disaY - 28, r: 66, sx: 1.1, color: PALETTE.goldPale, intensity: 1},
    {x: 240, y: 214, r: 160, sx: 2, color: PALETTE.amber, intensity: 0.4, banded: false},
    ...flying.map((f) => ({x: f.x, y: f.y, r: 26, color: PALETTE.goldPale, intensity: 0.7 * f.op})),
    {x: 172, y: 192, r: 44, color: PALETTE.gold, intensity: 0.8 * bucketOn},
    {x: 310, y: 192, r: 44, color: PALETTE.teal, intensity: 0.8 * bucketOn},
  ];

  return (
    <SceneShell
      grade="library"
      camX={camX}
      camY={camY}
      zoom={camZoom}
      focus={focus}
      farBlur={2.4}
      midBlur={1}
      intro="truckR"
      outro="push"
      handheld={1}
      farBg={<LibraryHall />}
      midBg={<LibraryLamps xs={[150, 330]} />}
      floor3d={{y: FEET_Y, pattern: 'planks', tile: 30, gloss: 0.3, glossColor: PALETTE.goldPale, seed: 's07'}}
      lightMap={{ambient: '#2C160E', darkness: 0.46, lights: mapLights}}
      keyLight={{keyX: 96, keyY: 40, rimColor: PALETTE.goldPale, rimStrength: 0.9, shadowStrength: 0.55}}
      rays={{color: PALETTE.goldPale, opacity: 0.14, x: 96, y: 26, angleDeg: -10, spread: 30, length: 260}}
      bloom={{intensity: 0.3}}
      fog={{y: 150, height: 70, color: PALETTE.goldPale, opacity: 0.07}}
      lights={
        <>
          <GodRays x={384} y={26} color={PALETTE.goldPale} opacity={0.16} angle={112} spread={28} length={250} seed="w2" />
          <FloorGlow x={disaX} y={FEET_Y + 4} rx={40} ry={8} color={PALETTE.goldPale} opacity={0.3} />
          {bucketOn > 0 ? (
            <>
              <FloorGlow x={172} y={FEET_Y + 2} rx={30} ry={7} color={PALETTE.gold} opacity={0.4 * bucketOn} />
              <FloorGlow x={310} y={FEET_Y + 2} rx={30} ry={7} color={PALETTE.teal} opacity={0.4 * bucketOn} />
            </>
          ) : null}
          {flying.map((f) =>
            f.op > 0.05 ? <LensFlare key={f.idx} x={f.x} y={f.y} color={PALETTE.goldPale} intensity={0.35 * f.op} width={70} seed={`fc${f.idx}`} /> : null,
          )}
        </>
      }
      dust={{count: 54, color: PALETTE.goldPale, seed: 's07-dust', opacity: 0.6}}
      nearBokeh={{count: 6, color: PALETTE.gold, opacity: 0.25}}
      foreground={<S07Foreground />}
      foregroundBlur={3}
      hud={hud}
    >
      <NearShelves />
      <RollingLadder x={LADDER_X} floorY={FEET_Y} topY={64} />
      <PottedPlant x={60} y={FEET_Y} h={26} />

      {ambientCards.map((c, i) => (
        <FloatingCard key={`a${i}`} x={c.x} y={c.y} tilt={c.tilt} opacity={showBuckets ? 0.25 : 0.55} glow={i % 2 ? PALETTE.gold : PALETTE.goldPale} />
      ))}
      {flying.map((f) => (f.op > 0.02 ? <FloatingCard key={`f${f.idx}`} x={f.x} y={f.y} opacity={f.op} label={`[${f.idx + 1}]`} /> : null))}

      {bucketOn > 0 ? (
        <div style={{opacity: bucketOn}}>
          <SortBucket x={172} y={FEET_Y} color={PALETTE.gold} label="PUSTAKA" glow={bucketOn} />
          <SortBucket x={310} y={FEET_Y} color={PALETTE.teal} label="AMATI" glow={bucketOn} />
          {drops.map((d, i) => (d.op > 0 ? <FloatingCard key={`d${i}`} x={d.x} y={d.y} glow={d.c} /> : null))}
        </div>
      ) : null}

      <Character
        id="disa"
        x={disaX}
        y={disaY}
        flip={(t >= tL3 - 0.2 && t < tL3 + 1.4) ? false : t > hopEnd && t < tL2 + 1.2 ? true : t >= tL4 && t < tL6}
        pose={disaWalking ? 'walk' : showBuckets ? 'point' : t < hopStart ? 'wave' : 'talk'}
        expr="happy"
        lineId={activeLineId}
        jumpY={disaHop}
        emote={
          t >= tL6 + 4.4 && t < tL6 + 5.6
            ? {type: 'sparkle', startFrame: Math.round((tL6 + 4.4) * fps), durationFrames: 36}
            : t >= tL4 + 0.4 && t < tL4 + 1.6
              ? {type: 'idea', startFrame: Math.round((tL4 + 0.4) * fps), durationFrames: 34}
              : undefined
        }
        z={20}
      />
      {META.showMascotJeli ? <JeliMascot x={disaX + 34} y={FEET_Y - 14} mood="happy" z={22} /> : null}
      {showBuckets ? (
        <>
          <Sparkle x={172} y={170} size="sm" color={PALETTE.gold} />
          <Sparkle x={310} y={170} size="sm" color={PALETTE.teal} phase={10} />
        </>
      ) : null}
      <DubLayer sceneId="S07" />
      <SfxLayer cues={S07_SFX} />
    </SceneShell>
  );
};
