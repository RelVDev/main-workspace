import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character} from '../characters/Character';
import {S07_SFX} from '../data/cues/S07.cues';
import {PALETTE} from '../data/palette';
import referencesJson from '../data/references.json';
import {SceneShell} from '../engine/SceneShell';
import {PointLight} from '../engine/Lighting';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {ART_H, ART_W} from '../lib/pixel';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
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

  // Highlight groups of cards by beat
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

  const hud = (
    <>
      <SceneBanner badge="BAGIAN 7 · REFERENSI ILMIAH" title="9 Pustaka Ilmiah & Pemisahan Sumber Data" accent={PALETTE.goldPale} startFrame={6} endFrame={135} />

      {/* 9 Reference cards grid */}
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
                  boxShadow: isHighlighted ? `8px 8px 0 ${PALETTE.ink}` : `4px 4px 0 ${PALETTE.ink}`,
                  padding: '14px 18px',
                  opacity: revealed ? (isHighlighted ? 1 : 0.65) : 0,
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

      {/* L06-L07: Two sorting buckets */}
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
              Foto proses, rekaman uji nyala & catatan hasil praktikum kelompok sendiri — tidak tercampur!
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
      zoom={interpolate(t, [0, 6], [1, 1.08], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
      farBlur={4}
      midBlur={1.5}
      farBg={
        <div
          style={{
            width: ART_W,
            height: ART_H,
            background: `linear-gradient(180deg, ${PALETTE.woodDark} 0%, ${PALETTE.plumDeep} 100%)`,
          }}
        >
          {/* Bookshelves */}
          {[40, 140, 260, 360].map((bx) => (
            <div
              key={bx}
              style={{
                position: 'absolute',
                left: bx,
                top: 24,
                width: 82,
                height: 174,
                backgroundColor: PALETTE.woodMid,
                border: `3px solid ${PALETTE.ink}`,
              }}
            >
              {[36, 76, 116, 152].map((sy) => (
                <div
                  key={sy}
                  style={{
                    position: 'absolute',
                    left: 4,
                    right: 4,
                    top: sy,
                    height: 3,
                    backgroundColor: PALETTE.ink,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      }
      floor={<StageFloor y={202} topColor={PALETTE.woodMid} bottomColor={PALETTE.woodDark} />}
      lights={<PointLight x={240} y={84} radius={160} color={PALETTE.goldPale} intensity={0.5} />}
      dust={{count: 38, color: PALETTE.goldPale, seed: 's07-dust'}}
      hud={hud}
    >
      <Character
        id="disa"
        x={240}
        y={202}
        pose={showBuckets ? 'point' : 'talk'}
        expr="happy"
        lineId={activeLineId}
        z={20}
      />
      <DubLayer sceneId="S07" />
      <SfxLayer cues={S07_SFX} />
    </SceneShell>
  );
};
