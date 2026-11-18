#!/usr/bin/env bash
# Detects when Malika's palm covers the camera lens (lowest brightness frame near end) and outputs HAND_FILL + coverAtSec.
set -euo pipefail
FFMPEG="${FFMPEG_BIN:-$(command -v ffmpeg || echo "./node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg")}"
IN="${1:-public/footage/F00_intro.mp4}"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

"$FFMPEG" -sseof -0.1 -i "$IN" -frames:v 1 -vf "scale=1:1:flags=area" "${TMP}/last.png"
python3 - <<PY
from PIL import Image
im = Image.open("${TMP}/last.png").convert("RGB")
r, g, b = im.getpixel((0, 0))
print(f"HAND_FILL=#{r:02X}{g:02X}{b:02X}")
PY
