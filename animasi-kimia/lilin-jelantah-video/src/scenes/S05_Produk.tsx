import React from 'react';
import {Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character, JeliMascot} from '../characters/Character';
import {S05_SFX} from '../data/cues/S05.cues';
import {META} from '../data/meta';
import {PALETTE} from '../data/palette';
import {recipe} from '../data/recipe';
import {FloorGlow, PointLight, Sparkle, SpotCone} from '../engine/Lighting';
import {SceneShell} from '../engine/SceneShell';
import {EvidenceFrame} from '../footage/EvidenceFrame';
import {smoothKeyframes} from '../lib/easing';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {ART_H, ART_W} from '../lib/pixel';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {PottedPlant, StringLights} from './shared/RoomDecor';
import {AnimatedFlame, PixelDoor, StageFloor, VelvetCurtains} from './shared/StageElements';

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

  const shake =
    (t >= tL6 + 0.6 && t <= tL6 + 1.0) || (t >= tL7 + 0.6 && t <= tL7 + 1.0) ? 0.85 : 0;

  // Smooth zoom in & pull back — zero snap
  const camZoom = smoothKeyframes(t, [
    [0, 1.0],
    [tL5 - 0.3, 1.0],
    [tL5 + 1.5, 1.34],
    [tL6 - 0.4, 1.34],
    [tL6 + 0.9, 1.0],
    [tL8, 1.0],
    [tL8 + 2.5, 1.18],
  ]);

  const hud = (
    <>
      <SceneBanner
        badge="BAGIAN 5 · PRODUK & KESELAMATAN"
        title="Lilin Aromatis dari Minyak Jelantah"
        accent={PALETTE.blush}
        startFrame={6}
        endFrame={135}
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
                  backgroundColor: 'rgba(27,16,32,0.92)',
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
            top: 90,
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
            top: 96,
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
              <div style={{fontFamily: FONT_TITLE, fontSize: 22, color: PALETTE.gold}}>
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
                      fontSize: 16,
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

      <SceneSubtitles sceneId="S05" bottomOffset={44} />
    </>
  );

  return (
    <SceneShell
      grade="showroom"
      camX={240}
      camY={135}
      zoom={camZoom}
      shake={shake}
      farBlur={5}
      midBlur={2}
      farBg={
        <div
          style={{
            width: ART_W,
            height: ART_H,
            background: `radial-gradient(circle at 50% 35%, ${PALETTE.burgundy} 0%, ${PALETTE.plumDeep} 60%, ${PALETTE.void} 100%)`,
          }}
        />
      }
      midBg={
        <>
          <VelvetCurtains openProgress={1} />
          <StringLights y={18} count={14} sag={10} colorA={PALETTE.goldPale} colorB={PALETTE.blush} />
        </>
      }
      floor={<StageFloor y={202} topColor={PALETTE.plumMid} bottomColor={PALETTE.plumDeep} />}
      lights={
        <>
          <SpotCone x={240} topY={0} bottomY={210} spreadW={82} color={PALETTE.goldPale} opacity={0.26} />
          <FloorGlow x={240} y={206} rx={72} ry={14} color={candleLit ? PALETTE.gold : PALETTE.amber} opacity={0.38} />
          <PointLight x={240} y={110} radius={135} color={PALETTE.amber} intensity={0.65} />
          {candleLit ? (
            <PointLight x={240} y={132} radius={86} color={PALETTE.gold} intensity={0.88} flicker />
          ) : null}
        </>
      }
      rays={{color: PALETTE.gold, opacity: 0.18, angleDeg: 0}}
      dust={{count: 38, color: PALETTE.goldPale, seed: 's05-dust'}}
      hud={hud}
    >
      <PixelDoor x={426} y={134} glow={PALETTE.teal} label="OBSERVATORIUM" />
      <PottedPlant x={66} y={202} h={28} />
      <PottedPlant x={392} y={202} h={24} />

      <Img
        src={staticFile('sprites/props/podium.png')}
        style={{position: 'absolute', left: 216, top: 166, width: 48, height: 40, imageRendering: 'pixelated'}}
      />
      <Img
        src={staticFile('sprites/props/candle_unlit.png')}
        style={{position: 'absolute', left: 224, top: 128, width: 32, height: 40, imageRendering: 'pixelated'}}
      />
      {candleLit ? <AnimatedFlame x={240} y={140} scale={1} /> : null}

      {showSafety ? (
        <Img
          src={staticFile('sprites/props/safety_sign.png')}
          style={{position: 'absolute', left: 160, top: 170, width: 32, height: 32, imageRendering: 'pixelated'}}
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
      />

      {META.showMascotJeli ? (
        <JeliMascot x={240} y={candleLit ? 124 : 186} mood={candleLit ? 'flame' : 'happy'} z={24} />
      ) : null}

      <Sparkle x={240} y={116} size="md" color={PALETTE.gold} />
      <DubLayer sceneId="S05" />
      <SfxLayer cues={S05_SFX} />
    </SceneShell>
  );
};
