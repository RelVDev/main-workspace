import React from 'react';
import {Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character} from '../characters/Character';
import {S06_SFX} from '../data/cues/S06.cues';
import {OBSERVATION_CRITERIA} from '../data/observations';
import {PALETTE} from '../data/palette';
import {SceneShell} from '../engine/SceneShell';
import {PointLight} from '../engine/Lighting';
import {EvidenceFrame} from '../footage/EvidenceFrame';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {ART_H, ART_W} from '../lib/pixel';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {Counter} from '../ui/Counter';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {Tag} from '../ui/Tag';
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

  // 140 household dot grid (90 orange = 64.3%)
  const dotsLit = Math.min(
    90,
    Math.floor(interpolate(t, [tL3 + 0.5, tL3 + 9.0], [0, 90], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})),
  );

  const hud = (
    <>
      <SceneBanner badge="BAGIAN 6 · DATA & BUKTI" title="Memisahkan Data Pustaka & Pengamatan Kelompok" accent={PALETTE.teal} startFrame={6} endFrame={135} />

      {/* L01-L02: 898.000 ton/year DATA PUSTAKA */}
      {showNational ? (
        <div
          style={{
            position: 'absolute',
            top: 96,
            left: 160,
            right: 160,
            backgroundColor: 'rgba(21,50,67,0.92)',
            border: `5px solid ${PALETTE.gold}`,
            boxShadow: `10px 10px 0 ${PALETTE.ink}`,
            padding: '28px 36px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <Tag kind="DATA_PUSTAKA" startFrame={Math.round(tL1 * fps)} />
            <span style={{fontFamily: FONT_BODY, fontSize: 22, color: PALETTE.silver}}>
              Sumber: IPOSS · Prosiding ICMCER 2024
            </span>
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 32, color: PALETTE.cream}}>
            Potensi Minyak Jelantah Rumah Tangga Indonesia:
          </div>
          <div>
            <Counter
              target={898000}
              suffix=" ton/tahun"
              startFrame={Math.round((tL1 + 1) * fps)}
              durationFrames={90}
              color={PALETTE.gold}
              fontSize={54}
            />
          </div>
          {t >= tL2 ? (
            <div style={{fontFamily: FONT_BODY, fontSize: 24, color: PALETTE.amber}}>
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
            left: 150,
            right: 150,
            backgroundColor: 'rgba(21,50,67,0.94)',
            border: `5px solid ${PALETTE.gold}`,
            boxShadow: `10px 10px 0 ${PALETTE.ink}`,
            padding: '24px 32px',
            display: 'flex',
            gap: 36,
            alignItems: 'center',
          }}
        >
          {/* 14x10 = 140 dots */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(14, 22px)', gap: 8}}>
            {Array.from({length: 140}, (_, i) => (
              <div
                key={i}
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: i < dotsLit ? PALETTE.amber : PALETTE.slate,
                  border: `2px solid ${PALETTE.ink}`,
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
            <div style={{fontFamily: FONT_BODY, fontSize: 26, color: PALETTE.cream}}>
              Responden langsung membuang minyak jelantah (Katadata Insight Center, 2020 · 140 rumah tangga · visualisasi proporsi).
            </div>
          </div>
        </div>
      ) : null}

      {/* L04: Innovation Pipeline */}
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
                    boxShadow: `6px 6px 0 ${PALETTE.ink}`,
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
            <EvidenceFrame footageId="F07" badge="PENGAMATAN KELOMPOK" label="Uji Nyala & Catatan" width={620} height={360} />
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

      {/* L06: Split Comparison DATA PUSTAKA vs PENGAMATAN */}
      {showSplitBalance ? (
        <div
          style={{
            position: 'absolute',
            top: 110,
            left: 160,
            right: 160,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 28,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(27,16,32,0.92)',
              border: `5px solid ${PALETTE.gold}`,
              padding: '26px 30px',
              boxShadow: `8px 8px 0 ${PALETTE.ink}`,
            }}
          >
            <Tag kind="DATA_PUSTAKA" startFrame={Math.round(tL6 * fps)} />
            <div style={{fontFamily: FONT_BODY, fontSize: 30, color: PALETTE.cream, marginTop: 18}}>
              Memberi <strong>konteks masalah</strong> (898 ribu ton/thn · 64,3% dibuang).
            </div>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(27,16,32,0.92)',
              border: `5px solid ${PALETTE.teal}`,
              padding: '26px 30px',
              boxShadow: `8px 8px 0 ${PALETTE.ink}`,
            }}
          >
            <Tag kind="PENGAMATAN" startFrame={Math.round((tL6 + 2) * fps)} />
            <div style={{fontFamily: FONT_BODY, fontSize: 30, color: PALETTE.cream, marginTop: 18}}>
              Memberi <strong>bukti percobaan</strong> nyata dari tekstur, aroma & nyala lilin kelompok.
            </div>
          </div>
        </div>
      ) : null}

      {/* L07-L09: Takeaway */}
      {showTakeaway ? (
        <div
          style={{
            position: 'absolute',
            top: 130,
            left: 200,
            right: 200,
            backgroundColor: 'rgba(21,50,67,0.92)',
            border: `5px solid ${PALETTE.teal}`,
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
      camX={240}
      camY={135}
      zoom={1}
      farBlur={5}
      midBlur={2}
      farBg={
        <div
          style={{
            width: ART_W,
            height: ART_H,
            background: `linear-gradient(180deg, ${PALETTE.navy} 0%, ${PALETTE.tealDark} 70%, ${PALETTE.plumDeep} 100%)`,
          }}
        />
      }
      floor={<StageFloor y={204} topColor={PALETTE.navy} bottomColor={PALETTE.void} />}
      lights={<PointLight x={240} y={100} radius={160} color={PALETTE.teal} intensity={0.45} />}
      dust={{count: 34, color: PALETTE.cyan, seed: 's06-dust'}}
      hud={hud}
    >
      {/* Decorative oil barrels during L02 */}
      {t >= tL2 && t < tL4 ? (
        <>
          {[0, 1, 2].map((b) => (
            <Img
              key={b}
              src={staticFile('sprites/props/drum_oil.png')}
              style={{position: 'absolute', left: 376 + b * 24, top: 174, width: 24, height: 32, imageRendering: 'pixelated'}}
            />
          ))}
        </>
      ) : null}

      <Character
        id="farel"
        x={155}
        y={204}
        flip={t >= tL9}
        pose={farelSpeaking ? 'point' : showTakeaway ? 'cheer' : 'idle'}
        expr="determined"
        lineId={farelSpeaking ? activeLineId : undefined}
        dim={sofiSpeaking ? 0.35 : 0}
        z={20}
      />
      <Character
        id="sofi"
        x={325}
        y={204}
        flip={!t || t < tL9}
        pose={sofiSpeaking ? 'point' : showTakeaway ? 'cheer' : 'idle'}
        expr="happy"
        lineId={sofiSpeaking ? activeLineId : undefined}
        dim={farelSpeaking ? 0.35 : 0}
        z={20}
      />

      <DubLayer sceneId="S06" />
      <SfxLayer cues={S06_SFX} />
    </SceneShell>
  );
};
