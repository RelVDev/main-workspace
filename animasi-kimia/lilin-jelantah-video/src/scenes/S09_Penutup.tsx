import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character, JeliMascot} from '../characters/Character';
import {ALL_CHAR_IDS} from '../characters/registry';
import {S09_SFX} from '../data/cues/S09.cues';
import {META} from '../data/meta';
import {PALETTE} from '../data/palette';
import type {CharId} from '../data/script';
import {SceneShell} from '../engine/SceneShell';
import {PointLight, Sparkle} from '../engine/Lighting';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {ART_H, ART_W} from '../lib/pixel';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneSubtitles} from '../ui/Subtitles';
import {AnimatedFlame, StageFloor} from './shared/StageElements';

const RELAY_LINES: Array<{id: string; who: CharId}> = [
  {id: 'S09_L01', who: 'malika'},
  {id: 'S09_L02', who: 'noya'},
  {id: 'S09_L03', who: 'marsha'},
  {id: 'S09_L04', who: 'ayuya'},
  {id: 'S09_L05', who: 'lovyta'},
  {id: 'S09_L06', who: 'farel'},
  {id: 'S09_L07', who: 'sofi'},
  {id: 'S09_L08', who: 'disa'},
  {id: 'S09_L09', who: 'ais'},
];

export const S09_Penutup: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;

  const tL5 = lineStartSec('S09_L05');
  const tL10 = lineStartSec('S09_L10');
  const endL10 = lineEnd('S09_L10') / fps;
  const endCardStart = Math.max(33.5, endL10 + 0.5);

  const activeRelay = RELAY_LINES.find(
    (r) => frame >= Math.round(lineStartSec(r.id) * fps) && frame <= lineEnd(r.id),
  );
  const allSpeaking = frame >= Math.round(tL10 * fps) && frame <= lineEnd('S09_L10');
  const candleLit = t >= tL5 + 1.0;
  const showEndCard = t >= endCardStart;

  // Sunset -> night transition
  const nightMix = interpolate(t, [0, 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOutBlack = interpolate(frame, [durationInFrames - 45, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Split 9 characters cleanly on left (4) and right (5) of center candle podium (x=240)
  const ROOF_X = [42, 82, 122, 162, 314, 352, 390, 426, 460];

  // Gentle camera spotlight follow during relay
  const activeIdx = activeRelay ? ALL_CHAR_IDS.indexOf(activeRelay.who) : -1;
  const targetX = activeIdx >= 0 ? ROOF_X[activeIdx] : 240;
  const camZoom = activeRelay ? 1.35 : 1.0;
  const groupJump =
    t >= tL10 && t <= tL10 + 1.0
      ? Math.max(0, Math.round(Math.sin(((t - tL10) / 1.0) * Math.PI) * 14))
      : 0;

  const hud = (
    <>
      {/* Safety reminder pill during L05 */}
      {t >= tL5 && t <= endL10 ? (
        <div
          style={{
            position: 'absolute',
            top: 84,
            right: 64,
            backgroundColor: 'rgba(27,16,32,0.9)',
            border: `4px solid ${PALETTE.gold}`,
            padding: '10px 18px',
            fontFamily: FONT_TITLE,
            fontSize: 13,
            color: PALETTE.gold,
          }}
        >
          [!] UJI NYALA AMAN · BUKAN UNTUK DIKONSUMSI
        </div>
      ) : null}

      {/* Closing motto banner on S09_L10 */}
      {t >= tL10 && !showEndCard ? (
        <div
          style={{
            position: 'absolute',
            top: 130,
            left: 160,
            right: 160,
            textAlign: 'center',
            backgroundColor: 'rgba(27,16,32,0.92)',
            border: `5px solid ${PALETTE.gold}`,
            boxShadow: `10px 10px 0 ${PALETTE.ink}`,
            padding: '22px 32px',
          }}
        >
          <div style={{fontFamily: FONT_TITLE, fontSize: 22, color: PALETTE.gold, lineHeight: 1.5}}>
            &ldquo;Pilah, kumpulkan, dan manfaatkan limbah dengan bijak!&rdquo;
          </div>
        </div>
      ) : null}

      {/* Final End Card */}
      {showEndCard ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(16,10,20,0.88)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            padding: 80,
          }}
        >
          <div style={{fontFamily: FONT_TITLE, fontSize: 40, color: PALETTE.gold, textShadow: `4px 4px 0 ${PALETTE.ink}`}}>
            TERIMA KASIH
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 34, fontWeight: 700, color: PALETTE.cream, textAlign: 'center'}}>
            {META.judul}
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 26, color: PALETTE.teal}}>
            {META.matkul} · Kelompok: {META.kelompok} · Dosen: {META.dosen}
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 24, color: PALETTE.cream, textAlign: 'center'}}>
            Anggota: {META.anggota.join(' · ')}
          </div>
          <div
            style={{
              marginTop: 12,
              backgroundColor: PALETTE.plumDeep,
              border: `4px solid ${PALETTE.amber}`,
              padding: '12px 24px',
              fontFamily: FONT_TITLE,
              fontSize: 13,
              color: PALETTE.amber,
            }}
          >
            KESELAMATAN: LILIN BUKAN UNTUK DIKONSUMSI · UJI DENGAN PENGAWASAN DI TEMPAT AMAN
          </div>
        </div>
      ) : null}

      {!showEndCard ? <SceneSubtitles sceneId="S09" bottomOffset={84} /> : null}
    </>
  );

  return (
    <div style={{width: '100%', height: '100%', opacity: fadeOutBlack}}>
      <SceneShell
        grade={nightMix > 0.5 ? 'night' : 'rooftop'}
        camX={targetX}
        camY={135}
        zoom={camZoom}
        farBlur={3}
        midBlur={1}
        farBg={
          <div
            style={{
              width: ART_W,
              height: ART_H,
              background:
                nightMix > 0.5
                  ? `linear-gradient(180deg, ${PALETTE.void} 0%, ${PALETTE.navy} 65%, ${PALETTE.plumDeep} 100%)`
                  : `linear-gradient(180deg, ${PALETTE.plumDeep} 0%, ${PALETTE.maroon} 55%, ${PALETTE.amber} 100%)`,
            }}
          >
            {/* Distant twinkling pixel city skyline */}
            <div style={{position: 'absolute', left: 0, right: 0, bottom: 68, height: 64, display: 'flex', alignItems: 'flex-end', gap: 6, padding: '0 12px'}}>
              {[34, 48, 28, 56, 40, 32, 60, 44, 36, 52, 30, 46].map((bh, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: bh,
                    backgroundColor: PALETTE.ink,
                    position: 'relative',
                  }}
                >
                  {(frame + i * 7) % 40 < 24 ? (
                    <div
                      style={{
                        position: 'absolute',
                        left: 6,
                        top: 8,
                        width: 4,
                        height: 4,
                        backgroundColor: PALETTE.gold,
                      }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        }
        floor={<StageFloor y={204} topColor={PALETTE.slate} bottomColor={PALETTE.plumDeep} />}
        lights={
          candleLit ? (
            <PointLight x={240} y={168} radius={165} color={PALETTE.amber} intensity={0.95} flicker banded />
          ) : (
            <PointLight x={240} y={90} radius={150} color={PALETTE.gold} intensity={0.4} />
          )
        }
        dust={{count: 36, color: PALETTE.goldPale, seed: 's09-dust'}}
        letterbox={1}
        hud={hud}
      >
        {/* Center table & hero candle */}
        <Img
          src={staticFile('sprites/props/podium.png')}
          style={{position: 'absolute', left: 216, top: 174, width: 48, height: 34, imageRendering: 'pixelated'}}
        />
        <Img
          src={staticFile('sprites/props/candle_unlit.png')}
          style={{position: 'absolute', left: 226, top: 142, width: 28, height: 34, imageRendering: 'pixelated'}}
        />
        {candleLit ? <AnimatedFlame x={240} y={152} scale={1} /> : null}

        {/* All 9 characters lined cleanly on left & right of hero candle */}
        {ALL_CHAR_IDS.map((cid, idx) => {
          const isMe = activeRelay?.who === cid || allSpeaking;
          return (
            <Character
              key={cid}
              id={cid}
              x={ROOF_X[idx]}
              y={204}
              pose={allSpeaking ? 'cheer' : isMe ? 'wave' : 'idle'}
              expr="happy"
              lineId={
                activeRelay?.who === cid
                  ? activeRelay.id
                  : allSpeaking
                    ? 'S09_L10'
                    : undefined
              }
              dim={activeRelay && activeRelay.who !== cid ? 0.35 : 0}
              jumpY={groupJump}
              z={isMe ? 24 : 12}
            />
          );
        })}

        {META.showMascotJeli ? (
          <JeliMascot x={240} y={candleLit ? 136 : 190} mood={candleLit ? 'flame' : 'happy'} z={26} />
        ) : null}

        <Sparkle x={240} y={120} size="sm" color={PALETTE.gold} />
      </SceneShell>
      <DubLayer sceneId="S09" />
      <SfxLayer cues={S09_SFX} />
    </div>
  );
};
