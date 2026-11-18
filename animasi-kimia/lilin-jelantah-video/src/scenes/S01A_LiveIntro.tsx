import React from 'react';
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {SfxLayer} from '../audio/SfxLayer';
import {Character} from '../characters/Character';
import {CHARACTERS} from '../characters/registry';
import {S01A_SFX} from '../data/cues/S01A.cues';
import introSegmentsJson from '../data/intro-segments.json';
import {MEMBER_PROFILES} from '../data/meta';
import {PALETTE} from '../data/palette';
import type {CharId} from '../data/script';
import {Grain} from '../engine/Grain';
import {Vignette} from '../engine/Vignette';
import {FootageSlot} from '../footage/FootageSlot';
import {FOOTAGE_MAP, RealFootage} from '../footage/RealFootage';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {ART_H, ART_W, PX} from '../lib/pixel';

interface IntroSegment {
  label: string;
  speakers: string[];
  startSec: number;
  endSec: number;
}

const SEGMENTS = introSegmentsJson as IntroSegment[];

export const S01A_LiveIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const hasRealF00 = Boolean(FOOTAGE_MAP.F00?.present);

  const activeSeg =
    SEGMENTS.find((s) => t >= s.startSec && t < s.endSec) ?? SEGMENTS[SEGMENTS.length - 1];

  const activeChars: CharId[] = (
    activeSeg?.speakers.includes('all') ? [] : (activeSeg?.speakers ?? [])
  ).filter((s): s is CharId => s in CHARACTERS);

  const segFrame = Math.max(0, Math.round((t - (activeSeg?.startSec ?? 0)) * fps));
  const fadeIn = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Subtle living zoom-in breathing across real live intro video
  const liveZoom = activeSeg
    ? interpolate(
        t,
        [activeSeg.startSec, activeSeg.endSec],
        [1.0, activeSeg.speakers.includes('all') ? 1.04 : 1.03],
        {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic)},
      )
    : 1.0;

  const primaryAccent =
    activeChars.length > 0 ? CHARACTERS[activeChars[0]].accentColor : PALETTE.gold;

  return (
    <AbsoluteFill style={{backgroundColor: PALETTE.void, opacity: fadeIn, overflow: 'hidden'}}>
      <AbsoluteFill style={{transform: `scale(${liveZoom.toFixed(4)})`}}>
        {hasRealF00 ? (
          <RealFootage id="F00" variant="natural" fit="cover" />
        ) : (
          <FootageSlot id="F00" durationSec={FOOTAGE_MAP.F00?.durationSec ?? 40} />
        )}
      </AbsoluteFill>

      {/* Top bar badges cleanly spaced left & right */}
      <div
        style={{
          position: 'absolute',
          top: 28,
          left: 44,
          backgroundColor: 'rgba(27,16,32,0.88)',
          border: `4px solid ${PALETTE.gold}`,
          padding: '10px 18px',
          fontFamily: FONT_TITLE,
          fontSize: 14,
          color: PALETTE.cream,
          boxShadow: `5px 5px 0 ${PALETTE.ink}`,
        }}
      >
        PRAKTIKUM KIMIA DASAR · LILIN JELANTAH
      </div>

      {activeSeg ? (
        <div
          style={{
            position: 'absolute',
            top: 28,
            right: 44,
            backgroundColor: 'rgba(27,16,32,0.88)',
            border: `4px solid ${primaryAccent}`,
            padding: '10px 18px',
            boxShadow: `5px 5px 0 ${PALETTE.ink}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 4,
          }}
        >
          <span style={{fontFamily: FONT_TITLE, fontSize: 11, color: primaryAccent}}>
            PERKENALAN KELOMPOK
          </span>
          <span style={{fontFamily: FONT_BODY, fontSize: 26, fontWeight: 700, color: PALETTE.cream}}>
            {activeSeg.label}
          </span>
        </div>
      ) : null}

      {/* Opening Group Interactive Banner during Opening Segment */}
      {activeSeg?.speakers.includes('all') ? (
        <div
          style={{
            position: 'absolute',
            bottom: 36,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(27,16,32,0.9)',
            border: `4px solid ${PALETTE.gold}`,
            boxShadow: `6px 6px 0 ${PALETTE.ink}`,
            padding: '14px 28px',
            textAlign: 'center',
          }}
        >
          <div style={{fontFamily: FONT_TITLE, fontSize: 15, color: PALETTE.gold, marginBottom: 4}}>
            TIM LILIN AROMATIS MINYAK JELANTAH
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 26, fontWeight: 700, color: PALETTE.cream}}>
            9 Mahasiswa · Pengenalan Peran & Topik Proyek
          </div>
        </div>
      ) : null}

      {/* Interactive Member Text Note / Student Name & NIM Name Tag Cards */}
      {activeChars.length > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 44,
            right: 44,
            bottom: 32,
            display: 'flex',
            justifyContent: activeChars.length === 3 ? 'space-between' : 'space-around',
            alignItems: 'flex-end',
            gap: 20,
            pointerEvents: 'none',
          }}
        >
          {activeChars.map((cid, idx) => {
            const meta = CHARACTERS[cid];
            const profile = MEMBER_PROFILES[cid];
            const delay = idx * 8;
            const popScale = spring({
              fps,
              frame: Math.max(0, segFrame - delay),
              config: {damping: 14, stiffness: 120},
            });
            const cardOp = interpolate(segFrame - delay, [0, 10], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            // Subtle active spotlight highlight alternating along speaker window
            const segLen = Math.max(1, activeSeg.endSec - activeSeg.startSec);
            const rel = (t - activeSeg.startSec) / segLen;
            const slotIdx = Math.min(activeChars.length - 1, Math.floor(rel * activeChars.length));
            const isSpotlight = idx === slotIdx;

            return (
              <div
                key={cid}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  backgroundColor: isSpotlight ? 'rgba(27,16,32,0.95)' : 'rgba(27,16,32,0.84)',
                  border: `4px solid ${isSpotlight ? meta.accentColor : PALETTE.woodLight}`,
                  boxShadow: isSpotlight
                    ? `0 0 22px ${meta.accentColor}66, 8px 8px 0 ${PALETTE.ink}`
                    : `6px 6px 0 ${PALETTE.ink}`,
                  padding: '10px 20px 10px 12px',
                  opacity: cardOp,
                  transform: `translate3d(0, ${((1 - popScale) * 24).toFixed(2)}px, 0) scale(${(isSpotlight ? 1.03 : 0.96).toFixed(3)})`,
                  minWidth: activeChars.length === 3 ? 460 : 520,
                }}
              >
                {/* Mini interactive pixel avatar badge */}
                <div
                  style={{
                    width: 80,
                    height: 96,
                    position: 'relative',
                    backgroundColor: PALETTE.plumMid,
                    border: `3px solid ${meta.accentColor}`,
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 80,
                      transform: 'scale(1.3)',
                      transformOrigin: 'top left',
                      position: 'relative',
                      left: -2,
                      top: -4,
                    }}
                  >
                    <Character
                      id={cid}
                      x={32}
                      y={74}
                      pose={isSpotlight ? 'wave' : 'idle'}
                      expr="happy"
                      mouth={isSpotlight && frame % 14 < 7 ? 'open' : 'smile'}
                    />
                  </div>
                </div>

                {/* Readable Name, NIM & Role Text Note */}
                <div style={{display: 'flex', flexDirection: 'column', gap: 5}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: isSpotlight ? PALETTE.green : PALETTE.gold,
                        display: 'inline-block',
                      }}
                    />
                    <span style={{fontFamily: FONT_TITLE, fontSize: 16, color: meta.accentColor}}>
                      {profile.fullName.toUpperCase()}
                    </span>
                  </div>
                  <div
                    style={{
                      backgroundColor: PALETTE.plumMid,
                      border: `2px solid ${meta.accentColor}`,
                      padding: '4px 10px',
                      fontFamily: FONT_BODY,
                      fontSize: 22,
                      fontWeight: 700,
                      color: PALETTE.goldPale,
                      alignSelf: 'flex-start',
                    }}
                  >
                    {profile.nim ? `NIM: ${profile.nim}` : 'Praktikum Kimia Dasar'}
                  </div>
                  <div style={{fontFamily: FONT_BODY, fontSize: 21, color: PALETTE.cream}}>
                    Peran: {profile.role}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

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
        <Vignette strength={0.22} />
        <Grain opacity={0.04} />
      </div>

      <SfxLayer cues={S01A_SFX} />
    </AbsoluteFill>
  );
};
