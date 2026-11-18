#!/usr/bin/env python3
"""Render lineup sheet out/lineup.png of all 9 characters + Jeli + expressions/mouths."""

import json
import os
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
CHARS_DIR = os.path.join(ROOT, "public", "sprites", "characters")
OUT_PNG = os.path.join(ROOT, "out", "lineup.png")


def compose_char(cid: str, expr="open", mouth="smile", arm_l="down", arm_r="down", legs="idle", glasses=False):
    cdir = os.path.join(CHARS_DIR, cid)
    canvas = Image.new("RGBA", (64, 80), (0, 0, 0, 0))
    order = [
        "shadow.png",
        "hair_back.png",
        f"legs_{legs}.png",
        f"arm_l_{arm_l}.png",
        "body.png",
        "head.png",
        "blush.png",
        f"eyes_{expr}.png",
        f"mouth_{mouth}.png",
        "hair_front.png",
    ]
    if glasses and os.path.exists(os.path.join(cdir, "glasses.png")):
        order.append("glasses.png")
    order.extend(["accessory.png", "rim.png", f"arm_r_{arm_r}.png"])

    for fname in order:
        fpath = os.path.join(cdir, fname)
        if os.path.exists(fpath):
            layer = Image.open(fpath).convert("RGBA")
            canvas = Image.alpha_composite(canvas, layer)
    return canvas


def main():
    with open(os.path.join(ROOT, "src", "data", "characters.json"), "r", encoding="utf-8") as f:
        chars = json.load(f)

    scale = 3
    cols = len(chars)
    # 3 rows: Row 0 = idle+smile, Row 1 = wave+happy+open, Row 2 = worried/point
    sheet_w = cols * 64 * scale + 40
    sheet_h = 3 * 80 * scale + 80
    sheet = Image.new("RGBA", (sheet_w, sheet_h), (42, 21, 48, 255))
    draw = ImageDraw.Draw(sheet)

    for i, (cid, ch) in enumerate(chars.items()):
        x = 20 + i * 64 * scale
        r0 = compose_char(cid, "open", "smile", "down", "down", "idle", ch.get("glasses", False))
        r1 = compose_char(cid, "happy", "open", "wave_a", "point", "walk_a", ch.get("glasses", False))
        r2 = compose_char(cid, "determined", "o", "think", "up", "idle", ch.get("glasses", False))

        sheet.paste(r0.resize((64 * scale, 80 * scale), Image.Resampling.NEAREST), (x, 20), r0.resize((64 * scale, 80 * scale), Image.Resampling.NEAREST))
        sheet.paste(r1.resize((64 * scale, 80 * scale), Image.Resampling.NEAREST), (x, 20 + 80 * scale), r1.resize((64 * scale, 80 * scale), Image.Resampling.NEAREST))
        sheet.paste(r2.resize((64 * scale, 80 * scale), Image.Resampling.NEAREST), (x, 20 + 160 * scale), r2.resize((64 * scale, 80 * scale), Image.Resampling.NEAREST))
        draw.text((x + 48, sheet_h - 32), ch["displayName"], fill=(255, 243, 220, 255))

    os.makedirs(os.path.dirname(OUT_PNG), exist_ok=True)
    sheet.save(OUT_PNG)
    print(f"Saved {OUT_PNG}")


if __name__ == "__main__":
    main()
