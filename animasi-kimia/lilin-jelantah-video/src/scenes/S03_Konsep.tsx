import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character, JeliMascot} from '../characters/Character';
import {S03_SFX} from '../data/cues/S03.cues';
import {META} from '../data/meta';
import {PALETTE} from '../data/palette';
import {recipe} from '../data/recipe';
import {Bloom, FloorGlow, PointLight, Sparkle} from '../engine/Lighting';
import {SceneShell} from '../engine/SceneShell';
import {smoothKeyframes} from '../lib/easing';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {Tag} from '../ui/Tag';
import {HangingLamp, LabBackdrop, LabBenchExtras} from './shared/RoomDecor';
import {AnimatedFlame, PixelDoor, StageFloor} from './shared/StageElements';

export const S03_Konsep: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const tL2 = lineStartSec('S03_L02');
  const tL3 = lineStartSec('S03_L03');
  const tL4 = lineStartSec('S03_L04');
  const tL5 = lineStartSec('S03_L05');
  const tL6 = lineStartSec('S03_L06');
  const tL7 = lineStartSec('S03_L07');

  const activeLineId = ['S03_L01', 'S03_L02', 'S03_L03', 'S03_L04', 'S03_L05', 'S03_L06', 'S03_L07'].find(
    (id) => frame >= Math.round(lineStartSec(id) * fps) && frame <= lineEnd(id),
  );

  const showTriglyceride = t >= tL2 && t < tL3;
  const showFiltering = t >= tL3 && t < tL4;
  const showNotParaffin = t >= tL4 && t < tL5;
  const showPhaseChange = t >= tL5 && t < tL6;
  const showCombustion = t >= tL6 && t < tL7;
  const showSummary = t >= tL7;

  const candleLit = t >= tL6 + 1.3;
  const shake = t >= tL4 + 1.8 && t <= tL4 + 2.3 ? 0.85 : 0;

  // Dynamic expressive zoom keyframes following lab demos
  const camZoom = smoothKeyframes(t, [
    [0, 1.0],
    [tL2 - 0.3, 1.04],
    [tL2 + 1.0, 1.22],
    [tL3 - 0.3, 1.22],
    [tL3 + 0.9, 1.12],
    [tL4 - 0.3, 1.12],
    [tL4 + 0.9, 1.26],
    [tL5 - 0.3, 1.26],
    [tL5 + 1.2, 1.18],
    [tL6 - 0.2, 1.14],
    [tL6 + 2.4, 1.48],
    [tL7 - 0.4, 1.48],
    [tL7 + 0.9, 1.0],
  ]);

  const camX = smoothKeyframes(t, [
    [0, 240],
    [tL2 - 0.3, 240],
    [tL2 + 0.9, 270],
    [tL3 - 0.3, 270],
    [tL3 + 0.8, 246],
    [tL5 + 1.0, 265],
    [tL6 - 0.2, 265],
    [tL6 + 2.0, 326],
    [tL7 - 0.4, 326],
    [tL7 + 0.9, 240],
  ]);

  const noyaX = smoothKeyframes(t, [
    [0, 124],
    [tL5 - 0.2, 124],
    [tL5 + 1.2, 152],
    [tL7 - 0.3, 152],
    [tL7 + 0.9, 128],
  ]);
  const noyaWalking =
    (t >= tL5 - 0.2 && t <= tL5 + 1.15) || (t >= tL7 - 0.3 && t <= tL7 + 0.85);

  const jeliX = smoothKeyframes(t, [
    [0, 78],
    [tL5, 78],
    [tL5 + 2.0, 294],
    [tL6, 294],
    [tL6 + 1.8, 378],
    [tL7, 378],
    [tL7 + 1.4, 86],
  ]);
  const jeliY = smoothKeyframes(t, [
    [0, 186],
    [tL5, 186],
    [tL5 + 2.0, 112],
    [tL6 + 1.8, 124],
    [tL7, 124],
    [tL7 + 1.4, 186],
  ]);

  const solidFill = interpolate(t, [tL5 + 6.5, tL5 + 10.2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const tailSnaps = [tL2 + 2.0, tL2 + 3.8, tL2 + 5.6].map((ts) =>
    interpolate(t, [ts - 0.5, ts], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }),
  );

  const hud = (
    <>
      <SceneBanner
        badge="BAGIAN 3 · KONSEP KIMIA"
        title="Dari Molekul Trigliserida hingga Reaksi Pembakaran"
        accent={PALETTE.teal}
        startFrame={6}
        endFrame={108}
      />

      {showTriglyceride ? (
        <div
          style={{
            position: 'absolute',
            top: 112,
            right: 110,
            width: 820,
            backgroundColor: 'rgba(21,50,67,0.93)',
            border: `5px solid ${PALETTE.teal}`,
            boxShadow: `8px 8px 0 ${PALETTE.ink}`,
            padding: '24px 30px',
          }}
        >
          <div style={{fontFamily: FONT_TITLE, fontSize: 18, color: PALETTE.cyan, marginBottom: 12}}>
            STRUKTUR MINYAK GORENG: TRIGLISERIDA
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 28, color: PALETTE.cream, marginBottom: 16}}>
            1 Molekul Gliserol + 3 Rantai Asam Lemak
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
            <div
              style={{
                backgroundColor: PALETTE.tealMid,
                border: `4px solid ${PALETTE.ink}`,
                padding: '26px 18px',
                fontFamily: FONT_TITLE,
                fontSize: 15,
                color: PALETTE.cream,
              }}
            >
              GLISEROL
              <br />
              (3-C)
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 12, flex: 1}}>
              {['Asam Lemak 1', 'Asam Lemak 2', 'Asam Lemak 3'].map((label, i) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    opacity: tailSnaps[i],
                    transform: `translate3d(${((1 - tailSnaps[i]) * 60).toFixed(2)}px, 0, 0)`,
                  }}
                >
                  <span style={{color: PALETTE.gold, fontFamily: FONT_TITLE, fontSize: 18}}>═══</span>
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: PALETTE.amber,
                      color: PALETTE.ink,
                      fontFamily: FONT_BODY,
                      fontSize: 24,
                      fontWeight: 700,
                      padding: '6px 14px',
                      border: `3px solid ${PALETTE.ink}`,
                    }}
                  >
                    {label} (Rantai Hidrokarbon)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showFiltering ? (
        <div
          style={{
            position: 'absolute',
            top: 114,
            right: 110,
            width: 760,
            backgroundColor: 'rgba(27,16,32,0.93)',
            border: `5px solid ${PALETTE.amber}`,
            boxShadow: `8px 8px 0 ${PALETTE.ink}`,
            padding: '24px 30px',
          }}
        >
          <div style={{fontFamily: FONT_TITLE, fontSize: 20, color: PALETTE.gold, marginBottom: 10}}>
            PENYARINGAN = PEMISAHAN FISIKA
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 28, color: PALETTE.cream, lineHeight: 1.35}}>
            Remah padat tersaring, namun minyak tetap terdegradasi.
          </div>
          <div
            style={{
              marginTop: 14,
              display: 'inline-block',
              backgroundColor: PALETTE.red,
              color: PALETTE.cream,
              fontFamily: FONT_TITLE,
              fontSize: 16,
              padding: '10px 18px',
              border: `3px solid ${PALETTE.ink}`,
            }}
          >
            DISARING ≠ KEMBALI BARU
          </div>
        </div>
      ) : null}

      {showNotParaffin ? (
        <div
          style={{
            position: 'absolute',
            top: 112,
            right: 100,
            width: 860,
            backgroundColor: 'rgba(27,16,32,0.95)',
            border: `6px solid ${PALETTE.red}`,
            boxShadow: `10px 10px 0 ${PALETTE.ink}`,
            padding: '26px 32px',
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18}}>
            <div style={{backgroundColor: PALETTE.amberDeep, color: PALETTE.cream, padding: '12px 18px', border: `4px solid ${PALETTE.ink}`, fontFamily: FONT_TITLE, fontSize: 14}}>
              MINYAK JELANTAH
            </div>
            <div style={{fontFamily: FONT_TITLE, fontSize: 28, color: PALETTE.red}}>──✕──▶</div>
            <div style={{backgroundColor: PALETTE.slate, color: PALETTE.cream, padding: '12px 18px', border: `4px solid ${PALETTE.ink}`, fontFamily: FONT_TITLE, fontSize: 14}}>
              PARAFIN
            </div>
          </div>
          <div style={{fontFamily: FONT_TITLE, fontSize: 24, color: PALETTE.red, marginBottom: 10}}>
            BUKAN PARAFIN!
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 28, color: PALETTE.cream, lineHeight: 1.35}}>
            Jelantah dicampur secara fisika dengan bahan pemadat ({recipe.bahanLilin}).
          </div>
        </div>
      ) : null}

      {showPhaseChange ? (
        <div style={{position: 'absolute', top: 112, right: 110, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start'}}>
          <Tag kind="FISIKA" label="PEMADATAN = PERUBAHAN FISIKA" startFrame={Math.round((tL5 + 9.5) * fps)} />
          <div
            style={{
              backgroundColor: 'rgba(21,50,67,0.93)',
              border: `4px solid ${PALETTE.teal}`,
              boxShadow: `6px 6px 0 ${PALETTE.ink}`,
              padding: '18px 24px',
              maxWidth: 700,
              fontFamily: FONT_BODY,
              fontSize: 28,
              color: PALETTE.cream,
              lineHeight: 1.35,
            }}
          >
            Dipanaskan → meleleh · Didinginkan → memadat (wujud berubah, zat tetap sama).
          </div>
        </div>
      ) : null}

      {showCombustion ? (
        <div style={{position: 'absolute', top: 112, left: 80, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start'}}>
          <Tag kind="KIMIA" label="PEMBAKARAN = PERUBAHAN KIMIA" startFrame={Math.round((tL6 + 6.0) * fps)} />
          <div
            style={{
              backgroundColor: 'rgba(27,16,32,0.92)',
              border: `4px solid ${PALETTE.amber}`,
              boxShadow: `6px 6px 0 ${PALETTE.ink}`,
              padding: '18px 24px',
              maxWidth: 680,
              fontFamily: FONT_BODY,
              fontSize: 28,
              color: PALETTE.cream,
              lineHeight: 1.35,
            }}
          >
            Bahan bakar naik via kapilaritas sumbu → menguap → bereaksi dengan O₂ menghasilkan panas & cahaya.
          </div>
          {META.showOptionalCombustionProducts ? (
            <Tag kind="OPSIONAL" label="[OPSIONAL] Umumnya menghasilkan CO₂ + H₂O" startFrame={Math.round((tL6 + 8.0) * fps)} />
          ) : null}
        </div>
      ) : null}

      {showSummary ? (
        <div
          style={{
            position: 'absolute',
            top: 118,
            left: 120,
            right: 120,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
          }}
        >
          {[
            {n: '1. PEMISAHAN', s: 'Penyaringan fisika', c: PALETTE.teal},
            {n: '2. PENCAMPURAN', s: 'Jelantah + bahan lilin', c: PALETTE.gold},
            {n: '3. WUJUD (FISIKA)', s: 'Meleleh → memadat', c: PALETTE.cyan},
            {n: '4. KIMIA', s: 'Reaksi pembakaran', c: PALETTE.amber},
          ].map((item, idx) => {
            const active = t >= tL7 + 0.8 + idx * 1.1;
            return (
              <div
                key={item.n}
                style={{
                  backgroundColor: active ? 'rgba(27,16,32,0.95)' : 'rgba(27,16,32,0.55)',
                  border: `4px solid ${active ? item.c : PALETTE.slate}`,
                  padding: '18px 18px',
                  boxShadow: active ? `6px 6px 0 ${PALETTE.ink}` : undefined,
                  opacity: active ? 1 : 0.45,
                }}
              >
                <div style={{fontFamily: FONT_TITLE, fontSize: 13, color: item.c, marginBottom: 8}}>{item.n}</div>
                <div style={{fontFamily: FONT_BODY, fontSize: 25, fontWeight: 700, color: PALETTE.cream}}>{item.s}</div>
              </div>
            );
          })}
        </div>
      ) : null}

      <SceneSubtitles sceneId="S03" bottomOffset={40} />
    </>
  );

  return (
    <SceneShell
      grade="lab"
      camX={camX}
      camY={135}
      zoom={camZoom}
      shake={shake}
      farBlur={3.6}
      midBlur={1.4}
      farBg={<LabBackdrop />}
      floor={<StageFloor y={200} topColor={PALETTE.slate} bottomColor={PALETTE.navy} />}
      lights={
        <>
          <HangingLamp x={200} cordLen={16} bulbColor={PALETTE.cyan} coneHeight={165} opacity={0.18} />
          <HangingLamp x={320} cordLen={16} bulbColor={PALETTE.goldPale} coneHeight={165} opacity={0.2} />
          <FloorGlow x={275} y={205} rx={110} ry={14} color={candleLit ? PALETTE.amber : PALETTE.cyan} opacity={0.32} />
          {candleLit ? (
            <PointLight x={352} y={120} radius={135} color={PALETTE.amber} intensity={0.95} flicker banded />
          ) : (
            <PointLight x={260} y={84} radius={130} color={PALETTE.cyan} intensity={0.48} />
          )}
        </>
      }
      bloom={candleLit ? {intensity: 0.36, color: PALETTE.amber} : {intensity: 0.18, color: PALETTE.cyan}}
      dust={{count: 34, color: candleLit ? PALETTE.goldPale : PALETTE.cyan, seed: 's03-dust'}}
      hud={hud}
    >
      <PixelDoor x={426} y={132} glow={PALETTE.amber} label="WORKSHOP" />

      {/* Lab bench top = y:158 */}
      <div
        style={{
          position: 'absolute',
          left: 170,
          top: 158,
          width: 224,
          height: 44,
          backgroundColor: PALETTE.woodMid,
          border: `2px solid ${PALETTE.ink}`,
        }}
      />
      <LabBenchExtras heated={showPhaseChange || candleLit} />

      {/* Beaker + funnel grounded cleanly onto lab bench y=158 */}
      <Img
        src={staticFile('sprites/props/beaker_funnel.png')}
        style={{position: 'absolute', left: 196, top: 122, width: 36, height: 40, imageRendering: 'pixelated'}}
      />

      {/* Hotplate resting cleanly onto y=158 + Melting pot */}
      <div
        style={{
          position: 'absolute',
          left: 252,
          top: 154,
          width: 40,
          height: 6,
          backgroundColor: PALETTE.slate,
          border: `2px solid ${PALETTE.ink}`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 256,
          top: 120,
          width: 32,
          height: 35,
          border: `2px solid ${PALETTE.ink}`,
          backgroundColor: PALETTE.silver,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 2,
            right: 2,
            bottom: 2,
            height: Math.round(24 * solidFill + 8),
            backgroundColor: solidFill > 0.6 ? PALETTE.cream : PALETTE.amber,
          }}
        />
      </div>

      {/* Candle jar grounded flush onto y=158 + dynamic flame */}
      <Img
        src={staticFile('sprites/props/candle_unlit.png')}
        style={{position: 'absolute', left: 336, top: 122, width: 32, height: 40, imageRendering: 'pixelated'}}
      />
      {candleLit ? (
        <>
          <AnimatedFlame x={352} y={134} scale={1} />
          {[0, 1, 2, 3].map((i) => {
            const ang = frame * 0.08 + (i * Math.PI) / 2;
            const ox = 352 + Math.cos(ang) * 18;
            const oy = 118 + Math.sin(ang) * 8;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  transform: `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, 0)`,
                  width: 4,
                  height: 4,
                  backgroundColor: PALETTE.cyan,
                  border: `1px solid ${PALETTE.ink}`,
                }}
              />
            );
          })}
          <Bloom intensity={0.24} color={PALETTE.amber} />
        </>
      ) : null}

      <Character
        id="noya"
        x={noyaX}
        y={202}
        flip={showSummary}
        pose={noyaWalking ? 'walk' : showNotParaffin || showTriglyceride || showCombustion ? 'point' : 'talk'}
        expr={showNotParaffin ? 'determined' : 'happy'}
        lineId={activeLineId}
        z={20}
      />

      {META.showMascotJeli ? (
        <JeliMascot x={jeliX} y={jeliY} mood={candleLit ? 'flame' : showPhaseChange ? 'happy' : 'idle'} z={24} />
      ) : null}

      <Sparkle x={352} y={96} size="sm" color={candleLit ? PALETTE.gold : PALETTE.cyan} />
      <DubLayer sceneId="S03" />
      <SfxLayer cues={S03_SFX} />
    </SceneShell>
  );
};
