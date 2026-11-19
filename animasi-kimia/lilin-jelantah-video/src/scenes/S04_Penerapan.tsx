import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character} from '../characters/Character';
import {S04_SFX} from '../data/cues/S04.cues';
import {OBSERVATION_CRITERIA} from '../data/observations';
import {PALETTE} from '../data/palette';
import {recipe} from '../data/recipe';
import {LensFlare} from '../engine/Atmosphere';
import {FloorGlow} from '../engine/Lighting';
import {SceneShell} from '../engine/SceneShell';
import type {MapLight} from '../engine/SceneLight';
import {VoxelModel, bottleModel, candleJarModel} from '../engine/Voxel';
import {FOOTAGE_MAP} from '../footage/RealFootage';
import {TvScreen, type TvClipItem, useFootageLightColor} from '../footage/TvScreen';
import {clamp01, smoothKeyframes} from '../lib/easing';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {Tag} from '../ui/Tag';
import {HangingLamp} from './shared/RoomDecor';
import {AnimatedFlame} from './shared/StageElements';
import {LoungeBackdrop, LoungeForeground, WorkStation, WorkshopBackdrop, WorkshopForeground} from './shared/S04Set';

const STATION_X = [84, 188, 292, 396];
const LOUNGE_CUT = 10.8; // lights-down cut from the workshop into the Ruang Nonton (matches SOFA_SIT sfx @11.0)
// TV screen rectangle in world space (TvScreen at x176,y34,w160,h124 → screen 15%/28%/56%/50%)
const SCREEN = {x: 200, y: 69, w: 90, h: 62};

