#!/usr/bin/env bash
# Usage: ./scripts/normalize-footage.sh <input.mp4> <output_name_without_ext>
set -euo pipefail
FFMPEG="${FFMPEG_BIN:-$(command -v ffmpeg || echo "./node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg")}"
mkdir -p public/footage
"$FFMPEG" -y -i "$1" \
  -r 30 \
  -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,format=yuv420p" \
  -c:v libx264 -crf 17 -preset medium -g 30 -keyint_min 30 \
  -c:a aac -b:a 192k -ar 48000 \
  "public/footage/$2.mp4"
