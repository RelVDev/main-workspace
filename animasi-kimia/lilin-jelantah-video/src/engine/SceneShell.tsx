import React, {useId} from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {PixelStage} from './PixelStage';
import {
  BASE_OVERSCAN,
  CameraLayer,
  DepthPlane,
  clampCam,
  composeCam,
  handheldOffset,
  introOffset,
  outroOffset,
  shakeOffset,
  type IntroMove,
  type OutroMove,
} from './Camera';
import {Dust} from './Dust';
import {Grade, gradeFilter, resolveGrade, type GradePreset} from './Grade';
import {Vignette} from './Vignette';
import {Grain} from './Grain';
import {Letterbox} from './Letterbox';
import {Fog, GodRays, NearBokeh, ScreenBloom} from './Atmosphere';
import {DEFAULT_LIGHT, LightMap, SceneLightProvider, type MapLight, type SceneLightInfo} from './SceneLight';
import {PerspectiveFloor} from './PerspectiveFloor';
import {ART_H, ART_W} from '../lib/pixel';
import {PALETTE} from '../data/palette';

export interface SceneShellProps {
  grade: GradePreset;
  /** Optional second grade + blend amount (0..1) for in-scene look changes. */
  gradeTo?: GradePreset;
  gradeMix?: number;
  camX?: number;
  camY?: number;
  zoom?: number;
  shake?: number;
  /** 0 = background in focus … 1 = subject in focus (background blurred). */
  focus?: number;
  farBlur?: number;
  midBlur?: number;
  farBg?: React.ReactNode;
  midBg?: React.ReactNode;
  floor?: React.ReactNode;
  /** HD-2D perspective floor (rendered in the subject plane under props/characters). */
  floor3d?: Omit<React.ComponentProps<typeof PerspectiveFloor>, 'camX'> | false;
  /** Additive practical lights / glows (lamps, screens, flames) — drawn above the subject. */
  lights?: React.ReactNode;
  /** Multiply light-map: ambient darkness + light pools (real contrast & shadows). */
  lightMap?: {ambient?: string; darkness?: number; lights: MapLight[]} | false;
  /** Key light for character cast shadows & rim tint. */
  keyLight?: Partial<SceneLightInfo>;
  rays?: {color?: string; opacity?: number; angleDeg?: number; x?: number; y?: number; spread?: number; length?: number} | false;
  bloom?: {intensity?: number; color?: string; radius?: number} | false;
  dust?: {count?: number; color?: string; seed?: string; opacity?: number} | false;
  fog?: {y?: number; height?: number; color?: string; opacity?: number} | false;
  nearBokeh?: {count?: number; color?: string; opacity?: number} | false;
  /** Out-of-focus foreground elements (nearer than the subject, extra parallax). */
  foreground?: React.ReactNode;
  foregroundBlur?: number;
  intro?: IntroMove;
  outro?: OutroMove;
  /** 0..2 amount of organic camera drift. */
  handheld?: number;
  vignette?: number;
  grain?: number;
  letterbox?: number;
  hud?: React.ReactNode;
  children: React.ReactNode;
}