export const S04_Penerapan: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const tL2 = lineStartSec('S04_L02');
  const tL3 = lineStartSec('S04_L03');
  const tL4 = lineStartSec('S04_L04');
  const tL5 = lineStartSec('S04_L05');
  const tL6 = lineStartSec('S04_L06');
  const tL7 = lineStartSec('S04_L07');

  const isWorkshop = t < LOUNGE_CUT;
  const isAnalysis = t >= tL6;

  // Ordered schedule of documentation clips on the TV with crossfade support
  const tvClips: TvClipItem[] = [
    {id: 'F01', startSec: tL2, endSec: tL3},
    {id: 'F02', startSec: tL3, endSec: tL3 + 8.5},
    {id: 'F03', startSec: tL3 + 8.5, endSec: tL4},
    {id: 'F04', startSec: tL4, endSec: tL4 + 7.5},
    {id: 'F05', startSec: tL4 + 7.5, endSec: tL5},
    {id: 'F07', startSec: tL5, endSec: tL6},
  ];

  const activeClipObj = tvClips.find((c) => t >= c.startSec && t < c.endSec) ?? tvClips[0];
  const activeClip = activeClipObj.id;
  const clipStartSec = activeClipObj.startSec;

  const tvLightColor = useFootageLightColor(activeClip);

  const activeLineId = ['S04_L01', 'S04_L02', 'S04_L03', 'S04_L04', 'S04_L05', 'S04_L06', 'S04_L07'].find(
    (id) => frame >= Math.round(lineStartSec(id) * fps) && frame <= lineEnd(id),
  );

  const clampOpts = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

  // ── Workshop: Marsha walks station to station; each station lights up (SFX 1.5/3.5/5.5/7.5)
  const stationLit = STATION_X.map((_, i) => clamp01((t - (1.5 + i * 2.0)) / 0.3));
  const marshaWX = (tt: number) =>
    smoothKeyframes(tt, [
      [0, 40],
      [0.6, 40],
      [1.3, STATION_X[0] - 6],
      [2.7, STATION_X[0] - 6],
      [3.4, STATION_X[1] - 6],
      [4.7, STATION_X[1] - 6],
      [5.4, STATION_X[2] - 6],
      [6.7, STATION_X[2] - 6],
      [7.4, STATION_X[3] - 6],
    ]);
  const marshaShopX = marshaWX(t);
  const marshaShopWalking = Math.abs(marshaWX(t + 0.05) - marshaShopX) > 0.4;

  // ── Lounge timeline
  const marshaLoungeX = smoothKeyframes(t, [
    [LOUNGE_CUT, 52],
    [LOUNGE_CUT + 0.4, 52],
    [LOUNGE_CUT + 2.0, 116],
  ]);
  const marshaLoungeWalking = t > LOUNGE_CUT + 0.4 && t < LOUNGE_CUT + 2.0;
  const tvOn = clamp01((t - 14.0) / 0.4) * (isAnalysis ? 1 - clamp01((t - tL6) / 0.6) : 1);
  const standby = t >= 14 && t < tL2 + 0.3 ? clamp01((t - 14) / 0.3) * (1 - clamp01((t - tL2) / 0.3)) : 0;
  const fire = activeClip === 'F07' && t >= tL5 ? clamp01((t - tL5 - 1.2) / 0.6) * (1 - clamp01((t - tL6 + 0.4) / 0.4)) : 0;
  const analysisOn = clamp01((t - tL6) / 0.8);

  // ── Camera ───────────────────────────────────────────────────────────
  const camZoom = isWorkshop
    ? smoothKeyframes(t, [
        [0, 1.62],
        [8.4, 1.62],
        [10.0, 1.08],
      ])
    : smoothKeyframes(t, [
        [LOUNGE_CUT, 1.12],
        [13.6, 1.0],
        [16.5, 1.1],
        [tL2 - 0.6, 1.14],
        [tL2 + 1.4, 1.42],
        [tL3 - 0.5, 1.5],
        [tL3 + 0.6, 1.42],
        [tL3 + 11.4, 1.46],
        [tL3 + 12.0, 1.95],
        [tL3 + 13.6, 1.95],
        [tL3 + 14.5, 1.45],
        [tL4, 1.46],
        [tL5 - 0.4, 1.56],
        [tL5 + 1.2, 1.8],
        [tL6 - 0.6, 1.9],
        [tL6 + 0.8, 1.14],
        [tL6 + 10.3, 1.16],
        [tL6 + 11.0, 1.75],
        [tL6 + 13.2, 1.75],
        [tL6 + 14.2, 1.14],
        [tL7, 1.14],
        [tL7 + 3.0, 1.3],
      ]);
  const camX = isWorkshop
    ? smoothKeyframes(t, [
        [0, 104],
        [1.6, 104],
        [3.6, 190],
        [5.6, 290],
        [7.6, 372],
        [8.4, 372],
        [10.0, 240],
      ])
    : smoothKeyframes(t, [
        [LOUNGE_CUT, 230],
        [13.6, 240],
        [tL2 - 0.6, 244],
        [tL2 + 1.4, 248],
        [tL3 + 11.4, 248],
        [tL3 + 12.0, 242],
        [tL3 + 13.6, 242],
        [tL3 + 14.5, 248],
        [tL5 + 1.2, 246],
        [tL6 + 0.8, 240],
        [tL6 + 10.3, 240],
        [tL6 + 11.0, 372],
        [tL6 + 13.2, 372],
        [tL6 + 14.2, 240],
        [tL7, 240],
        [tL7 + 3.0, 300],
      ]);
  const camY = isWorkshop
    ? smoothKeyframes(t, [
        [0, 146],
        [8.4, 146],
        [10.0, 138],
      ])
    : smoothKeyframes(t, [
        [LOUNGE_CUT, 122],
        [13.6, 132],
        [tL2 - 0.6, 128],
        [tL2 + 1.4, 110],
        [tL3 + 11.4, 110],
        [tL3 + 12.0, 176],
        [tL3 + 13.6, 176],
        [tL3 + 14.5, 110],
        [tL5 + 1.2, 104],
        [tL6 + 0.8, 150],
        [tL6 + 10.3, 150],
        [tL6 + 11.0, 168],
        [tL6 + 13.2, 168],
        [tL6 + 14.2, 150],
        [tL7 + 3.0, 156],
      ]);
  const focus = isWorkshop ? 1 : t < tL2 ? 0.55 : 1;
  const gradeMix = interpolate(t, [LOUNGE_CUT - 0.2, LOUNGE_CUT + 0.9], [0, 1], clampOpts);
  const lightsDown = interpolate(t, [LOUNGE_CUT - 0.55, LOUNGE_CUT, LOUNGE_CUT + 0.05, LOUNGE_CUT + 0.9], [0, 1, 1, 0], {
    ...clampOpts,
    easing: Easing.inOut(Easing.cubic),
  });

  // ── Light maps
  const workshopLights: MapLight[] = [
    {x: 90, y: 40, r: 130, sx: 1.2, color: PALETTE.gold, intensity: 0.55, banded: false},
    {x: 410, y: 40, r: 130, sx: 1.2, color: PALETTE.gold, intensity: 0.5, banded: false},
    ...STATION_X.map((sx, i) => ({x: sx, y: 156, r: 58, sx: 1.2, color: PALETTE.goldPale, intensity: 0.3 + 0.75 * stationLit[i], seed: `st${i}`})),
    {x: marshaShopX, y: 176, r: 44, color: PALETTE.amber, intensity: 0.45},
    {x: 240, y: 236, r: 170, sx: 2, color: PALETTE.amber, intensity: 0.32, banded: false},
  ];
  const loungeLights: MapLight[] = [
    // the screen itself must stay true-colour: a hot white hole in the light-map
    {x: SCREEN.x + SCREEN.w / 2, y: SCREEN.y + SCREEN.h / 2, r: 100, sx: 1.4, color: '#FFFFFF', intensity: 2 * Math.max(tvOn, standby), banded: false},
    {x: 245, y: 150, r: 150, sx: 1.5, color: tvLightColor, intensity: 0.8 * tvOn, flicker: 0.12, seed: 'tv', banded: false},
    {x: 245, y: 214, r: 62, sx: 2.3, color: tvLightColor, intensity: 0.7 * tvOn, flicker: 0.1, seed: 'tvf'},
    {x: 245, y: 150, r: 170, sx: 1.6, color: PALETTE.amber, intensity: 0.95 * fire, flicker: 0.3, seed: 'fire', banded: false},
    {x: 118, y: 80, r: 50, color: PALETTE.amber, intensity: 0.75, seed: 'sc1'},
    {x: 362, y: 80, r: 50, color: PALETTE.amber, intensity: 0.75, seed: 'sc2'},
    {x: marshaLoungeX, y: 170, r: 40, color: PALETTE.gold, intensity: 0.35},
    {x: 386, y: 170, r: 44, color: PALETTE.gold, intensity: 0.35 + 0.5 * clamp01((t - tL6 - 10) / 0.6) * (1 - clamp01((t - tL6 - 13.4) / 0.6))},
    // soft face fill on the sofa from the screen
    {x: 242, y: 176, r: 80, sx: 1.6, color: tvLightColor, intensity: 0.45 * tvOn, banded: false},
    {x: 240, y: 150, r: 150, sx: 1.6, color: PALETTE.goldPale, intensity: 0.7 * analysisOn, banded: false},
    {x: 245, y: 140, r: 110, sx: 1.4, color: PALETTE.teal, intensity: 0.5 * standby, banded: false},
  ];

  const bottle = React.useMemo(() => bottleModel(PALETTE.amberDeep), []);
  const jarA = React.useMemo(() => candleJarModel(PALETTE.cream, PALETTE.amber, 0.7), []);
  const jarB = React.useMemo(() => candleJarModel(PALETTE.blush, PALETTE.teal, 0.55), []);
  const tvRim = fire > 0.3 ? PALETTE.amber : tvLightColor;

  const hud = (
    <>
      {lightsDown > 0.01 ? <div style={{position: 'absolute', inset: 0, backgroundColor: PALETTE.void, opacity: lightsDown}} /> : null}
      <SceneBanner
        badge="BAGIAN 4 · PENERAPAN & ANALISIS"
        title="Menonton Langsung Praktikum di Ruang Nonton"
        accent={PALETTE.gold}
        startFrame={6}
        endFrame={108}
      />

      {/* Top >= 132 so there is ZERO collision with SceneBanner */}
      {isWorkshop ? (
        <div
          style={{
            position: 'absolute',
            top: 132,
            left: 110,
            right: 110,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
          }}
        >
          {[
            {n: '01', txt: 'Persiapan & Penyaringan'},
            {n: '02', txt: 'Peleburan & Pencampuran'},
            {n: '03', txt: 'Penuangan & Pemadatan'},
            {n: '04', txt: 'Uji Nyala Aman'},
          ].map((item, idx) => {
            const lit = t >= 1.5 + idx * 2.0;
            return (
              <div
                key={item.n}
                style={{
                  backgroundColor: lit ? PALETTE.amber : 'rgba(27,16,32,0.88)',
                  color: lit ? PALETTE.ink : PALETTE.cream,
                  border: `4px solid ${PALETTE.ink}`,
                  boxShadow: `6px 6px 0 ${PALETTE.ink}`,
                  padding: '18px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <span style={{fontFamily: FONT_TITLE, fontSize: 13, opacity: 0.8}}>{item.n}</span>
                <span style={{fontFamily: FONT_BODY, fontSize: 25, fontWeight: 700, lineHeight: 1.25}}>
                  {item.txt}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {!isWorkshop && !isAnalysis ? (
        <div style={{position: 'absolute', top: 36, right: 56, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-end'}}>
          {activeClip === 'F01' ? (
            <Tag kind="FISIKA" label="PERSIAPAN MINYAK · FISIKA" startFrame={Math.round((tL2 + 0.5) * fps)} />
          ) : null}
          {activeClip === 'F02' || activeClip === 'F03' ? (
            <div
              style={{
                backgroundColor: 'rgba(27,16,32,0.92)',
                border: `4px solid ${PALETTE.gold}`,
                boxShadow: `6px 6px 0 ${PALETTE.ink}`,
                padding: '14px 20px',
                maxWidth: 520,
              }}
            >
              <div style={{fontFamily: FONT_TITLE, fontSize: 13, color: PALETTE.gold, marginBottom: 6}}>
                BAHAN PRAKTIKUM KELOMPOK
              </div>
              <div style={{fontFamily: FONT_BODY, fontSize: 23, fontWeight: 600, color: PALETTE.cream}}>
                {recipe.bahanLilin} · {recipe.pewangi}
              </div>
            </div>
          ) : null}
          {activeClip === 'F04' || activeClip === 'F05' ? (
            <Tag kind="FISIKA" label="PENCETAKAN & PEMADATAN · FISIKA" startFrame={Math.round((tL4 + 0.5) * fps)} />
          ) : null}
          {activeClip === 'F07' ? (
            <Tag kind="KIMIA" label="PEMBAKARAN · KIMIA" startFrame={Math.round((tL5 + 0.5) * fps)} />
          ) : null}
          {(() => {
            const relT = t - clipStartSec;
            const note = FOOTAGE_MAP[activeClip]?.annotations?.find((a) => relT >= a.t0 && relT <= a.t1);
            if (!note) return null;
            return (
              <div
                style={{
                  backgroundColor: 'rgba(27,16,32,0.92)',
                  border: `3px solid ${PALETTE.cyan}`,
                  boxShadow: `4px 4px 0 ${PALETTE.ink}`,
                  padding: '10px 18px',
                  fontFamily: FONT_BODY,
                  fontSize: 23,
                  fontWeight: 600,
                  color: PALETTE.cyan,
                  maxWidth: 480,
                  textAlign: 'right',
                }}
              >
                ▸ {note.text}
              </div>
            );
          })()}
        </div>
      ) : null}

      {isAnalysis ? (
        <div
          style={{
            position: 'absolute',
            top: 108,
            left: 110,
            right: 110,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}
        >
          {OBSERVATION_CRITERIA.map((card, i) => {
            const flipAt = tL6 + 1.0 + i * 2.8;
            const visible = t >= flipAt;
            return (
              <div
                key={card.id}
                style={{
                  backgroundColor: 'rgba(27,16,32,0.94)',
                  border: `5px solid ${visible ? PALETTE.teal : PALETTE.slate}`,
                  boxShadow: `8px 8px 0 ${PALETTE.ink}`,
                  padding: '22px 24px',
                  opacity: visible ? 1 : 0.45,
                }}
              >
                <div style={{fontFamily: FONT_BODY, fontSize: 26, fontWeight: 700, color: PALETTE.teal, marginBottom: 8}}>
                  {card.judul}
                </div>
                <div style={{fontFamily: FONT_BODY, fontSize: 22, color: PALETTE.cream, marginBottom: 14, lineHeight: 1.35}}>
                  Kriteria: {card.kriteria}
                </div>
                <div
                  style={{
                    backgroundColor: PALETTE.plumMid,
                    padding: '10px 14px',
                    border: `2px solid ${PALETTE.gold}`,
                    fontFamily: FONT_BODY,
                    fontSize: 21,
                    fontWeight: 600,
                    color: PALETTE.goldPale,
                    lineHeight: 1.3,
                  }}
                >
                  {card.hasilUser}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <SceneSubtitles sceneId="S04" bottomOffset={40} />
    </>
  );

  return (
    <SceneShell
      grade="workshop"
      gradeTo="cinema"
      gradeMix={gradeMix}
      camX={camX}
      camY={camY}
      zoom={camZoom}
      focus={focus}
      farBlur={isWorkshop ? 2.4 : 2.0}
      midBlur={1}
      intro="truckL"
      outro="right"
      handheld={isWorkshop ? 1.2 : 0.8}
      farBg={isWorkshop ? <WorkshopBackdrop /> : <LoungeBackdrop />}
      floor3d={
        isWorkshop
          ? {y: 200, pattern: 'planks', tile: 26, gloss: 0.25, glossColor: PALETTE.gold, seed: 's04w'}
          : {y: 202, pattern: 'carpet', tile: 24, depthFade: 0.7, seed: 's04l'}
      }
      lightMap={
        isWorkshop
          ? {ambient: '#2A1408', darkness: 0.42, lights: workshopLights}
          : {ambient: '#100A22', darkness: 0.66 - 0.2 * analysisOn, lights: loungeLights}
      }
      keyLight={
        isWorkshop
          ? {keyX: 90, keyY: -10, rimColor: PALETTE.gold, rimStrength: 0.85, shadowStrength: 0.55}
          : {keyX: 245, keyY: 96, rimColor: tvRim, rimStrength: 0.4 + 0.6 * Math.max(tvOn, analysisOn * 0.5), shadowStrength: 0.45}
      }
      lights={
        isWorkshop ? (
          <>
            {STATION_X.map((sx, i) => (
              <HangingLamp key={sx} x={sx} cordLen={30} bulbColor={PALETTE.goldPale} coneHeight={110} coneWidth={70} opacity={0.06 + 0.14 * stationLit[i]} />
            ))}
            <FloorGlow x={marshaShopX} y={206} rx={34} ry={7} color={PALETTE.amber} opacity={0.25} />
            {stationLit[3] > 0.1 ? <LensFlare x={STATION_X[3] + 6} y={142} color={PALETTE.gold} intensity={0.45 * stationLit[3]} width={110} seed="st4" /> : null}
          </>
        ) : (
          <>
            {tvOn > 0.02 ? <FloorGlow x={245} y={214} rx={100} ry={12} color={fire > 0.3 ? PALETTE.amber : tvLightColor} opacity={0.3 * tvOn} /> : null}
            {fire > 0.05 ? <LensFlare x={245} y={100} color={PALETTE.amber} intensity={0.5 * fire} width={200} seed="tv-fire" /> : null}
          </>
        )
      }
      rays={isWorkshop ? {color: PALETTE.goldPale, opacity: 0.2, x: 90, y: 40, angleDeg: -5, spread: 30, length: 240} : false}
      bloom={{intensity: isWorkshop ? 0.28 : 0.34}}
      dust={{count: 30, color: isWorkshop ? PALETTE.goldPale : PALETTE.cyan, seed: 's04-dust', opacity: isWorkshop ? 0.55 : 0.4}}
      nearBokeh={{count: 5, color: isWorkshop ? PALETTE.gold : PALETTE.teal, opacity: 0.22}}
      foreground={isWorkshop ? <WorkshopForeground /> : <LoungeForeground />}
      foregroundBlur={3}
      vignette={isWorkshop ? 0.4 : 0.5}
      grain={0.075}
      hud={hud}
    >
      {isWorkshop ? (
        <>
          <WorkStation x={STATION_X[0]} n="01" lit={stationLit[0]}>
            <Img src={staticFile('sprites/props/beaker_funnel.png')} style={{position: 'absolute', left: 6, top: 8, width: 36, height: 40, imageRendering: 'pixelated'}} />
            <VoxelModel voxels={bottle} x={54} y={44} angle={frame * 0.03} unit={1} box={16} z={2} />
          </WorkStation>
          <WorkStation x={STATION_X[1]} n="02" lit={stationLit[1]}>
            <Img src={staticFile('sprites/props/pan_stove.png')} style={{position: 'absolute', left: 10, top: 16, width: 48, height: 32, imageRendering: 'pixelated'}} />
            {stationLit[1] > 0.1 ? (
              <div style={{position: 'absolute', left: 14, top: 26, width: 40, height: 14, borderRadius: '50%', background: `radial-gradient(ellipse, ${PALETTE.amber}AA 0%, transparent 70%)`, mixBlendMode: 'screen', opacity: stationLit[1] * (0.7 + 0.3 * Math.sin(frame * 0.4))}} />
            ) : null}
          </WorkStation>
          <WorkStation x={STATION_X[2]} n="03" lit={stationLit[2]}>
            <VoxelModel voxels={jarA} x={20} y={42} angle={frame * 0.025} unit={1} box={22} z={2} />
            <VoxelModel voxels={jarB} x={46} y={42} angle={-frame * 0.02 + 1} unit={1} box={22} z={2} />
          </WorkStation>
          <WorkStation x={STATION_X[3]} n="04" lit={stationLit[3]}>
            <Img src={staticFile('sprites/props/candle_unlit.png')} style={{position: 'absolute', left: 24, top: 8, width: 32, height: 40, imageRendering: 'pixelated'}} />
            {stationLit[3] > 0.1 ? <AnimatedFlame x={40} y={20} scale={0.8} /> : null}
          </WorkStation>
          <Character
            id="marsha"
            x={marshaShopX}
            y={206}
            flip={false}
            pose={marshaShopWalking ? 'walk' : 'point'}
            expr="happy"
            lineId={activeLineId}
            z={20}
          />
        </>
      ) : (
        <div style={{position: 'absolute', inset: 0}}>
          {!isAnalysis ? <TvScreen clips={tvClips} activeId={activeClip} x={176} y={34} w={160} h={124} /> : null}
          {/* CRT standby static between TV_ON and the first clip */}
          {standby > 0.01 ? (
            <div
              style={{
                position: 'absolute',
                left: SCREEN.x + 2,
                top: SCREEN.y + 2,
                width: SCREEN.w - 4,
                height: SCREEN.h - 4,
                zIndex: 3,
                opacity: standby,
                background: `repeating-linear-gradient(0deg, ${PALETTE.tealDark} 0px, ${PALETTE.tealDark} 1px, ${PALETTE.teal} 1px, ${PALETTE.teal} 2px, ${PALETTE.cyan} 2px, ${PALETTE.cyan} 3px)`,
                backgroundPosition: `0 ${(frame * 7) % 9}px`,
              }}
            >
              <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse, ${PALETTE.white}AA 0%, transparent 70%)`}} />
            </div>
          ) : null}

          <Img
            src={staticFile('sprites/props/sofa.png')}
            style={{position: 'absolute', left: 164, top: 164, width: 152, height: 52, imageRendering: 'pixelated', zIndex: 10}}
          />
          <Character id="ayuya" x={200} y={206} pose="sit" expr="happy" z={14} dim={0.2} emote={{type: 'sparkle', startFrame: Math.round((tL4 + 8.5) * fps), durationFrames: 30}} />
          <Character
            id="noya"
            x={242}
            y={206}
            pose="sit"
            expr={t >= tL3 + 11.8 && t < tL3 + 14 ? 'surprised' : 'neutral'}
            z={14}
            dim={0.2}
            emote={{type: 'exclaim', startFrame: Math.round((tL3 + 12.0) * fps), durationFrames: 36}}
          />
          <Character id="farel" x={282} y={206} pose="sit" expr="determined" z={14} dim={0.2} emote={{type: 'heart', startFrame: Math.round((tL5 + 3.0) * fps), durationFrames: 30}} />

          <Character
            id="marsha"
            x={marshaLoungeX}
            y={204}
            pose={marshaLoungeWalking ? 'walk' : t >= tL7 ? 'wave' : 'point'}
            expr="happy"
            lineId={activeLineId}
            z={20}
          />
          <Character
            id="ais"
            x={386}
            y={204}
            flip
            pose={t >= tL6 + 10 && t < tL6 + 13.5 ? 'hold' : 'think'}
            expr="neutral"
            z={18}
            dim={0.15}
            emote={{type: 'idea', startFrame: Math.round((tL6 + 10.5) * fps), durationFrames: 30}}
          />
        </div>
      )}

      <DubLayer sceneId="S04" />
      <SfxLayer cues={S04_SFX} />
    </SceneShell>
  );
};
