import React from 'react';
import {Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {PALETTE} from '../data/palette';
import {FONT_BODY, FONT_TITLE} from '../lib/fonts';
import {snap} from '../lib/pixel';

const SLOT_DESCRIPTIONS: Record<string, {title: string; step: string; accent: string}> = {
  F00: {
    title: 'FOOTAGE F00 · INTRO LIVE-ACTION',
    step: 'Perkenalan 9 anggota kelompok -> Malika menutup lensa',
    accent: PALETTE.amber,
  },
  F01: {
    title: 'FOOTAGE F01 · PENYARINGAN',
    step: 'Minyak jelantah disaring dari remah & kotoran padat',
    accent: PALETTE.teal,
  },
  F02: {
    title: 'FOOTAGE F02 · PELEBURAN BAHAN LILIN',
    step: 'Bahan lilin dipanaskan perlahan hingga meleleh',
    accent: PALETTE.gold,
  },
  F03: {
    title: 'FOOTAGE F03 · PENCAMPURAN & PEWANGI',
    step: 'Jelantah tersaring dicampur bahan lilin + pewangi',
    accent: PALETTE.amber,
  },
  F04: {
    title: 'FOOTAGE F04 · PENUANGAN KE WADAH',
    step: 'Campuran hangat dituang ke wadah bersumbu',
    accent: PALETTE.gold,
  },
  F05: {
    title: 'FOOTAGE F05 · PENDINGINAN (TIMELAPSE)',
    step: 'Suhu turun -> cairan memadat menjadi lilin (FISIKA)',
    accent: PALETTE.cyan,
  },
  F06: {
    title: 'FOOTAGE F06 · PRODUK LILIN JADI',
    step: 'Tampilan produk akhir lilin aromatis kelompok',
    accent: PALETTE.goldPale,
  },
  F07: {
    title: 'FOOTAGE F07 · UJI NYALA AMAN',
    step: 'Pengujian kestabilan nyala api dengan pengawasan',
    accent: PALETTE.amber,
  },
  F08: {
    title: 'FOOTAGE F08 · DOKUMENTASI TIM',
    step: 'Cuplikan behind-the-scenes kerja sama 9 anggota',
    accent: PALETTE.blush,
  },
};

export const FootageSlot: React.FC<{
  id: string;
  durationSec?: number;
  compact?: boolean;
}> = ({id, durationSec = 10, compact = false}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const info = SLOT_DESCRIPTIONS[id] ?? {
    title: `FOOTAGE ${id}`,
    step: 'Slot video praktikum asli',
    accent: PALETTE.amber,
  };

  const tSec = frame / fps;
  const pct = Math.min(1, tSec / Math.max(1, durationSec));
  const dropY = snap((frame * 2) % 36);
  const swirl = Math.sin(frame / 6) * 8;
  const flicker = frame % 9 < 3 ? 'a' : frame % 9 < 6 ? 'b' : 'c';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: PALETTE.plumDeep,
        backgroundImage: `radial-gradient(circle at 50% 42%, rgba(240,138,60,0.18) 0%, rgba(27,16,32,0.95) 75%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: compact ? 10 : 28,
        boxSizing: 'border-box',
      }}
    >
      {/* Subtle pixel grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.12,
          backgroundImage: `linear-gradient(${PALETTE.cream} 1px, transparent 1px), linear-gradient(90deg, ${PALETTE.cream} 1px, transparent 1px)`,
          backgroundSize: compact ? '12px 12px' : '24px 24px',
        }}
      />

      {/* Animated step illustration */}
      <div
        style={{
          position: 'relative',
          width: compact ? 52 : 220,
          height: compact ? 30 : 160,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: compact ? 3 : 16,
        }}
      >
        {id === 'F01' ? (
          <div style={{position: 'relative', width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <Img src={staticFile('sprites/props/beaker_funnel.png')} style={{width: compact ? 24 : 112, height: compact ? 28 : 124, imageRendering: 'pixelated'}} />
            <div style={{position: 'absolute', top: compact ? 10 + dropY * 0.3 : 44 + dropY, width: compact ? 2 : 8, height: compact ? 3 : 12, backgroundColor: PALETTE.gold}} />
          </div>
        ) : id === 'F02' || id === 'F03' ? (
          <div style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Img src={staticFile('sprites/props/pan_stove.png')} style={{width: compact ? 36 : 180, height: compact ? 24 : 120, imageRendering: 'pixelated'}} />
            <div
              style={{
                position: 'absolute',
                top: compact ? 6 : 26,
                transform: `translateX(${(compact ? swirl * 0.4 : swirl).toFixed(0)}px)`,
                width: compact ? 4 : 18,
                height: compact ? 4 : 18,
                backgroundColor: id === 'F03' ? PALETTE.teal : PALETTE.goldPale,
                border: `1px solid ${PALETTE.ink}`,
              }}
            />
          </div>
        ) : id === 'F04' || id === 'F05' || id === 'F06' ? (
          <div style={{position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <Img
              src={staticFile('sprites/props/candle_unlit.png')}
              style={{
                width: compact ? 24 : 120,
                height: compact ? 28 : 150,
                imageRendering: 'pixelated',
                filter: id === 'F05' ? 'hue-rotate(15deg) saturate(1.1)' : undefined,
              }}
            />
            {id === 'F06' ? (
              <Img
                src={staticFile('sprites/fx/sparkle_md.png')}
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: compact ? 10 : 42,
                  height: compact ? 10 : 42,
                  imageRendering: 'pixelated',
                  opacity: interpolate(frame % 24, [0, 12, 24], [0.4, 1, 0.4]),
                }}
              />
            ) : null}
          </div>
        ) : id === 'F07' ? (
          <div style={{position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <Img
              src={staticFile(`sprites/fx/flame_${flicker}.png`)}
              style={{width: compact ? 10 : 48, height: compact ? 14 : 72, imageRendering: 'pixelated', marginBottom: compact ? -3 : -8}}
            />
            <Img src={staticFile('sprites/props/candle_unlit.png')} style={{width: compact ? 20 : 96, height: compact ? 24 : 120, imageRendering: 'pixelated'}} />
          </div>
        ) : (
          <Img src={staticFile('sprites/props/bottle_gold.png')} style={{width: compact ? 18 : 96, height: compact ? 26 : 144, imageRendering: 'pixelated'}} />
        )}
      </div>

      {/* Slot label */}
      <div
        style={{
          fontFamily: FONT_TITLE,
          fontSize: compact ? 5 : 18,
          color: info.accent,
          textAlign: 'center',
          textShadow: compact ? `1px 1px 0 ${PALETTE.ink}` : `2px 2px 0 ${PALETTE.ink}`,
          marginBottom: compact ? 2 : 8,
          lineHeight: 1.25,
          maxWidth: '94%',
        }}
      >
        {compact ? id : info.title}
      </div>
      {!compact ? (
        <div
          style={{
            fontFamily: FONT_BODY,
            fontSize: 24,
            color: PALETTE.cream,
            textAlign: 'center',
            maxWidth: '85%',
            marginBottom: 14,
          }}
        >
          {info.step}
        </div>
      ) : null}

      {/* Progress timer bar */}
      <div
        style={{
          width: compact ? '78%' : '65%',
          height: compact ? 3 : 12,
          backgroundColor: PALETTE.ink,
          border: compact ? `1px solid ${PALETTE.cream}` : `2px solid ${PALETTE.cream}`,
          position: 'relative',
        }}
      >
        <div
          style={{
            width: `${(pct * 100).toFixed(1)}%`,
            height: '100%',
            backgroundColor: info.accent,
          }}
        />
      </div>
      <div
        style={{
          marginTop: compact ? 2 : 8,
          fontFamily: FONT_TITLE,
          fontSize: compact ? 4 : 12,
          color: PALETTE.silver,
        }}
      >
        {compact ? `${tSec.toFixed(0)}s/${durationSec.toFixed(0)}s` : `REC ${tSec.toFixed(1)}s / ${durationSec.toFixed(1)}s · SLOT VIDEO ASLI`}
      </div>
    </div>
  );
};
