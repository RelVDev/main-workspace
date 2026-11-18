import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character} from '../characters/Character';
import {ALL_CHAR_IDS, CHARACTERS} from '../characters/registry';
import contributionsJson from '../data/contributions.json';
import {S08_SFX} from '../data/cues/S08.cues';
import {PALETTE} from '../data/palette';
import type {CharId} from '../data/script';
import {SceneShell} from '../engine/SceneShell';
import {PointLight} from '../engine/Lighting';
import {RealFootage} from '../footage/RealFootage';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {ART_H, ART_W} from '../lib/pixel';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {StageFloor} from './shared/StageElements';

const CONTRIB_MAP = contributionsJson as Record<CharId, {role: string; tasks: string[]; prop: string}>;

export const S08_Kontribusi: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const tL2 = lineStartSec('S08_L02');
  const tL3 = lineStartSec('S08_L03');

  const activeLineId = ['S08_L01', 'S08_L02', 'S08_L03'].find(
    (id) => frame >= Math.round(lineStartSec(id) * fps) && frame <= lineEnd(id),
  );

  const hud = (
    <>
      <SceneBanner badge="BAGIAN 8 · KONTRIBUSI TIM" title="Kerja Sama 9 Anggota Kelompok" accent={PALETTE.tan} startFrame={6} endFrame={120} />

      {/* Polaroid & task corkboard cards */}
      {t >= tL2 - 1 && t < tL3 ? (
        <div
          style={{
            position: 'absolute',
            top: 86,
            left: 88,
            right: 88,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          {ALL_CHAR_IDS.map((cid, i) => {
            const lit = t >= tL2 + i * 1.3;
            const info = CONTRIB_MAP[cid];
            const meta = CHARACTERS[cid];
            return (
              <div
                key={cid}
                style={{
                  backgroundColor: lit ? 'rgba(27,16,32,0.92)' : 'rgba(27,16,32,0.65)',
                  border: `4px solid ${lit ? meta.accentColor : PALETTE.woodMid}`,
                  boxShadow: `6px 6px 0 ${PALETTE.ink}`,
                  padding: '12px 16px',
                  opacity: lit ? 1 : 0.45,
                }}
              >
                <div style={{fontFamily: FONT_TITLE, fontSize: 13, color: meta.accentColor}}>
                  {meta.displayName}
                </div>
                <div style={{fontFamily: FONT_BODY, fontSize: 21, color: PALETTE.cream, marginTop: 4}}>
                  {info.tasks[0]}
                </div>
                <div style={{fontFamily: FONT_BODY, fontSize: 17, color: PALETTE.gold, marginTop: 2}}>
                  {info.tasks[1]}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* L03 Mini BTS TVs + Relay Summary */}
      {t >= tL3 ? (
        <div
          style={{
            position: 'absolute',
            top: 96,
            left: 120,
            right: 120,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            alignItems: 'center',
          }}
        >
          <div style={{display: 'flex', gap: 24}}>
            {[0, 1, 2].map((tv) => (
              <div
                key={tv}
                style={{
                  width: 360,
                  height: 210,
                  border: `6px solid ${PALETTE.woodMid}`,
                  outline: `4px solid ${PALETTE.ink}`,
                  backgroundColor: PALETTE.void,
                  overflow: 'hidden',
                }}
              >
                <RealFootage id="F08" variant="pixel" compactPlaceholder />
              </div>
            ))}
          </div>
          <div
            style={{
              backgroundColor: 'rgba(27,16,32,0.92)',
              border: `4px solid ${PALETTE.gold}`,
              padding: '14px 28px',
              fontFamily: FONT_TITLE,
              fontSize: 16,
              color: PALETTE.cream,
            }}
          >
            SARING → CAMPUR → CETAK → PASANG SUMBU → DEKOR → DOKUMENTASI
          </div>
        </div>
      ) : null}

      <SceneSubtitles sceneId="S08" bottomOffset={44} />
    </>
  );

  return (
    <SceneShell
      grade="office"
      camX={240}
      camY={135}
      zoom={1}
      farBlur={4}
      midBlur={1.5}
      farBg={
        <div
          style={{
            width: ART_W,
            height: ART_H,
            background: `linear-gradient(180deg, ${PALETTE.woodMid} 0%, ${PALETTE.woodDark} 100%)`,
          }}
        >
          {/* Corkboard */}
          <div
            style={{
              position: 'absolute',
              left: 72,
              top: 24,
              width: 336,
              height: 124,
              backgroundColor: PALETTE.woodLight,
              border: `4px solid ${PALETTE.woodDark}`,
            }}
          />
        </div>
      }
      floor={<StageFloor y={206} topColor={PALETTE.woodMid} bottomColor={PALETTE.woodDark} />}
      lights={<PointLight x={240} y={96} radius={180} color={PALETTE.cream} intensity={0.4} />}
      dust={{count: 24, color: PALETTE.cream, seed: 's08-dust'}}
      hud={hud}
    >
      {/* All 9 members lined behind team table */}
      {ALL_CHAR_IDS.map((cid, idx) => (
        <Character
          key={cid}
          id={cid}
          x={52 + idx * 47}
          y={208}
          pose={t >= tL3 + 6 ? 'cheer' : cid === 'ais' ? 'talk' : 'idle'}
          expr="happy"
          lineId={cid === 'ais' ? activeLineId : undefined}
          dim={cid === 'ais' ? 0 : 0.15}
          z={cid === 'ais' ? 22 : 14}
        />
      ))}

      <DubLayer sceneId="S08" />
      <SfxLayer cues={S08_SFX} />
    </SceneShell>
  );
};
