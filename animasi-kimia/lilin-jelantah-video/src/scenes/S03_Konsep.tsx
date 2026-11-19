import React from 'react';
import {Easing, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DubLayer} from '../audio/DubLayer';
import {SfxLayer} from '../audio/SfxLayer';
import {Character, JeliMascot} from '../characters/Character';
import {S03_SFX} from '../data/cues/S03.cues';
import {META} from '../data/meta';
import {PALETTE} from '../data/palette';
import {recipe} from '../data/recipe';
import {LensFlare} from '../engine/Atmosphere';
import {FloorGlow, Sparkle} from '../engine/Lighting';
import {SceneShell} from '../engine/SceneShell';
import type {MapLight} from '../engine/SceneLight';
import {PixelMolecule3D, VoxelModel, bottleModel, triglycerideAtoms} from '../engine/Voxel';
import {clamp01, smoothKeyframes} from '../lib/easing';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {lineEnd, lineStartSec} from '../lib/seconds';
import {SceneBanner} from '../ui/SceneBanner';
import {SceneSubtitles} from '../ui/Subtitles';
import {Tag} from '../ui/Tag';
import {LabBackdrop, LabBenchExtras} from './shared/RoomDecor';
import {AnimatedFlame, PixelDoor} from './shared/StageElements';
import {
  CapillaryArrows,
  FilterDrips,
  HoloPedestal,
  LabBench,
  LabForeground,
  LabLampHardware,
  glassJarModel,
  paraffinBlockModel,
} from './shared/S03Set';

const ramp = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

