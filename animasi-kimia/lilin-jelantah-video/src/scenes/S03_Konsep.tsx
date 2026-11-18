import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character, JeliMascot} from '../characters/Character';
import {S03_SFX} from '../data/cues/S03.cues';
import {META} from '../data/meta';
import {PALETTE} from '../data/palette';
import {recipe} from '../data/recipe';
import {SceneShell} from '../engine/SceneShell';
import {Bloom, PointLight, Sparkle} from '../engine/Lighting';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {ART_H, ART_W, snap} from '../lib/pixel';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {Tag} from '../ui/Tag';
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

  // Beat flags
  const showTriglyceride = t >= tL2 && t < tL3;
  const showFiltering = t >= tL3 && t < tL4;
  const showNotParaffin = t >= tL4 && t < tL5;
  const showPhaseChange = t >= tL5 && t < tL6;
  const showCombustion = t >= tL6 && t < tL7;
  const showSummary = t >= tL7;

  const candleLit = t >= tL6 + 1.3;
  const shake = t >= tL4 + 1.8 && t <= tL4 + 2.3 ? 1 : 0;

  // Camera zoom per beat (establishing -> board close-up -> bench -> candle flame)
  const camZoom =
    showTriglyceride || showNotParaffin
      ? 1.18
      : showCombustion
        ? interpolate(t, [tL6, tL6 + 3], [1.1, 1.38], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
        : 1.0;
  const camX = showCombustion ? 318 : showTriglyceride ? 265 : 240;

  // Solidification progress during L05 (liquid -> solid wipe bottom-up)
  const solidFill = interpolate(t, [tL5 + 6.5, tL5 + 10.2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  // 3 fatty acid chains snap into glycerol
  const tailSnaps = [tL2 + 2.0, tL2 + 3.8, tL2 + 5.6].map((ts) =>
    interpolate(t, [ts - 0.5, ts], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
  );

  const hud = (
    <>
      <SceneBanner badge="BAGIAN 3 · KONSEP KIMIA" title="Dari Molekul Trigliserida hingga Reaksi Pembakaran" accent={PALETTE.teal} startFrame={6} endFrame={135} />

      {/* L02 Triglyceride chalkboard overlay */}
      {showTriglyceride ? (
        <div
          style={{
            position: 'absolute',
            top: 90,
            right: 120,
            width: 820,
            backgroundColor: 'rgba(21,50,67,0.92)',
            border: `5px solid ${PALETTE.teal}`,
            boxShadow: `8px 8px 0 ${PALETTE.ink}`,
            padding: '24px 30px',
          }}
        >
          <div style={{fontFamily: FONT_TITLE, fontSize: 20, color: PALETTE.cyan, marginBottom: 14}}>
            STRUKTUR MINYAK GORENG: TRIGLISERIDA
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 30, color: PALETTE.cream, marginBottom: 16}}>
            1 Molekul Gliserol + 3 Rantai Asam Lemak
          </div>
          {/* Crisp schematic */}
          <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
            <div
              style={{
                backgroundColor: PALETTE.tealMid,
                border: `4px solid ${PALETTE.ink}`,
                padding: '28px 18px',
                fontFamily: FONT_TITLE,
                fontSize: 16,
                color: PALETTE.cream,
              }}
            >
              GLISEROL
              <br />
              (3-C)
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 14, flex: 1}}>
              {['Asam Lemak 1', 'Asam Lemak 2', 'Asam Lemak 3'].map((label, i) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    opacity: tailSnaps[i],
                    transform: `translateX(${((1 - tailSnaps[i]) * 60).toFixed(0)}px)`,
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

      {/* L03 Filtering != New */}
      {showFiltering ? (
        <div
          style={{
            position: 'absolute',
            top: 110,
            right: 120,
            width: 760,
            backgroundColor: 'rgba(27,16,32,0.92)',
            border: `5px solid ${PALETTE.amber}`,
            padding: '24px 30px',
          }}
        >
          <div style={{fontFamily: FONT_TITLE, fontSize: 22, color: PALETTE.gold, marginBottom: 10}}>
            PENYARINGAN = PEMISAHAN FISIKA
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 30, color: PALETTE.cream}}>
            Remah padat tersaring, namun minyak tetap terdegradasi.
          </div>
          <div
            style={{
              marginTop: 14,
              display: 'inline-block',
              backgroundColor: PALETTE.red,
              color: PALETTE.cream,
              fontFamily: FONT_TITLE,
              fontSize: 18,
              padding: '10px 18px',
              border: `3px solid ${PALETTE.ink}`,
            }}
          >
            DISARING ≠ KEMBALI BARU
          </div>
        </div>
      ) : null}

      {/* L04 STRICT RULE: Jelantah DOES NOT become Paraffin */}
      {showNotParaffin ? (
        <div
          style={{
            position: 'absolute',
            top: 90,
            right: 100,
            width: 860,
            backgroundColor: 'rgba(27,16,32,0.94)',
            border: `6px solid ${PALETTE.red}`,
            boxShadow: `10px 10px 0 ${PALETTE.ink}`,
            padding: '26px 32px',
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18}}>
            <div style={{backgroundColor: PALETTE.amberDeep, color: PALETTE.cream, padding: '12px 18px', border: `4px solid ${PALETTE.ink}`, fontFamily: FONT_TITLE, fontSize: 14}}>
              MINYAK JELANTAH
            </div>
            <div style={{position: 'relative', fontFamily: FONT_TITLE, fontSize: 28, color: PALETTE.red}}>
              ──✕──▶
            </div>
            <div style={{backgroundColor: PALETTE.slate, color: PALETTE.cream, padding: '12px 18px', border: `4px solid ${PALETTE.ink}`, fontFamily: FONT_TITLE, fontSize: 14}}>
              PARAFIN
            </div>
          </div>
          <div style={{fontFamily: FONT_TITLE, fontSize: 26, color: PALETTE.red, marginBottom: 10}}>
            BUKAN PARAFIN!
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 28, color: PALETTE.cream}}>
            Jelantah dicampur secara fisika dengan bahan pemadat ({recipe.bahanLilin}).
          </div>
        </div>
      ) : null}

      {/* L05 Physical state change: Solidification */}
      {showPhaseChange ? (
        <div style={{position: 'absolute', top: 100, right: 120, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start'}}>
          <Tag kind="FISIKA" label="PEMADATAN = PERUBAHAN FISIKA" startFrame={Math.round((tL5 + 9.5) * fps)} />
          <div
            style={{
              backgroundColor: 'rgba(21,50,67,0.92)',
              border: `4px solid ${PALETTE.teal}`,
              padding: '18px 24px',
              maxWidth: 700,
              fontFamily: FONT_BODY,
              fontSize: 28,
              color: PALETTE.cream,
            }}
          >
            Dipanaskan → meleleh · Didinginkan → memadat (wujud berubah, zat tetap sama).
          </div>
        </div>
      ) : null}

      {/* L06 Chemical reaction: Combustion + optional CO2 + H2O */}
      {showCombustion ? (
        <div style={{position: 'absolute', top: 90, left: 80, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start'}}>
          <Tag kind="KIMIA" label="PEMBAKARAN = PERUBAHAN KIMIA" startFrame={Math.round((tL6 + 6.0) * fps)} />
          <div
            style={{
              backgroundColor: 'rgba(27,16,32,0.9)',
              border: `4px solid ${PALETTE.amber}`,
              padding: '18px 24px',
              maxWidth: 680,
              fontFamily: FONT_BODY,
              fontSize: 28,
              color: PALETTE.cream,
            }}
          >
            Bahan bakar naik via kapilaritas sumbu → menguap → bereaksi dengan O₂ menghasilkan panas & cahaya.
          </div>
          {META.showOptionalCombustionProducts ? (
            <Tag kind="OPSIONAL" label="[OPSIONAL] Umumnya menghasilkan CO₂ + H₂O" startFrame={Math.round((tL6 + 8.0) * fps)} />
          ) : null}
        </div>
      ) : null}

      {/* L07 Four concepts summary */}
      {showSummary ? (
        <div
          style={{
            position: 'absolute',
            top: 108,
            left: 140,
            right: 140,
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
                  padding: '18px 16px',
                  boxShadow: active ? `6px 6px 0 ${PALETTE.ink}` : undefined,
                  opacity: active ? 1 : 0.45,
                }}
              >
                <div style={{fontFamily: FONT_TITLE, fontSize: 14, color: item.c, marginBottom: 8}}>{item.n}</div>
                <div style={{fontFamily: FONT_BODY, fontSize: 24, color: PALETTE.cream}}>{item.s}</div>
              </div>
            );
          })}
        </div>
      ) : null}

      <SceneSubtitles sceneId="S03" bottomOffset={44} />
    </>
  );

  return (
    <SceneShell
      grade="lab"
      camX={camX}
      camY={135}
      zoom={camZoom}
      shake={shake}
      farBlur={4}
      midBlur={1.5}
      farBg={
        <div
          style={{
            width: ART_W,
            height: ART_H,
            background: `linear-gradient(180deg, ${PALETTE.tealDark} 0%, ${PALETTE.navy} 100%)`,
          }}
        >
          {/* Lab blackboard */}
          <div
            style={{
              position: 'absolute',
              left: 165,
              top: 26,
              width: 248,
              height: 112,
              backgroundColor: PALETTE.greenDark,
              border: `5px solid ${PALETTE.woodMid}`,
            }}
          />
        </div>
      }
      floor={<StageFloor y={200} topColor={PALETTE.slate} bottomColor={PALETTE.navy} />}
      lights={
        candleLit ? (
          <PointLight x={352} y={120} radius={130} color={PALETTE.amber} intensity={0.95} flicker banded />
        ) : (
          <PointLight x={260} y={80} radius={120} color={PALETTE.cyan} intensity={0.4} />
        )
      }
      bloom={candleLit ? {intensity: 0.35, color: PALETTE.amber} : {intensity: 0.15, color: PALETTE.cyan}}
      dust={{count: 30, color: candleLit ? PALETTE.goldPale : PALETTE.cyan, seed: 's03-dust'}}
      hud={hud}
    >
      {/* Door to Workshop on right */}
      <PixelDoor x={426} y={132} glow={PALETTE.amber} label="WORKSHOP" />

      {/* Lab bench */}
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

      {/* Beaker + funnel */}
      <Img
        src={staticFile('sprites/props/beaker_funnel.png')}
        style={{position: 'absolute', left: 190, top: 120, width: 36, height: 40, imageRendering: 'pixelated'}}
      />

      {/* Electric hotplate + Melting pot / solidification jar */}
      <div
        style={{
          position: 'absolute',
          left: 252,
          top: 156,
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
          height: 36,
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
            height: snap(24 * solidFill + 8),
            backgroundColor: solidFill > 0.6 ? PALETTE.cream : PALETTE.amber,
          }}
        />
      </div>

      {/* Candle jar & dynamic flame */}
      <Img
        src={staticFile('sprites/props/candle_unlit.png')}
        style={{position: 'absolute', left: 336, top: 120, width: 32, height: 40, imageRendering: 'pixelated'}}
      />
      {candleLit ? (
        <>
          <AnimatedFlame x={352} y={132} scale={1} />
          {/* Swirling O2 particles */}
          {[0, 1, 2, 3].map((i) => {
            const ang = frame * 0.1 + (i * Math.PI) / 2;
            const ox = snap(352 + Math.cos(ang) * 18);
            const oy = snap(118 + Math.sin(ang) * 8);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: ox,
                  top: oy,
                  width: 4,
                  height: 4,
                  backgroundColor: PALETTE.cyan,
                  border: `1px solid ${PALETTE.ink}`,
                }}
              />
            );
          })}
          <Bloom intensity={0.22} color={PALETTE.amber} />
        </>
      ) : null}

      {/* Noya presenter */}
      <Character
        id="noya"
        x={124}
        y={202}
        flip={showSummary}
        pose={showNotParaffin || showTriglyceride ? 'point' : 'talk'}
        expr={showNotParaffin ? 'determined' : 'happy'}
        lineId={activeLineId}
        z={20}
      />

      {META.showMascotJeli ? (
        <JeliMascot x={80} y={186} mood={candleLit ? 'happy' : 'idle'} z={22} />
      ) : null}

      <Sparkle x={352} y={96} size="sm" color={candleLit ? PALETTE.gold : PALETTE.cyan} />
      <DubLayer sceneId="S03" />
      <SfxLayer cues={S03_SFX} />
    </SceneShell>
  );
};
