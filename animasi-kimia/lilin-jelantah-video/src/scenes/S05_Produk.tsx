import React from 'react';
import {Easing, interpolate, Sequence, staticFile, Img, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character, JeliMascot} from '../characters/Character';
import {S05_SFX} from '../data/cues/S05.cues';
import {META} from '../data/meta';
import {PALETTE} from '../data/palette';
import {recipe} from '../data/recipe';
import {LensFlare} from '../engine/Atmosphere';
import {FloorGlow, Sparkle, SpotCone} from '../engine/Lighting';
import {SceneShell} from '../engine/SceneShell';
import type {MapLight} from '../engine/SceneLight';
import {VoxelModel, candleJarModel, podiumModel} from '../engine/Voxel';
import {EvidenceFrame} from '../footage/EvidenceFrame';
import {clamp01, smoothKeyframes} from '../lib/easing';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {PottedPlant, StringLights} from './shared/RoomDecor';
import {AnimatedFlame, PixelDoor} from './shared/StageElements';
import {VelvetCurtainsV2} from './shared/Stage3D';
import {RopeStanchions, ShowroomBackdrop} from './shared/S05Set';

export const S05_Produk: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const tL2 = lineStartSec('S05_L02');
  const tL3 = lineStartSec('S05_L03');
  const tL5 = lineStartSec('S05_L05');
  const tL6 = lineStartSec('S05_L06');
  const tL7 = lineStartSec('S05_L07');
  const tL8 = lineStartSec('S05_L08');

  const ayuyaLines = ['S05_L01', 'S05_L03', 'S05_L05', 'S05_L07'];
  const lovytaLines = ['S05_L02', 'S05_L04', 'S05_L06', 'S05_L08'];
  const activeLineId = [...ayuyaLines, ...lovytaLines].find(
    (id) => frame >= Math.round(lineStartSec(id) * fps) && frame <= lineEnd(id),
  );
  const ayuyaSpeaking = Boolean(activeLineId && ayuyaLines.includes(activeLineId));
  const lovytaSpeaking = Boolean(activeLineId && lovytaLines.includes(activeLineId));

  const showEquation = t >= tL2 && t < tL3;
  const showProcess = t >= tL3 && t < tL5;
  const showProductZoom = t >= tL5 && t < tL6;
  const showSafety = t >= tL6 && t < tL8;
  const candleLit = t >= tL8 + 0.9;

  // Impact shake on each safety panel (beep @+0.5, stamp @+2.8, beep @L07+0.5)
  const shakeAt = [tL6 + 0.55, tL6 + 2.85, tL7 + 0.55];
  const shake = shakeAt.reduce((m, s0) => Math.max(m, t >= s0 && t <= s0 + 0.35 ? 0.9 * (1 - (t - s0) / 0.35) : 0), 0);

  // ── Camera: curtain-open establishing → push-in → tilt-up (equation) → pan (steps)
  //    → 2x product close-up → wide safety → push to flame → rack/pan to the door
  const camZoom = smoothKeyframes(t, [
    [0, 1.0],
    [1.0, 1.0],
    [5.6, 1.2],
    [tL2, 1.2],
    [tL2 + 1.3, 1.08],
    [tL3, 1.08],
    [tL5 - 0.3, 1.1],
    [tL5 + 1.3, 2.3],
    [tL6 - 0.5, 2.38],
    [tL6 + 0.8, 1.04],
    [tL8, 1.06],
    [tL8 + 2.2, 1.4],
    [tL8 + 2.8, 1.4],
    [tL8 + 4.4, 1.3],
  ]);
  const camX = smoothKeyframes(t, [
    [0, 240],
    [tL3, 232],
    [tL5 - 0.3, 254],
    [tL5 + 1.3, 240],
    [tL8 + 2.8, 240],
    [tL8 + 4.4, 384],
  ]);
  const camY = smoothKeyframes(t, [
    [0, 130],
    [1.0, 130],
    [5.6, 150],
    [tL2, 150],
    [tL2 + 1.3, 130],
    [tL3, 138],
    [tL5 - 0.3, 138],
    [tL5 + 1.3, 166],
    [tL6 - 0.5, 166],
    [tL6 + 0.8, 140],
    [tL8, 140],
    [tL8 + 2.2, 168],
    [tL8 + 4.4, 160],
  ]);
  const focus = smoothKeyframes(t, [
    [0, 0.6],
    [tL5, 0.6],
    [tL5 + 1.3, 1],
    [tL6, 1],
    [tL6 + 0.8, 0.6],
    [tL8 + 2.8, 1],
    [tL8 + 4.4, 0.1],
  ]);
  const curtainOpen = smoothKeyframes(t, [
    [0, 0.08],
    [0.3, 0.08],
    [2.6, 1],
  ]);
  const lit = clamp01((t - tL8 - 0.9) / 0.35);
  const doorOn = clamp01((t - tL8 - 2.6) / 0.8);

  const podium = React.useMemo(() => podiumModel(PALETTE.gold, PALETTE.woodMid), []);
  const candle = React.useMemo(() => candleJarModel(PALETTE.cream, PALETTE.blush, 0.8), []);
  const spin = frame * 0.018;

  const mapLights: MapLight[] = [
    {x: 240, y: 178, r: 66, sx: 1.3, color: PALETTE.goldPale, intensity: 0.95, seed: 'pod'},
    {x: 148, y: 176, r: 46, color: PALETTE.gold, intensity: 0.5 + 0.4 * (ayuyaSpeaking ? 1 : 0)},
    {x: 332, y: 176, r: 46, color: PALETTE.goldPale, intensity: 0.5 + 0.4 * (lovytaSpeaking ? 1 : 0)},
    {x: 240, y: 100, r: 170, sx: 1.7, color: PALETTE.amber, intensity: 0.45, banded: false},
    {x: 92, y: 80, r: 60, color: PALETTE.goldPale, intensity: 0.32},
    {x: 410, y: 80, r: 60, color: PALETTE.goldPale, intensity: 0.32},
    {x: 443, y: 168, r: 62, color: PALETTE.teal, intensity: 0.4 + 0.8 * doorOn, flicker: 0.05, seed: 'door'},
    {x: 240, y: 160, r: 130, color: PALETTE.gold, intensity: 0.95 * lit, flicker: 0.22, seed: 'flame', banded: false},
    {x: 240, y: 252, r: 160, sx: 2, color: PALETTE.amber, intensity: 0.4, banded: false},
  ];

  const hud = (
    <>
      <SceneBanner
        badge="BAGIAN 5 · PRODUK & KESELAMATAN"
        title="Lilin Aromatis dari Minyak Jelantah"
        accent={PALETTE.blush}
        startFrame={6}
        endFrame={108}
      />

      {showEquation ? (
        <div
          style={{
            position: 'absolute',
            top: 118,
            left: 90,
            right: 90,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            flexWrap: 'wrap',
          }}
        >
          {[
            {txt: 'Minyak Jelantah\n(Tersaring)', c: PALETTE.amber, at: tL2 + 0.2},
            {txt: '+', c: PALETTE.cream, plain: true, at: tL2 + 1.0},
            {txt: `Bahan Lilin\n(${recipe.bahanLilin})`, c: PALETTE.gold, at: tL2 + 1.3},
            {txt: '+', c: PALETTE.cream, plain: true, at: tL2 + 2.2},
            {txt: `Pewangi & Warna\n(${recipe.pewangi})`, c: PALETTE.blush, at: tL2 + 2.5},
            {txt: '+', c: PALETTE.cream, plain: true, at: tL2 + 3.4},
            {txt: 'Sumbu &\nWadah', c: PALETTE.teal, at: tL2 + 3.6},
            {txt: '=', c: PALETTE.gold, plain: true, at: tL2 + 4.3},
            {txt: 'LILIN AROMATIS', c: PALETTE.cyan, at: tL2 + 4.5},
          ].map((box, i) => {
            if (t < box.at) return null;
            const popIn = interpolate(t, [box.at, box.at + 0.25], [0.75, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.back(1.4)),
            });
            if (box.plain) {
              return (
                <span key={i} style={{fontFamily: FONT_TITLE, fontSize: 30, color: box.c, textShadow: `3px 3px 0 ${PALETTE.ink}`}}>
                  {box.txt}
                </span>
              );
            }
            return (
              <div
                key={i}
                style={{
                  backgroundColor: 'rgba(27,16,32,0.93)',
                  border: `4px solid ${box.c}`,
                  boxShadow: `6px 6px 0 ${PALETTE.ink}`,
                  padding: '16px 20px',
                  fontFamily: FONT_BODY,
                  fontSize: 25,
                  fontWeight: 700,
                  color: PALETTE.cream,
                  whiteSpace: 'pre-line',
                  textAlign: 'center',
                  transform: `scale(${popIn.toFixed(3)})`,
                }}
              >
                {box.txt}
              </div>
            );
          })}
        </div>
      ) : null}

      {showProcess || showProductZoom ? (
        <div
          style={{
            position: 'absolute',
            top: 112,
            left: 110,
            right: 110,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 28,
          }}
        >
          <div style={{display: 'flex', flexDirection: 'column', gap: 12, flex: 1}}>
            {[
              '1. Siapkan minyak jelantah & wadah bersumbu',
              '2. Lelehkan parafin & campurkan minyak + pewangi',
              '3. Tambahkan pewarna & aduk merata',
              '4. Tuang ke wadah & dinginkan (FISIKA)',
              '5. Produk siap diamati & diberi nilai guna',
            ].map((step, i) => {
              const active = t >= tL3 + i * 2.1;
              return (
                <div
                  key={step}
                  style={{
                    backgroundColor: active ? 'rgba(27,16,32,0.92)' : 'rgba(27,16,32,0.55)',
                    border: `4px solid ${active ? PALETTE.gold : PALETTE.slate}`,
                    padding: '12px 18px',
                    fontFamily: FONT_BODY,
                    fontSize: 25,
                    fontWeight: 700,
                    color: active ? PALETTE.cream : PALETTE.steel,
                  }}
                >
                  {step}
                </div>
              );
            })}
          </div>
          <Sequence from={Math.round(tL3 * fps)} layout="none">
            <EvidenceFrame footageId="F06" badge="DOKUMENTASI PRODUK" label="Produk Lilin Aromatis" width={640} height={360} />
          </Sequence>
        </div>
      ) : null}

      {showSafety ? (
        <div
          style={{
            position: 'absolute',
            top: 112,
            left: 140,
            right: 140,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div
            style={{
              background: `repeating-linear-gradient(-45deg, ${PALETTE.gold} 0px, ${PALETTE.gold} 18px, ${PALETTE.ink} 18px, ${PALETTE.ink} 36px)`,
              padding: 8,
              border: `4px solid ${PALETTE.ink}`,
              boxShadow: `10px 10px 0 ${PALETTE.ink}`,
            }}
          >
            <div style={{backgroundColor: PALETTE.plumDeep, padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16}}>
              <div style={{fontFamily: FONT_TITLE, fontSize: 20, color: PALETTE.gold}}>
                [!] PERINGATAN KESELAMATAN WAJIB
              </div>
              {[
                {txt: 'BUKAN UNTUK DIKONSUMSI', at: tL6 + 0.5, col: PALETTE.red},
                {txt: 'MINYAK JELANTAH ≠ UNTUK MEMASAK LAGI', at: tL6 + 2.8, col: PALETTE.amber},
                {
                  txt: 'UJI NYALA DENGAN PENGAWASAN · TEMPAT AMAN · JAUH DARI BENDA MUDAH TERBAKAR',
                  at: tL7 + 0.5,
                  col: PALETTE.gold,
                },
              ].map((item) => {
                if (t < item.at) return null;
                return (
                  <div
                    key={item.txt}
                    style={{
                      backgroundColor: 'rgba(16,10,20,0.85)',
                      border: `4px solid ${item.col}`,
                      padding: '14px 20px',
                      fontFamily: FONT_TITLE,
                      fontSize: 15,
                      color: PALETTE.cream,
                      lineHeight: 1.5,
                    }}
                  >
                    ■ {item.txt}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <SceneSubtitles sceneId="S05" bottomOffset={40} />
    </>
  );

  return (
    <SceneShell
      grade="showroom"
      camX={camX}
      camY={camY}
      zoom={camZoom}
      shake={shake}
      focus={focus}
      farBlur={2.6}
      midBlur={1}
      intro="none"
      outro="push"
      handheld={0.9}
      farBg={<ShowroomBackdrop />}
      midBg={
        <>
          <StringLights y={22} count={14} sag={10} colorA={PALETTE.goldPale} colorB={PALETTE.blush} />
          <VelvetCurtainsV2 openProgress={curtainOpen} seed="s05c" />
        </>
      }
      floor3d={{y: 202, pattern: 'stage', tile: 28, gloss: 0.45, glossColor: PALETTE.gold, seed: 's05'}}
      lightMap={{ambient: '#1E0C24', darkness: 0.5, lights: mapLights}}
      keyLight={{
        keyX: 240,
        keyY: candleLit ? 160 : 0,
        rimColor: candleLit ? PALETTE.amber : PALETTE.goldPale,
        rimStrength: 0.9,
        shadowStrength: 0.55,
      }}
      lights={
        <>
          <SpotCone x={240} topY={0} bottomY={206} spreadW={70} color={PALETTE.goldPale} opacity={0.2} />
          <SpotCone x={148} topY={0} bottomY={206} spreadW={34} color={PALETTE.gold} opacity={ayuyaSpeaking ? 0.14 : 0.07} />
          <SpotCone x={332} topY={0} bottomY={206} spreadW={34} color={PALETTE.goldPale} opacity={lovytaSpeaking ? 0.14 : 0.07} />
          <FloorGlow x={240} y={206} rx={60} ry={10} color={candleLit ? PALETTE.gold : PALETTE.amber} opacity={0.32 + 0.2 * lit} />
          {lit > 0.02 ? <LensFlare x={240} y={160} color={PALETTE.gold} intensity={0.6 * lit} width={170} seed="s05-flame" /> : null}
        </>
      }
      rays={{color: PALETTE.goldPale, opacity: 0.18, x: 240, y: -6, spread: 30, length: 230}}
      bloom={{intensity: 0.3 + 0.12 * lit}}
      dust={{count: 38, color: PALETTE.goldPale, seed: 's05-dust', opacity: 0.55}}
      nearBokeh={{count: 6, color: PALETTE.gold, opacity: 0.26}}
      foreground={<RopeStanchions y={222} />}
      foregroundBlur={2.6}
      vignette={0.45}
      grain={0.07}
      hud={hud}
    >
      <PixelDoor x={426} y={134} glow={PALETTE.teal} label="OBSERVATORIUM" />
      <PottedPlant x={66} y={202} h={28} />
      <PottedPlant x={392} y={202} h={24} />

      {/* Hero product: voxel podium + aromatic candle on a slow turntable */}
      <VoxelModel voxels={podium} x={240} y={204} angle={spin} unit={2} box={60} tilt={0.5} z={6} />
      <VoxelModel voxels={candle} x={240} y={185} angle={spin} unit={1} box={26} tilt={0.5} z={7} />
      {candleLit ? <AnimatedFlame x={240} y={168} scale={0.75} /> : null}

      {showSafety ? (
        <Img
          src={staticFile('sprites/props/safety_sign.png')}
          style={{position: 'absolute', left: 176, top: 173, width: 32, height: 32, imageRendering: 'pixelated', zIndex: 9}}
        />
      ) : null}

      <Character
        id="ayuya"
        x={148}
        y={204}
        flip={t >= tL8}
        pose={t < 6 ? 'cheer' : ayuyaSpeaking ? 'point' : 'idle'}
        expr="happy"
        lineId={ayuyaSpeaking ? activeLineId : undefined}
        dim={lovytaSpeaking ? 0.35 : 0}
        z={20}
        emote={{type: 'heart', startFrame: Math.round((tL5 + 0.8) * fps), durationFrames: 32}}
      />
      <Character
        id="lovyta"
        x={332}
        y={204}
        flip={t < tL8}
        pose={t < 6 ? 'cheer' : lovytaSpeaking ? 'point' : 'idle'}
        expr={showSafety ? 'determined' : 'happy'}
        lineId={lovytaSpeaking ? activeLineId : undefined}
        dim={ayuyaSpeaking ? 0.35 : 0}
        z={20}
        emote={{type: 'sparkle', startFrame: Math.round((tL2 + 4.3) * fps), durationFrames: 30}}
      />

      {META.showMascotJeli ? (
        <JeliMascot x={candleLit ? 240 : 270} y={candleLit ? 154 : 192} mood={candleLit ? 'flame' : 'happy'} z={24} />
      ) : null}

      <Sparkle x={240} y={candleLit ? 138 : 150} size="md" color={PALETTE.gold} glowRadius={18} />
      <DubLayer sceneId="S05" />
      <SfxLayer cues={S05_SFX} />
    </SceneShell>
  );
};
