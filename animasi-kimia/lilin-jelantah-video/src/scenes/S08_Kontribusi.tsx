import React from 'react';
import {Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character} from '../characters/Character';
import {ALL_CHAR_IDS, CHARACTERS} from '../characters/registry';
import contributionsJson from '../data/contributions.json';
import {S08_SFX} from '../data/cues/S08.cues';
import {PALETTE} from '../data/palette';
import type {CharId} from '../data/script';
import {FloorGlow, PointLight} from '../engine/Lighting';
import {SceneShell} from '../engine/SceneShell';
import {RealFootage} from '../footage/RealFootage';
import {smoothKeyframes} from '../lib/easing';
import {FONT_BODY} from '../lib/fonts';
import {ART_H, ART_W} from '../lib/pixel';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {HangingLamp, PottedPlant, StringLights, WallWainscot} from './shared/RoomDecor';
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

  // Smooth zoom & pan across 9 members and BTS TVs
  const camZoom = smoothKeyframes(t, [
    [0, 1.0],
    [tL2, 1.06],
    [tL3, 1.14],
    [tL3 + 6, 1.06],
  ]);
  const btsProgress = Math.max(0, Math.min(1, (t - tL3) / 0.45));
  const btsEase = 1 - (1 - btsProgress) ** 3;

  const hud = (
    <>
      <SceneBanner
        badge="BAGIAN 8 · KONTRIBUSI TIM"
        title="Kerja Sama 9 Anggota Kelompok"
        accent={PALETTE.tan}
        startFrame={6}
        endFrame={105}
      />

      {t >= tL2 - 1 && t < tL3 ? (
        <div
          style={{
            position: 'absolute',
            top: 112,
            left: 84,
            right: 84,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
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
                  backgroundColor: lit ? 'rgba(27,16,32,0.92)' : 'rgba(27,16,32,0.68)',
                  border: `4px solid ${lit ? meta.accentColor : PALETTE.woodMid}`,
                  boxShadow: lit ? `0 0 14px ${meta.accentColor}44, 6px 6px 0 ${PALETTE.ink}` : `6px 6px 0 ${PALETTE.ink}`,
                  padding: '10px 14px',
                  opacity: lit ? 1 : 0.48,
                }}
              >
                <div style={{fontFamily: FONT_BODY, fontSize: 20, fontWeight: 700, color: meta.accentColor, letterSpacing: 0.4}}>
                  {meta.displayName}
                </div>
                <div style={{fontFamily: FONT_BODY, fontSize: 19, color: PALETTE.cream, marginTop: 2, lineHeight: 1.2}}>
                  {info.tasks[0]}
                </div>
                <div style={{fontFamily: FONT_BODY, fontSize: 17, color: PALETTE.gold, marginTop: 2, lineHeight: 1.2}}>
                  {info.tasks[1]}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {t >= tL3 ? (
        <div
          style={{
            position: 'absolute',
            top: 112,
            left: 120,
            right: 120,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            alignItems: 'center',
            opacity: btsEase,
            transform: `scale(${0.95 + 0.05 * btsEase})`,
          }}
        >
          <div style={{display: 'flex', gap: 24}}>
            {[0, 1, 2].map((tv) => (
              <div
                key={tv}
                style={{
                  width: 380,
                  height: 220,
                  border: `6px solid ${PALETTE.woodMid}`,
                  outline: `4px solid ${PALETTE.ink}`,
                  boxShadow: `8px 8px 0 ${PALETTE.ink}`,
                  backgroundColor: PALETTE.void,
                  overflow: 'hidden',
                }}
              >
                <Sequence from={Math.max(0, Math.round((tL3 - tv * 2) * fps))} layout="none">
                  <RealFootage id="F08" variant="natural" loop fit="cover" compactPlaceholder />
                </Sequence>
              </div>
            ))}
          </div>
          <div
            style={{
              backgroundColor: 'rgba(27,16,32,0.92)',
              border: `4px solid ${PALETTE.gold}`,
              padding: '12px 26px',
              fontFamily: FONT_BODY,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 0.8,
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
      zoom={camZoom}
      farBlur={3.2}
      midBlur={1.2}
      farBg={
        <div style={{position: 'relative', width: ART_W, height: ART_H}}>
          <WallWainscot yFloor={206} wallTop={PALETTE.woodMid} wallBot={PALETTE.woodDark} wainscot={PALETTE.woodDark} trim={PALETTE.gold} />
          {/* Detailed Corkboard with colorful polaroid pins */}
          <div
            style={{
              position: 'absolute',
              left: 72,
              top: 24,
              width: 336,
              height: 124,
              backgroundColor: PALETTE.woodLight,
              border: `4px solid ${PALETTE.woodDark}`,
              outline: `2px solid ${PALETTE.ink}`,
            }}
          >
            {[0, 1, 2, 3, 4].map((p) => (
              <div
                key={p}
                style={{
                  position: 'absolute',
                  left: 24 + p * 62,
                  top: 22 + (p % 2) * 26,
                  width: 42,
                  height: 36,
                  backgroundColor: PALETTE.cream,
                  border: `2px solid ${PALETTE.ink}`,
                }}
              >
                <div style={{position: 'absolute', left: 18, top: -3, width: 5, height: 5, borderRadius: '50%', backgroundColor: PALETTE.red}} />
                <div style={{position: 'absolute', inset: '5px 5px 10px 5px', backgroundColor: p % 2 === 0 ? PALETTE.teal : PALETTE.amber}} />
              </div>
            ))}
          </div>
        </div>
      }
      midBg={<StringLights y={12} count={16} sag={8} />}
      floor={<StageFloor y={206} topColor={PALETTE.woodMid} bottomColor={PALETTE.woodDark} />}
      lights={
        <>
          <HangingLamp x={140} cordLen={14} bulbColor={PALETTE.cream} coneHeight={170} opacity={0.18} />
          <HangingLamp x={340} cordLen={14} bulbColor={PALETTE.cream} coneHeight={170} opacity={0.18} />
          <FloorGlow x={240} y={210} rx={140} ry={14} color={PALETTE.goldPale} opacity={0.3} />
          <PointLight x={240} y={96} radius={185} color={PALETTE.cream} intensity={0.44} />
        </>
      }
      dust={{count: 28, color: PALETTE.cream, seed: 's08-dust'}}
      hud={hud}
    >
      <PottedPlant x={24} y={206} h={24} />
      <PottedPlant x={456} y={206} h={24} />

      {ALL_CHAR_IDS.map((cid, idx) => (
        <Character
          key={cid}
          id={cid}
          x={52 + idx * 47}
          y={208}
          pose={t >= tL3 + 6 ? 'cheer' : cid === 'ais' ? 'talk' : 'idle'}
          expr="happy"
          lineId={cid === 'ais' ? activeLineId : undefined}
          dim={cid === 'ais' ? 0 : 0.12}
          z={cid === 'ais' ? 22 : 14}
        />
      ))}

      <DubLayer sceneId="S08" />
      <SfxLayer cues={S08_SFX} />
    </SceneShell>
  );
};
