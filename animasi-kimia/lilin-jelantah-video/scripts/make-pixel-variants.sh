#!/usr/bin/env bash
# Usage: ./scripts/make-pixel-variants.sh <name_without_ext>
set -euo pipefail
FFMPEG="${FFMPEG_BIN:-$(command -v ffmpeg || echo "./node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg")}"
mkdir -p public/footage/pix
"$FFMPEG" -y -i "public/footage/$1.mp4" \
  -vf "scale=320:180:flags=area,scale=1920:1080:flags=neighbor,eq=saturation=1.15:contrast=1.05" \
  -c:v libx264 -crf 16 -pix_fmt yuv420p -an "public/footage/pix/${1}_soft.mp4"
"$FFMPEG" -y -i "public/footage/$1.mp4" \
  -vf "fps=30,scale=240:135:flags=area,split[a][b];[a]palettegen=max_colors=32[p];[b][p]paletteuse=dither=bayer:bayer_scale=3,scale=1920:1080:flags=neighbor" \
  -c:v libx264 -crf 14 -pix_fmt yuv420p -an "public/footage/pix/${1}_hard.mp4"
