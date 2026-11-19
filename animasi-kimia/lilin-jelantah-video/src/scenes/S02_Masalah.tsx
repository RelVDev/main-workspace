import React from 'react';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character, JeliMascot} from '../characters/Character';
import {S02_SFX} from '../data/cues/S02.cues';
import {META} from '../data/meta';
import {PALETTE} from '../data/palette';
import {LensFlare} from '../engine/Atmosphere';
import {FloorGlow} from '../engine/Lighting';
import {SceneShell} from '../engine/SceneShell';
import type {MapLight} from '../engine/SceneLight';
import {PixelMolecule3D, triglycerideAtoms} from '../engine/Voxel';
import {clamp01, smoothKeyframes} from '../lib/easing';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {HangingLamp, KitchenBackdrop, PottedPlant} from './shared/RoomDecor';
import {
  IdeaBubble,
  KitchenCounter,
  KitchenForeground,
  KitchenMid,
  OilStream,
  PanSizzle,
  PropImg,
  RiverWorld,
  SurfaceShimmer,
  Thermometer,
} from './shared/S02Set';

const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

export const S02_Masalah: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const tL2 = lineStartSec('S02_L02');
  const tL3 = lineStartSec('S02_L03');
  const tL4 = lineStartSec('S02_L04');
  const tL5 = lineStartSec('S02_L05');
  const tL6 = lineStartSec('S02_L06');
  const tL7 = lineStartSec('S02_L07');
  const tL8 = lineStartSec('S02_L08');
  const tL9 = lineStartSec('S02_L09');

  const isRiver = t >= tL4 && t < tL6;
  const isPanHeat = t >= tL6 && t < tL7;
  const isHope = t >= tL7;

  const activeLineId = [
    'S02_L01',
    'S02_L02',
    'S02_L03',
    'S02_L04',
    'S02_L05',
    'S02_L06',
    'S02_L07',
    'S02_L08',
    'S02_L09',
  ].find((id) => frame >= Math.round(lineStartSec(id) * fps) && frame <= lineEnd(id));

  // ── Camera ────────────────────────────────────────────────────────────
  // Kitchen: establish → push to Malika & bottle → pan to the sizzling pan → track Malika to the
  // sink → PLUNGE into the drain. River: crane down through the surface, drift with the fish,
  // punch in on trapped bubbles, pan to the soil bank, rise out. Kitchen again: tight on the pan
  // (heat), then open up warm for the hope beat, rack to Noya entering.
  const kX: Array<[number, number]> = [
    [0, 222],
    [4.2, 196],
    [tL2 + 0.8, 306],
    [tL2 + 4.6, 312],
    [tL3 - 0.4, 250],
    [tL3 + 1.3, 330],
    [tL3 + 3.6, 364],
    [tL4 - 1.0, 372],
    [tL4 - 0.02, 384],
    // river
    [tL4, 240],
    [tL4 + 2.2, 206],
    [tL4 + 4.6, 176],
    [tL4 + 7.4, 176],
    [tL5 - 0.4, 150],
    [tL5 + 1.2, 120],
    [tL5 + 4.2, 150],
    [tL6 - 0.02, 200],
    // kitchen: heat close-up
    [tL6, 296],
    [tL6 + 6, 300],
    [tL7 - 0.6, 290],
    [tL7 + 1.0, 236],
    [tL7 + 3.8, 176],
    [tL8 - 0.2, 176],
    [tL8 + 1.2, 232],
    [tL9 - 0.2, 246],
    [tL9 + 1.4, 268],
  ];
  const kY: Array<[number, number]> = [
    [0, 140],
    [4.2, 150],
    [tL2 + 0.8, 140],
    [tL3 - 0.4, 146],
    [tL3 + 1.3, 152],
    [tL3 + 3.6, 150],
    [tL4 - 0.02, 156],
    [tL4, 52],
    [tL4 + 2.2, 150],
    [tL4 + 4.6, 112],
    [tL4 + 7.4, 112],
    [tL5 - 0.4, 140],
    [tL5 + 1.2, 148],
    [tL5 + 4.2, 140],
    [tL6 - 0.9, 150],
    [tL6 - 0.02, 70],
    [tL6, 128],
    [tL6 + 6, 124],
    [tL7 - 0.6, 136],
    [tL7 + 1.0, 140],
    [tL7 + 3.8, 152],
    [tL8 - 0.2, 152],
    [tL8 + 1.2, 156],
    [tL9 + 1.4, 156],
  ];
  const kZ: Array<[number, number]> = [
    [0, 1.05],
    [4.2, 1.5],
    [tL2 + 0.8, 1.85],
    [tL2 + 4.6, 2.0],
    [tL3 - 0.4, 1.25],
    [tL3 + 1.3, 1.55],
    [tL3 + 3.6, 1.95],
    [tL4 - 1.0, 2.0],
    [tL4 - 0.02, 3.2],
    [tL4, 1.75],
    [tL4 + 2.2, 1.12],
    [tL4 + 4.6, 1.9],
    [tL4 + 7.4, 1.9],
    [tL5 - 0.4, 1.2],
    [tL5 + 1.2, 1.65],
    [tL5 + 4.2, 1.35],
    [tL6 - 0.9, 1.3],
    [tL6 - 0.02, 1.6],
    [tL6, 1.9],
    [tL6 + 6, 2.1],
    [tL7 - 0.6, 2.0],
    [tL7 + 1.0, 1.1],
    [tL7 + 3.8, 1.6],
    [tL8 - 0.2, 1.6],
    [tL8 + 1.2, 1.28],
    [tL9 - 0.2, 1.34],
    [tL9 + 1.4, 1.38],
  ];
  // Hard scene-cuts (drain → river, surface → kitchen) must not interpolate across the cut.
  const segKey = (keys: Array<[number, number]>) => {
    const seg = t < tL4 ? 0 : t < tL6 ? 1 : 2;
    const bounds: Array<[number, number]> = [
      [-1, tL4 - 0.001],
      [tL4, tL6 - 0.001],
      [tL6, 999],
    ];
    const [a, b] = bounds[seg];
    return smoothKeyframes(t, keys.filter(([k]) => k >= a && k <= b));
  };
  const camX = segKey(kX);
  const camY = segKey(kY);
  const camZoom = segKey(kZ);
  const focus = isRiver ? 0.6 : smoothKeyframes(t, [[0, 0.5], [4.2, 1], [tL7 + 1.0, 0.5], [tL7 + 3.8, 1], [tL9, 1], [tL9 + 1.4, 0.7]]);

  const shake =
    (t >= tL3 + 4.5 && t <= tL3 + 4.9 ? 0.7 : 0) +
    (t >= tL4 + 4.5 && t <= tL4 + 4.85 ? 0.6 : 0) +
    (t >= tL6 + 2.4 && t <= tL6 + 2.8 ? 0.7 : 0);

  // Plunge/rise "dip" at the two cuts (sells the whoosh SFX)
  const dip = Math.max(
    1 - Math.abs(t - tL4) / 0.22,
    1 - Math.abs(t - tL6) / 0.22,
    0,
  );

  // ── Grade: kitchen ⇄ river ────────────────────────────────────────────
  const riverMix = Math.min(ramp(t, tL4 - 0.5, tL4 + 0.6), 1 - ramp(t, tL6 - 0.5, tL6 + 0.6));

  // ── Story state ──────────────────────────────────────────────────────
  // L03 she carries the bottle to the sink; after the river cut she stands beside the stove (L06)
  const malikaX =
    t < tL6
      ? smoothKeyframes(t, [
          [0, 140],
          [tL3 - 0.2, 140],
          [tL3 + 1.0, 350],
        ])
      : smoothKeyframes(t, [
          [tL6, 252],
          [tL7 - 0.2, 252],
          [tL7 + 0.9, 150],
        ]);
  const malikaWalking = (t >= tL3 - 0.2 && t <= tL3 + 0.95) || (t >= tL7 - 0.2 && t <= tL7 + 0.85);

  const oilDarkness = interpolate(t, [tL2, tL2 + 5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sizzle = Math.max(ramp(t, tL2 - 0.2, tL2 + 0.5) * (1 - ramp(t, tL2 + 5.5, tL2 + 6.5)), isPanHeat ? ramp(t, tL6 + 1.6, tL6 + 2.2) : 0);
  const stoveOn = Math.max(ramp(t, tL2 - 0.4, tL2) * (1 - ramp(t, tL3 - 0.5, tL3)), isPanHeat ? 1 : 0);
  const pouring = t >= tL3 + 1.2 && t <= tL3 + 4.2 ? Math.min(ramp(t, tL3 + 1.2, tL3 + 1.5), 1 - ramp(t, tL3 + 3.9, tL3 + 4.2)) : 0;
  const filmCover = ramp(t, tL4 + 0.4, tL4 + 4.5) * 0.85 + 0.12;
  const soilStain = ramp(t, tL5 + 0.4, tL5 + 3.8);
  const heatLevel = isPanHeat ? ramp(t, tL6 + 0.4, tL6 + 3.0) : 0;
  const hope = ramp(t, tL7 - 0.2, tL7 + 1.2);

  const tri = React.useMemo(() => triglycerideAtoms(5), []);

  const hud = (
    <>
      <SceneBanner
        badge="BAGIAN 2 · MASALAH"
        title="Mengapa Minyak Jelantah Perlu Dikelola?"
        accent={PALETTE.amber}
        startFrame={8}
        endFrame={110}
      />

      {t >= tL2 && t < tL3 ? (
        <div
          style={{
            position: 'absolute',
            top: 118,
            left: 110,
            backgroundColor: 'rgba(27,16,32,0.92)',
            border: `4px solid ${PALETTE.gold}`,
            boxShadow: `6px 6px 0 ${PALETTE.ink}`,
            padding: '16px 26px',
            fontFamily: FONT_BODY,
            fontSize: 28,
            fontWeight: 700,
            color: PALETTE.cream,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span style={{color: PALETTE.gold}}>Minyak Goreng</span>
          <span>→</span>
          <span style={{color: PALETTE.amber}}>Dipakai Berulang</span>
          <span>→</span>
          <span style={{color: PALETTE.red}}>Minyak Jelantah</span>
        </div>
      ) : null}

      {isRiver ? (
        <div
          style={{
            position: 'absolute',
            top: 112,
            right: 80,
            backgroundColor: 'rgba(21,50,67,0.93)',
            border: `4px solid ${PALETTE.red}`,
            boxShadow: `6px 6px 0 ${PALETTE.ink}`,
            padding: '18px 26px',
            maxWidth: 720,
          }}
        >
          <div style={{fontFamily: FONT_TITLE, fontSize: 15, color: PALETTE.red, marginBottom: 8}}>
            ✕ PERTUKARAN O₂ TERHAMBAT
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 28, color: PALETTE.cream, lineHeight: 1.35}}>
            {t >= tL5
              ? 'Kajian lingkungan membahas dampaknya pada kualitas air & tanah.'
              : 'Lapisan minyak menutup permukaan air dan mengganggu organisme.'}
          </div>
        </div>
      ) : null}

      {isPanHeat ? (
        <div
          style={{
            position: 'absolute',
            top: 114,
            left: 90,
            backgroundColor: 'rgba(27,16,32,0.93)',
            border: `4px solid ${PALETTE.red}`,
            boxShadow: `6px 6px 0 ${PALETTE.ink}`,
            padding: '18px 26px',
            maxWidth: 640,
          }}
        >
          <div style={{fontFamily: FONT_TITLE, fontSize: 16, color: PALETTE.red, marginBottom: 8}}>
            ✕ JANGAN DIGORENG BERULANG
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 28, color: PALETTE.cream, lineHeight: 1.35}}>
            Pemanasan berulang memicu senyawa hasil degradasi minyak.
          </div>
        </div>
      ) : null}

      {t >= tL8 ? (
        <div
          style={{
            position: 'absolute',
            top: 116,
            left: 160,
            right: 160,
            textAlign: 'center',
            backgroundColor: 'rgba(27,16,32,0.93)',
            border: `5px solid ${PALETTE.teal}`,
            padding: '22px 32px',
            boxShadow: `8px 8px 0 ${PALETTE.ink}`,
          }}
        >
          <div style={{fontFamily: FONT_TITLE, fontSize: 18, color: PALETTE.teal, marginBottom: 10}}>
            PERTANYAAN PROYEK
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 32, fontWeight: 700, color: PALETTE.cream, lineHeight: 1.32}}>
            Bagaimana jelantah diolah menjadi lilin aromatis yang berguna dengan konsep kimia yang tepat?
          </div>
        </div>
      ) : null}

      <SceneSubtitles sceneId="S02" bottomOffset={40} />
    </>
  );

  // ── Lighting ─────────────────────────────────────────────────────────
  const kitchenLights: MapLight[] = [
    // morning window spill + sun patch on the floor
    {x: 92, y: 66, r: 150, sx: 1.2, color: PALETTE.goldPale, intensity: 0.95 + 0.15 * hope, banded: false},
    {x: 182, y: 206, r: 46, sx: 2.4, color: PALETTE.gold, intensity: 0.85},
    // hanging lamp pool over the counter
    {x: 300, y: 150, r: 92, sx: 1.6, color: PALETTE.goldPale, intensity: 0.6 + 0.3 * hope, banded: false},
    {x: 300, y: 158, r: 44, sx: 1.4, color: PALETTE.goldPale, intensity: 0.45},
    // stove flame + glow on the pan
    {x: 310, y: 148, r: 34, color: PALETTE.cyan, intensity: 0.65 * stoveOn, flicker: 0.2, seed: 'stove'},
    {x: 310, y: 140, r: 46, color: PALETTE.amber, intensity: 0.5 * sizzle + 0.4 * heatLevel, flicker: 0.15, seed: 'pan'},
    // the hope beat: a warm fill blooming through the kitchen
    {x: 240, y: 150, r: 200, sx: 1.6, color: PALETTE.gold, intensity: 0.45 * hope, banded: false},
  ];
  const riverLights: MapLight[] = [
    {x: 400, y: 60, r: 240, sx: 1.5, color: PALETTE.cyan, intensity: 1.0 - filmCover * 0.35, banded: false},
    {x: 140, y: 100, r: 190, sx: 1.8, color: PALETTE.teal, intensity: 0.75 - filmCover * 0.3, banded: false},
    {x: 240, y: 230, r: 160, sx: 2.2, color: PALETTE.tealMid, intensity: 0.5, banded: false},
    // sunlight on the river bank (soil beat)
    {x: 40, y: 110, r: 120, sx: 1.2, color: PALETTE.goldPale, intensity: 0.9 * ramp(t, tL5 - 0.8, tL5 + 0.4)},
  ];

  return (
    <SceneShell
      grade="kitchen"
      gradeTo="river"
      gradeMix={riverMix}
      camX={camX}
      camY={camY}
      zoom={camZoom}
      focus={focus}
      shake={shake}
      intro="pull"
      outro="push"
      handheld={isRiver ? 1.6 : 1}
      farBlur={isRiver ? 1.6 : 2.4}
      midBlur={0.9}
      farBg={isRiver ? null : <KitchenBackdrop />}
      midBg={isRiver ? null : <KitchenMid sun={1 + 0.3 * hope} />}
      floor3d={isRiver ? false : {y: 200, pattern: 'planks', tile: 30, gloss: 0.25, glossColor: PALETTE.goldPale, seed: 's02k'}}
      lightMap={{
        ambient: isRiver ? '#06202E' : '#3B2238',
        darkness: isRiver ? 0.36 : 0.44 - 0.1 * hope,
        lights: isRiver ? riverLights : kitchenLights,
      }}
      keyLight={
        isRiver
          ? {keyX: 380, keyY: 40, rimColor: PALETTE.cyan, rimStrength: 0.7, shadowStrength: 0.2}
          : {keyX: 92, keyY: 50, rimColor: PALETTE.goldPale, rimStrength: 0.9, shadowStrength: 0.55}
      }
      rays={
        isRiver
          ? {color: PALETTE.cyan, opacity: 0.12 * (1.2 - filmCover), x: 400, y: 70, angleDeg: 34, spread: 30, length: 220}
          : {color: PALETTE.goldPale, opacity: 0.2 + 0.06 * hope, x: 96, y: 40, angleDeg: -10, spread: 36, length: 260}
      }
      lights={
        isRiver ? (
          <SurfaceShimmer cover={filmCover} />
        ) : (
          <>
            <HangingLamp x={300} cordLen={18} bulbColor={PALETTE.goldPale} coneHeight={130} opacity={0.12} />
            <FloorGlow x={182} y={208} rx={70} ry={10} color={PALETTE.gold} opacity={0.22} />
            {stoveOn > 0.05 ? <LensFlare x={310} y={148} color={PALETTE.cyan} intensity={0.35 * stoveOn} width={90} seed="s02-stove" /> : null}
          </>
        )
      }
      bloom={{intensity: isRiver ? 0.22 : 0.28}}
      dust={{count: isRiver ? 26 : 34, color: isRiver ? PALETTE.cyan : PALETTE.cream, seed: isRiver ? 's02-silt' : 's02-dust', opacity: isRiver ? 0.45 : 0.6}}
      nearBokeh={isRiver ? {count: 7, color: PALETTE.cyan, opacity: 0.22} : {count: 5, color: PALETTE.goldPale, opacity: 0.22}}
      foreground={isRiver ? null : <KitchenForeground />}
      foregroundBlur={3}
      vignette={isRiver ? 0.5 : 0.38}
      hud={hud}
    >
      {isRiver ? (
        <RiverWorld filmCover={filmCover} soilStain={soilStain} />
      ) : (
        <div style={{position: 'absolute', inset: 0}}>
          <KitchenCounter stoveOn={stoveOn} />

          <PropImg src={`sprites/props/${oilDarkness > 0.5 ? 'bottle_used' : 'bottle_gold'}.png`} x={222} y={121} w={24} h={36} style={{opacity: pouring > 0 ? 0 : 1}} />
          <PropImg src="sprites/props/beaker_funnel.png" x={254} y={131} w={22} h={26} />
          <PropImg src="sprites/props/pan_stove.png" x={286} y={125} w={48} h={32} />
          {/* oil inside the pan darkens from gold to brown while frying */}
          <div
            style={{
              position: 'absolute',
              left: 296,
              top: 141,
              width: 26,
              height: 2,
              backgroundColor: oilDarkness > 0.66 ? PALETTE.woodMid : oilDarkness > 0.33 ? PALETTE.amberDeep : PALETTE.gold,
            }}
          />
          <PanSizzle x={309} y={138} amount={sizzle} />
          {isPanHeat ? <Thermometer x={336} y={110} level={heatLevel} /> : null}
          <PottedPlant x={452} y={200} h={26} />

          {/* L03: pouring jelantah into the sink drain */}
          {t >= tL3 + 1.0 && t < tL4 ? (
            <>
              <PropImg src="sprites/props/bottle_used.png" x={358} y={126} w={18} h={27} />
              <OilStream x0={371} y0={131} x1={388} y1={157} flow={pouring} />
              {t >= tL3 + 4.5 ? (
                <PropImg
                  src="sprites/ui/icon_x.png"
                  x={377}
                  y={118}
                  w={22}
                  h={22}
                  style={{transform: `scale(${(0.6 + 0.4 * Math.min(1, (t - tL3 - 4.5) * 5)).toFixed(3)})`}}
                />
              ) : null}
            </>
          ) : null}

          {/* L06: degraded molecule jiggling above the hot pan */}
          {isPanHeat ? (
            <>
              <div style={{opacity: ramp(t, tL6 + 0.6, tL6 + 1.4)}}>
                <PixelMolecule3D
                  atoms={tri.atoms}
                  bonds={tri.bonds}
                  x={322}
                  y={98}
                  yaw={frame * 0.03}
                  pitch={0.5}
                  w={110}
                  h={60}
                  jiggle={0.4 + heatLevel * 1.4}
                  frame={frame}
                  z={26}
                />
              </div>
              {t >= tL6 + 2.4 ? <PropImg src="sprites/ui/icon_x.png" x={340} y={74} w={18} h={18} /> : null}
            </>
          ) : null}

          {/* L07: Malika's idea */}
          <IdeaBubble x={malikaX + 8} y={112} progress={ramp(t, tL7 + 4.0, tL7 + 4.5) * (1 - ramp(t, tL8 - 0.3, tL8))} />

          <Character
            id="malika"
            x={malikaX}
            y={202}
            flip={t >= tL7 - 0.2 && t < tL7 + 0.9}
            pose={malikaWalking ? 'walk' : isHope ? (t >= tL9 ? 'point' : t >= tL8 ? 'talk' : 'think') : t >= tL3 && t < tL4 ? 'hold' : 'talk'}
            expr={t >= tL3 && t < tL7 ? 'worried' : isHope ? 'happy' : 'neutral'}
            lineId={activeLineId}
            emote={
              t >= tL7 + 0.9 && t < tL7 + 2.2
                ? {type: 'question', startFrame: Math.round((tL7 + 1.0) * fps), durationFrames: 34}
                : t >= tL7 + 4.1 && t < tL8
                  ? {type: 'idea', startFrame: Math.round((tL7 + 4.2) * fps), durationFrames: 40}
                  : undefined
            }
            z={20}
          />

          {t >= tL9 - 1.5 ? (
            <Character
              id="noya"
              x={interpolate(t, [tL9 - 1.5, tL9 + 1.0], [470, 385], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
                easing: Easing.out(Easing.cubic),
              })}
              y={202}
              flip
              pose={t < tL9 + 1.0 ? 'walk' : 'wave'}
              expr="happy"
              z={18}
            />
          ) : null}

          {META.showMascotJeli ? (
            <JeliMascot x={92} y={186} mood={t >= tL3 && t < tL7 ? 'worried' : isHope ? 'happy' : 'idle'} z={22} />
          ) : null}
        </div>
      )}

      {/* plunge / rise dip */}
      {dip > 0 ? (
        <div style={{position: 'absolute', left: -200, top: -200, width: 880, height: 670, backgroundColor: PALETTE.tealDark, opacity: dip * 0.9}} />
      ) : null}

      <DubLayer sceneId="S02" />
      <SfxLayer cues={S02_SFX} />
    </SceneShell>
  );
};
