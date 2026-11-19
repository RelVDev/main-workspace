import React from 'react';
import {TransitionSeries, linearTiming} from '@remotion/transitions';
import {Easing} from 'remotion';
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
import {curtain, irisGlow, lightFlash, pixelDissolve, whipPan} from './transitions';

ensurePixelFonts();

export const Main: React.FC = () => {
  const smooth24 = linearTiming({
    durationInFrames: 24,
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <>
      <TransitionSeries>
        {/* S01A -> S01B: Direct clean cut so user can drop manual hand transition on the opening boundary */}
        <TransitionSeries.Sequence name="S01A Live Intro" durationInFrames={sceneDurationFrames('S01A')}>
          <S01A_LiveIntro />
        </TransitionSeries.Sequence>

        <TransitionSeries.Sequence name="S01B World Reveal" durationInFrames={sceneDurationFrames('S01B')}>
          <S01B_WorldReveal />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={irisGlow({cx: 24, cy: 36, color: '#4FD1C5'})}
          timing={smooth24}
        />

        <TransitionSeries.Sequence name="S02 Masalah" durationInFrames={sceneDurationFrames('S02')}>
          <S02_Masalah />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={pixelDissolve({cols: 32, rows: 18, seed: 'tr-s02'})}
          timing={smooth24}
        />

        <TransitionSeries.Sequence name="S03 Konsep Kimia" durationInFrames={sceneDurationFrames('S03')}>
          <S03_Konsep />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={whipPan({direction: 'left'})}
          timing={smooth24}
        />

        <TransitionSeries.Sequence name="S04 Penerapan & Analisis" durationInFrames={sceneDurationFrames('S04')}>
          <S04_Penerapan />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={curtain()}
          timing={smooth24}
        />

        <TransitionSeries.Sequence name="S05 Produk & Keselamatan" durationInFrames={sceneDurationFrames('S05')}>
          <S05_Produk />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={lightFlash({color: '#FFD97D'})}
          timing={smooth24}
        />

        <TransitionSeries.Sequence name="S06 Data & Bukti" durationInFrames={sceneDurationFrames('S06')}>
          <S06_DataBukti />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={whipPan({direction: 'left', page: true})}
          timing={smooth24}
        />

        <TransitionSeries.Sequence name="S07 Referensi" durationInFrames={sceneDurationFrames('S07')}>
          <S07_Referensi />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={pixelDissolve({cols: 32, rows: 18, seed: 'tr-s07'})}
          timing={smooth24}
        />

        <TransitionSeries.Sequence name="S08 Kontribusi" durationInFrames={sceneDurationFrames('S08')}>
          <S08_Kontribusi />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={lightFlash({color: '#FFB25A'})}
          timing={smooth24}
        />

        <TransitionSeries.Sequence name="S09 Penutup" durationInFrames={sceneDurationFrames('S09')}>
          <S09_Penutup />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <GlobalBgm />
    </>
  );
};
