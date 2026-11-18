import React from 'react';
import {Composition, Folder, Still} from 'remotion';
import {computeTotalFrames, FPS, sceneDurationFrames} from './data/timeline';
import {ensurePixelFonts} from './lib/fonts';
import {Main} from './Main';
import {S01A_LiveIntro} from './scenes/S01A_LiveIntro';
import {S01B_WorldReveal} from './scenes/S01B_WorldReveal';
import {S02_Masalah} from './scenes/S02_Masalah';
import {S03_Konsep} from './scenes/S03_Konsep';
import {S04_Penerapan} from './scenes/S04_Penerapan';
import {S05_Produk} from './scenes/S05_Produk';
import {S06_DataBukti} from './scenes/S06_DataBukti';
import {S07_Referensi} from './scenes/S07_Referensi';
import {S08_Kontribusi} from './scenes/S08_Kontribusi';
import {S09_Penutup} from './scenes/S09_Penutup';

ensurePixelFonts();

const TOTAL_FRAMES = computeTotalFrames();

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LilinJelantah"
        component={Main}
        width={1920}
        height={1080}
        fps={FPS}
        durationInFrames={TOTAL_FRAMES}
        calculateMetadata={async () => ({
          durationInFrames: computeTotalFrames(),
        })}
      />

      <Still
        id="StyleFrameHero"
        component={S01B_WorldReveal}
        width={1920}
        height={1080}
      />

      <Folder name="Scenes">
        <Composition id="S01A-LiveIntro" component={S01A_LiveIntro} width={1920} height={1080} fps={FPS} durationInFrames={sceneDurationFrames('S01A')} />
        <Composition id="S01B-WorldReveal" component={S01B_WorldReveal} width={1920} height={1080} fps={FPS} durationInFrames={sceneDurationFrames('S01B')} />
        <Composition id="S02-Masalah" component={S02_Masalah} width={1920} height={1080} fps={FPS} durationInFrames={sceneDurationFrames('S02')} />
        <Composition id="S03-Konsep" component={S03_Konsep} width={1920} height={1080} fps={FPS} durationInFrames={sceneDurationFrames('S03')} />
        <Composition id="S04-Penerapan" component={S04_Penerapan} width={1920} height={1080} fps={FPS} durationInFrames={sceneDurationFrames('S04')} />
        <Composition id="S05-Produk" component={S05_Produk} width={1920} height={1080} fps={FPS} durationInFrames={sceneDurationFrames('S05')} />
        <Composition id="S06-DataBukti" component={S06_DataBukti} width={1920} height={1080} fps={FPS} durationInFrames={sceneDurationFrames('S06')} />
        <Composition id="S07-Referensi" component={S07_Referensi} width={1920} height={1080} fps={FPS} durationInFrames={sceneDurationFrames('S07')} />
        <Composition id="S08-Kontribusi" component={S08_Kontribusi} width={1920} height={1080} fps={FPS} durationInFrames={sceneDurationFrames('S08')} />
        <Composition id="S09-Penutup" component={S09_Penutup} width={1920} height={1080} fps={FPS} durationInFrames={sceneDurationFrames('S09')} />
      </Folder>
    </>
  );
};
