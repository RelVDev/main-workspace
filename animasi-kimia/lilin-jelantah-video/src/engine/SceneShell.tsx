import React from 'react';
import {PixelStage} from './PixelStage';
import {Camera} from './Camera';
import {Parallax} from './Parallax';
import {Bloom, LightRays} from './Lighting';
import {Dust} from './Dust';
import {Grade, type GradePreset} from './Grade';
import {Vignette} from './Vignette';
import {Grain} from './Grain';
import {Letterbox} from './Letterbox';
import {ART_H, ART_W} from '../lib/pixel';
import {PALETTE} from '../data/palette';

export interface SceneShellProps {
  grade: GradePreset;
  camX?: number;
  camY?: number;
  zoom?: number;
  shake?: number;
  focus?: number;
  farBlur?: number;
  midBlur?: number;
  farBg?: React.ReactNode;
  midBg?: React.ReactNode;
  floor?: React.ReactNode;
  lights?: React.ReactNode;
  rays?: {color?: string; opacity?: number; angleDeg?: number} | false;
  bloom?: {intensity?: number; color?: string} | false;
  dust?: {count?: number; color?: string; seed?: string; opacity?: number} | false;
  vignette?: number;
  grain?: number;
  letterbox?: number;
  hud?: React.ReactNode;
  children: React.ReactNode;
}

export const SceneShell: React.FC<SceneShellProps> = ({
  grade,
  camX = ART_W / 2,
  camY = ART_H / 2,
  zoom = 1,
  shake = 0,
  focus = 1,
  farBlur = 6,
  midBlur = 2.2,
  farBg,
  midBg,
  floor,
  lights,
  rays = {opacity: 0.16},
  bloom = {intensity: 0.25},
  dust = {count: 38},
  vignette = 0.4,
  grain = 0.075,
  letterbox = 0,
  hud,
  children,
}) => {
  const camOffsetX = ART_W / 2 - camX;
  const camOffsetY = ART_H / 2 - camY;

  return (
    <PixelStage background={PALETTE.void} hud={hud}>
      <Camera x={camX} y={camY} zoom={zoom} shake={shake}>
        {/* 1. Far background (cinematic DoF blur) */}
        {farBg ? (
          <Parallax depth={0.2} blurPx={farBlur} focus={focus} camOffsetX={camOffsetX} camOffsetY={camOffsetY}>
            {farBg}
          </Parallax>
        ) : null}

        {/* 2. Midground (moderate DoF blur) */}
        {midBg ? (
          <Parallax depth={0.5} blurPx={midBlur} focus={focus} camOffsetX={camOffsetX} camOffsetY={camOffsetY}>
            {midBg}
          </Parallax>
        ) : null}

        {/* 3. Floor & grounding */}
        {floor}

        {/* 4. Sharp characters & main props */}
        <div style={{position: 'absolute', inset: 0}}>{children}</div>

        {/* 5. Volumetric god rays */}
        {rays ? <LightRays {...rays} /> : null}

        {/* 6. Local practical & key lights */}
        {lights}

        {/* 7. Soft filmic bloom */}
        {bloom ? <Bloom {...bloom} /> : null}

        {/* 8. Floating atmospheric dust & bokeh */}
        {dust ? <Dust {...dust} /> : null}
      </Camera>

      {/* 9-12. Screen-space post-processing: Grade -> Vignette -> Grain -> Letterbox */}
      <Grade preset={grade} />
      <Vignette strength={vignette} />
      {grain > 0 ? <Grain opacity={grain} /> : null}
      {letterbox > 0 ? <Letterbox amount={letterbox} /> : null}
    </PixelStage>
  );
};
