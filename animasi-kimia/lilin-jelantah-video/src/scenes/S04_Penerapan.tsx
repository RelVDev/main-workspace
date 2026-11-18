import React from 'react';
import {Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
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
import {TvScreen, type TvClipItem, useFootageLightColor} from '../footage/TvScreen';
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

  // Ordered schedule of documentation clips on the TV with crossfade support
  const tvClips: TvClipItem[] = [
    {id: 'F01', startSec: tL2, endSec: tL3},
    {id: 'F02', startSec: tL3, endSec: tL3 + 8.5},
    {id: 'F03', startSec: tL3 + 8.5, endSec: tL4},
    {id: 'F04', startSec: tL4, endSec: tL4 + 7.5},
    {id: 'F05', startSec: tL4 + 7.5, endSec: tL5},
    {id: 'F07', startSec: tL5, endSec: tL6},
  ];

  const activeClipObj =
    tvClips.find((c) => t >= c.startSec && t < c.endSec) ?? tvClips[0];
  const activeClip = activeClipObj.id;
  const clipStartSec = activeClipObj.startSec;

  const tvLightColor = useFootageLightColor(activeClip);

  const activeLineId = ['S04_L01', 'S04_L02', 'S04_L03', 'S04_L04', 'S04_L05', 'S04_L06', 'S04_L07'].find(
    (id) => frame >= Math.round(lineStartSec(id) * fps) && frame <= lineEnd(id),
  );

  // Expressive zoom dolly onto TV screen & gentle breath across clips
  const camZoom = smoothKeyframes(t, [
    [0, 1.0],
    [11.0, 1.0],
    [14.2, 1.32],
    [tL4, 1.38],
    [tL5, 1.35],
    [tL5 + 4, 1.44],
    [tL6 - 0.5, 1.4],
    [tL6 + 1.0, 1.04],
  ]);

  const camX = smoothKeyframes(t, [
    [0, 240],
    [11.0, 240],
    [14.2, 256],
    [tL6 - 0.5, 256],
    [tL6 + 1.0, 240],
  ]);

  const camY = smoothKeyframes(t, [
    [0, 135],
    [11.0, 135],
    [14.2, 112],
    [tL6 - 0.5, 112],
    [tL6 + 1.0, 135],
  ]);

  const hud = (
    <>
      <SceneBanner
        badge="BAGIAN 4 · PENERAPAN & ANALISIS"
        title="Menonton Langsung Praktikum di Ruang Nonton"
        accent={PALETTE.gold}
        startFrame={6}
        endFrame={108}
      />

      {/* Top >= 132 so there is ZERO collision with SceneBanner */}
      {isWorkshop ? (
        <div
          style={{
            position: 'absolute',
            top: 132,
            left: 110,
            right: 110,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
          }}
        >
          {[
            {n: '01', txt: 'Persiapan & Penyaringan'},
            {n: '02', txt: 'Peleburan & Pencampuran'},
            {n: '03', txt: 'Penuangan & Pemadatan'},
            {n: '04', txt: 'Uji Nyala Aman'},
          ].map((item, idx) => {
            const lit = t >= 1.5 + idx * 2.0;
            return (
              <div
                key={item.n}
                style={{
                  backgroundColor: lit ? PALETTE.amber : 'rgba(27,16,32,0.88)',
                  color: lit ? PALETTE.ink : PALETTE.cream,
                  border: `4px solid ${PALETTE.ink}`,
                  boxShadow: `6px 6px 0 ${PALETTE.ink}`,
                  padding: '18px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <span style={{fontFamily: FONT_TITLE, fontSize: 13, opacity: 0.8}}>{item.n}</span>
                <span style={{fontFamily: FONT_BODY, fontSize: 25, fontWeight: 700, lineHeight: 1.25}}>
                  {item.txt}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {!isWorkshop && !isAnalysis ? (
        <div style={{position: 'absolute', top: 36, right: 56, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-end'}}>
          {activeClip === 'F01' ? (
            <Tag kind="FISIKA" label="PERSIAPAN MINYAK · FISIKA" startFrame={Math.round((tL2 + 0.5) * fps)} />
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
              <div style={{fontFamily: FONT_BODY, fontSize: 23, fontWeight: 600, color: PALETTE.cream}}>
                {recipe.bahanLilin} · {recipe.pewangi}
              </div>
            </div>
          ) : null}
          {activeClip === 'F04' || activeClip === 'F05' ? (
            <Tag kind="FISIKA" label="PENCETAKAN & PEMADATAN · FISIKA" startFrame={Math.round((tL4 + 0.5) * fps)} />
          ) : null}
          {activeClip === 'F07' ? (
            <Tag kind="KIMIA" label="PEMBAKARAN · KIMIA" startFrame={Math.round((tL5 + 0.5) * fps)} />
          ) : null}
          {(() => {
            const relT = t - clipStartSec;
            const note = FOOTAGE_MAP[activeClip]?.annotations?.find((a) => relT >= a.t0 && relT <= a.t1);
            if (!note) return null;
            return (
              <div
                style={{
                  backgroundColor: 'rgba(27,16,32,0.92)',
                  border: `3px solid ${PALETTE.cyan}`,
                  boxShadow: `4px 4px 0 ${PALETTE.ink}`,
                  padding: '10px 18px',
                  fontFamily: FONT_BODY,
                  fontSize: 23,
                  fontWeight: 600,
                  color: PALETTE.cyan,
                  maxWidth: 480,
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
            top: 108,
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
                  opacity: visible ? 1 : 0.45,
                }}
              >
                <div style={{fontFamily: FONT_BODY, fontSize: 26, fontWeight: 700, color: PALETTE.teal, marginBottom: 8}}>
                  {card.judul}
                </div>
                <div style={{fontFamily: FONT_BODY, fontSize: 22, color: PALETTE.cream, marginBottom: 14, lineHeight: 1.35}}>
                  Kriteria: {card.kriteria}
                </div>
                <div
                  style={{
                    backgroundColor: PALETTE.plumMid,
                    padding: '10px 14px',
                    border: `2px solid ${PALETTE.gold}`,
                    fontFamily: FONT_BODY,
                    fontSize: 21,
                    fontWeight: 600,
                    color: PALETTE.goldPale,
                    lineHeight: 1.3,
                  }}
                >
                  {card.hasilUser}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <SceneSubtitles sceneId="S04" bottomOffset={40} />
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
            <TvScreen clips={tvClips} activeId={activeClip} x={176} y={34} w={160} h={124} />
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
