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
    -r 30 -vf "scale=trunc(iw/${FAC}/2)*2:trunc(ih/${FAC}/2)*2:flags=neighbor,scale=1920:1080:flags=neighbor,format=yuv420p" \
    -c:v libx264 -crf 14 -an "${TMP}/s${idx}.mp4"
done

"$FFMPEG" -y \
  -i "${TMP}/s0.mp4" -i "${TMP}/s1.mp4" -i "${TMP}/s2.mp4" -i "${TMP}/s3.mp4" -i "${TMP}/s4.mp4" \
  -filter_complex "[0:v][1:v][2:v][3:v][4:v]concat=n=5:v=1:a=0[v]" -map "[v]" \
  -c:v libx264 -crf 14 -pix_fmt yuv420p -an "public/footage/F00_ramp.mp4"
