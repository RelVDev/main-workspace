import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {SfxLayer} from '../audio/SfxLayer';
import {Character} from '../characters/Character';
import {CHARACTERS} from '../characters/registry';
import {S01A_SFX} from '../data/cues/S01A.cues';
import introSegmentsJson from '../data/intro-segments.json';
import {PALETTE} from '../data/palette';
import type {CharId} from '../data/script';
import {Grain} from '../engine/Grain';
import {Vignette} from '../engine/Vignette';
import {FootageSlot} from '../footage/FootageSlot';
import {FOOTAGE_MAP, RealFootage} from '../footage/RealFootage';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {ART_H, ART_W, PX} from '../lib/pixel';
import {NamePlate} from '../ui/NamePlate';

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

  // Current group segment (Opening -> Disa & Malika -> Noya & Marsha -> Ayuya & Lovyta -> Sofi, Farel & Ais)
  const activeSeg =
    SEGMENTS.find((s) => t >= s.startSec && t < s.endSec) ?? SEGMENTS[SEGMENTS.length - 1];

  const activeChars: CharId[] = (
    activeSeg?.speakers.includes('all')
      ? []
      : (activeSeg?.speakers ?? [])
  ).filter((s): s is CharId => s in CHARACTERS);

  // Smooth fade-in at opening; keep tail crisp & clean so user can edit manual hand transition
  const fadeIn = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const primaryAccent =
    activeChars.length > 0 ? CHARACTERS[activeChars[0]].accentColor : PALETTE.gold;

  return (
    <AbsoluteFill style={{backgroundColor: PALETTE.void, opacity: fadeIn}}>
      {hasRealF00 ? (
        <RealFootage id="F00" variant="natural" />
      ) : (
        <FootageSlot id="F00" durationSec={FOOTAGE_MAP.F00?.durationSec ?? 40} />
      )}

      {/* Subtle course header badge (top-left) */}
      <div
        style={{
          position: 'absolute',
          top: 34,
          left: 44,
          backgroundColor: 'rgba(27,16,32,0.84)',
          border: `4px solid ${PALETTE.gold}`,
          padding: '10px 18px',
          fontFamily: FONT_TITLE,
          fontSize: 15,
          color: PALETTE.cream,
          boxShadow: `4px 4px 0 ${PALETTE.ink}`,
        }}
      >
        PRAKTIKUM KIMIA DASAR · LILIN JELANTAH
      </div>

      {/* Active intro cast indicator pill (top-right) */}
      {activeSeg ? (
        <div
          style={{
            position: 'absolute',
            top: 34,
            right: 44,
            backgroundColor: 'rgba(27,16,32,0.86)',
            border: `4px solid ${primaryAccent}`,
            padding: '10px 18px',
            boxShadow: `4px 4px 0 ${PALETTE.ink}`,
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

      {/* Playful pixel chibi mini-cameos in bottom-left matching active speakers in real footage */}
      {activeChars.length > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: 44,
            bottom: 34,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 14,
          }}
        >
          {activeChars.map((cid, idx) => (
            <div
              key={cid}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div
                style={{
                  width: 128,
                  height: 160,
                  position: 'relative',
                  backgroundColor: 'rgba(27,16,32,0.78)',
                  border: `4px solid ${CHARACTERS[cid].accentColor}`,
                  boxShadow: `5px 5px 0 ${PALETTE.ink}`,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 80,
                    transform: 'scale(2)',
                    transformOrigin: 'top left',
                    imageRendering: 'pixelated',
                    position: 'relative',
                  }}
                >
                  <Character
                    id={cid}
                    x={32}
                    y={74}
                    pose={idx % 2 === 0 ? 'wave' : 'cheer'}
                    expr="happy"
                    mouth={frame % 16 < 8 ? 'smile' : 'open'}
                  />
                </div>
              </div>
              <NamePlate
                name={CHARACTERS[cid].displayName}
                color={CHARACTERS[cid].accentColor}
              />
            </div>
          ))}
        </div>
      ) : null}

      {/* Subtle cinema film grain + vignette */}
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
