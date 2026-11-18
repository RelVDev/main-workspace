#!/usr/bin/env bash
# Usage: ./scripts/make-pixel-ramp.sh [F00_intro]
set -euo pipefail
FFMPEG="${FFMPEG_BIN:-$(command -v ffmpeg || echo "./node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg")}"
FFPROBE="${FFPROBE_BIN:-$(command -v ffprobe || echo "./node_modules/@remotion/compositor-linux-x64-gnu/ffprobe")}"
NAME="${1:-F00_intro}"
IN="public/footage/${NAME}.mp4"
DUR=$("$FFPROBE" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$IN")
START=$(python3 -c "print(max(0.0, float('${DUR}') - 1.0))")
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

for idx in 0 1 2 3 4; do
  FAC=$((2 << idx))
  SEG_START=$(python3 -c "print(${START} + ${idx} * 0.2)")
  "$FFMPEG" -y -ss "$SEG_START" -t 0.2 -i "$IN" \
    -vf "fps=30,scale=trunc(iw/${FAC}/2)*2:trunc(ih/${FAC}/2)*2:flags=neighbor,scale=1920:1080:flags=neighbor" \
    -c:v libx264 -crf 14 -pix_fmt yuv420p -an "${TMP}/s${idx}.mp4"
  echo "file '${TMP}/s${idx}.mp4'" >> "${TMP}/list.txt"
done

"$FFMPEG" -y -f concat -safe 0 -i "${TMP}/list.txt" -c copy "public/footage/F00_ramp.mp4"
