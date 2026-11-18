#!/usr/bin/env python3
"""
Procedural Chibi Pixel-Art Puppet Rig Builder (Jalur A - PLAN.md Section 5 & 6).
Generates 64x80 layered PNGs for all 9 group members + Jeli mascot,
strictly constrained to MASTER_PALETTE (32) + up to 6 per-character colors.
"""

import json
import os
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
CHARS_JSON = os.path.join(ROOT, "src", "data", "characters.json")
OUT_CHARS = os.path.join(ROOT, "public", "sprites", "characters")
W, H = 64, 80

MASTER_HEX = [
    "#1B1020", "#2A1530", "#3D1C42", "#4E1A3C", "#6B1F4A", "#8A2A4A", "#B23A5A", "#D94E52",
    "#5A3418", "#7A4A22", "#A06834", "#C98A5E", "#C46A2C", "#F08A3C", "#FFB25A", "#FFD97D",
    "#FFF3DC", "#F6D9C4", "#DFAC8B", "#F4A3B0", "#153243", "#1E4D5C", "#2C7A7B", "#4FD1C5",
    "#9FF3EE", "#2F6B4F", "#52A86D", "#4A5568", "#718096", "#CBD5E0", "#F7FAFC", "#100A14",
]


def hex_to_rgba(h: str, a: int = 255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


INK = hex_to_rgba("#1B1020")
CREAM = hex_to_rgba("#FFF3DC")
WHITE = hex_to_rgba("#F7FAFC")
BLUSH = hex_to_rgba("#F4A3B0")
MOUTH_IN = hex_to_rgba("#8A2A4A")
CYAN = hex_to_rgba("#9FF3EE")
TEAL = hex_to_rgba("#4FD1C5")
GOLD = hex_to_rgba("#FFD97D")
AMBER = hex_to_rgba("#F08A3C")
AMBER_HI = hex_to_rgba("#FFB25A")
AMBER_SH = hex_to_rgba("#C46A2C")
NAVY = hex_to_rgba("#153243")
SLATE = hex_to_rgba("#4A5568")
STEEL = hex_to_rgba("#718096")
SILVER = hex_to_rgba("#CBD5E0")
SKIN_L = hex_to_rgba("#F6D9C4")
SKIN_M = hex_to_rgba("#DFAC8B")
SKIN_SH = hex_to_rgba("#C98A5E")


def new_canvas(w=W, h=H):
    return np.zeros((h, w, 4), dtype=np.uint8)


def put_px(arr, x, y, col):
    h, w, _ = arr.shape
    if 0 <= x < w and 0 <= y < h:
        arr[y, x] = col


def fill_rect(arr, x0, y0, x1, y1, col):
    h, w, _ = arr.shape
    x0c, x1c = max(0, x0), min(w - 1, x1)
    y0c, y1c = max(0, y0), min(h - 1, y1)
    if x0c <= x1c and y0c <= y1c:
        arr[y0c : y1c + 1, x0c : x1c + 1] = col


def fill_ellipse(arr, cx, cy, rx, ry, col):
    h, w, _ = arr.shape
    for y in range(max(0, int(cy - ry - 1)), min(h, int(cy + ry + 2))):
        for x in range(max(0, int(cx - rx - 1)), min(w, int(cx + rx + 2))):
            if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.0:
                arr[y, x] = col


def add_selective_outline(arr, ink=INK):
    h, w, _ = arr.shape
    solid = arr[:, :, 3] > 128
    out = arr.copy()
    for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        shifted = np.zeros_like(solid)
        sy = slice(max(0, -dy), h - max(0, dy))
        ty = slice(max(0, dy), h - max(0, -dy))
        sx = slice(max(0, -dx), w - max(0, dx))
        tx = slice(max(0, dx), w - max(0, -dx))
        shifted[ty, tx] = solid[sy, sx]
        edge = shifted & (~solid)
        out[edge] = ink
    return out


def save_layer(path, arr):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    Image.fromarray(arr, mode="RGBA").save(path)


def build_shadow():
    arr = new_canvas()
    # 28x6 translucent ellipse centered at (32, 75)
    for y in range(72, 79):
        for x in range(17, 48):
            d = ((x - 32) / 14.0) ** 2 + ((y - 75) / 3.0) ** 2
            if d <= 1.0:
                arr[y, x] = (27, 16, 32, 130)
    return arr


def build_head(skin_tone: str):
    base = SKIN_L if skin_tone == "light" else SKIN_M
    shade = SKIN_M if skin_tone == "light" else SKIN_SH
    arr = new_canvas()
    # Neck
    fill_rect(arr, 29, 47, 34, 50, shade)
    # Ears
    fill_rect(arr, 17, 34, 19, 39, shade)
    fill_rect(arr, 44, 34, 46, 39, shade)
    put_px(arr, 18, 35, base)
    put_px(arr, 45, 35, base)
    # Rounded chibi head
    fill_ellipse(arr, 31.5, 35.5, 13.5, 12.2, base)
    # Taper bottom chin softly
    fill_rect(arr, 24, 46, 39, 47, base)
    # Jaw / right-side subtle shadow
    for y in range(26, 48):
        for x in range(18, 46):
            if arr[y, x, 3] > 0:
                if y >= 45 or (x >= 41 and y >= 33):
                    arr[y, x] = shade
    # Forehead highlight
    fill_rect(arr, 25, 25, 34, 26, CREAM if skin_tone == "light" else SKIN_L)
    return add_selective_outline(arr)


def build_blush():
    arr = new_canvas()
    fill_rect(arr, 21, 39, 23, 40, BLUSH)
    fill_rect(arr, 40, 39, 42, 40, BLUSH)
    return arr


def build_eyes(expr: str):
    arr = new_canvas()
    lx, rx = 22, 39
    if expr == "open":
        for ex in (lx, rx):
            fill_rect(arr, ex, 34, ex + 2, 37, INK)
            put_px(arr, ex, 34, WHITE)
            put_px(arr, ex + 1, 37, SLATE)
        # Brows
        fill_rect(arr, lx, 31, lx + 2, 31, INK)
        fill_rect(arr, rx, 31, rx + 2, 31, INK)
    elif expr == "blink":
        fill_rect(arr, lx, 36, lx + 3, 36, INK)
        fill_rect(arr, rx - 1, 36, rx + 2, 36, INK)
        fill_rect(arr, lx, 32, lx + 2, 32, INK)
        fill_rect(arr, rx, 32, rx + 2, 32, INK)
    elif expr == "happy":
        for ex in (lx, rx):
            put_px(arr, ex, 36, INK)
            put_px(arr, ex + 1, 35, INK)
            put_px(arr, ex + 2, 35, INK)
            put_px(arr, ex + 3, 36, INK)
            fill_rect(arr, ex, 31, ex + 2, 31, INK)
    elif expr == "surprised":
        for ex in (lx, rx):
            fill_rect(arr, ex, 33, ex + 2, 37, WHITE)
            fill_rect(arr, ex, 33, ex + 2, 33, INK)
            fill_rect(arr, ex, 37, ex + 2, 37, INK)
            put_px(arr, ex + 1, 35, INK)
            put_px(arr, ex, 34, CYAN)
        fill_rect(arr, lx, 29, lx + 2, 29, INK)
        fill_rect(arr, rx, 29, rx + 2, 29, INK)
    elif expr == "worried":
        for ex in (lx, rx):
            fill_rect(arr, ex, 35, ex + 2, 37, INK)
            put_px(arr, ex, 35, WHITE)
        put_px(arr, lx, 32, INK)
        put_px(arr, lx + 1, 31, INK)
        put_px(arr, lx + 2, 31, INK)
        put_px(arr, rx, 31, INK)
        put_px(arr, rx + 1, 31, INK)
        put_px(arr, rx + 2, 32, INK)
    elif expr == "determined":
        for ex in (lx, rx):
            fill_rect(arr, ex, 34, ex + 2, 37, INK)
            put_px(arr, ex, 34, WHITE)
            put_px(arr, ex + 2, 37, TEAL)
        put_px(arr, lx, 31, INK)
        put_px(arr, lx + 1, 31, INK)
        put_px(arr, lx + 2, 32, INK)
        put_px(arr, rx, 32, INK)
        put_px(arr, rx + 1, 31, INK)
        put_px(arr, rx + 2, 31, INK)
    elif expr == "sad":
        for ex in (lx, rx):
            fill_rect(arr, ex, 35, ex + 2, 37, INK)
            put_px(arr, ex, 35, WHITE)
            put_px(arr, ex + 1, 38, CYAN)
        put_px(arr, lx, 32, INK)
        put_px(arr, lx + 1, 31, INK)
        put_px(arr, rx + 1, 31, INK)
        put_px(arr, rx + 2, 32, INK)
    return arr


def build_mouth(kind: str):
    arr = new_canvas()
    if kind == "closed":
        fill_rect(arr, 30, 43, 33, 43, INK)
    elif kind == "half":
        fill_rect(arr, 30, 42, 33, 42, INK)
        fill_rect(arr, 30, 43, 33, 43, MOUTH_IN)
        fill_rect(arr, 31, 44, 32, 44, INK)
    elif kind == "open":
        fill_rect(arr, 29, 42, 34, 42, INK)
        fill_rect(arr, 30, 43, 33, 44, MOUTH_IN)
        put_px(arr, 31, 44, BLUSH)
        put_px(arr, 32, 44, BLUSH)
        fill_rect(arr, 30, 45, 33, 45, INK)
    elif kind == "smile":
        put_px(arr, 29, 42, INK)
        fill_rect(arr, 30, 43, 33, 43, INK)
        put_px(arr, 34, 42, INK)
    elif kind == "o":
        fill_rect(arr, 31, 42, 32, 42, INK)
        put_px(arr, 30, 43, INK)
        fill_rect(arr, 31, 43, 32, 43, MOUTH_IN)
        put_px(arr, 33, 43, INK)
        fill_rect(arr, 31, 44, 32, 44, INK)
    return arr


def build_glasses(gold_frame: bool):
    arr = new_canvas()
    frame = hex_to_rgba("#7A4A22") if gold_frame else INK
    glint = CREAM if gold_frame else CYAN
    # Left lens frame
    fill_rect(arr, 20, 33, 27, 33, frame)
    fill_rect(arr, 20, 39, 27, 39, frame)
    fill_rect(arr, 20, 33, 20, 39, frame)
    fill_rect(arr, 27, 33, 27, 39, frame)
    # Right lens frame
    fill_rect(arr, 36, 33, 43, 33, frame)
    fill_rect(arr, 36, 39, 43, 39, frame)
    fill_rect(arr, 36, 33, 36, 39, frame)
    fill_rect(arr, 43, 33, 43, 39, frame)
    # Bridge & temples
    fill_rect(arr, 28, 35, 35, 35, frame)
    fill_rect(arr, 18, 35, 19, 35, frame)
    fill_rect(arr, 44, 35, 45, 35, frame)
    # Subtle glass glint
    put_px(arr, 21, 34, glint)
    put_px(arr, 37, 34, glint)
    return arr


def build_legs(pose: str, ch):
    arr = new_canvas()
    pants = NAVY if ch["outfitStyle"] in ("sweater_pants", "jacket_pants", "labcoat", "overall") else SLATE
    shoe = INK
    sole = hex_to_rgba(ch["charColors"]["outfitAccent"])
    if pose == "idle":
        fill_rect(arr, 25, 63, 29, 71, pants)
        fill_rect(arr, 34, 63, 38, 71, pants)
        fill_rect(arr, 24, 71, 29, 74, shoe)
        fill_rect(arr, 34, 71, 39, 74, shoe)
        fill_rect(arr, 24, 74, 29, 74, sole)
        fill_rect(arr, 34, 74, 39, 74, sole)
    elif pose == "walk_a":
        fill_rect(arr, 23, 63, 27, 70, pants)
        fill_rect(arr, 35, 63, 39, 72, pants)
        fill_rect(arr, 22, 70, 27, 73, shoe)
        fill_rect(arr, 35, 72, 40, 75, shoe)
    elif pose == "walk_b":
        fill_rect(arr, 24, 63, 28, 72, pants)
        fill_rect(arr, 36, 63, 40, 70, pants)
        fill_rect(arr, 23, 72, 28, 75, shoe)
        fill_rect(arr, 36, 70, 41, 73, shoe)
    elif pose == "sit":
        fill_rect(arr, 24, 62, 29, 67, pants)
        fill_rect(arr, 34, 62, 39, 67, pants)
        fill_rect(arr, 23, 67, 28, 70, shoe)
        fill_rect(arr, 35, 67, 40, 70, shoe)
    return add_selective_outline(arr)


def build_body(ch):
    arr = new_canvas()
    base = hex_to_rgba(ch["charColors"]["outfitBase"])
    shade = hex_to_rgba(ch["charColors"]["outfitShade"])
    accent = hex_to_rgba(ch["charColors"]["outfitAccent"])
    style = ch["outfitStyle"]

    # Torso core
    fill_rect(arr, 24, 50, 39, 63, base)
    fill_rect(arr, 36, 50, 39, 63, shade)

    if style == "hoodie_skirt":
        # Hoodie pocket & yellow drawstrings + brown skirt
        fill_rect(arr, 27, 50, 36, 51, shade)
        fill_rect(arr, 29, 51, 29, 56, accent)
        fill_rect(arr, 34, 51, 34, 56, accent)
        fill_rect(arr, 27, 57, 36, 60, shade)
        fill_rect(arr, 23, 61, 40, 65, hex_to_rgba("#7A4A22"))
        fill_rect(arr, 35, 61, 40, 65, hex_to_rgba("#5A3418"))
    elif style == "labcoat":
        # White lab coat over teal shirt
        fill_rect(arr, 29, 50, 34, 59, accent)
        fill_rect(arr, 28, 51, 29, 54, SILVER)
        fill_rect(arr, 34, 51, 35, 54, SILVER)
        fill_rect(arr, 23, 60, 40, 65, base)
        fill_rect(arr, 36, 60, 40, 65, shade)
        fill_rect(arr, 31, 56, 32, 65, SILVER)
    elif style == "apron":
        # Cream shirt + amber apron
        fill_rect(arr, 24, 50, 39, 53, CREAM)
        fill_rect(arr, 26, 53, 37, 64, base)
        fill_rect(arr, 27, 50, 28, 53, shade)
        fill_rect(arr, 35, 50, 36, 53, shade)
        fill_rect(arr, 28, 57, 35, 61, shade)
    elif style == "sweater_pants":
        # Knit sweater with pastel collar/hem
        fill_rect(arr, 28, 50, 35, 52, accent)
        fill_rect(arr, 24, 60, 39, 62, accent)
        fill_rect(arr, 28, 54, 35, 55, shade)
    elif style == "cardigan_skirt":
        # Cardigan over shirt + dark skirt
        fill_rect(arr, 29, 50, 34, 60, WHITE)
        fill_rect(arr, 24, 50, 28, 60, base)
        fill_rect(arr, 35, 50, 39, 60, shade)
        put_px(arr, 30, 53, accent)
        put_px(arr, 30, 57, accent)
        fill_rect(arr, 23, 60, 40, 65, NAVY)
    elif style == "jacket_pants":
        # Bomber jacket with cream tee + golden zip
        fill_rect(arr, 29, 50, 34, 60, CREAM)
        fill_rect(arr, 24, 50, 28, 61, base)
        fill_rect(arr, 35, 50, 39, 61, shade)
        fill_rect(arr, 24, 61, 39, 62, accent)
    elif style == "vest_shirt":
        # Maroon vest over crisp white shirt + skirt
        fill_rect(arr, 24, 50, 39, 52, WHITE)
        fill_rect(arr, 26, 52, 37, 60, base)
        fill_rect(arr, 30, 50, 33, 53, WHITE)
        fill_rect(arr, 23, 61, 40, 65, SLATE)
    elif style == "overall":
        # Pale gold shirt + caramel overalls
        fill_rect(arr, 24, 50, 39, 54, accent)
        fill_rect(arr, 26, 54, 37, 63, base)
        fill_rect(arr, 26, 50, 27, 54, shade)
        fill_rect(arr, 36, 50, 37, 54, shade)
        put_px(arr, 27, 55, GOLD)
        put_px(arr, 36, 55, GOLD)

    return add_selective_outline(arr)


def build_arms(pose: str, ch, side: str):
    arr = new_canvas()
    sleeve = hex_to_rgba(ch["charColors"]["outfitBase"])
    sleeve_sh = hex_to_rgba(ch["charColors"]["outfitShade"])
    skin = SKIN_L if ch["skin"] == "light" else SKIN_M
    col = sleeve if side == "l" else sleeve_sh

    if side == "l":
        if pose == "down":
            fill_rect(arr, 19, 50, 22, 57, col)
            fill_rect(arr, 19, 58, 22, 60, skin)
        elif pose == "wave_a":
            fill_rect(arr, 16, 46, 22, 50, col)
            fill_rect(arr, 15, 42, 18, 46, skin)
        elif pose == "wave_b":
            fill_rect(arr, 15, 47, 22, 51, col)
            fill_rect(arr, 13, 44, 16, 47, skin)
        elif pose == "point":
            fill_rect(arr, 13, 50, 22, 53, col)
            fill_rect(arr, 10, 50, 13, 52, skin)
        elif pose == "hold":
            fill_rect(arr, 18, 51, 23, 55, col)
            fill_rect(arr, 21, 54, 25, 57, skin)
        elif pose == "up":
            fill_rect(arr, 15, 42, 19, 51, col)
            fill_rect(arr, 14, 37, 18, 42, skin)
        elif pose == "think":
            fill_rect(arr, 19, 50, 22, 56, col)
            fill_rect(arr, 19, 57, 22, 59, skin)
    else:
        if pose == "down":
            fill_rect(arr, 41, 50, 44, 57, col)
            fill_rect(arr, 41, 58, 44, 60, skin)
        elif pose == "wave_a":
            fill_rect(arr, 41, 46, 47, 50, col)
            fill_rect(arr, 45, 42, 48, 46, skin)
        elif pose == "wave_b":
            fill_rect(arr, 41, 47, 48, 51, col)
            fill_rect(arr, 47, 44, 50, 47, skin)
        elif pose == "point":
            fill_rect(arr, 41, 50, 50, 53, col)
            fill_rect(arr, 50, 50, 53, 52, skin)
        elif pose == "hold":
            fill_rect(arr, 40, 51, 45, 55, col)
            fill_rect(arr, 38, 54, 42, 57, skin)
        elif pose == "up":
            fill_rect(arr, 44, 42, 48, 51, col)
            fill_rect(arr, 45, 37, 49, 42, skin)
        elif pose == "think":
            fill_rect(arr, 41, 48, 45, 53, col)
            fill_rect(arr, 38, 45, 42, 48, skin)

    return add_selective_outline(arr)


def build_hair(ch):
    back = new_canvas()
    front = new_canvas()
    base = hex_to_rgba(ch["charColors"]["hairBase"])
    hi = hex_to_rgba(ch["charColors"]["hairHi"])
    sh = hex_to_rgba(ch["charColors"]["hairShade"])
    style = ch["hairStyle"]

    if style in ("hijab_draped", "hijab_neat"):
        # Hijab wraps cleanly around head and shoulders
        fill_ellipse(back, 31.5, 34, 16, 15, base)
        fill_rect(back, 17, 36, 46, 54, sh)
        if style == "hijab_draped":
            fill_rect(back, 21, 48, 43, 56, base)
        # Front hood framing face
        fill_ellipse(front, 31.5, 25, 14.5, 6.5, base)
        fill_rect(front, 16, 26, 20, 46, base)
        fill_rect(front, 43, 26, 47, 46, sh)
        fill_rect(front, 21, 45, 42, 51, base)
        fill_rect(front, 24, 22, 37, 24, hi)
        if style == "hijab_draped":
            fill_rect(front, 25, 49, 39, 54, sh)
            fill_rect(front, 27, 48, 36, 52, base)
        else:
            fill_rect(front, 25, 47, 38, 51, base)
        return add_selective_outline(back), add_selective_outline(front)

    # Common hair cap for non-hijab styles
    fill_ellipse(front, 31.5, 25.5, 14.5, 7.5, base)
    # Shine band across top of bangs
    fill_rect(front, 22, 23, 40, 24, hi)
    # Sideburns / framing locks
    fill_rect(front, 17, 25, 20, 40, base)
    fill_rect(front, 43, 25, 46, 40, sh)

    if style == "long_bangs":
        fill_rect(back, 16, 24, 47, 60, sh)
        fill_rect(back, 18, 25, 44, 58, base)
        fill_rect(front, 20, 26, 43, 31, base)
        # Bang gaps
        put_px(front, 26, 31, base)
        put_px(front, 31, 31, base)
        put_px(front, 37, 31, base)
        fill_rect(front, 16, 36, 19, 54, base)
        fill_rect(front, 44, 36, 47, 54, sh)
    elif style == "shoulder_wavy":
        fill_ellipse(back, 31.5, 40, 16.5, 15, sh)
        fill_rect(back, 16, 36, 47, 51, base)
        fill_rect(front, 20, 26, 34, 30, base)
        fill_rect(front, 35, 26, 43, 29, base)
        fill_rect(front, 16, 34, 19, 48, base)
        fill_rect(front, 44, 34, 47, 48, sh)
    elif style == "short_bob":
        fill_rect(back, 16, 26, 47, 47, sh)
        fill_rect(back, 18, 28, 45, 45, base)
        fill_rect(front, 21, 26, 42, 30, base)
        fill_rect(front, 16, 31, 20, 45, base)
        fill_rect(front, 43, 31, 47, 45, sh)
    elif style == "short_spiky":
        fill_rect(back, 18, 20, 45, 36, sh)
        fill_rect(front, 21, 25, 42, 29, base)
        # Spikes on crown
        for sx in (22, 27, 32, 37):
            fill_rect(front, sx, 17, sx + 2, 20, base)
            put_px(front, sx + 1, 16, hi)
        fill_rect(front, 17, 25, 19, 34, base)
        fill_rect(front, 44, 25, 46, 34, sh)
    elif style == "ponytail":
        # High ponytail swinging right-back
        fill_ellipse(back, 44, 28, 6, 12, sh)
        fill_rect(back, 41, 24, 48, 43, base)
        fill_rect(front, 21, 25, 36, 30, base)
        fill_rect(front, 37, 26, 43, 29, base)
        fill_rect(front, 17, 28, 19, 39, base)
        fill_rect(front, 44, 28, 46, 39, sh)
    elif style == "side_braid":
        fill_rect(back, 17, 25, 46, 48, sh)
        fill_rect(front, 20, 26, 43, 29, base)
        # Braided tail over left shoulder
        for by in range(40, 59, 4):
            fill_rect(front, 16, by, 20, by + 2, base if (by // 4) % 2 == 0 else hi)
            fill_rect(front, 17, by + 3, 19, by + 3, sh)
    elif style == "wavy_bob":
        fill_ellipse(back, 31.5, 38, 16, 12, sh)
        fill_rect(front, 20, 26, 42, 30, base)
        fill_rect(front, 15, 32, 19, 45, base)
        fill_rect(front, 44, 32, 48, 45, sh)

    return add_selective_outline(back), add_selective_outline(front)


def build_accessory(ch):
    arr = new_canvas()
    acc = ch["accessory"]
    accent = hex_to_rgba(ch["charColors"]["outfitAccent"])
    if acc == "hairclip_gold":
        fill_rect(arr, 38, 25, 42, 26, GOLD)
        put_px(arr, 42, 24, CREAM)
    elif acc == "lab_pen":
        fill_rect(arr, 35, 55, 36, 58, TEAL)
        put_px(arr, 35, 54, WHITE)
        fill_rect(arr, 34, 57, 37, 57, SILVER)
    elif acc == "badge_star":
        fill_rect(arr, 27, 55, 29, 57, GOLD)
        put_px(arr, 28, 56, CREAM)
    elif acc == "headband_ribbon":
        fill_rect(arr, 20, 20, 43, 21, BLUSH)
        fill_rect(arr, 37, 17, 41, 19, accent)
        put_px(arr, 39, 18, CREAM)
    elif acc == "brooch_leaf":
        fill_rect(arr, 31, 49, 32, 50, hex_to_rgba("#52A86D"))
        put_px(arr, 32, 49, CYAN)
    elif acc == "wrist_watch":
        fill_rect(arr, 19, 56, 22, 57, GOLD)
    elif acc == "hair_tie_red":
        fill_rect(arr, 40, 21, 43, 23, hex_to_rgba("#D94E52"))
    elif acc == "beret_star":
        fill_ellipse(arr, 29, 18, 10, 4.5, hex_to_rgba("#6B1F4A"))
        fill_rect(arr, 21, 20, 38, 21, hex_to_rgba("#4E1A3C"))
        put_px(arr, 25, 17, GOLD)
    return add_selective_outline(arr)


def build_rim(layers_for_silhouette):
    combined = np.zeros((H, W), dtype=bool)
    for lyr in layers_for_silhouette:
        combined |= lyr[:, :, 3] > 128

    rim = new_canvas()
    # Outer right/bottom-right rim highlight facing warm stage light (keep torso shoulder clear for posed arms)
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if combined[y, x] and (not combined[y, x + 1] or not combined[y + 1, x]):
                if x >= 38 and y <= 47:
                    rim[y, x] = CREAM
                elif y >= 61 and x >= 26:
                    rim[y, x] = CREAM
    return rim


def build_jeli():
    jeli_dir = os.path.join(OUT_CHARS, "jeli")
    os.makedirs(jeli_dir, exist_ok=True)
    for variant in ("idle_a", "idle_b", "happy", "worried", "flame"):
        arr = new_canvas(24, 24)
        dy = 0 if variant != "idle_b" else 1
        # Droplet silhouette
        fill_ellipse(arr, 12, 15 + dy, 6.5, 6.0, AMBER)
        for row, half_w in [(5, 1), (6, 1), (7, 2), (8, 3), (9, 4), (10, 5)]:
            fill_rect(arr, 12 - half_w, row + dy, 12 + half_w, row + dy, AMBER)
        # Shading & highlight
        fill_ellipse(arr, 13.5, 16.5 + dy, 4.0, 3.5, AMBER_SH)
        fill_rect(arr, 9, 11 + dy, 10, 14 + dy, AMBER_HI)
        put_px(arr, 10, 10 + dy, CREAM)
        if variant == "flame":
            fill_rect(arr, 11, 2, 13, 6, GOLD)
            put_px(arr, 12, 1, CREAM)
        arr = add_selective_outline(arr)
        # Cute eyes
        if variant == "happy":
            put_px(arr, 9, 14 + dy, INK)
            put_px(arr, 10, 13 + dy, INK)
            put_px(arr, 14, 13 + dy, INK)
            put_px(arr, 15, 14 + dy, INK)
        elif variant == "worried":
            fill_rect(arr, 9, 14 + dy, 10, 16 + dy, INK)
            fill_rect(arr, 14, 14 + dy, 15, 16 + dy, INK)
            put_px(arr, 9, 14 + dy, WHITE)
            put_px(arr, 14, 14 + dy, WHITE)
            fill_rect(arr, 11, 18 + dy, 13, 18 + dy, INK)
        else:
            fill_rect(arr, 9, 13 + dy, 10, 16 + dy, INK)
            fill_rect(arr, 14, 13 + dy, 15, 16 + dy, INK)
            put_px(arr, 9, 13 + dy, WHITE)
            put_px(arr, 14, 13 + dy, WHITE)
            put_px(arr, 11, 17 + dy, INK)
            put_px(arr, 12, 18 + dy, INK)
            put_px(arr, 13, 17 + dy, INK)
        save_layer(os.path.join(jeli_dir, f"{variant}.png"), arr)
    print("[OK] Built mascot Jeli (5 variants).")


def verify_palette(char_dir: str, allowed_hexes: set[str], char_id: str):
    allowed_rgb = {hex_to_rgba(h)[:3] for h in allowed_hexes}
    bad = set()
    for fname in os.listdir(char_dir):
        if not fname.endswith(".png") or fname == "shadow.png":
            continue
        arr = np.array(Image.open(os.path.join(char_dir, fname)).convert("RGBA"))
        mask = arr[:, :, 3] > 0
        pixels = arr[mask][:, :3]
        for rgb in np.unique(pixels, axis=0):
            tup = tuple(int(c) for c in rgb)
            if tup not in allowed_rgb:
                bad.add((fname, tup))
    if bad:
        raise RuntimeError(f"Palette violation for {char_id}: {bad}")


def main():
    with open(CHARS_JSON, "r", encoding="utf-8") as f:
        chars = json.load(f)

    master_set = {h.upper() for h in MASTER_HEX}

    for cid, ch in chars.items():
        cdir = os.path.join(OUT_CHARS, cid)
        os.makedirs(cdir, exist_ok=True)

        shadow = build_shadow()
        head = build_head(ch["skin"])
        blush = build_blush()
        body = build_body(ch)
        hair_back, hair_front = build_hair(ch)
        acc = build_accessory(ch)
        legs_idle = build_legs("idle", ch)

        save_layer(os.path.join(cdir, "shadow.png"), shadow)
        save_layer(os.path.join(cdir, "head.png"), head)
        save_layer(os.path.join(cdir, "blush.png"), blush)
        save_layer(os.path.join(cdir, "body.png"), body)
        save_layer(os.path.join(cdir, "hair_back.png"), hair_back)
        save_layer(os.path.join(cdir, "hair_front.png"), hair_front)
        save_layer(os.path.join(cdir, "accessory.png"), acc)

        for lpose in ("idle", "walk_a", "walk_b", "sit"):
            save_layer(os.path.join(cdir, f"legs_{lpose}.png"), build_legs(lpose, ch))

        for apose in ("down", "wave_a", "wave_b", "point", "hold", "up", "think"):
            save_layer(os.path.join(cdir, f"arm_l_{apose}.png"), build_arms(apose, ch, "l"))
            save_layer(os.path.join(cdir, f"arm_r_{apose}.png"), build_arms(apose, ch, "r"))

        for expr in ("open", "blink", "happy", "surprised", "worried", "determined", "sad"):
            save_layer(os.path.join(cdir, f"eyes_{expr}.png"), build_eyes(expr))

        for m in ("closed", "half", "open", "smile", "o"):
            save_layer(os.path.join(cdir, f"mouth_{m}.png"), build_mouth(m))

        if ch.get("glasses"):
            save_layer(os.path.join(cdir, "glasses.png"), build_glasses(ch["accessory"] == "glasses_gold"))

        rim = build_rim([head, body, legs_idle, hair_front, hair_back])
        save_layer(os.path.join(cdir, "rim.png"), rim)

        allowed = master_set | {v.upper() for v in ch["charColors"].values()}
        verify_palette(cdir, allowed, cid)
        print(f"[PALETTE OK] Built character '{cid}' (all rig layers).")

    build_jeli()
    print("[DONE] All 9 characters + Jeli built & palette-verified.")


if __name__ == "__main__":
    main()
