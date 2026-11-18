#!/usr/bin/env python3
"""Quantize any image to the 32-color master palette with optional Bayer dither & 1px outline."""

import argparse
import numpy as np
from PIL import Image

BAYER_4X4 = (
    np.array(
        [
            [0, 8, 2, 10],
            [12, 4, 14, 6],
            [3, 11, 1, 9],
            [15, 7, 13, 5],
        ],
        dtype=np.float32,
    )
    / 16.0
    - 0.5
)


def parse_gpl(gpl_path: str):
    colors = []
    with open(gpl_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith(("GIMP", "Name:", "Columns:", "#")):
                continue
            parts = line.split()
            if len(parts) >= 3 and parts[0].isdigit():
                colors.append((int(parts[0]), int(parts[1]), int(parts[2])))
    return np.array(colors, dtype=np.float32)


def add_outline(rgba: np.ndarray, ink=(27, 16, 32, 255)) -> np.ndarray:
    h, w, _ = rgba.shape
    alpha = rgba[:, :, 3] > 128
    out = rgba.copy()
    for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        shifted = np.zeros_like(alpha)
        src_y = slice(max(0, -dy), h - max(0, dy))
        dst_y = slice(max(0, dy), h - max(0, -dy))
        src_x = slice(max(0, -dx), w - max(0, dx))
        dst_x = slice(max(0, dx), w - max(0, -dx))
        shifted[dst_y, dst_x] = alpha[src_y, src_x]
        edge = shifted & (~alpha)
        out[edge] = ink
    return out


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input")
    parser.add_argument("output")
    parser.add_argument("--size", default="64x80")
    parser.add_argument("--palette", default="tools/palette.gpl")
    parser.add_argument("--dither", choices=["none", "bayer"], default="none")
    parser.add_argument("--outline", action="store_true")
    args = parser.parse_args()

    w, h = map(int, args.size.lower().split("x"))
    pal = parse_gpl(args.palette)

    img = Image.open(args.input).convert("RGBA")
    img = img.resize((w, h), Image.Resampling.NEAREST)
    arr = np.array(img, dtype=np.float32)
    rgb = arr[:, :, :3]
    alpha = arr[:, :, 3]

    if args.dither == "bayer":
        tiled = np.tile(BAYER_4X4, (h // 4 + 1, w // 4 + 1))[:h, :w]
        rgb = np.clip(rgb + tiled[:, :, None] * 28.0, 0, 255)

    diffs = rgb[:, :, None, :] - pal[None, None, :, :]
    dists = np.sum(diffs * diffs, axis=-1)
    idx = np.argmin(dists, axis=-1)
    mapped_rgb = pal[idx].astype(np.uint8)
    mapped_alpha = np.where(alpha > 128, 255, 0).astype(np.uint8)
    out = np.dstack([mapped_rgb, mapped_alpha])

    if args.outline:
        ink = (*pal[0].astype(np.uint8), 255)
        out = add_outline(out, ink=ink)

    Image.fromarray(out, mode="RGBA").save(args.output)
    print(f"Saved quantized sprite to {args.output}")


if __name__ == "__main__":
    main()