export const SceneShell: React.FC<SceneShellProps> = ({
  grade,
  gradeTo,
  gradeMix = 0,
  camX = ART_W / 2,
  camY = ART_H / 2,
  zoom = 1,
  shake = 0,
  focus = 1,
  farBlur = 2.2,
  midBlur = 0.9,
  farBg,
  midBg,
  floor,
  floor3d = false,
  lights,
  lightMap = false,
  keyLight,
  rays = {opacity: 0.16},
  bloom = {intensity: 0.25},
  dust = {count: 38},
  fog = false,
  nearBokeh = {count: 6},
  foreground,
  foregroundBlur = 3,
  intro = 'crane',
  outro = 'push',
  handheld = 1,
  vignette = 0.4,
  grain = 0.075,
  letterbox = 0,
  hud,
  children,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const t = frame / fps;
  const tToEnd = (durationInFrames - frame) / fps;

  // ── Lens: scene camera ⊕ entrance ⊕ exit ⊕ operator drift ⊕ impact shake, then clamp.
  const cam = clampCam(
    composeCam(
      {x: camX, y: camY, zoom: Math.max(1, zoom) * BASE_OVERSCAN},
      introOffset(intro, t),
      outroOffset(outro, tToEnd),
      handheldOffset(frame, handheld),
      shakeOffset(frame, shake),
    ),
  );

  // Depth of field: the tighter the lens, the softer the background (cinematic tele look).
  const teleDof = 1 + Math.max(0, cam.zoom - 1.1) * 0.9;
  const dofK = (0.3 + 0.7 * focus) * teleDof;
  const g = resolveGrade(grade, gradeTo, gradeMix);
  const rimFilterId = `rim-${useId().replace(/:/g, '')}`;
  const light: SceneLightInfo = {...DEFAULT_LIGHT, ...keyLight, rimFilterId};

  const raysCfg = rays
    ? {
        x: rays.x ?? light.keyX,
        y: rays.y ?? Math.max(-10, light.keyY - 20),
        color: rays.color ?? PALETTE.goldPale,
        opacity: (rays.opacity ?? 0.16) * 1.4,
        angle: 90 + ((rays.angleDeg ?? 20) - 20) * 0.6,
        spread: rays.spread ?? 46,
        length: rays.length ?? 300,
      }
    : null;

  return (
    <PixelStage background={PALETTE.void} hud={hud}>
      <SceneLightProvider value={light}>
        {/* Lit world (graded with a filter so blend layers inside stay in one group) */}
        <div style={{position: 'absolute', left: 0, top: 0, width: ART_W, height: ART_H, filter: gradeFilter(g), overflow: 'hidden'}}>
          {/* One camera group; far/mid/foreground planes are nested with relative transforms */}
          <CameraLayer cam={cam} depth={1}>
            {/* 1. Far plane */}
            {farBg ? (
              <DepthPlane cam={cam} depth={0.35} bleed={1.1} blur={farBlur * dofK}>
                {farBg}
              </DepthPlane>
            ) : null}
            {/* 2. Mid plane */}
            {midBg ? (
              <DepthPlane cam={cam} depth={0.7} bleed={1.04} blur={midBlur * dofK}>
                {midBg}
              </DepthPlane>
            ) : null}
            {/* 3-4. Subject plane: floor, props, characters (always sharp) */}
            {floor3d ? <PerspectiveFloor {...floor3d} camX={cam.x} /> : null}
            {floor}
            <div style={{position: 'absolute', inset: 0}}>{children}</div>
            {fog ? <Fog {...fog} /> : null}
            {/* 5. Volumetric rays */}
            {raysCfg ? (
              <GodRays
                x={raysCfg.x}
                y={raysCfg.y}
                color={raysCfg.color}
                opacity={raysCfg.opacity}
                angle={raysCfg.angle}
                spread={raysCfg.spread}
                length={raysCfg.length}
              />
            ) : null}
            {/* Light-map (multiply): pools of light, everything else falls into tinted shadow */}
            {lightMap ? (
              <LightMap ambient={lightMap.ambient ?? PALETTE.plumDeep} darkness={lightMap.darkness ?? 0.55} lights={lightMap.lights} />
            ) : null}
            {/* 6. Practical lights (additive) */}
            {lights}
            {/* 8. Dust motes in the air */}
            {dust ? <Dust {...dust} /> : null}
            {/* Foreground (nearest plane, defocused) */}
            {foreground ? (
              <DepthPlane cam={cam} depth={1.35} blur={foregroundBlur}>
                {foreground}
              </DepthPlane>
            ) : null}
          </CameraLayer>
          {nearBokeh ? <NearBokeh {...nearBokeh} /> : null}

          {/* 7. Bloom — real highlight glow sampled from the lit world */}
          {bloom ? <ScreenBloom intensity={(bloom.intensity ?? 0.25) * 1.25} radius={bloom.radius ?? 3.5} /> : null}
        </div>

        {/* 9-12. Grade → vignette → grain → letterbox */}
        <Grade spec={g} />
        <Vignette strength={vignette} />
        {grain > 0 ? <Grain opacity={grain} /> : null}
        {letterbox > 0 ? <Letterbox amount={letterbox} /> : null}
        {/* shared SVG filter used by characters to tint their rim light */}
        <svg width="0" height="0" style={{position: 'absolute'}} aria-hidden>
          <filter id={rimFilterId} colorInterpolationFilters="sRGB">
            <feFlood floodColor={light.rimColor} />
            <feComposite in2="SourceAlpha" operator="in" />
          </filter>
        </svg>
      </SceneLightProvider>
    </PixelStage>
  );
};
