import React from 'react';
import {interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character, JeliMascot} from '../characters/Character';
import {ALL_CHAR_IDS} from '../characters/registry';
import {S09_SFX} from '../data/cues/S09.cues';
import {META} from '../data/meta';
import {PALETTE} from '../data/palette';
import type {CharId} from '../data/script';
import {LensFlare} from '../engine/Atmosphere';
import {FloorGlow, Sparkle} from '../engine/Lighting';
import type {MapLight} from '../engine/SceneLight';
import {VoxelModel, candleJarModel} from '../engine/Voxel';
import {SceneShell} from '../engine/SceneShell';
import {FOOTAGE_MAP, RealFootage} from '../footage/RealFootage';
import {clamp01, smoothKeyframes} from '../lib/easing';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneSubtitles} from '../ui/Subtitles';
import {StringLights} from './shared/RoomDecor';
import {AnimatedFlame} from './shared/StageElements';
import {CandleTable, DuskSky, RooftopForeground, RooftopParapet, Skyline, mixHex} from './shared/S09Set';

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

const ROOF_X = [42, 82, 122, 162, 314, 352, 390, 426, 460];

export const S09_Penutup: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;

  const tL5 = lineStartSec('S09_L05');
  const tL10 = lineStartSec('S09_L10');
  const endL10 = lineEnd('S09_L10') / fps;

  const hasClosingVideo = Boolean(FOOTAGE_MAP.F09?.present);
  const closingStart = Math.max(30.2, endL10 + 0.4);
  const closingDur = FOOTAGE_MAP.F09?.durationSec ?? 7.0;
  const showClosingVideo = hasClosingVideo && t >= closingStart && t < closingStart + closingDur;
  const endCardStart = hasClosingVideo ? closingStart + closingDur + 0.3 : Math.max(33.5, endL10 + 0.5);

  const activeRelay = RELAY_LINES.find(
    (r) => frame >= Math.round(lineStartSec(r.id) * fps) && frame <= lineEnd(r.id),
  );
  const allSpeaking = frame >= Math.round(tL10 * fps) && frame <= lineEnd('S09_L10');
  const showEndCard = t >= endCardStart;

  const nightMix = interpolate(t, [1, 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const fadeOutBlack = interpolate(frame, [durationInFrames - 45, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const closingOpacity = showClosingVideo
    ? Math.min(
        interpolate(t, [closingStart, closingStart + 0.45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
        interpolate(t, [closingStart + closingDur - 0.35, closingStart + closingDur], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      )
    : 0;
  const endCardOpacity = showEndCard
    ? interpolate(t, [endCardStart, endCardStart + 0.5], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})
    : 0;

  // ── Camera ──────────────────────────────────────────────────────────
  // 0-3 s establishing wide at dusk (crane down from the sky), then alternating close-ups on each
  // speaker (≈2x) with eased moves between them; L05 frames Lovyta + candle together;
  // L10 pulls back for the group jump; closing clip / end card sit on a slow static push.
  const camKeysX: Array<[number, number]> = [[0, 240], [2.4, 240]];
  const camKeysY: Array<[number, number]> = [[0, 128], [2.4, 132]];
  const camKeysZoom: Array<[number, number]> = [[0, 1.0], [2.4, 1.02]];
  for (const r of RELAY_LINES) {
    const s0 = lineStartSec(r.id);
    const e0 = lineEnd(r.id) / fps;
    const idx = ALL_CHAR_IDS.indexOf(r.who);
    const isCandleBeat = r.id === 'S09_L05';
    const cx = isCandleBeat ? (ROOF_X[idx] + 240) / 2 : ROOF_X[idx] ?? 240;
    const z = isCandleBeat ? 1.7 : 2.0;
    camKeysX.push([Math.max(2.6, s0 - 0.35), camKeysX[camKeysX.length - 1][1]]);
    camKeysX.push([s0 + 0.4, cx]);
    camKeysX.push([e0, cx + (idx % 2 === 0 ? 3 : -3)]);
    camKeysY.push([Math.max(2.6, s0 - 0.35), camKeysY[camKeysY.length - 1][1]]);
    camKeysY.push([s0 + 0.4, 172]);
    camKeysZoom.push([Math.max(2.6, s0 - 0.35), camKeysZoom[camKeysZoom.length - 1][1]]);
    camKeysZoom.push([s0 + 0.4, z]);
    camKeysZoom.push([e0, z * 1.03]);
  }
  camKeysX.push([tL10 - 0.2, 240]);
  camKeysY.push([tL10 - 0.2, 140]);
  camKeysZoom.push([tL10 - 0.2, 1.0]);
  camKeysZoom.push([closingStart, 1.06]);
  camKeysZoom.push([closingStart + 12, 1.1]);

  const targetX = smoothKeyframes(t, camKeysX);
  const targetY = smoothKeyframes(t, camKeysY);
  const camZoom = smoothKeyframes(t, camKeysZoom);
  const focus = smoothKeyframes(t, [
    [0, 0.35],
    [2.6, 0.35],
    [3.2, 1],
    [tL10 - 0.4, 1],
    [tL10 + 0.4, 0.5],
  ]);

  // Hero candle: lit by Lovyta during S09_L05; becomes the key light of the whole scene
  const litU = clamp01((t - (tL5 + 1.0)) / 0.6);
  const candleFlicker = 0.9 + 0.1 * Math.sin(frame * 0.7) * Math.sin(frame * 0.23);
  const heroCandle = React.useMemo(() => candleJarModel(PALETTE.cream, PALETTE.amber, 0.72), []);
  const CANDLE_X = 240;
  const TABLE_Y = 178;
  const FLAME_Y = TABLE_Y + 3 - 19;

  const groupJump =
    t >= tL10 && t <= tL10 + 1.0
      ? Math.max(0, Math.sin(((t - tL10) / 1.0) * Math.PI) * 14)
      : 0;

  const hud = (
    <>
      {t >= tL5 && t < closingStart ? (
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

      {t >= tL10 && t < closingStart ? (
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

      {/* Real Group Live-Action Closing Clip (closing.MOV) */}
      {showClosingVideo ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(16,10,20,0.74)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            opacity: closingOpacity,
          }}
        >
          <div
            style={{
              backgroundColor: PALETTE.gold,
              color: PALETTE.ink,
              fontFamily: FONT_BODY,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 0.8,
              padding: '8px 22px',
              border: `4px solid ${PALETTE.ink}`,
              boxShadow: `5px 5px 0 ${PALETTE.ink}`,
            }}
          >
            SALAM PENUTUP KELOMPOK
          </div>
          <div
            style={{
              width: 1120,
              height: 630,
              border: `8px solid ${PALETTE.gold}`,
              outline: `5px solid ${PALETTE.ink}`,
              boxShadow: `14px 14px 0 ${PALETTE.ink}`,
              overflow: 'hidden',
              backgroundColor: PALETTE.void,
              transform: `scale(${(0.95 + 0.05 * closingOpacity).toFixed(3)})`,
            }}
          >
            <Sequence from={Math.round(closingStart * fps)} layout="none">
              <RealFootage id="F09" variant="natural" fit="cover" />
            </Sequence>
          </div>
        </div>
      ) : null}

      {showEndCard ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(16,10,20,0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            padding: 80,
            opacity: endCardOpacity,
          }}
        >
          <div style={{fontFamily: FONT_TITLE, fontSize: 40, color: PALETTE.gold, textShadow: `4px 4px 0 ${PALETTE.ink}`}}>
            TERIMA KASIH
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 34, fontWeight: 700, color: PALETTE.cream, textAlign: 'center'}}>
            {META.judul}
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 26, color: PALETTE.teal}}>
            {META.matkul} · {META.kelompok}{META.dosen ? ` · Dosen: ${META.dosen}` : ''}
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 24, color: PALETTE.cream, textAlign: 'center'}}>
            Anggota: {META.anggota.join(' · ')}
          </div>
          <div
            style={{
              marginTop: 12,
              backgroundColor: PALETTE.plumDeep,
              border: `4px solid ${PALETTE.amber}`,
              padding: '10px 24px',
              fontFamily: FONT_BODY,
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: 0.6,
              color: PALETTE.amber,
            }}
          >
            KESELAMATAN: LILIN BUKAN UNTUK DIKONSUMSI · UJI DENGAN PENGAWASAN DI TEMPAT AMAN
          </div>
        </div>
      ) : null}

      {!showEndCard && !showClosingVideo ? <SceneSubtitles sceneId="S09" bottomOffset={80} /> : null}
    </>
  );

  // ── Lighting: low sun → city glow → the candle becomes the main light ──
  const twinkle = (i: number) => 0.7 + 0.3 * Math.sin(frame * 0.09 + i * 2.3);
  const mapLights: MapLight[] = [
    {x: 400, y: 170, r: 230, sx: 1.4, color: PALETTE.amber, intensity: 0.9 * (1 - nightMix), banded: false},
    {x: 240, y: 60, r: 280, sx: 1.6, color: '#8A9AE0', intensity: 0.42 * nightMix, banded: false},
    ...[60, 150, 330, 430].map((x, i) => ({x, y: 150, r: 26, color: i % 2 ? PALETTE.cyan : PALETTE.gold, intensity: 0.45 * nightMix * twinkle(i)}) as MapLight),
    ...(litU > 0
      ? [
          {x: CANDLE_X, y: FLAME_Y + 18, r: 150, sx: 1.6, color: PALETTE.gold, intensity: 1.1 * litU, flicker: 0.12, seed: 's09-candle'} as MapLight,
          {x: CANDLE_X, y: FLAME_Y, r: 44, color: PALETTE.goldPale, intensity: 1.0 * litU, flicker: 0.15, seed: 's09-core'} as MapLight,
        ]
      : []),
    ...(activeRelay
      ? [{x: ROOF_X[ALL_CHAR_IDS.indexOf(activeRelay.who)], y: 166, r: 58, color: PALETTE.goldPale, intensity: 0.85} as MapLight]
      : []),
    ...(allSpeaking ? [{x: 240, y: 170, r: 170, sx: 1.8, color: PALETTE.gold, intensity: 0.5, banded: false} as MapLight] : []),
  ];

  return (
    <div style={{width: '100%', height: '100%', opacity: fadeOutBlack}}>
      <SceneShell
        grade="rooftop"
        gradeTo="night"
        gradeMix={nightMix}
        camX={targetX}
        camY={targetY}
        zoom={camZoom}
        focus={focus}
        farBlur={2.4}
        midBlur={1}
        intro="crane"
        outro="none"
        handheld={0.9}
        farBg={
          <>
            <DuskSky night={nightMix} />
            <Skyline baseY={196} minH={26} maxH={70} color={mixHex('#4E1A3C', '#0E1430', nightMix)} night={nightMix} seed="sky-far" count={20} />
          </>
        }
        midBg={
          <>
            <Skyline baseY={206} minH={40} maxH={96} color={mixHex('#2A1530', '#0A0E22', nightMix)} night={nightMix} seed="sky-mid" windowColor={PALETTE.goldPale} count={12} />
            <StringLights y={22} count={18} sag={14} />
          </>
        }
        floor3d={{y: 202, pattern: 'roof', tile: 28, gloss: 0.2 + 0.4 * litU, glossColor: PALETTE.amber, seed: 's09', fadeColor: '#100A14'}}
        fog={{y: 150, height: 60, color: mixHex('#FFB25A', '#3A5AA0', nightMix), opacity: 0.12}}
        lightMap={{ambient: mixHex('#4A2A58', '#0C1430', nightMix), darkness: 0.3 + 0.3 * nightMix, lights: mapLights}}
        keyLight={
          litU > 0.5
            ? {keyX: CANDLE_X, keyY: FLAME_Y + 30, rimColor: PALETTE.gold, rimStrength: 1, shadowStrength: 0.75}
            : {keyX: 420, keyY: 150, rimColor: PALETTE.amber, rimStrength: 0.9 * (1 - nightMix * 0.6), shadowStrength: 0.55 * (1 - nightMix * 0.5)}
        }
        lights={
          <>
            {litU > 0 ? (
              <>
                <FloorGlow x={CANDLE_X} y={206} rx={120} ry={16} color={PALETTE.amber} opacity={0.45 * litU * candleFlicker} />
                <LensFlare x={CANDLE_X} y={FLAME_Y - 8} color={PALETTE.gold} intensity={0.55 * litU} width={170} seed="s09-candle" />
              </>
            ) : null}
          </>
        }
        rays={nightMix < 0.85 ? {color: PALETTE.goldPale, opacity: 0.2 * (1 - nightMix), x: 394, y: 150, angleDeg: 20, spread: 40, length: 420} : false}
        bloom={{intensity: 0.28 + 0.12 * litU}}
        dust={{count: 30, color: PALETTE.goldPale, seed: 's09-dust', opacity: 0.45}}
        nearBokeh={{count: 6, color: litU > 0 ? PALETTE.gold : PALETTE.amber, opacity: 0.25}}
        foreground={<RooftopForeground />}
        foregroundBlur={3}
        vignette={0.44}
        letterbox={1}
        hud={hud}
      >
        <RooftopParapet y={178} />
        <CandleTable x={CANDLE_X} y={TABLE_Y} />
        <VoxelModel voxels={heroCandle} x={CANDLE_X} y={TABLE_Y + 3} angle={frame * 0.02} unit={1} box={24} tilt={0.5} z={9} />
        {litU > 0 ? (
          <div style={{opacity: litU}}>
            <AnimatedFlame x={CANDLE_X} y={FLAME_Y + 4} scale={0.75} />
          </div>
        ) : null}

        {ALL_CHAR_IDS.map((cid, idx) => {
          const isMe = activeRelay?.who === cid || allSpeaking;
          const relay = RELAY_LINES.find((r) => r.who === cid);
          const lineF = relay ? Math.round(lineStartSec(relay.id) * fps) : 0;
          // Lovyta lights the candle carefully: lean-in 'hold' pose during the strike
          const lighting = cid === 'lovyta' && t >= tL5 && t < tL5 + 1.8;
          return (
            <Character
              key={cid}
              id={cid}
              x={ROOF_X[idx]}
              y={204}
              flip={ROOF_X[idx] > 240}
              pose={allSpeaking ? 'cheer' : lighting ? 'hold' : isMe ? 'wave' : 'idle'}
              expr="happy"
              lineId={
                activeRelay?.who === cid
                  ? activeRelay.id
                  : allSpeaking
                    ? 'S09_L10'
                    : undefined
              }
              dim={activeRelay && activeRelay.who !== cid ? 0.35 : 0}
              jumpY={groupJump * (0.85 + 0.15 * ((idx * 37) % 5) / 4)}
              z={isMe ? 24 : 12}
              emote={
                allSpeaking
                  ? {type: idx % 3 === 0 ? 'heart' : 'sparkle', startFrame: Math.round((tL10 + 0.3 + idx * 0.06) * fps), durationFrames: 30}
                  : relay
                    ? {type: cid === 'lovyta' ? 'idea' : 'sparkle', startFrame: lineF + 4, durationFrames: 22}
                    : undefined
              }
            />
          );
        })}

        {META.showMascotJeli ? (
          <JeliMascot x={litU > 0 ? CANDLE_X + 22 : 262} y={litU > 0 ? FLAME_Y - 6 : 196} mood={litU > 0 ? 'flame' : 'happy'} z={26} />
        ) : null}

        {allSpeaking ? (
          <>
            <Sparkle x={150} y={110} size="md" color={PALETTE.gold} phase={0} />
            <Sparkle x={330} y={100} size="md" color={PALETTE.teal} phase={20} />
            <Sparkle x={240} y={86} size="lg" color={PALETTE.goldPale} phase={40} />
          </>
        ) : null}
      </SceneShell>
      <DubLayer sceneId="S09" />
      <SfxLayer cues={S09_SFX} />
    </div>
  );
};
