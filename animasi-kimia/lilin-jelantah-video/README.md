# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i --loglevel=error
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).

## Render di mesin lokal (upgrade sinematik HD-2D)

Visual v2 (light-map, bloom, depth of field, lantai 3D, voxel) lebih berat dari versi lama:
±1,5 dtk/frame di 4 core CPU → ±21.300 frame. Di Ryzen 7 + RTX 3050:

```bash
npm ci                         # sekali saja (Node 20/22)
npm run render:local:preview   # cek dulu, setengah resolusi
npm run render:local           # final 1080p → out/lilin-jelantah-final.mp4
```

- `--gl=angle` memakai GPU untuk efek blur/bloom. Jika error/hasil hitam, hapus flag itu (fallback CPU).
- RAM 16 GB: `--concurrency=6` aman. Jika kehabisan memori turunkan ke 4; jika longgar coba 8.
- Render bisa dipecah per bagian lalu digabung, mis. `npx remotion render LilinJelantah out/part1.mp4 --frames=0-10999 --gl=angle`
  dan `--frames=11000-21333` → gabung dengan `ffmpeg -f concat`.
- Cek satu frame cepat: `npx remotion still LilinJelantah out/cek.png --frame=3000`.