export const S03_Konsep: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;

  const tL2 = lineStartSec('S03_L02');
  const tL3 = lineStartSec('S03_L03');
  const tL4 = lineStartSec('S03_L04');
  const tL5 = lineStartSec('S03_L05');
  const tL6 = lineStartSec('S03_L06');
  const tL7 = lineStartSec('S03_L07');

  const activeLineId = ['S03_L01', 'S03_L02', 'S03_L03', 'S03_L04', 'S03_L05', 'S03_L06', 'S03_L07'].find(
    (id) => frame >= Math.round(lineStartSec(id) * fps) && frame <= lineEnd(id),
  );

  const showTriglyceride = t >= tL2 && t < tL3;
  const showFiltering = t >= tL3 && t < tL4;
  const showNotParaffin = t >= tL4 && t < tL5;
  const showPhaseChange = t >= tL5 && t < tL6;
  const showCombustion = t >= tL6 && t < tL7;
  const showSummary = t >= tL7;

  const candleLit = t >= tL6 + 1.3;
  const shake =
    (t >= tL4 + 1.8 && t <= tL4 + 2.3 ? 0.85 : 0) +
    (t >= tL5 + 9.5 && t <= tL5 + 9.8 ? 0.4 : 0) +
    (t >= tL6 + 1.3 && t <= tL6 + 1.6 ? 0.35 : 0);

  // ── Camera ──────────────────────────────────────────────────────────────
  // Dolly in to Noya → molecule close-up on the board → funnel close-up (filtering) → two holo
  // exhibits "BUKAN PARAFIN" (+impact shake) → melting pot → pour into the jar → push into the
  // flame (the flame becomes the key light) → pull back wide, drift toward the workshop door.
  const camX = smoothKeyframes(t, [
    [0, 252],
    [5.5, 186],
    [tL2 - 0.3, 196],
    [tL2 + 1.0, 214],
    [tL3 + 2.8, 214],
    [tL3 + 4.2, 250],
    [tL4 - 0.4, 250],
    [tL4 + 0.9, 212],
    [tL5 - 0.3, 212],
    [tL5 + 1.2, 300],
    [tL5 + 6.0, 300],
    [tL5 + 7.2, 365],
    [tL6 - 0.2, 360],
    [tL6 + 2.4, 334],
    [tL7 - 0.4, 334],
    [tL7 + 0.9, 240],
    [tL7 + 6.5, 300],
  ]);
  const camY = smoothKeyframes(t, [
    [0, 138],
    [5.5, 150],
    [tL2 - 0.3, 146],
    [tL2 + 1.0, 112],
    [tL3 + 2.8, 112],
    [tL3 + 4.2, 140],
    [tL4 - 0.4, 140],
    [tL4 + 0.9, 132],
    [tL5 - 0.3, 132],
    [tL5 + 1.2, 136],
    [tL6 - 0.2, 136],
    [tL6 + 2.4, 124],
    [tL7 - 0.4, 124],
    [tL7 + 0.9, 140],
  ]);
  const camZoom = smoothKeyframes(t, [
    [0, 1.0],
    [5.5, 1.45],
    [tL2 - 0.3, 1.4],
    [tL2 + 1.0, 1.5],
    [tL3 + 2.8, 1.55],
    [tL3 + 4.2, 2.05],
    [tL4 - 0.4, 2.05],
    [tL4 + 0.9, 1.5],
    [tL5 - 0.3, 1.5],
    [tL5 + 1.2, 2.0],
    [tL5 + 6.0, 2.12],
    [tL5 + 7.2, 2.1],
    [tL6 - 0.2, 1.9],
    [tL6 + 2.4, 2.5],
    [tL7 - 0.4, 2.55],
    [tL7 + 0.9, 1.0],
    [tL7 + 6.5, 1.16],
  ]);
  const focus = smoothKeyframes(t, [
    [0, 0.4],
    [5.5, 1],
    [tL7 + 0.9, 0.45],
  ]);

  // ── Choreography ────────────────────────────────────────────────────────
  const noyaX = smoothKeyframes(t, [
    [0, 124],
    [tL5 - 0.2, 124],
    [tL5 + 1.2, 152],
    [tL7 - 0.3, 152],
    [tL7 + 0.9, 128],
  ]);
  const noyaWalking = (t >= tL5 - 0.2 && t <= tL5 + 1.15) || (t >= tL7 - 0.3 && t <= tL7 + 0.85);

  const jeliX = smoothKeyframes(t, [
    [0, 78],
    [tL5, 78],
    [tL5 + 2.0, 294],
    [tL6, 294],
    [tL6 + 1.8, 384],
    [tL7, 384],
    [tL7 + 1.4, 86],
  ]);
  const jeliY = smoothKeyframes(t, [
    [0, 186],
    [tL5, 186],
    [tL5 + 2.0, 104],
    [tL6 + 1.8, 120],
    [tL7, 120],
    [tL7 + 1.4, 186],
  ]);

  const solidFill = interpolate(t, [tL5 + 6.5, tL5 + 10.2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });

  const tailSnaps = [tL2 + 2.0, tL2 + 3.8, tL2 + 5.6].map((ts) =>
    interpolate(t, [ts - 0.5, ts], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }),
  );

  // Molecule (L02 → first half of L03, jiggles when the oil is heated)
  const molOp = Math.min(ramp(t, tL2 + 0.2, tL2 + 0.9), 1 - ramp(t, tL3 + 3.4, tL3 + 4.1));
  const snapsKey = tailSnaps.map((v) => v.toFixed(2)).join(',');
  const tri = React.useMemo(
    () => triglycerideAtoms(6, snapsKey.split(',').map(Number) as [number, number, number]),
    [snapsKey],
  );
  const molAlpha = React.useMemo(() => {
    const snaps = snapsKey.split(',').map(Number);
    return tri.atoms.map((_, i) => (i < 3 ? 1 : snaps[Math.floor((i - 3) / 9)] ?? 1));
  }, [tri, snapsKey]);
  const heatJiggle = showFiltering ? 0.6 + 0.8 * ramp(t, tL3 + 0.6, tL3 + 2.0) : 0;

  // Phase change: wax chips melt in the pot, get stirred, poured into the jar, then cool solid.
  const melt = ramp(t, tL5 + 1.0, tL5 + 4.0);
  const pour = ramp(t, tL5 + 6.5, tL5 + 9.0);
  const cooling = showPhaseChange ? Math.min(ramp(t, tL5 + 8.8, tL5 + 9.6), 1 - ramp(t, tL6 - 0.6, tL6)) : 0;
  const potLevel = t < tL5 ? 0 : 0.85 * (1 - pour);
  const jarFill = t < tL5 + 6.5 ? 0 : 0.05 + 0.75 * pour;
  const jarWax = solidFill > 0.6 ? PALETTE.cream : PALETTE.amber;
  const jarKey = `${(Math.round(jarFill * 14) / 14).toFixed(3)}-${jarWax}`;
  const jarVox = React.useMemo(() => {
    const [lvl, wax] = jarKey.split('-');
    return glassJarModel(Number(lvl), wax);
  }, [jarKey]);
  const bottleVox = React.useMemo(() => bottleModel(PALETTE.amberDeep), []);
  const waxVox = React.useMemo(() => paraffinBlockModel(), []);
  const holoOn = showNotParaffin ? Math.min(ramp(t, tL4 + 0.2, tL4 + 0.8), 1 - ramp(t, tL5 - 0.5, tL5)) : 0;

  const warm = ramp(t, tL6 + 1.2, tL6 + 2.2) * (1 - 0.5 * ramp(t, tL7 + 0.4, tL7 + 1.6));

  const hud = (
    <>
      <SceneBanner
        badge="BAGIAN 3 · KONSEP KIMIA"
        title="Dari Molekul Trigliserida hingga Reaksi Pembakaran"
        accent={PALETTE.teal}
        startFrame={6}
        endFrame={108}
      />

      {showTriglyceride ? (
        <div
          style={{
            position: 'absolute',
            top: 112,
            right: 110,
            width: 820,
            backgroundColor: 'rgba(21,50,67,0.93)',
            border: `5px solid ${PALETTE.teal}`,
            boxShadow: `8px 8px 0 ${PALETTE.ink}`,
            padding: '24px 30px',
          }}
        >
          <div style={{fontFamily: FONT_TITLE, fontSize: 18, color: PALETTE.cyan, marginBottom: 12}}>
            STRUKTUR MINYAK GORENG: TRIGLISERIDA
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 28, color: PALETTE.cream, marginBottom: 16}}>
            1 Molekul Gliserol + 3 Rantai Asam Lemak
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 22}}>
            <div
              style={{
                backgroundColor: PALETTE.tealMid,
                border: `4px solid ${PALETTE.ink}`,
                padding: '26px 18px',
                fontFamily: FONT_TITLE,
                fontSize: 15,
                color: PALETTE.cream,
              }}
            >
              GLISEROL
              <br />
              (3-C)
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 12, flex: 1}}>
              {['Asam Lemak 1', 'Asam Lemak 2', 'Asam Lemak 3'].map((label, i) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    opacity: tailSnaps[i],
                    transform: `translate3d(${((1 - tailSnaps[i]) * 60).toFixed(2)}px, 0, 0)`,
                  }}
                >
                  <span style={{color: PALETTE.gold, fontFamily: FONT_TITLE, fontSize: 18}}>═══</span>
                  <div
                    style={{
                      flex: 1,
                      backgroundColor: PALETTE.amber,
                      color: PALETTE.ink,
                      fontFamily: FONT_BODY,
                      fontSize: 24,
                      fontWeight: 700,
                      padding: '6px 14px',
                      border: `3px solid ${PALETTE.ink}`,
                    }}
                  >
                    {label} (Rantai Hidrokarbon)
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showFiltering ? (
        <div
          style={{
            position: 'absolute',
            top: 114,
            right: 110,
            width: 760,
            backgroundColor: 'rgba(27,16,32,0.93)',
            border: `5px solid ${PALETTE.amber}`,
            boxShadow: `8px 8px 0 ${PALETTE.ink}`,
            padding: '24px 30px',
          }}
        >
          <div style={{fontFamily: FONT_TITLE, fontSize: 20, color: PALETTE.gold, marginBottom: 10}}>
            PENYARINGAN = PEMISAHAN FISIKA
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 28, color: PALETTE.cream, lineHeight: 1.35}}>
            Remah padat tersaring, namun minyak tetap terdegradasi.
          </div>
          <div
            style={{
              marginTop: 14,
              display: 'inline-block',
              backgroundColor: PALETTE.red,
              color: PALETTE.cream,
              fontFamily: FONT_TITLE,
              fontSize: 16,
              padding: '10px 18px',
              border: `3px solid ${PALETTE.ink}`,
            }}
          >
            DISARING ≠ KEMBALI BARU
          </div>
        </div>
      ) : null}

      {showNotParaffin ? (
        <div
          style={{
            position: 'absolute',
            top: 112,
            right: 100,
            width: 860,
            backgroundColor: 'rgba(27,16,32,0.95)',
            border: `6px solid ${PALETTE.red}`,
            boxShadow: `10px 10px 0 ${PALETTE.ink}`,
            padding: '26px 32px',
          }}
        >
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18}}>
            <div style={{backgroundColor: PALETTE.amberDeep, color: PALETTE.cream, padding: '12px 18px', border: `4px solid ${PALETTE.ink}`, fontFamily: FONT_TITLE, fontSize: 14}}>
              MINYAK JELANTAH
            </div>
            <div style={{fontFamily: FONT_TITLE, fontSize: 28, color: PALETTE.red}}>──✕──▶</div>
            <div style={{backgroundColor: PALETTE.slate, color: PALETTE.cream, padding: '12px 18px', border: `4px solid ${PALETTE.ink}`, fontFamily: FONT_TITLE, fontSize: 14}}>
              PARAFIN
            </div>
          </div>
          <div style={{fontFamily: FONT_TITLE, fontSize: 24, color: PALETTE.red, marginBottom: 10}}>
            BUKAN PARAFIN!
          </div>
          <div style={{fontFamily: FONT_BODY, fontSize: 28, color: PALETTE.cream, lineHeight: 1.35}}>
            Jelantah dicampur secara fisika dengan bahan pemadat ({recipe.bahanLilin}).
          </div>
        </div>
      ) : null}

      {showPhaseChange ? (
        <div style={{position: 'absolute', top: 112, right: 110, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start'}}>
          <Tag kind="FISIKA" label="PEMADATAN = PERUBAHAN FISIKA" startFrame={Math.round((tL5 + 9.5) * fps)} />
          <div
            style={{
              backgroundColor: 'rgba(21,50,67,0.93)',
              border: `4px solid ${PALETTE.teal}`,
              boxShadow: `6px 6px 0 ${PALETTE.ink}`,
              padding: '18px 24px',
              maxWidth: 700,
              fontFamily: FONT_BODY,
              fontSize: 28,
              color: PALETTE.cream,
              lineHeight: 1.35,
            }}
          >
            Dipanaskan → meleleh · Didinginkan → memadat (wujud berubah, zat tetap sama).
          </div>
        </div>
      ) : null}

      {showCombustion ? (
        <div style={{position: 'absolute', top: 112, left: 80, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start'}}>
          <Tag kind="KIMIA" label="PEMBAKARAN = PERUBAHAN KIMIA" startFrame={Math.round((tL6 + 6.0) * fps)} />
          <div
            style={{
              backgroundColor: 'rgba(27,16,32,0.92)',
              border: `4px solid ${PALETTE.amber}`,
              boxShadow: `6px 6px 0 ${PALETTE.ink}`,
              padding: '18px 24px',
              maxWidth: 680,
              fontFamily: FONT_BODY,
              fontSize: 28,
              color: PALETTE.cream,
              lineHeight: 1.35,
            }}
          >
            Bahan bakar naik via kapilaritas sumbu → menguap → bereaksi dengan O₂ menghasilkan panas & cahaya.
          </div>
          {META.showOptionalCombustionProducts ? (
            <Tag kind="OPSIONAL" label="[OPSIONAL] Umumnya menghasilkan CO₂ + H₂O" startFrame={Math.round((tL6 + 8.0) * fps)} />
          ) : null}
        </div>
      ) : null}

      {showSummary ? (
        <div
          style={{
            position: 'absolute',
            top: 118,
            left: 120,
            right: 120,
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
          }}
        >
          {[
            {n: '1. PEMISAHAN', s: 'Penyaringan fisika', c: PALETTE.teal},
            {n: '2. PENCAMPURAN', s: 'Jelantah + bahan lilin', c: PALETTE.gold},
            {n: '3. WUJUD (FISIKA)', s: 'Meleleh → memadat', c: PALETTE.cyan},
            {n: '4. KIMIA', s: 'Reaksi pembakaran', c: PALETTE.amber},
          ].map((item, idx) => {
            const active = t >= tL7 + 0.8 + idx * 1.1;
            return (
              <div
                key={item.n}
                style={{
                  backgroundColor: active ? 'rgba(27,16,32,0.95)' : 'rgba(27,16,32,0.55)',
                  border: `4px solid ${active ? item.c : PALETTE.slate}`,
                  padding: '18px 18px',
                  boxShadow: active ? `6px 6px 0 ${PALETTE.ink}` : undefined,
                  opacity: active ? 1 : 0.45,
                }}
              >
                <div style={{fontFamily: FONT_TITLE, fontSize: 13, color: item.c, marginBottom: 8}}>{item.n}</div>
                <div style={{fontFamily: FONT_BODY, fontSize: 25, fontWeight: 700, color: PALETTE.cream}}>{item.s}</div>
              </div>
            );
          })}
        </div>
      ) : null}

      <SceneSubtitles sceneId="S03" bottomOffset={40} />
    </>
  );

  // ── Lighting ─────────────────────────────────────────────────────────────
  const dimOthers = 1 - 0.55 * warm;
  const mapLights: MapLight[] = [
    // board glow + lamp pools over the bench
    {x: 275, y: 78, r: 150, sx: 1.4, color: PALETTE.cyan, intensity: 0.55 * dimOthers, banded: false},
    {x: 200, y: 150, r: 62, sx: 1.5, color: PALETTE.cyan, intensity: 0.75 * dimOthers},
    {x: 320, y: 150, r: 62, sx: 1.5, color: PALETTE.goldPale, intensity: 0.75 * dimOthers},
    {x: 130, y: 175, r: 60, sx: 1.3, color: PALETTE.cream, intensity: 0.6 * dimOthers},
    // workshop door spill
    {x: 443, y: 168, r: 50, color: PALETTE.amber, intensity: 0.7, flicker: 0.05, seed: 'door'},
    // hotplate glow while melting
    {x: 272, y: 152, r: 34, color: PALETTE.amber, intensity: showPhaseChange ? 0.8 * (1 - pour) : 0, flicker: 0.15, seed: 'hot'},
    // cooling: cold blue wash on the jar
    {x: 352, y: 140, r: 46, color: PALETTE.cyan, intensity: 0.9 * cooling},
    // holo exhibits
    {x: 175, y: 110, r: 64, sx: 1.4, color: PALETTE.teal, intensity: 0.7 * holoOn},
    // summary: soft overhead fill so the wide shot isn't murky
    {x: 250, y: 150, r: 230, sx: 1.6, color: PALETTE.cream, intensity: 0.5 * ramp(t, tL7 + 0.4, tL7 + 1.6), banded: false},
    // THE FLAME — main key once lit
    {x: 352, y: 118, r: 120, color: PALETTE.amber, intensity: 1.05 * warm, flicker: 0.16, seed: 'flame'},
    {x: 352, y: 118, r: 40, color: PALETTE.goldPale, intensity: 0.9 * warm, flicker: 0.2, seed: 'flame2'},
  ];

  return (
    <SceneShell
      grade="lab"
      gradeTo="workshop"
      gradeMix={warm * 0.85}
      camX={camX}
      camY={camY}
      zoom={camZoom}
      focus={focus}
      shake={shake}
      intro="push"
      outro="right"
      farBlur={2.4}
      midBlur={0.8}
      farBg={<LabBackdrop />}
      midBg={<LabLampHardware xs={[200, 320]} colors={[PALETTE.cyan, PALETTE.goldPale]} />}
      floor3d={{y: 200, pattern: 'lab', tile: 26, gloss: 0.3, glossColor: candleLit ? PALETTE.amber : PALETTE.cyan, seed: 's03'}}
      lightMap={{ambient: '#0B1E2C', darkness: 0.4 + 0.22 * warm, lights: mapLights}}
      keyLight={
        candleLit
          ? {keyX: 352, keyY: 118, rimColor: PALETTE.gold, rimStrength: 1, shadowStrength: 0.65}
          : {keyX: 260, keyY: 10, rimColor: PALETTE.cyan, rimStrength: 0.8, shadowStrength: 0.5}
      }
      rays={{color: candleLit ? PALETTE.gold : PALETTE.cyan, opacity: 0.12 * dimOthers, x: 260, y: -8, spread: 50, length: 230}}
      lights={
        <>
          <FloorGlow x={275} y={206} rx={100} ry={12} color={candleLit ? PALETTE.amber : PALETTE.cyan} opacity={0.22} />
          {candleLit ? <LensFlare x={352} y={114} color={PALETTE.gold} intensity={0.7 * warm} width={170} seed="s03-flame" /> : null}
        </>
      }
      bloom={candleLit ? {intensity: 0.38} : {intensity: 0.22}}
      dust={{count: 34, color: candleLit ? PALETTE.goldPale : PALETTE.cyan, seed: 's03-dust', opacity: 0.55}}
      nearBokeh={{count: 6, color: candleLit ? PALETTE.gold : PALETTE.cyan, opacity: 0.22}}
      foreground={<LabForeground />}
      foregroundBlur={3.2}
      hud={hud}
    >
      <PixelDoor x={426} y={132} glow={PALETTE.amber} label="WORKSHOP" />

      <LabBench />
      <LabBenchExtras heated={showPhaseChange && melt > 0 && pour < 1} />

      {/* Funnel + beaker (filtering demo drips during L03) */}
      <Img
        src={staticFile('sprites/props/beaker_funnel.png')}
        style={{position: 'absolute', left: 196, top: 118, width: 36, height: 40, imageRendering: 'pixelated'}}
      />
      <FilterDrips x={213} yTop={136} yBottom={146} on={showFiltering ? ramp(t, tL3 + 3.8, tL3 + 4.4) : 0} />

      {/* Hotplate + melting pot */}
      <div style={{position: 'absolute', left: 252, top: 150, width: 40, height: 6, backgroundColor: PALETTE.slate, border: `2px solid ${PALETTE.ink}`}}>
        <div style={{position: 'absolute', left: 6, top: 1, width: 26, height: 1, backgroundColor: PALETTE.red, opacity: showPhaseChange ? 1 - pour : 0}} />
      </div>
      <div style={{position: 'absolute', left: 256, top: 120, width: 32, height: 31, border: `2px solid ${PALETTE.ink}`, backgroundColor: PALETTE.silver, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 1, top: 1, width: 2, height: 27, backgroundColor: PALETTE.white, opacity: 0.8}} />
        {potLevel > 0.01 ? (
          <div style={{position: 'absolute', left: 2, right: 2, bottom: 2, height: Math.round(4 + 20 * potLevel), backgroundColor: PALETTE.amber}}>
            {/* stirring swirl */}
            {t >= tL5 + 4 && t < tL5 + 6.5 ? (
              <div style={{position: 'absolute', left: 4 + Math.round(10 + Math.sin(frame * 0.4) * 9), top: 2, width: 4, height: 2, backgroundColor: PALETTE.goldPale}} />
            ) : null}
            {/* unmelted wax chips */}
            {[0, 1, 2, 3].map((k) => (
              <div key={k} style={{position: 'absolute', left: 3 + k * 6, top: 1 + (k % 2) * 3, width: 4, height: 3, backgroundColor: PALETTE.white, border: `1px solid ${PALETTE.silver}`, opacity: 1 - melt}} />
            ))}
          </div>
        ) : null}
      </div>
      {/* pour stream pot → jar */}
      {pour > 0 && pour < 1 ? (
        <div style={{position: 'absolute', left: 289, top: 120, width: 60, height: 20}}>
          {Array.from({length: 14}, (_, i) => {
            const u = i / 13;
            return <div key={i} style={{position: 'absolute', left: Math.round(u * 58), top: Math.round(Math.sin(u * Math.PI) * -6 + u * 14), width: 2, height: 2, backgroundColor: i % 3 === (frame >> 1) % 3 ? PALETTE.goldPale : PALETTE.amber}} />;
          })}
        </div>
      ) : null}

      {/* 3D pixel candle jar (glass, wick, wax level) */}
      <VoxelModel voxels={jarVox} x={352} y={151} angle={0.5 + frame * 0.012} unit={2} box={34} tilt={0.5} z={8} outline={null} />
      {candleLit ? (
        <>
          <AnimatedFlame x={352} y={124} scale={0.8} />
          <CapillaryArrows x={350} y={126} on={showCombustion ? ramp(t, tL6 + 2.5, tL6 + 3.0) * (1 - ramp(t, tL6 + 9, tL6 + 9.5)) : 0} />
          {showCombustion
            ? [0, 1, 2, 3].map((i) => {
                const ang = frame * 0.08 + (i * Math.PI) / 2;
                const ox = 352 + Math.cos(ang) * 18;
                const oy = 112 + Math.sin(ang) * 8;
                const op = ramp(t, tL6 + 4.3, tL6 + 4.9);
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      transform: `translate3d(${ox.toFixed(2)}px, ${oy.toFixed(2)}px, 0)`,
                      width: 4,
                      height: 4,
                      backgroundColor: PALETTE.cyan,
                      border: `1px solid ${PALETTE.ink}`,
                      opacity: op,
                    }}
                  />
                );
              })
            : null}
        </>
      ) : null}

      {/* 3D triglyceride on the board */}
      {molOp > 0.01 ? (
        <div style={{opacity: molOp}}>
          <PixelMolecule3D
            atoms={tri.atoms}
            bonds={tri.bonds}
            alpha={molAlpha}
            x={186}
            y={90}
            yaw={0.35 + Math.sin(frame * 0.02) * 0.5}
            pitch={0.45}
            w={130}
            h={76}
            jiggle={heatJiggle}
            frame={frame}
            z={6}
          />
        </div>
      ) : null}

      {/* L04: two holo exhibits — oil ≠ paraffin */}
      {holoOn > 0.01 ? (
        <div style={{opacity: holoOn}}>
          <HoloPedestal x={150} y={128} color={PALETTE.amber} />
          <HoloPedestal x={204} y={128} color={PALETTE.teal} />
          <VoxelModel voxels={bottleVox} x={150} y={124} angle={frame * 0.03} unit={1} box={20} tilt={0.5} z={9} />
          <VoxelModel voxels={waxVox} x={204} y={126} angle={-frame * 0.03} unit={2} box={34} tilt={0.5} z={9} />
          <Img
            src={staticFile('sprites/ui/icon_x.png')}
            style={{
              position: 'absolute',
              left: 168,
              top: 96,
              width: 18,
              height: 18,
              imageRendering: 'pixelated',
              opacity: ramp(t, tL4 + 1.8, tL4 + 2.0),
              transform: `scale(${(1.6 - 0.6 * ramp(t, tL4 + 1.8, tL4 + 2.1)).toFixed(3)})`,
            }}
          />
        </div>
      ) : null}

      <Character
        id="noya"
        x={noyaX}
        y={202}
        flip={showSummary && t > tL7 + 0.9}
        pose={noyaWalking ? 'walk' : showNotParaffin || showTriglyceride || showCombustion ? 'point' : 'talk'}
        expr={showNotParaffin ? 'determined' : 'happy'}
        lineId={activeLineId}
        emote={
          t >= tL6 + 1.3 && t < tL6 + 2.6
            ? {type: 'sparkle', startFrame: Math.round((tL6 + 1.4) * fps), durationFrames: 30}
            : t >= tL4 + 1.9 && t < tL4 + 3.2
              ? {type: 'exclaim', startFrame: Math.round((tL4 + 2.0) * fps), durationFrames: 30}
              : undefined
        }
        z={20}
      />

      {META.showMascotJeli ? (
        <JeliMascot x={jeliX} y={jeliY} mood={candleLit ? 'flame' : showPhaseChange ? 'happy' : 'idle'} z={24} />
      ) : null}

      <Sparkle x={352} y={92} size="sm" color={candleLit ? PALETTE.gold : PALETTE.cyan} />
      <DubLayer sceneId="S03" />
      <SfxLayer cues={S03_SFX} />
    </SceneShell>
  );
};
