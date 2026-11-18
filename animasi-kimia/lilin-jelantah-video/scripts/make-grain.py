#!/usr/bin/env python3
"""Generate 4 deterministic film grain PNG frames (480x270) for PixelStage."""

import os
import numpy as np
from PIL import Image

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "sprites", "fx")
W, H = 480, 270


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for i in range(4):
        rng = np.random.default_rng(seed=1000 + i * 73)
        # Subtle warm-neutral film grain centered around 128
        noise = rng.normal(loc=128.0, scale=28.0, size=(H, W)).clip(0, 255).astype(np.uint8)
        alpha = rng.integers(low=18, high=52, size=(H, W), dtype=np.uint8)
        rgba = np.stack([noise, noise, noise, alpha], axis=-1)
        img = Image.fromarray(rgba, mode="RGBA")
        out_path = os.path.join(OUT_DIR, f"grain_{i}.png")
        img.save(out_path)
        print(f"Saved {out_path}")


if __name__ == "__main__":
    main()
