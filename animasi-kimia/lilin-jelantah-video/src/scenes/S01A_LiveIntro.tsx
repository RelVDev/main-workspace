import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character} from '../characters/Character';
import {CHARACTERS, getSpeakerInfo} from '../characters/registry';
import {S01A_SFX} from '../data/cues/S01A.cues';
import {META} from '../data/meta';
import {PALETTE} from '../data/palette';
import {S01A_LIVE_LINES, type CharId} from '../data/script';
import {SfxLayer} from '../audio/SfxLayer';
import {Grain} from '../engine/Grain';
import {Vignette} from '../engine/Vignette';
import {FOOTAGE_MAP, RealFootage} from '../footage/RealFootage';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {ART_H, ART_W, PX, snap} from '../lib/pixel';
import {NamePlate} from '../ui/NamePlate';
import {SceneSubtitles} from '../ui/Subtitles';

const INTRO_CAST: CharId[] = [
  'malika',
  'noya',
  'marsha',
  'ayuya',
  'lovyta',
  'farel',
  'sofi',
  'disa',
  'ais',
];

export const S01A_LiveIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;

  const hasRealF00 = Boolean(FOOTAGE_MAP.F00?.present);
  const coverFrame = Math.round(META.coverAtSec * fps);
  const rampStart = durationInFrames - fps; // last 1.0s pixelate ramp

  // Active speaker during 0..35.5s
  const activeLine = S01A_LIVE_LINES.find((l) => t >= l.startSec && t <= l.endSec);
  const activeChar: CharId | null =
    activeLine && activeLine.speaker !== 'semua' ? (activeLine.speaker as CharId) : null;

  // Fade in from black (6 frames)
  const fadeIn = interpolate(frame, [0, 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Warm edge portal glow 30..35s
  const portalGlow = interpolate(t, [30, 35.5], [0, 0.75], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Hand cover slam progress (35.0s -> coverAtSec)
  const handClose = interpolate(frame, [coverFrame - 14, coverFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Progressive pixelate ramp in final 1s (5 stepped block sizes)
  const rampStep = frame >= rampStart ? Math.min(4, Math.floor((frame - rampStart) / 6)) : -1;
  const shakePx = Math.abs(frame - coverFrame) < 6 ? (frame % 2 === 0 ? 3 : -3) : 0;

  return (
    <AbsoluteFill style={{backgroundColor: PALETTE.void, opacity: fadeIn}}>
      <AbsoluteFill style={{transform: `translate(${shakePx}px, ${shakePx}px)`}}>
        {/* Main live-action footage F00 or stylized studio intro slot */}
        {hasRealF00 ? (
          frame >= rampStart && FOOTAGE_MAP.F00?.pix ? (
            <RealFootage id="F00" variant="pixel" />
          ) : (
            <RealFootage id="F00" variant="natural" />
          )
        ) : (
          <AbsoluteFill
            style={{
              background: `linear-gradient(160deg, #2C1D35 0%, #3E273A 55%, #5A3418 100%)`,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {/* Subtle camera viewfinder corners */}
            <div
              style={{
                position: 'absolute',
                inset: 42,
                border: `4px dashed rgba(255,243,220,0.22)`,
              }}
            />

            {/* Live-action placeholder stage */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 24,
                padding: '36px 56px',
                backgroundColor: 'rgba(27,16,32,0.82)',
                border: `6px solid ${PALETTE.gold}`,
                boxShadow: `12px 12px 0 ${PALETTE.ink}`,
                maxWidth: 1180,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_TITLE,
                  fontSize: 20,
                  color: PALETTE.gold,
                  letterSpacing: 1,
                }}
              >
                [REC] · SLOT FOOTAGE ASLI F00 (LIVE-ACTION KELOMPOK)
              </div>
              <div
                style={{
                  fontFamily: FONT_BODY,
                  fontSize: 38,
                  color: PALETTE.cream,
                  textAlign: 'center',
                  lineHeight: 1.35,
                }}
              >
                {activeLine
                  ? `${getSpeakerInfo(activeLine.speaker).name}: "${activeLine.text}"`
                  : t >= META.coverAtSec
                    ? 'Malika menutup kamera dengan telapak tangan...'
                    : 'Kelompok bersiap menyapa di depan kamera...'}
              </div>
              {/* 9 mini cast preview row */}
              <div style={{display: 'flex', gap: 18, marginTop: 10}}>
                {INTRO_CAST.map((cid) => {
                  const isSpk = activeChar === cid || (activeLine?.speaker === 'semua');
                  return (
                    <div
                      key={cid}
                      style={{
                        padding: '8px 14px',
                        backgroundColor: isSpk ? CHARACTERS[cid].accentColor : PALETTE.plumMid,
                        color: isSpk ? PALETTE.ink : PALETTE.cream,
                        fontFamily: FONT_TITLE,
                        fontSize: 12,
                        border: `3px solid ${PALETTE.ink}`,
                      }}
                    >
                      {CHARACTERS[cid].displayName}
                    </div>
                  );
                })}
              </div>
            </div>
          </AbsoluteFill>
        )}

        {/* Top-left course badge */}
        <div
          style={{
            position: 'absolute',
            top: 38,
            left: 48,
            backgroundColor: 'rgba(27,16,32,0.86)',
            border: `4px solid ${PALETTE.gold}`,
            padding: '10px 18px',
            fontFamily: FONT_TITLE,
            fontSize: 16,
            color: PALETTE.cream,
            boxShadow: `4px 4px 0 ${PALETTE.ink}`,
          }}
        >
          PRAKTIKUM KIMIA DASAR
        </div>

        {/* Bottom-left jumping pixel avatar preview when a member speaks */}
        {activeChar && t < META.coverAtSec ? (
          <div
            style={{
              position: 'absolute',
              left: 52,
              bottom: 210,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 192,
                height: 240,
                position: 'relative',
                backgroundColor: 'rgba(27,16,32,0.75)',
                border: `4px solid ${CHARACTERS[activeChar].accentColor}`,
                boxShadow: `6px 6px 0 ${PALETTE.ink}`,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 80,
                  transform: 'scale(3)',
                  transformOrigin: 'top left',
                  imageRendering: 'pixelated',
                  position: 'relative',
                }}
              >
                <Character
                  id={activeChar}
                  x={32}
                  y={74}
                  pose="wave"
                  expr="happy"
                  mouth={frame % 10 < 5 ? 'open' : 'smile'}
                  jumpY={frame % 16 < 8 ? 3 : 0}
                />
              </div>
            </div>
            <NamePlate
              name={CHARACTERS[activeChar].displayName}
              color={CHARACTERS[activeChar].accentColor}
              sublabel={CHARACTERS[activeChar].role}
            />
          </div>
        ) : null}

        {/* Warm portal glow around frame edges 30..35s */}
        {portalGlow > 0 ? (
          <AbsoluteFill
            style={{
              boxShadow: `inset 0 0 120px rgba(255,178,90,${portalGlow.toFixed(2)})`,
              pointerEvents: 'none',
            }}
          />
        ) : null}

        {/* Giant pixel hand covering lens (35.5s -> 40s) + progressive pixel ramp */}
        {handClose > 0 ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: ART_W,
              height: ART_H,
              transform: `scale(${PX})`,
              transformOrigin: 'top left',
              imageRendering: 'pixelated',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: `translateY(${snap((1 - handClose) * 180)}px) scale(${(1.25 - handClose * 0.25).toFixed(2)})`,
                opacity: Math.min(1, handClose * 1.4),
              }}
            >
              <Img
                src={staticFile('sprites/fx/giant_palm.png')}
                style={{width: ART_W, height: ART_H, imageRendering: 'pixelated'}}
              />
            </div>
            {/* 5-stage pixelate ramp overlay converging cleanly to HAND_FILL */}
            {rampStep >= 0 ? (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: META.HAND_FILL,
                  opacity: [0.2, 0.42, 0.65, 0.85, 1][rampStep] ?? 1,
                }}
              />
            ) : null}
          </div>
        ) : null}

        {/* Film grain & subtle vignette for cohesive transition */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: ART_W,
            height: ART_H,
            transform: `scale(${PX})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }}
        >
          <Vignette strength={0.28} />
          <Grain opacity={0.05} />
        </div>
      </AbsoluteFill>

      {t < META.coverAtSec ? <SceneSubtitles sceneId="S01A" bottomOffset={38} /> : null}
      <SfxLayer cues={S01A_SFX} />
    </AbsoluteFill>
  );
};
