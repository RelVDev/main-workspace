import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character, JeliMascot} from '../characters/Character';
import {S02_SFX} from '../data/cues/S02.cues';
import {META} from '../data/meta';
import {PALETTE} from '../data/palette';
import {FloorGlow, PointLight} from '../engine/Lighting';
import {SceneShell} from '../engine/SceneShell';
import {smoothKeyframes} from '../lib/easing';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {ART_H, ART_W} from '../lib/pixel';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {HangingLamp, KitchenBackdrop, PottedPlant, RiverDioramaExtras} from './shared/RoomDecor';
import {StageFloor} from './shared/StageElements';

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

  // Lively, expressive zoom & pan keyframes across kitchen & river beats
  const camZoom = smoothKeyframes(t, [
    [0, 1.0],
    [3.5, 1.18],
    [tL2 + 1.0, 1.24],
    [tL3 - 0.3, 1.18],
    [tL3 + 1.0, 1.12],
    [tL4 - 0.3, 1.12],
    [tL4 + 0.9, 1.04],
    [tL5 + 1.5, 1.14],
    [tL6 - 0.3, 1.08],
    [tL6 + 1.0, 1.48],
    [tL7 - 0.4, 1.48],
    [tL7 + 0.9, 1.04],
    [tL8 + 2.0, 1.14],
    [tL9, 1.06],
  ]);

  const camX = smoothKeyframes(t, [
    [0, 240],
    [tL2 + 1.0, 252],
    [tL3 - 0.2, 244],
    [tL3 + 1.0, 286],
    [tL4 - 0.2, 286],
    [tL4 + 0.7, 240],
    [tL6 - 0.3, 240],
    [tL6 + 1.0, 304],
    [tL7 - 0.4, 304],
    [tL7 + 0.9, 240],
    [tL9, 260],
  ]);

  const malikaX = smoothKeyframes(t, [
    [0, 140],
    [tL3 - 0.2, 140],
    [tL3 + 1.0, 318],
    [tL7 - 0.2, 318],
    [tL7 + 0.9, 140],
  ]);
  const malikaWalking =
    (t >= tL3 - 0.2 && t <= tL3 + 0.95) || (t >= tL7 - 0.2 && t <= tL7 + 0.85);

  const oilDarkness = interpolate(t, [tL2, tL2 + 5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bubbleY = (idx: number) => Math.max(108, 240 - ((frame * 1.35 + idx * 24) % 140));
  const jiggleX = (idx: number) => Math.sin(frame * 0.42 + idx * 2.1) * 2.4;
  const jiggleY = (idx: number) => Math.cos(frame * 0.36 + idx * 1.7) * 2.2;

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

  return (
    <SceneShell
      grade={isRiver ? 'river' : 'kitchen'}
      camX={camX}
      camY={135}
      zoom={camZoom}
      farBlur={isRiver ? 3.5 : 4.2}
      midBlur={1.8}
      farBg={
        isRiver ? (
          <div
            style={{
              width: ART_W,
              height: ART_H,
              background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.tealDark} 45%, ${PALETTE.ink} 100%)`,
            }}
          />
        ) : (
          <KitchenBackdrop />
        )
      }
      floor={
        isRiver ? null : (
          <StageFloor y={200} topColor={PALETTE.woodMid} bottomColor={PALETTE.woodDark} />
        )
      }
      lights={
        isRiver ? (
          <>
            <PointLight x={200} y={80} radius={150} color={PALETTE.teal} intensity={0.42} />
            <PointLight x={340} y={150} radius={110} color={PALETTE.cyan} intensity={0.28} />
          </>
        ) : (
          <>
            <HangingLamp x={295} cordLen={18} bulbColor={PALETTE.goldPale} coneHeight={165} opacity={0.24} />
            <PointLight x={92} y={66} radius={130} color={PALETTE.goldPale} intensity={0.62} />
            <FloorGlow x={295} y={206} rx={86} ry={14} color={PALETTE.amber} opacity={0.34} />
          </>
        )
      }
      rays={isRiver ? {color: PALETTE.teal, opacity: 0.14, angleDeg: 18} : {color: PALETTE.goldPale, opacity: 0.18, angleDeg: 28}}
      dust={{count: 34, color: isRiver ? PALETTE.cyan : PALETTE.cream, seed: 's02-dust'}}
      hud={hud}
    >
      {isRiver ? (
        <div style={{position: 'absolute', inset: 0}}>
          <RiverDioramaExtras />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 94,
              height: 12,
              backgroundColor: PALETTE.amberDeep,
              borderTop: `2px solid ${PALETTE.ink}`,
              borderBottom: `2px solid ${PALETTE.ink}`,
            }}
          />
          {[70, 120, 180, 240, 290].map((bx, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transform: `translate3d(${(bx + Math.sin(frame / 10 + i) * 3).toFixed(2)}px, ${bubbleY(i).toFixed(2)}px, 0)`,
                width: 6,
                height: 6,
                borderRadius: '50%',
                border: `1px solid ${PALETTE.cyan}`,
                backgroundColor: `${PALETTE.teal}66`,
              }}
            />
          ))}
          <Img
            src={staticFile('sprites/ui/icon_x.png')}
            style={{position: 'absolute', left: 144, top: 88, width: 20, height: 20, imageRendering: 'pixelated'}}
          />
          {t >= tL5 ? (
            <div
              style={{
                position: 'absolute',
                right: 28,
                top: 140,
                width: 120,
                height: 68,
                backgroundColor: PALETTE.woodDark,
                border: `2px solid ${PALETTE.ink}`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 26,
                  top: 14,
                  width: 64,
                  height: 28,
                  backgroundColor: PALETTE.ink,
                  opacity: 0.65,
                  borderRadius: '50%',
                }}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{position: 'absolute', inset: 0}}>
          {/* Kitchen counter top edge = y:158 */}
          <div
            style={{
              position: 'absolute',
              left: 190,
              top: 158,
              width: 240,
              height: 44,
              backgroundColor: PALETTE.woodLight,
              border: `2px solid ${PALETTE.ink}`,
            }}
          >
            {[16, 78, 140, 194].map((cx) => (
              <div
                key={cx}
                style={{
                  position: 'absolute',
                  left: cx,
                  top: 8,
                  width: 36,
                  height: 28,
                  backgroundColor: PALETTE.woodMid,
                  border: `1px solid ${PALETTE.ink}`,
                }}
              />
            ))}
          </div>

          {/* All counter props grounded flush onto y=158 compensating transparent PNG bottom padding */}
          <Img
            src={staticFile(`sprites/props/${oilDarkness > 0.5 ? 'bottle_used' : 'bottle_gold'}.png`)}
            style={{position: 'absolute', left: 222, top: 125, width: 24, height: 36, imageRendering: 'pixelated'}}
          />
          <Img
            src={staticFile('sprites/props/beaker_funnel.png')}
            style={{position: 'absolute', left: 254, top: 135, width: 22, height: 26, imageRendering: 'pixelated'}}
          />
          <Img
            src={staticFile('sprites/props/pan_stove.png')}
            style={{position: 'absolute', left: 286, top: 129, width: 48, height: 32, imageRendering: 'pixelated'}}
          />
          <PottedPlant x={446} y={200} h={24} />

          {t >= tL3 && t < tL4 ? (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: 368,
                  top: 146,
                  width: 44,
                  height: 14,
                  backgroundColor: PALETTE.silver,
                  border: `2px solid ${PALETTE.ink}`,
                }}
              />
              <Img
                src={staticFile('sprites/ui/icon_x.png')}
                style={{position: 'absolute', left: 378, top: 118, width: 24, height: 24, imageRendering: 'pixelated'}}
              />
            </>
          ) : null}

          {isPanHeat ? (
            <>
              {[0, 1, 2].map((m) => (
                <div
                  key={m}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    transform: `translate3d(${(294 + m * 12 + jiggleX(m)).toFixed(2)}px, ${(108 + jiggleY(m)).toFixed(2)}px, 0)`,
                    width: 8,
                    height: 8,
                    backgroundColor: PALETTE.red,
                    border: `1px solid ${PALETTE.ink}`,
                  }}
                />
              ))}
              <Img
                src={staticFile('sprites/ui/icon_x.png')}
                style={{position: 'absolute', left: 300, top: 96, width: 20, height: 20, imageRendering: 'pixelated'}}
              />
            </>
          ) : null}

          <Character
            id="malika"
            x={malikaX}
            y={202}
            pose={malikaWalking ? 'walk' : isHope ? 'point' : t >= tL3 && t < tL4 ? 'hold' : 'talk'}
            expr={t >= tL3 && t < tL7 ? 'worried' : isHope ? 'happy' : 'neutral'}
            lineId={activeLineId}
            emote={
              t >= tL7 && t < tL8
                ? {type: 'idea', startFrame: Math.round(tL7 * fps), durationFrames: 36}
                : undefined
            }
            z={20}
          />

          {t >= tL9 - 1.5 ? (
            <Character
              id="noya"
              x={interpolate(t, [tL9 - 1.5, tL9 + 1.0], [460, 385], {
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
            <JeliMascot
              x={92}
              y={186}
              mood={t >= tL3 && t < tL7 ? 'worried' : isHope ? 'happy' : 'idle'}
              z={22}
            />
          ) : null}
        </div>
      )}

      <DubLayer sceneId="S02" />
      <SfxLayer cues={S02_SFX} />
    </SceneShell>
  );
};
