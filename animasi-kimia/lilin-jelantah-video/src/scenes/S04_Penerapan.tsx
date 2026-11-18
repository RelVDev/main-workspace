import React from 'react';
import {Img, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character} from '../characters/Character';
import {S04_SFX} from '../data/cues/S04.cues';
import {OBSERVATION_CRITERIA} from '../data/observations';
import {PALETTE} from '../data/palette';
import {recipe} from '../data/recipe';
import {SceneShell} from '../engine/SceneShell';
import {PointLight} from '../engine/Lighting';
import {TvScreen, useFootageLightColor} from '../footage/TvScreen';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {ART_H, ART_W} from '../lib/pixel';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {Tag} from '../ui/Tag';
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

  // Which footage clip plays on the CRT TV
  let activeClip = 'F01';
  let clipStartSec = tL2;
  if (t >= tL3 && t < tL3 + 8) {
    activeClip = 'F02';
    clipStartSec = tL3;
  } else if (t >= tL3 + 8 && t < tL4) {
    activeClip = 'F03';
    clipStartSec = tL3 + 8;
  } else if (t >= tL4 && t < tL4 + 7) {
    activeClip = 'F04';
    clipStartSec = tL4;
  } else if (t >= tL4 + 7 && t < tL5) {
    activeClip = 'F05';
    clipStartSec = tL4 + 7;
  } else if (t >= tL5) {
    activeClip = 'F07';
    clipStartSec = tL5;
  }

  const staticBurst = !isWorkshop && !isAnalysis && t >= clipStartSec && t <= clipStartSec + 0.35;
  const tvLightColor = useFootageLightColor(activeClip);

  const activeLineId = ['S04_L01', 'S04_L02', 'S04_L03', 'S04_L04', 'S04_L05', 'S04_L06', 'S04_L07'].find(
    (id) => frame >= Math.round(lineStartSec(id) * fps) && frame <= lineEnd(id),
  );

  // Camera dolly-in toward TV during clips, pull back for analysis cards
  const camZoom = isWorkshop
    ? 1.0
    : isAnalysis
      ? 1.05
      : interpolate(t, [tL2, tL2 + 2.5], [1.0, 1.32], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const camX = isWorkshop || isAnalysis ? 240 : 256;
  const camY = isWorkshop || isAnalysis ? 135 : 112;

  const hud = (
    <>
      <SceneBanner badge="BAGIAN 4 · PENERAPAN & ANALISIS" title="Menonton Langsung Praktikum di Ruang Nonton" accent={PALETTE.gold} startFrame={6} endFrame={135} />

      {/* Workshop 4 stations indicator */}
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
            '1. SARING',
            '2. PANASKAN & CAMPUR',
            '3. CETAK & DINGINKAN',
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
                  fontSize: 14,
                  textAlign: 'center',
                }}
              >
                {label}
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Tags during practical footage */}
      {!isWorkshop && !isAnalysis ? (
        <div style={{position: 'absolute', top: 44, right: 56, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-end'}}>
          {activeClip === 'F01' ? (
            <Tag kind="FISIKA" label="PENYARINGAN · FISIKA" startFrame={Math.round((tL2 + 1) * fps)} />
          ) : null}
          {activeClip === 'F02' || activeClip === 'F03' ? (
            <div
              style={{
                backgroundColor: 'rgba(27,16,32,0.92)',
                border: `4px solid ${PALETTE.gold}`,
                padding: '14px 20px',
                maxWidth: 520,
              }}
            >
              <div style={{fontFamily: FONT_TITLE, fontSize: 13, color: PALETTE.gold, marginBottom: 6}}>
                RESEP KELOMPOK
              </div>
              <div style={{fontFamily: FONT_BODY, fontSize: 22, color: PALETTE.cream}}>
                Bahan: {recipe.bahanLilin} · Pewangi: {recipe.pewangi}
              </div>
            </div>
          ) : null}
          {activeClip === 'F04' || activeClip === 'F05' ? (
            <Tag kind="FISIKA" label="PEMADATAN · FISIKA" startFrame={Math.round((tL4 + 1) * fps)} />
          ) : null}
          {activeClip === 'F07' ? (
            <Tag kind="KIMIA" label="PEMBAKARAN · KIMIA" startFrame={Math.round((tL5 + 1) * fps)} />
          ) : null}
        </div>
      ) : null}

      {/* L06 Analysis cards: Criteria + TODO(user) (never fabricated!) */}
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
      farBlur={4}
      midBlur={1.5}
      farBg={
        <div
          style={{
            width: ART_W,
            height: ART_H,
            background: isWorkshop
              ? `linear-gradient(180deg, ${PALETTE.woodDark} 0%, ${PALETTE.plumDeep} 100%)`
              : `linear-gradient(180deg, ${PALETTE.plumDeep} 0%, ${PALETTE.void} 100%)`,
          }}
        />
      }
      floor={<StageFloor y={202} topColor={PALETTE.woodMid} bottomColor={PALETTE.woodDark} />}
      lights={
        isWorkshop ? (
          <PointLight x={240} y={80} radius={160} color={PALETTE.gold} intensity={0.5} />
        ) : (
          <PointLight x={256} y={96} radius={160} color={tvLightColor} intensity={0.75} />
        )
      }
      dust={{count: 24, color: PALETTE.cream, seed: 's04-dust'}}
      hud={hud}
    >
      {isWorkshop ? (
        <Character id="marsha" x={240} y={202} pose="point" expr="happy" lineId={activeLineId} z={20} />
      ) : (
        <div style={{position: 'absolute', inset: 0}}>
          {/* Retro CRT TV playing practical clips (dimmed/hidden during full-width analysis cards) */}
          {!isAnalysis ? (
            <Sequence key={activeClip} from={Math.round(clipStartSec * fps)} layout="none">
              <TvScreen footageId={activeClip} x={176} y={34} w={160} h={124} staticBurst={staticBurst} />
            </Sequence>
          ) : null}

          {/* Sofa & cast watching */}
          <Img
            src={staticFile('sprites/props/sofa.png')}
            style={{position: 'absolute', left: 164, top: 164, width: 152, height: 52, imageRendering: 'pixelated', zIndex: 10}}
          />
          <Character id="ayuya" x={200} y={206} pose="sit" expr="happy" z={14} dim={0.2} />
          <Character id="noya" x={242} y={206} pose="sit" expr="neutral" z={14} dim={0.2} />
          <Character id="farel" x={282} y={206} pose="sit" expr="determined" z={14} dim={0.2} />

          {/* Marsha standing next to TV */}
          <Character
            id="marsha"
            x={116}
            y={204}
            pose={t >= tL7 ? 'wave' : 'point'}
            expr="happy"
            lineId={activeLineId}
            z={20}
          />
          {/* Ais taking notes on right */}
          <Character id="ais" x={386} y={204} flip pose="think" expr="neutral" z={18} dim={0.15} />
        </div>
      )}

      <DubLayer sceneId="S04" />
      <SfxLayer cues={S04_SFX} />
    </SceneShell>
  );
};
