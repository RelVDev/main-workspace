import React from 'react';
import {Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character, JeliMascot} from '../characters/Character';
import {S06_SFX} from '../data/cues/S06.cues';
import {META} from '../data/meta';
import {OBSERVATION_CRITERIA} from '../data/observations';
import {PALETTE} from '../data/palette';
import {FloorGlow, PointLight, Sparkle} from '../engine/Lighting';
import {SceneShell} from '../engine/SceneShell';
import {EvidenceFrame} from '../footage/EvidenceFrame';
import {smoothKeyframes} from '../lib/easing';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {Counter} from '../ui/Counter';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {Tag} from '../ui/Tag';
import {HangingLamp, ObservatoryDecor} from './shared/RoomDecor';
import {StageFloor} from './shared/StageElements';

export const S06_DataBukti: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const tL1 = lineStartSec('S06_L01');
  const tL2 = lineStartSec('S06_L02');
  const tL3 = lineStartSec('S06_L03');
  const tL4 = lineStartSec('S06_L04');
  const tL5 = lineStartSec('S06_L05');
  const tL6 = lineStartSec('S06_L06');
  const tL7 = lineStartSec('S06_L07');
  const tL8 = lineStartSec('S06_L08');
  const tL9 = lineStartSec('S06_L09');

  const farelLines = ['S06_L01', 'S06_L04', 'S06_L06', 'S06_L08'];
  const sofiLines = ['S06_L02', 'S06_L03', 'S06_L05', 'S06_L07', 'S06_L09'];
  const activeLineId = [...farelLines, ...sofiLines].find(
    (id) => frame >= Math.round(lineStartSec(id) * fps) && frame <= lineEnd(id),
  );
  const farelSpeaking = Boolean(activeLineId && farelLines.includes(activeLineId));
  const sofiSpeaking = Boolean(activeLineId && sofiLines.includes(activeLineId));

  const showNational = t < tL3;
  const showSurvey140 = t >= tL3 && t < tL4;
  const showPipeline = t >= tL4 && t < tL5;
  const showEvidence = t >= tL5 && t < tL6;
  const showSplitBalance = t >= tL6 && t < tL7;
  const showTakeaway = t >= tL7;

  // Smooth cinematic camera drift across Observatory beats
  const camZoom = smoothKeyframes(t, [
    [0, 1.0],
    [tL2, 1.08],
    [tL3, 1.05],
    [tL5, 1.04],
    [tL6, 1.08],
    [tL8, 1.16],
    [tL9, 1.05],
  ]);
  const camX = smoothKeyframes(t, [
    [0, 240],
    [tL2 + 1.5, 258],
    [tL3 + 2.0, 232],
    [tL6, 240],
  ]);

  // Playful interactive character positions:
  // - L01-L02: barrels drop from top & stack; Farel moves slightly toward barrels; Sofi cheers
  // - L03: Sofi playfully bounces along bottom stage illuminating the 140 dot array!
  // - L08: Farel & Sofi sprint together toward center and jump for a celebratory High-Five!
  const farelX = smoothKeyframes(t, [
    [0, 148],
    [tL2 - 0.2, 148],
    [tL2 + 1.2, 168],
    [tL6 - 0.3, 168],
    [tL6 + 0.8, 152],
    [tL8 - 0.1, 152],
    [tL8 + 1.2, 214],
    [tL9, 214],
    [tL9 + 1.2, 155],
  ]);
  const sofiX = smoothKeyframes(t, [
    [0, 326],
    [tL3 - 0.2, 326],
    [tL3 + 4.5, 290],
    [tL4, 326],
    [tL8 - 0.1, 326],
    [tL8 + 1.2, 266],
    [tL9, 266],
    [tL9 + 1.2, 325],
  ]);

  const isFarelWalk = (t >= tL2 - 0.2 && t <= tL2 + 1.1) || (t >= tL8 && t <= tL8 + 1.15);
  const isSofiBouncePlay = showSurvey140 && t <= tL3 + 9.0;
  const highFiveT = t - (tL8 + 1.4);
  const highFiveJump =
    highFiveT >= 0 && highFiveT <= 1.2 ? Math.max(0, Math.sin((highFiveT / 1.2) * Math.PI) * 16) : 0;
  const highFiveSpark = highFiveT >= 0.45 && highFiveT <= 1.5;

  // Jeli rides across the L04 pipeline & hops atop oil drums in L02
  const jeliX = showPipeline
    ? interpolate(t, [tL4 + 0.4, tL4 + 6.4], [96, 384], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.inOut(Easing.cubic),
      })
    : showNational && t >= tL2
      ? 386
      : 240;
  const jeliY = showPipeline
    ? 86 + Math.sin(frame * 0.25) * 3
    : showNational && t >= tL2
      ? 142
      : 186;

  // 140 household dot grid (90 orange = 64.3%)
  const dotsLit = Math.min(
    90,
    Math.floor(interpolate(t, [tL3 + 0.5, tL3 + 9.0], [0, 90], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})),
  );
  const scaleFill = interpolate(t, [tL1 + 1.0, tL1 + 4.0], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  // Animated balance scale tilt during L06
  const scaleTiltDeg = showSplitBalance
    ? interpolate(t, [tL6, tL6 + 2.5, tL6 + 4.2], [-9, 4, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: Easing.out(Easing.cubic),
      })
    : 0;

  const hud = (
    <>
      <SceneBanner
        badge="BAGIAN 6 · DATA & BUKTI"
        title="Memisahkan Data Pustaka & Pengamatan Kelompok"
        accent={PALETTE.teal}
        startFrame={6}
        endFrame={135}
      />

      {/* L01-L02: 898.000 ton/year + Animated Scale Bar */}
      {showNational ? (
        <div
          style={{
            position: 'absolute',
            top: 94,
            left: 150,
            right: 220,
            backgroundColor: 'rgba(21,50,67,0.92)',
            border: `5px solid ${PALETTE.gold}`,
            boxShadow: `10px 10px 0 ${PALETTE.ink}`,
            padding: '26px 34px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <Tag kind="DATA_PUSTAKA" startFrame={Math.round(tL1 * fps)} />
            <span style={{fontFamily: FONT_BODY, fontSize: 21, color: PALETTE.silver}}>
              Sumber: IPOSS · Prosiding ICMCER 2024
            </span>
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 30, color: PALETTE.cream}}>
            Potensi Minyak Jelantah Rumah Tangga Indonesia:
          </div>
          <div>
            <Counter
              target={898000}
              suffix=" ton/tahun"
              startFrame={Math.round((tL1 + 1) * fps)}
              durationFrames={90}
              color={PALETTE.gold}
              fontSize={52}
            />
          </div>
          {/* Live rising neon bar meter */}
          <div style={{height: 18, backgroundColor: PALETTE.ink, border: `3px solid ${PALETTE.cream}`, padding: 2}}>
            <div
              style={{
                width: `${(scaleFill * 100).toFixed(1)}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${PALETTE.teal} 0%, ${PALETTE.gold} 60%, ${PALETTE.amber} 100%)`,
              }}
            />
          </div>
          {t >= tL2 ? (
            <div style={{fontFamily: FONT_BODY, fontSize: 23, color: PALETTE.amber}}>
              *Ilustrasi skala limbah rumah tangga bila tidak dikelola dengan baik.
            </div>
          ) : null}
        </div>
      ) : null}

      {/* L03: 140-Dot Grid 64.3% Katadata */}
      {showSurvey140 ? (
        <div
          style={{
            position: 'absolute',
            top: 86,
            left: 140,
            right: 140,
            backgroundColor: 'rgba(21,50,67,0.94)',
            border: `5px solid ${PALETTE.gold}`,
            boxShadow: `10px 10px 0 ${PALETTE.ink}`,
            padding: '24px 32px',
            display: 'flex',
            gap: 36,
            alignItems: 'center',
          }}
        >
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(14, 22px)', gap: 8}}>
            {Array.from({length: 140}, (_, i) => (
              <div
                key={i}
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: i < dotsLit ? PALETTE.amber : PALETTE.slate,
                  border: `2px solid ${PALETTE.ink}`,
                  boxShadow: i === dotsLit - 1 ? `0 0 8px ${PALETTE.gold}` : undefined,
                }}
              />
            ))}
          </div>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 12}}>
            <Tag kind="DATA_PUSTAKA" startFrame={Math.round(tL3 * fps)} />
            <Counter
              target={64.3}
              decimals={1}
              suffix="%"
              startFrame={Math.round((tL3 + 1) * fps)}
              durationFrames={120}
              color={PALETTE.amber}
              fontSize={62}
            />
            <div style={{fontFamily: FONT_BODY, fontSize: 25, color: PALETTE.cream}}>
              Responden langsung membuang minyak jelantah (Katadata Insight Center, 2020 · 140 rumah tangga).
            </div>
          </div>
        </div>
      ) : null}

      {/* L04: Innovation Pipeline + Riding indicator */}
      {showPipeline ? (
        <div
          style={{
            position: 'absolute',
            top: 126,
            left: 120,
            right: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          {['SARING', 'CAMPUR', 'PANASKAN', 'PADATKAN', 'LILIN AROMATIS'].map((step, i) => {
            const lit = t >= tL4 + 0.5 + i * 1.4;
            return (
              <React.Fragment key={step}>
                <div
                  style={{
                    flex: 1,
                    backgroundColor: lit ? PALETTE.teal : 'rgba(27,16,32,0.85)',
                    color: lit ? PALETTE.ink : PALETTE.cream,
                    border: `4px solid ${PALETTE.ink}`,
                    boxShadow: lit ? `0 0 18px ${PALETTE.teal}88, 6px 6px 0 ${PALETTE.ink}` : `6px 6px 0 ${PALETTE.ink}`,
                    padding: '22px 12px',
                    fontFamily: FONT_TITLE,
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                >
                  {step}
                </div>
                {i < 4 ? (
                  <span style={{fontFamily: FONT_TITLE, fontSize: 22, color: PALETTE.gold}}>▶</span>
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      ) : null}

      {/* L05: Evidence Wall (PENGAMATAN KELOMPOK) */}
      {showEvidence ? (
        <div
          style={{
            position: 'absolute',
            top: 86,
            left: 90,
            right: 90,
            display: 'flex',
            gap: 24,
            alignItems: 'flex-start',
          }}
        >
          <Sequence from={Math.round(tL5 * fps)} layout="none">
            <EvidenceFrame footageId="F06" badge="PENGAMATAN KELOMPOK" label="Produk & Catatan Uji" width={620} height={360} />
          </Sequence>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 12}}>
            <Tag kind="PENGAMATAN" startFrame={Math.round(tL5 * fps)} />
            {OBSERVATION_CRITERIA.map((c) => (
              <div
                key={c.id}
                style={{
                  backgroundColor: 'rgba(27,16,32,0.92)',
                  border: `4px solid ${PALETTE.teal}`,
                  padding: '12px 18px',
                }}
              >
                <div style={{fontFamily: FONT_TITLE, fontSize: 13, color: PALETTE.teal}}>{c.judul}</div>
                <div style={{fontFamily: FONT_BODY, fontSize: 21, color: PALETTE.cream, marginTop: 4}}>
                  {c.kriteria}
                </div>
                <div style={{fontFamily: FONT_BODY, fontSize: 19, color: PALETTE.gold, marginTop: 4}}>
                  {c.hasilUser}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* L06: Split Comparison with tilting Neraca Beam */}
      {showSplitBalance ? (
        <div style={{position: 'absolute', top: 96, left: 160, right: 160, display: 'flex', flexDirection: 'column', gap: 16}}>
          <div
            style={{
              height: 14,
              backgroundColor: PALETTE.gold,
              border: `3px solid ${PALETTE.ink}`,
              transform: `rotate(${scaleTiltDeg.toFixed(2)}deg)`,
              transformOrigin: 'center center',
            }}
          />
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28}}>
            <div
              style={{
                backgroundColor: 'rgba(27,16,32,0.92)',
                border: `5px solid ${PALETTE.gold}`,
                padding: '24px 28px',
                boxShadow: `8px 8px 0 ${PALETTE.ink}`,
              }}
            >
              <Tag kind="DATA_PUSTAKA" startFrame={Math.round(tL6 * fps)} />
              <div style={{fontFamily: FONT_BODY, fontSize: 28, color: PALETTE.cream, marginTop: 16}}>
                Memberi <strong>konteks masalah</strong> (898 ribu ton/thn · 64,3% dibuang).
              </div>
            </div>
            <div
              style={{
                backgroundColor: 'rgba(27,16,32,0.92)',
                border: `5px solid ${PALETTE.teal}`,
                padding: '24px 28px',
                boxShadow: `8px 8px 0 ${PALETTE.ink}`,
              }}
            >
              <Tag kind="PENGAMATAN" startFrame={Math.round((tL6 + 2) * fps)} />
              <div style={{fontFamily: FONT_BODY, fontSize: 28, color: PALETTE.cream, marginTop: 16}}>
                Memberi <strong>bukti percobaan</strong> nyata dari tekstur, aroma & nyala lilin kelompok.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showTakeaway ? (
        <div
          style={{
            position: 'absolute',
            top: 120,
            left: 200,
            right: 200,
            backgroundColor: 'rgba(21,50,67,0.92)',
            border: `5px solid ${PALETTE.teal}`,
            boxShadow: `8px 8px 0 ${PALETTE.ink}`,
            padding: '24px 32px',
            textAlign: 'center',
          }}
        >
          <div style={{fontFamily: FONT_TITLE, fontSize: 22, color: PALETTE.gold, marginBottom: 10}}>
            NILAI GUNA BARU DARI KIMIA SEHARI-HARI
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 32, color: PALETTE.cream}}>
            Kimia membantu memahami bahan di sekitar dan menciptakan solusi kreatif!
          </div>
        </div>
      ) : null}

      <SceneSubtitles sceneId="S06" bottomOffset={44} />
    </>
  );

  return (
    <SceneShell
      grade="observatory"
      camX={camX}
      camY={135}
      zoom={camZoom}
      farBlur={3.6}
      midBlur={1.4}
      farBg={<ObservatoryDecor />}
      floor={<StageFloor y={204} topColor={PALETTE.navy} bottomColor={PALETTE.void} />}
      lights={
        <>
          <HangingLamp x={160} cordLen={18} bulbColor={PALETTE.teal} coneHeight={165} opacity={0.18} />
          <HangingLamp x={320} cordLen={18} bulbColor={PALETTE.goldPale} coneHeight={165} opacity={0.18} />
          <FloorGlow x={240} y={208} rx={120} ry={14} color={PALETTE.teal} opacity={0.32} />
          <PointLight x={240} y={96} radius={165} color={PALETTE.teal} intensity={0.48} />
        </>
      }
      dust={{count: 38, color: PALETTE.cyan, seed: 's06-dust'}}
      hud={hud}
    >
      {/* Playful Dropping & Stacking Oil Barrels during L01-L03 */}
      {t >= tL2 && t < tL4 ? (
        <>
          {[0, 1, 2].map((b) => {
            const dropY = interpolate(t, [tL2 + b * 0.65, tL2 + 0.55 + b * 0.65], [70, 174 - (b === 2 ? 26 : 0)], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.bounce),
            });
            const bx = b === 2 ? 388 : 374 + b * 24;
            return (
              <Img
                key={b}
                src={staticFile('sprites/props/drum_oil.png')}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  transform: `translate3d(${bx}px, ${dropY.toFixed(2)}px, 0)`,
                  width: 24,
                  height: 32,
                  imageRendering: 'pixelated',
                }}
              />
            );
          })}
        </>
      ) : null}

      <Character
        id="farel"
        x={farelX}
        y={204}
        flip={t >= tL9}
        pose={isFarelWalk ? 'walk' : farelSpeaking ? 'point' : showTakeaway ? 'cheer' : 'idle'}
        expr={highFiveSpark ? 'happy' : 'determined'}
        lineId={farelSpeaking ? activeLineId : undefined}
        dim={sofiSpeaking ? 0.35 : 0}
        jumpY={highFiveJump}
        emote={highFiveSpark ? {type: 'heart', startFrame: Math.round((tL8 + 1.8) * fps), durationFrames: 36} : undefined}
        z={20}
      />
      <Character
        id="sofi"
        x={sofiX}
        y={204}
        flip={t < tL9}
        pose={isSofiBouncePlay ? 'cheer' : sofiSpeaking ? 'point' : showTakeaway ? 'cheer' : 'idle'}
        expr="happy"
        lineId={sofiSpeaking ? activeLineId : undefined}
        dim={farelSpeaking ? 0.35 : 0}
        jumpY={isSofiBouncePlay ? Math.abs(Math.sin(frame * 0.3)) * 8 : highFiveJump}
        z={20}
      />

      {META.showMascotJeli ? (
        <JeliMascot x={jeliX} y={jeliY} mood={highFiveSpark ? 'flame' : showPipeline ? 'happy' : 'idle'} z={24} />
      ) : null}

      {highFiveSpark ? <Sparkle x={240} y={142} size="lg" color={PALETTE.gold} /> : null}

      <DubLayer sceneId="S06" />
      <SfxLayer cues={S06_SFX} />
    </SceneShell>
  );
};
