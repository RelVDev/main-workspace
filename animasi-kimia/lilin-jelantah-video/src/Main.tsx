import React from 'react';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {GlobalBgm} from './audio/Bgm';
import {sceneDurationFrames} from './data/timeline';
import {ensurePixelFonts} from './lib/fonts';
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
import {curtain, iris, lightFlash, pixelDissolve, slide} from './transitions';

ensurePixelFonts();

export const Main: React.FC = () => {
  const t15 = linearTiming({durationInFrames: 15});

  return (
    <>
      <TransitionSeries>
        {/* S01A -> S01B: Controlled hard cut (palm covers lens -> palm opens) */}
        <TransitionSeries.Sequence name="S01A Live Intro" durationInFrames={sceneDurationFrames('S01A')}>
          <S01A_LiveIntro />
        </TransitionSeries.Sequence>

        <TransitionSeries.Sequence name="S01B World Reveal" durationInFrames={sceneDurationFrames('S01B')}>
          <S01B_WorldReveal />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={iris({width: 1920, height: 1080})}
          timing={t15}
        />

        <TransitionSeries.Sequence name="S02 Masalah" durationInFrames={sceneDurationFrames('S02')}>
          <S02_Masalah />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={pixelDissolve({cols: 24, rows: 14, seed: 'tr-s02'})}
          timing={t15}
        />

        <TransitionSeries.Sequence name="S03 Konsep Kimia" durationInFrames={sceneDurationFrames('S03')}>
          <S03_Konsep />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({direction: 'from-right'})}
          timing={t15}
        />

        <TransitionSeries.Sequence name="S04 Penerapan & Analisis" durationInFrames={sceneDurationFrames('S04')}>
          <S04_Penerapan />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={curtain()}
          timing={t15}
        />

        <TransitionSeries.Sequence name="S05 Produk & Keselamatan" durationInFrames={sceneDurationFrames('S05')}>
          <S05_Produk />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={lightFlash()}
          timing={t15}
        />

        <TransitionSeries.Sequence name="S06 Data & Bukti" durationInFrames={sceneDurationFrames('S06')}>
          <S06_DataBukti />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({direction: 'from-right'})}
          timing={t15}
        />

        <TransitionSeries.Sequence name="S07 Referensi" durationInFrames={sceneDurationFrames('S07')}>
          <S07_Referensi />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={pixelDissolve({cols: 24, rows: 14, seed: 'tr-s07'})}
          timing={t15}
        />

        <TransitionSeries.Sequence name="S08 Kontribusi" durationInFrames={sceneDurationFrames('S08')}>
          <S08_Kontribusi />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={lightFlash({color: '#FFB25A'})}
          timing={t15}
        />

        <TransitionSeries.Sequence name="S09 Penutup" durationInFrames={sceneDurationFrames('S09')}>
          <S09_Penutup />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <GlobalBgm />
    </>
  );
};
