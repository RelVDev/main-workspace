import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character, JeliMascot} from '../characters/Character';
import {S02_SFX} from '../data/cues/S02.cues';
import {META} from '../data/meta';
import {PALETTE} from '../data/palette';
import {SceneShell} from '../engine/SceneShell';
import {PointLight} from '../engine/Lighting';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {ART_H, ART_W, snap} from '../lib/pixel';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
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

  // Active line for Malika's lip-sync
  const activeLineId = ['S02_L01', 'S02_L02', 'S02_L03', 'S02_L04', 'S02_L05', 'S02_L06', 'S02_L07', 'S02_L08', 'S02_L09'].find(
    (id) => frame >= Math.round(lineStartSec(id) * fps) && frame <= lineEnd(id),
  );

  // Camera framing per beat
  const camZoom =
    t < 4
      ? interpolate(t, [0, 4], [1, 1.15], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
      : isPanHeat
        ? 1.5
        : 1.05;
  const camX = isPanHeat ? 305 : 240;

  // Oil gold -> dark amber color progression during L02
  const oilDarkness = interpolate(t, [tL2, tL2 + 5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // River O2 bubbles blocked at oil slick
  const bubbleY = (idx: number) => {
    const raw = 240 - ((frame * 1.4 + idx * 24) % 145);
    return Math.max(108, snap(raw));
  };

  // Jiggling degraded molecules at L06
  const jiggle = (idx: number) => snap(Math.sin(frame * 0.7 + idx * 1.9) * 3);

  const hud = (
    <>
      <SceneBanner badge="BAGIAN 2 · MASALAH" title="Mengapa Minyak Jelantah Perlu Dikelola?" accent={PALETTE.amber} startFrame={10} endFrame={135} />

      {/* L02 progression text */}
      {t >= tL2 && t < tL3 ? (
        <div
          style={{
            position: 'absolute',
            top: 140,
            left: 110,
            backgroundColor: 'rgba(27,16,32,0.9)',
            border: `4px solid ${PALETTE.gold}`,
            padding: '18px 26px',
            fontFamily: FONT_TITLE,
            fontSize: 18,
            color: PALETTE.cream,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span style={{color: PALETTE.gold}}>MINYAK GORENG</span>
          <span>→</span>
          <span style={{color: PALETTE.amber}}>DIPAKAI BERULANG</span>
          <span>→</span>
          <span style={{color: PALETTE.red}}>JELANTAH</span>
        </div>
      ) : null}

      {/* L04-L05 environmental impact caption */}
      {isRiver ? (
        <div
          style={{
            position: 'absolute',
            top: 90,
            right: 80,
            backgroundColor: 'rgba(21,50,67,0.92)',
            border: `4px solid ${PALETTE.red}`,
            padding: '18px 24px',
            maxWidth: 680,
          }}
        >
          <div style={{fontFamily: FONT_TITLE, fontSize: 16, color: PALETTE.red, marginBottom: 8}}>
            ✕ PERTUKARAN O₂ TERHAMBAT
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 28, color: PALETTE.cream}}>
            {t >= tL5
              ? 'Kajian lingkungan membahas dampaknya pada kualitas air & tanah.'
              : 'Lapisan minyak menutup permukaan air dan mengganggu organisme.'}
          </div>
        </div>
      ) : null}

      {/* L06 repeat-frying warning */}
      {isPanHeat ? (
        <div
          style={{
            position: 'absolute',
            top: 110,
            left: 90,
            backgroundColor: 'rgba(27,16,32,0.92)',
            border: `4px solid ${PALETTE.red}`,
            padding: '18px 26px',
          }}
        >
          <div style={{fontFamily: FONT_TITLE, fontSize: 18, color: PALETTE.red, marginBottom: 8}}>
            ✕ JANGAN DIGORENG BERULANG
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 28, color: PALETTE.cream}}>
            Pemanasan berulang memicu senyawa hasil degradasi minyak.
          </div>
        </div>
      ) : null}

      {/* L08 project guiding question */}
      {t >= tL8 ? (
        <div
          style={{
            position: 'absolute',
            top: 120,
            left: 160,
            right: 160,
            textAlign: 'center',
            backgroundColor: 'rgba(27,16,32,0.9)',
            border: `5px solid ${PALETTE.teal}`,
            padding: '22px 32px',
            boxShadow: `8px 8px 0 ${PALETTE.ink}`,
          }}
        >
          <div style={{fontFamily: FONT_TITLE, fontSize: 20, color: PALETTE.teal, marginBottom: 10}}>
            PERTANYAAN PROYEK
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 34, fontWeight: 700, color: PALETTE.cream}}>
            Bagaimana jelantah diolah menjadi lilin aromatis yang berguna dengan konsep kimia yang tepat?
          </div>
        </div>
      ) : null}

      <SceneSubtitles sceneId="S02" bottomOffset={48} />
    </>
  );

  return (
    <SceneShell
      grade={isRiver ? 'river' : 'kitchen'}
      camX={camX}
      camY={135}
      zoom={camZoom}
      farBlur={isRiver ? 4 : 5}
      midBlur={2}
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
          <div
            style={{
              width: ART_W,
              height: ART_H,
              background: `linear-gradient(180deg, ${PALETTE.woodDark} 0%, ${PALETTE.plumMid} 100%)`,
            }}
          >
            {/* Kitchen window */}
            <div
              style={{
                position: 'absolute',
                left: 56,
                top: 32,
                width: 96,
                height: 76,
                backgroundColor: PALETTE.goldPale,
                border: `4px solid ${PALETTE.woodLight}`,
              }}
            />
          </div>
        )
      }
      floor={
        isRiver ? null : (
          <StageFloor y={200} topColor={PALETTE.woodMid} bottomColor={PALETTE.woodDark} />
        )
      }
      lights={
        isRiver ? (
          <PointLight x={240} y={80} radius={130} color={PALETTE.teal} intensity={0.35} />
        ) : (
          <PointLight x={104} y={70} radius={120} color={PALETTE.goldPale} intensity={0.55} />
        )
      }
      rays={isRiver ? false : {color: PALETTE.goldPale, opacity: 0.16, angleDeg: 28}}
      dust={{count: 28, color: isRiver ? PALETTE.cyan : PALETTE.cream, seed: 's02-dust'}}
      hud={hud}
    >
      {isRiver ? (
        /* River cross-section & soil comparison */
        <div style={{position: 'absolute', inset: 0}}>
          {/* Oil slick blocking surface */}
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
          {/* Blocked O2 bubbles */}
          {[70, 120, 180, 240].map((bx, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: bx,
                top: bubbleY(i),
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
          {/* Soil patch on right when L05 starts */}
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
        /* Kitchen counter & props */
        <div style={{position: 'absolute', inset: 0}}>
          {/* Kitchen counter */}
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
          />
          {/* Oil bottle shifting from gold to dark used */}
          <Img
            src={staticFile(`sprites/props/${oilDarkness > 0.5 ? 'bottle_used' : 'bottle_gold'}.png`)}
            style={{position: 'absolute', left: 224, top: 124, width: 24, height: 36, imageRendering: 'pixelated'}}
          />
          {/* Stove + pan */}
          <Img
            src={staticFile('sprites/props/pan_stove.png')}
            style={{position: 'absolute', left: 286, top: 128, width: 48, height: 32, imageRendering: 'pixelated'}}
          />
          {/* Sink & X cross when pouring at L03 */}
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
          {/* Degraded jiggling molecules during L06 */}
          {isPanHeat ? (
            <>
              {[0, 1, 2].map((m) => (
                <div
                  key={m}
                  style={{
                    position: 'absolute',
                    left: 294 + m * 12 + jiggle(m),
                    top: 108 + jiggle(m + 3),
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

          {/* Malika */}
          <Character
            id="malika"
            x={t >= tL3 && t < tL4 ? 320 : 140}
            y={202}
            pose={isHope ? 'point' : t >= tL3 && t < tL4 ? 'hold' : 'talk'}
            expr={t >= tL3 && t < tL7 ? 'worried' : isHope ? 'happy' : 'neutral'}
            lineId={activeLineId}
            emote={
              t >= tL7 && t < tL8
                ? {type: 'idea', startFrame: Math.round(tL7 * fps), durationFrames: 36}
                : undefined
            }
            z={20}
          />

          {/* Noya walks in at L09 */}
          {t >= tL9 - 1.5 ? (
            <Character
              id="noya"
              x={snap(interpolate(t, [tL9 - 1.5, tL9 + 1.0], [460, 385], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}))}
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
