import React from 'react';
import {Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character} from '../characters/Character';
import {S04_SFX} from '../data/cues/S04.cues';
import {OBSERVATION_CRITERIA} from '../data/observations';
import {PALETTE} from '../data/palette';
import {recipe} from '../data/recipe';
import {FloorGlow, PointLight} from '../engine/Lighting';
import {SceneShell} from '../engine/SceneShell';
import {FOOTAGE_MAP} from '../footage/RealFootage';
import {TvScreen, useFootageLightColor} from '../footage/TvScreen';
import {smoothKeyframes} from '../lib/easing';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {ART_H, ART_W} from '../lib/pixel';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {Tag} from '../ui/Tag';
import {CinemaLoungeDecor, HangingLamp} from './shared/RoomDecor';
import {StageFloor} from './shared/StageElements';

export const S04_Penerapan: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const tL2 = lineStartSec('S04_L02');
  const tL3 = lineStartSec('S04_L03');
  const tL4 = lineStartSec('S04_L04');
  const tL5 = lineStartSec('S04_L05');
  const tL6 = lineStartSec('S04_L06');
  const tL7 = lineStartSec('S04_L07');

  const isWorkshop = t < 11.5;
  const isAnalysis = t >= tL6;

  // Match real clip lengths cleanly: F01(14s), F02(8.5s), F03(9s), F04(7.5s), F05(7s), F07(burn)
  let activeClip = 'F01';
  let clipStartSec = tL2;
  if (t >= tL3 && t < tL3 + 8.5) {
    activeClip = 'F02';
    clipStartSec = tL3;
  } else if (t >= tL3 + 8.5 && t < tL4) {
    activeClip = 'F03';
    clipStartSec = tL3 + 8.5;
  } else if (t >= tL4 && t < tL4 + 7.5) {
    activeClip = 'F04';
    clipStartSec = tL4;
  } else if (t >= tL4 + 7.5 && t < tL5) {
    activeClip = 'F05';
    clipStartSec = tL4 + 7.5;
  } else if (t >= tL5) {
    activeClip = 'F07';
    clipStartSec = tL5;
  }

  const staticBurst = !isWorkshop && !isAnalysis && t >= clipStartSec && t <= clipStartSec + 0.35;
  const tvLightColor = useFootageLightColor(activeClip);

  const activeLineId = ['S04_L01', 'S04_L02', 'S04_L03', 'S04_L04', 'S04_L05', 'S04_L06', 'S04_L07'].find(
    (id) => frame >= Math.round(lineStartSec(id) * fps) && frame <= lineEnd(id),
  );

  // Smooth dolly-in to TV -> gentle hold -> smooth pull-out for analysis cards
  const camZoom = smoothKeyframes(t, [
    [0, 1.0],
    [11.2, 1.0],
    [14.2, 1.28],
    [tL6 - 0.5, 1.28],
    [tL6 + 1.1, 1.04],
  ]);

  const camX = smoothKeyframes(t, [
    [0, 240],
    [11.2, 240],
    [14.2, 256],
    [tL6 - 0.5, 256],
    [tL6 + 1.1, 240],
  ]);

  const camY = smoothKeyframes(t, [
    [0, 135],
    [11.2, 135],
    [14.2, 114],
    [tL6 - 0.5, 114],
    [tL6 + 1.1, 135],
  ]);

  const hud = (
    <>
      <SceneBanner
        badge="BAGIAN 4 · PENERAPAN & ANALISIS"
        title="Menonton Langsung Praktikum di Ruang Nonton"
        accent={PALETTE.gold}
        startFrame={6}
        endFrame={135}
      />

      {isWorkshop ? (
        <div
          style={{
            position: 'absolute',
            top: 150,
            left: 120,
            right: 120,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
          }}
        >
          {[
            '1. PERSIAPAN & PENYARINGAN',
            '2. PELEBURAN & PENCAMPURAN',
            '3. PENUANGAN & PEMADATAN',
            '4. UJI NYALA AMAN',
          ].map((label, idx) => {
            const lit = t >= 1.5 + idx * 2.0;
            return (
              <div
                key={label}
                style={{
                  backgroundColor: lit ? PALETTE.amber : 'rgba(27,16,32,0.85)',
                  color: lit ? PALETTE.ink : PALETTE.cream,
                  border: `4px solid ${PALETTE.ink}`,
                  boxShadow: `6px 6px 0 ${PALETTE.ink}`,
                  padding: '20px 16px',
                  fontFamily: FONT_TITLE,
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      ) : null}

      {!isWorkshop && !isAnalysis ? (
        <div style={{position: 'absolute', top: 44, right: 56, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-end'}}>
          {activeClip === 'F01' ? (
            <Tag kind="FISIKA" label="PERSIAPAN MINYAK · FISIKA" startFrame={Math.round((tL2 + 1) * fps)} />
          ) : null}
          {activeClip === 'F02' || activeClip === 'F03' ? (
            <div
              style={{
                backgroundColor: 'rgba(27,16,32,0.92)',
                border: `4px solid ${PALETTE.gold}`,
                boxShadow: `6px 6px 0 ${PALETTE.ink}`,
                padding: '14px 20px',
                maxWidth: 520,
              }}
            >
              <div style={{fontFamily: FONT_TITLE, fontSize: 13, color: PALETTE.gold, marginBottom: 6}}>
                BAHAN PRAKTIKUM KELOMPOK
              </div>
              <div style={{fontFamily: FONT_BODY, fontSize: 22, color: PALETTE.cream}}>
                {recipe.bahanLilin} · {recipe.pewangi}
              </div>
            </div>
          ) : null}
          {activeClip === 'F04' || activeClip === 'F05' ? (
            <Tag kind="FISIKA" label="PENCETAKAN & PEMADATAN · FISIKA" startFrame={Math.round((tL4 + 1) * fps)} />
          ) : null}
          {activeClip === 'F07' ? (
            <Tag kind="KIMIA" label="PEMBAKARAN · KIMIA" startFrame={Math.round((tL5 + 1) * fps)} />
          ) : null}
          {(() => {
            const relT = t - clipStartSec;
            const note = FOOTAGE_MAP[activeClip]?.annotations?.find((a) => relT >= a.t0 && relT <= a.t1);
            if (!note) return null;
            return (
              <div
                style={{
                  backgroundColor: 'rgba(27,16,32,0.9)',
                  border: `3px solid ${PALETTE.cyan}`,
                  boxShadow: `4px 4px 0 ${PALETTE.ink}`,
                  padding: '10px 16px',
                  fontFamily: FONT_BODY,
                  fontSize: 22,
                  color: PALETTE.cyan,
                  maxWidth: 460,
                  textAlign: 'right',
                }}
              >
                ▸ {note.text}
              </div>
            );
          })()}
        </div>
      ) : null}

      {isAnalysis ? (
        <div
          style={{
            position: 'absolute',
            top: 90,
            left: 110,
            right: 110,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 24,
          }}
        >
          {OBSERVATION_CRITERIA.map((card, i) => {
            const flipAt = tL6 + 1.0 + i * 2.8;
            const visible = t >= flipAt;
            return (
              <div
                key={card.id}
                style={{
                  backgroundColor: 'rgba(27,16,32,0.94)',
                  border: `5px solid ${visible ? PALETTE.teal : PALETTE.slate}`,
                  boxShadow: `8px 8px 0 ${PALETTE.ink}`,
                  padding: '22px 24px',
                  opacity: visible ? 1 : 0.35,
                }}
              >
                <div style={{fontFamily: FONT_TITLE, fontSize: 14, color: PALETTE.teal, marginBottom: 10}}>
                  {card.judul.toUpperCase()}
                </div>
                <div style={{fontFamily: FONT_BODY, fontSize: 22, color: PALETTE.cream, marginBottom: 12, lineHeight: 1.3}}>
                  Kriteria: {card.kriteria}
                </div>
                <div
                  style={{
                    backgroundColor: PALETTE.plumMid,
                    padding: '8px 12px',
                    border: `2px solid ${PALETTE.gold}`,
                    fontFamily: FONT_BODY,
                    fontSize: 20,
                    color: PALETTE.gold,
                  }}
                >
                  {card.hasilUser}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <SceneSubtitles sceneId="S04" bottomOffset={44} />
    </>
  );

  return (
    <SceneShell
      grade={isWorkshop ? 'workshop' : 'cinema'}
      camX={camX}
      camY={camY}
      zoom={camZoom}
      farBlur={3.5}
      midBlur={1.4}
      farBg={
        isWorkshop ? (
          <div
            style={{
              width: ART_W,
              height: ART_H,
              background: `linear-gradient(180deg, ${PALETTE.woodDark} 0%, ${PALETTE.plumDeep} 100%)`,
            }}
          />
        ) : (
          <CinemaLoungeDecor />
        )
      }
      floor={<StageFloor y={202} topColor={PALETTE.woodMid} bottomColor={PALETTE.woodDark} />}
      lights={
        isWorkshop ? (
          <>
            <HangingLamp x={240} cordLen={18} bulbColor={PALETTE.gold} coneHeight={170} opacity={0.25} />
            <PointLight x={240} y={84} radius={165} color={PALETTE.gold} intensity={0.52} />
          </>
        ) : (
          <>
            <HangingLamp x={108} cordLen={16} bulbColor={PALETTE.amber} coneHeight={160} opacity={0.16} />
            <HangingLamp x={390} cordLen={16} bulbColor={PALETTE.amber} coneHeight={160} opacity={0.16} />
            <PointLight x={256} y={96} radius={170} color={tvLightColor} intensity={0.78} />
            <FloorGlow x={250} y={208} rx={110} ry={14} color={tvLightColor} opacity={0.34} />
          </>
        )
      }
      dust={{count: 30, color: PALETTE.cream, seed: 's04-dust'}}
      hud={hud}
    >
      {isWorkshop ? (
        <Character id="marsha" x={240} y={202} pose="point" expr="happy" lineId={activeLineId} z={20} />
      ) : (
        <div style={{position: 'absolute', inset: 0}}>
          {!isAnalysis ? (
            <Sequence key={activeClip} from={Math.round(clipStartSec * fps)} layout="none">
              <TvScreen footageId={activeClip} x={176} y={34} w={160} h={124} staticBurst={staticBurst} />
            </Sequence>
          ) : null}

          <Img
            src={staticFile('sprites/props/sofa.png')}
            style={{position: 'absolute', left: 164, top: 164, width: 152, height: 52, imageRendering: 'pixelated', zIndex: 10}}
          />
          <Character id="ayuya" x={200} y={206} pose="sit" expr="happy" z={14} dim={0.2} />
          <Character id="noya" x={242} y={206} pose="sit" expr="neutral" z={14} dim={0.2} />
          <Character id="farel" x={282} y={206} pose="sit" expr="determined" z={14} dim={0.2} />

          <Character
            id="marsha"
            x={116}
            y={204}
            pose={t >= tL7 ? 'wave' : 'point'}
            expr="happy"
            lineId={activeLineId}
            z={20}
          />
          <Character id="ais" x={386} y={204} flip pose="think" expr="neutral" z={18} dim={0.15} />
        </div>
      )}

      <DubLayer sceneId="S04" />
      <SfxLayer cues={S04_SFX} />
    </SceneShell>
  );
};
