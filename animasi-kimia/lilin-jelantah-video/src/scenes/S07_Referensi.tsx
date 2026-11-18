import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character, JeliMascot} from '../characters/Character';
import {S07_SFX} from '../data/cues/S07.cues';
import {META} from '../data/meta';
import {PALETTE} from '../data/palette';
import referencesJson from '../data/references.json';
import {FloorGlow, PointLight, Sparkle} from '../engine/Lighting';
import {SceneShell} from '../engine/SceneShell';
import {smoothKeyframes} from '../lib/easing';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {HangingLamp, LibraryDecor, PottedPlant} from './shared/RoomDecor';
import {StageFloor} from './shared/StageElements';

export const S07_Referensi: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const tL2 = lineStartSec('S07_L02');
  const tL3 = lineStartSec('S07_L03');
  const tL4 = lineStartSec('S07_L04');
  const tL5 = lineStartSec('S07_L05');
  const tL6 = lineStartSec('S07_L06');

  const activeLineId = ['S07_L01', 'S07_L02', 'S07_L03', 'S07_L04', 'S07_L05', 'S07_L06', 'S07_L07'].find(
    (id) => frame >= Math.round(lineStartSec(id) * fps) && frame <= lineEnd(id),
  );

  const activeIndices =
    t >= tL2 && t < tL3
      ? [0, 1]
      : t >= tL3 && t < tL4
        ? [2, 3, 4]
        : t >= tL4 && t < tL5
          ? [5, 6]
          : t >= tL5 && t < tL6
            ? [7, 8]
            : [];

  const showBuckets = t >= tL6;

  // Smooth slow zoom-in across library
  const camZoom = smoothKeyframes(t, [
    [0, 1.0],
    [6.0, 1.08],
    [tL6, 1.06],
    [tL6 + 2.0, 1.12],
  ]);
  const disaX = smoothKeyframes(t, [
    [0, 240],
    [tL2, 180],
    [tL4, 290],
    [tL6, 240],
  ]);

  const hud = (
    <>
      <SceneBanner
        badge="BAGIAN 7 · REFERENSI ILMIAH"
        title="9 Pustaka Ilmiah & Pemisahan Sumber Data"
        accent={PALETTE.goldPale}
        startFrame={6}
        endFrame={135}
      />

      {!showBuckets && t >= tL2 - 1 ? (
        <div
          style={{
            position: 'absolute',
            top: 90,
            left: 110,
            right: 110,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 18,
          }}
        >
          {referencesJson.map((ref, idx) => {
            const isHighlighted = activeIndices.includes(idx);
            const revealed = t >= tL2 - 0.5;
            return (
              <div
                key={ref.id}
                style={{
                  backgroundColor: isHighlighted ? 'rgba(42,21,48,0.96)' : 'rgba(27,16,32,0.82)',
                  border: `4px solid ${isHighlighted ? PALETTE.gold : PALETTE.woodLight}`,
                  boxShadow: isHighlighted ? `0 0 16px ${PALETTE.gold}55, 8px 8px 0 ${PALETTE.ink}` : `4px 4px 0 ${PALETTE.ink}`,
                  padding: '14px 18px',
                  opacity: revealed ? (isHighlighted ? 1 : 0.62) : 0,
                  transform: `scale(${isHighlighted ? 1.03 : 1})`,
                }}
              >
                <div style={{fontFamily: FONT_TITLE, fontSize: 13, color: PALETTE.gold, marginBottom: 6}}>
                  [{ref.id}] {ref.short}
                </div>
                <div style={{fontFamily: FONT_BODY, fontSize: 22, color: PALETTE.cream, lineHeight: 1.25}}>
                  {ref.topic}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {showBuckets ? (
        <div
          style={{
            position: 'absolute',
            top: 110,
            left: 180,
            right: 180,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 36,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(27,16,32,0.94)',
              border: `6px solid ${PALETTE.gold}`,
              boxShadow: `10px 10px 0 ${PALETTE.ink}`,
              padding: '26px 30px',
            }}
          >
            <div style={{fontFamily: FONT_TITLE, fontSize: 18, color: PALETTE.gold, marginBottom: 12}}>
              EMBER A · DATA PUSTAKA
            </div>
            <div style={{fontFamily: FONT_BODY, fontSize: 26, color: PALETTE.cream}}>
              9 referensi jurnal, prosiding & buku ajar (898 ribu ton, 64,3%, konsep trigliserida & parafin).
            </div>
          </div>
          <div
            style={{
              backgroundColor: 'rgba(27,16,32,0.94)',
              border: `6px solid ${PALETTE.teal}`,
              boxShadow: `10px 10px 0 ${PALETTE.ink}`,
              padding: '26px 30px',
            }}
          >
            <div style={{fontFamily: FONT_TITLE, fontSize: 18, color: PALETTE.teal, marginBottom: 12}}>
              EMBER B · PENGAMATAN KELOMPOK
            </div>
            <div style={{fontFamily: FONT_BODY, fontSize: 26, color: PALETTE.cream}}>
              Dokumentasi video praktikum & catatan pengamatan kelompok sendiri — tidak tercampur!
            </div>
          </div>
        </div>
      ) : null}

      <SceneSubtitles sceneId="S07" bottomOffset={44} />
    </>
  );

  return (
    <SceneShell
      grade="library"
      camX={240}
      camY={135}
      zoom={camZoom}
      farBlur={3.6}
      midBlur={1.4}
      farBg={<LibraryDecor />}
      floor={<StageFloor y={202} topColor={PALETTE.woodMid} bottomColor={PALETTE.woodDark} />}
      lights={
        <>
          <HangingLamp x={160} cordLen={18} bulbColor={PALETTE.goldPale} coneHeight={170} opacity={0.22} />
          <HangingLamp x={320} cordLen={18} bulbColor={PALETTE.goldPale} coneHeight={170} opacity={0.22} />
          <FloorGlow x={240} y={206} rx={115} ry={14} color={PALETTE.goldPale} opacity={0.34} />
          <PointLight x={240} y={84} radius={165} color={PALETTE.goldPale} intensity={0.54} />
        </>
      }
      dust={{count: 40, color: PALETTE.goldPale, seed: 's07-dust'}}
      hud={hud}
    >
      <PottedPlant x={44} y={202} h={26} />
      <PottedPlant x={436} y={202} h={26} />
      <Character
        id="disa"
        x={disaX}
        y={202}
        flip={t >= tL4 && t < tL6}
        pose={showBuckets ? 'point' : 'talk'}
        expr="happy"
        lineId={activeLineId}
        z={20}
      />
      {META.showMascotJeli ? <JeliMascot x={290} y={188} mood="happy" z={22} /> : null}
      <Sparkle x={240} y={120} size="sm" color={PALETTE.goldPale} />
      <DubLayer sceneId="S07" />
      <SfxLayer cues={S07_SFX} />
    </SceneShell>
  );
};
