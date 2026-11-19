import React from 'react';
import {Easing, interpolate, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character, JeliMascot} from '../characters/Character';
import {S06_SFX} from '../data/cues/S06.cues';
import {META} from '../data/meta';
import {OBSERVATION_CRITERIA} from '../data/observations';
import {PALETTE} from '../data/palette';
import {LensFlare} from '../engine/Atmosphere';
import {FloorGlow, Sparkle} from '../engine/Lighting';
import type {MapLight} from '../engine/SceneLight';
import {VoxelModel, oilDrumModel} from '../engine/Voxel';
import {SceneShell} from '../engine/SceneShell';
import {EvidenceFrame} from '../footage/EvidenceFrame';
import {clamp01, smoothKeyframes} from '../lib/easing';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {Counter} from '../ui/Counter';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {Tag} from '../ui/Tag';
import {HangingLamp} from './shared/RoomDecor';
import {DataConsole, DeckRailing, IndonesiaHologram, LibraryDoorway, ObservatoryDome, S06Foreground} from './shared/S06Set';

const FEET_Y = 204;
/** Keep the characters' feet at a fixed screen height (above the subtitle box) whatever the zoom. */
const camYFor = (zoom: number, screenY = 206) => FEET_Y - (screenY - 135) / (zoom * 1.06);

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

  // ── Camera choreography (anchored to dub lines) ─────────────────────
  // L01 wide observatory → slow push toward the counter
  // L02 tilt-up the drum stack · L03 static w/ DoF on the 140-dot grid
  // L04 pan across the innovation diagram · L05 dolly along the evidence wall
  // L06 balanced static · L07 zoom-out montage · L08 push in for the high-five
  // L09 pan right to the library doorway (exits into the page-slide)
  const camZoom = smoothKeyframes(t, [
    [0, 1.0],
    [tL1 + 1.0, 1.02],
    [tL2 - 0.6, 1.24],
    [tL2 + 0.6, 1.38],
    [tL3 - 0.5, 1.34],
    [tL3 + 0.6, 1.08],
    [tL4 - 0.4, 1.12],
    [tL4 + 0.6, 1.28],
    [tL5 - 0.4, 1.3],
    [tL5 + 0.8, 1.2],
    [tL6 - 0.6, 1.24],
    [tL6 + 0.6, 1.08],
    [tL7 - 0.2, 1.1],
    [tL7 + 0.4, 1.34],
    [tL8 - 0.5, 1.0],
    [tL8 + 1.2, 1.12],
    [tL8 + 2.0, 1.55],
    [tL8 + 6.0, 1.45],
    [tL9 - 0.3, 1.3],
    [tL9 + 3.0, 1.32],
  ]);
  const camX = smoothKeyframes(t, [
    [0, 240],
    [tL2 - 0.6, 250],
    [tL2 + 0.6, 372],
    [tL3 - 0.5, 380],
    [tL3 + 0.6, 244],
    [tL4 - 0.4, 236],
    [tL4 + 0.6, 150],
    [tL5 - 0.4, 330],
    [tL5 + 0.8, 320],
    [tL6 - 0.6, 176],
    [tL6 + 0.6, 240],
    [tL7 - 0.2, 240],
    [tL7 + 0.4, 236],
    [tL8 - 0.5, 240],
    [tL8 + 2.0, 240],
    [tL9 - 0.3, 260],
    [tL9 + 3.0, 400],
  ]);
  // tilt-up on the drums during L02 (from the floor up to the top drum)
  const tiltUp = smoothKeyframes(t, [
    [tL2 + 0.2, 0],
    [tL2 + 3.2, 1],
    [tL3 - 0.5, 1],
    [tL3 + 0.6, 0],
  ]);
  const camY = camYFor(camZoom) - tiltUp * 16;
  const focus = smoothKeyframes(t, [
    [0, 0.5],
    [tL2, 0.5],
    [tL2 + 1, 0.9],
    [tL3 + 0.6, 1],
    [tL4 - 0.4, 1],
    [tL4 + 0.6, 0.6],
    [tL8, 0.6],
    [tL8 + 1.6, 1],
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
      ? 370
      : 240;
  const jeliY = showPipeline
    ? 86 + Math.sin(frame * 0.25) * 3
    : showNational && t >= tL2
      ? 158
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

  const hud = (
    <>
      <SceneBanner
        badge="BAGIAN 6 · DATA & BUKTI"
        title="Memisahkan Data Pustaka & Pengamatan Kelompok"
        accent={PALETTE.teal}
        startFrame={6}
        endFrame={108}
      />

      {/* L01-L02: 898.000 ton/year + Animated Scale Bar */}
      {showNational ? (
        <div
          style={{
            position: 'absolute',
            top: 114,
            left: 110,
            right: 260,
            backgroundColor: 'rgba(21,50,67,0.92)',
            border: `5px solid ${PALETTE.gold}`,
            boxShadow: `10px 10px 0 ${PALETTE.ink}`,
            padding: '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
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
            top: 112,
            left: 130,
            right: 130,
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
            top: 112,
            left: 90,
            right: 90,
            display: 'flex',
            gap: 24,
            alignItems: 'flex-start',
          }}
        >
          <Sequence from={Math.round(tL5 * fps)} layout="none">
            <EvidenceFrame footageId="F07" badge="PENGAMATAN KELOMPOK" label="Produk & Uji Nyala" width={600} height={350} />
          </Sequence>
          <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: 10}}>
            <Tag kind="PENGAMATAN" startFrame={Math.round(tL5 * fps)} />
            {OBSERVATION_CRITERIA.map((c) => (
              <div
                key={c.id}
                style={{
                  backgroundColor: 'rgba(27,16,32,0.92)',
                  border: `4px solid ${PALETTE.teal}`,
                  padding: '10px 16px',
                }}
              >
                <div style={{fontFamily: FONT_BODY, fontSize: 23, fontWeight: 700, color: PALETTE.teal}}>{c.judul}</div>
                <div style={{fontFamily: FONT_BODY, fontSize: 20, color: PALETTE.cream, marginTop: 2, lineHeight: 1.25}}>
                  {c.kriteria}
                </div>
                <div style={{fontFamily: FONT_BODY, fontSize: 19, color: PALETTE.gold, marginTop: 3}}>
                  {c.hasilUser}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* L06: Clean Balanced Split Comparison (No diagonal rotating bar overlapping text) */}
      {showSplitBalance ? (
        <div style={{position: 'absolute', top: 114, left: 160, right: 160, display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center'}}>
          <div
            style={{
              backgroundColor: PALETTE.gold,
              color: PALETTE.ink,
              border: `4px solid ${PALETTE.ink}`,
              boxShadow: `6px 6px 0 ${PALETTE.ink}`,
              padding: '8px 24px',
              fontFamily: FONT_BODY,
              fontSize: 23,
              fontWeight: 700,
              letterSpacing: 0.8,
            }}
          >
            ⚖ PERBANDINGAN DUA SUMBER INFORMASI
          </div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, width: '100%'}}>
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
              <Tag kind="PENGAMATAN" startFrame={Math.round((tL6 + 0.35) * fps)} />
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

  // ── Lighting ─────────────────────────────────────────────────────────
  const holoGlow = 0.75 + 0.25 * Math.sin(frame / 22);
  const drumOn = t >= tL2 && t < tL4 ? clamp01((t - tL2) / 0.6) : 0;
  const dotHeat = showSurvey140 ? dotsLit / 90 : 0;
  const doorOpen = smoothKeyframes(t, [
    [tL9 - 0.2, 0.25],
    [tL9 + 2.0, 1],
  ]);
  const mapLights: MapLight[] = [
    {x: 240, y: 96, r: 120, sx: 1.5, color: PALETTE.teal, intensity: 0.75 * holoGlow, banded: false},
    {x: 240, y: 120, r: 48, color: PALETTE.cyan, intensity: 0.8 * holoGlow},
    {x: 46, y: 160, r: 46, color: PALETTE.teal, intensity: 0.7, flicker: 0.08, seed: 'c1'},
    {x: 418, y: 160, r: 46, color: PALETTE.teal, intensity: 0.6, flicker: 0.08, seed: 'c2'},
    {x: farelX, y: 178, r: 66, sx: 1.1, color: PALETTE.goldPale, intensity: farelSpeaking ? 1 : 0.7},
    {x: sofiX, y: 178, r: 66, sx: 1.1, color: PALETTE.goldPale, intensity: sofiSpeaking ? 1 : 0.7},
    // cool overhead fill so the deck reads
    {x: 240, y: 200, r: 170, sx: 1.9, color: PALETTE.cyan, intensity: 0.35, banded: false},
    {x: 380, y: 170, r: 62, color: PALETTE.amber, intensity: 0.65 * drumOn, flicker: 0.05, seed: 'drum'},
    {x: 240, y: 230, r: 150, sx: 2.2, color: PALETTE.amber, intensity: 0.25 + 0.45 * dotHeat, banded: false},
    {x: 462, y: 170, r: 70, color: PALETTE.gold, intensity: 0.3 + 0.7 * doorOpen, flicker: 0.05, seed: 'door'},
    ...(highFiveSpark ? [{x: 240, y: 150, r: 80, color: PALETTE.goldPale, intensity: 0.9}] : []),
  ];

  return (
    <SceneShell
      grade="observatory"
      camX={camX}
      camY={camY}
      zoom={camZoom}
      focus={focus}
      farBlur={2.6}
      midBlur={1}
      intro="pull"
      outro="right"
      handheld={1}
      farBg={<ObservatoryDome />}
      midBg={
        <>
          <IndonesiaHologram x={240} y={104} glow={holoGlow} />
          <DeckRailing y={150} />
        </>
      }
      floor3d={{y: 204, pattern: 'lab', tile: 24, gloss: 0.35, glossColor: PALETTE.teal, seed: 's06'}}
      lightMap={{ambient: '#0A1A34', darkness: 0.44, lights: mapLights}}
      keyLight={{keyX: 240, keyY: 90, rimColor: PALETTE.cyan, rimStrength: 0.85, shadowStrength: 0.55}}
      rays={{color: PALETTE.cyan, opacity: 0.1, x: 240, y: -10, spread: 50, length: 260}}
      bloom={{intensity: 0.3}}
      fog={{y: 176, height: 50, color: PALETTE.teal, opacity: 0.08}}
      lights={
        <>
          <HangingLamp x={120} cordLen={14} bulbColor={PALETTE.teal} coneHeight={150} opacity={0.12} />
          <HangingLamp x={360} cordLen={14} bulbColor={PALETTE.goldPale} coneHeight={150} opacity={0.12} />
          <FloorGlow x={240} y={208} rx={90} ry={11} color={PALETTE.teal} opacity={0.22} />
          {drumOn > 0 ? <FloorGlow x={384} y={206} rx={40} ry={8} color={PALETTE.amber} opacity={0.3 * drumOn} /> : null}
          <LensFlare x={240} y={120} color={PALETTE.cyan} intensity={0.35 * holoGlow} width={130} seed="holo" />
          {highFiveSpark ? <LensFlare x={240} y={142} color={PALETTE.goldPale} intensity={0.8} width={200} seed="hf" /> : null}
        </>
      }
      dust={{count: 40, color: PALETTE.cyan, seed: 's06-dust', opacity: 0.5}}
      nearBokeh={{count: 6, color: PALETTE.teal, opacity: 0.22}}
      foreground={<S06Foreground />}
      foregroundBlur={3}
      hud={hud}
    >
      <DataConsole x={24} y={204} seed="left" />
      <DataConsole x={396} y={204} flip seed="right2" accent={PALETTE.cyan} />
      <LibraryDoorway x={438} y={204} open={doorOpen} />

      {/* L02-L03: voxel oil drums drop, bounce and stack — slowly turning (illustration) */}
      {t >= tL2 && t < tL4 ? (
        <>
          {[0, 1, 2].map((b) => {
            const landY = b === 2 ? 186 : 206;
            const dropY = interpolate(t, [tL2 + b * 0.8, tL2 + 0.7 + b * 0.8], [40, landY], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
              easing: Easing.out(Easing.bounce),
            });
            if (t < tL2 + b * 0.8) return null;
            const bx = b === 2 ? 370 : 358 + b * 24;
            return (
              <VoxelModel
                key={b}
                voxels={DRUM}
                x={bx}
                y={dropY}
                angle={frame * 0.02 + b * 1.3}
                unit={1}
                box={22}
                tilt={0.45}
                z={18 + b}
              />
            );
          })}
          <div
            style={{
              position: 'absolute',
              left: 344,
              top: 210,
              padding: '1px 3px',
              backgroundColor: PALETTE.ink,
              color: PALETTE.goldPale,
              fontFamily: 'monospace',
              fontSize: 5,
              fontStyle: 'italic',
              opacity: drumOn,
              zIndex: 25,
            }}
          >
            *ilustrasi
          </div>
        </>
      ) : null}

      <Character
        id="farel"
        x={farelX}
        y={FEET_Y}
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
        y={FEET_Y}
        flip={t < tL9}
        pose={isSofiBouncePlay ? 'cheer' : sofiSpeaking ? 'point' : showTakeaway ? 'cheer' : 'idle'}
        expr="happy"
        lineId={sofiSpeaking ? activeLineId : undefined}
        dim={farelSpeaking ? 0.35 : 0}
        jumpY={isSofiBouncePlay ? Math.abs(Math.sin(frame * 0.3)) * 8 : highFiveJump}
        emote={
          t >= tL7 + 0.8 && t < tL7 + 2.0
            ? {type: 'sparkle', startFrame: Math.round((tL7 + 0.8) * fps), durationFrames: 30}
            : undefined
        }
        z={20}
      />

      {META.showMascotJeli ? (
        <JeliMascot x={jeliX} y={jeliY} mood={highFiveSpark ? 'flame' : showPipeline ? 'happy' : 'idle'} z={24} />
      ) : null}

      {highFiveSpark ? <Sparkle x={240} y={142} size="lg" color={PALETTE.gold} /> : null}
      {showSurvey140 ? <Sparkle x={sofiX} y={150} size="sm" color={PALETTE.amber} phase={8} /> : null}

      <DubLayer sceneId="S06" />
      <SfxLayer cues={S06_SFX} />
    </SceneShell>
  );
};

const DRUM = oilDrumModel(PALETTE.amber, PALETTE.woodDark);
