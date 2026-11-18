#!/usr/bin/env python3
"""
Builds pixel-art props, FX sprites (sparkles, flames, emotes, giant_palm/fingers),
and UI icons strictly using MASTER_PALETTE (32 colors).
"""

import os
import numpy as np
from PIL import Image
from build_all import (
    INK, CREAM, WHITE, GOLD, AMBER, AMBER_HI, AMBER_SH, TEAL, CYAN, NAVY,
    SLATE, STEEL, SILVER, BLUSH, new_canvas, put_px, fill_rect, fill_ellipse,
    add_selective_outline, save_layer, hex_to_rgba, MASTER_HEX,
)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PROPS_DIR = os.path.join(ROOT, "public", "sprites", "props")
FX_DIR = os.path.join(ROOT, "public", "sprites", "fx")
UI_DIR = os.path.join(ROOT, "public", "sprites", "ui")

RED = hex_to_rgba("#D94E52")
GREEN = hex_to_rgba("#52A86D")
GREEN_DK = hex_to_rgba("#2F6B4F")
WOOD_D = hex_to_rgba("#5A3418")
WOOD_M = hex_to_rgba("#7A4A22")
WOOD_L = hex_to_rgba("#A06834")
TAN = hex_to_rgba("#C98A5E")
BURG = hex_to_rgba("#6B1F4A")
PLUM = hex_to_rgba("#2A1530")
TEAL_M = hex_to_rgba("#2C7A7B")
TEAL_D = hex_to_rgba("#1E4D5C")


def build_sparkles():
    # Small 9x9, Medium 15x15, Large 21x21 4-point star sparkles
    for name, size, col_outer, col_core in [
        ("sparkle_sm", 9, GOLD, CREAM),
        ("sparkle_md", 15, TEAL, CYAN),
        ("sparkle_lg", 21, AMBER_HI, WHITE),
    ]:
        arr = new_canvas(size, size)
        c = size // 2
        arm = c
        for d in range(-arm, arm + 1):
            t = max(0, 1 - abs(d) / (arm + 0.5))
            thick = 1 if abs(d) < arm // 2 else 0
            for o in range(-thick, thick + 1):
                put_px(arr, c + d, c + o, col_outer)
                put_px(arr, c + o, c + d, col_outer)
        fill_rect(arr, c - 1, c - 1, c + 1, c + 1, col_core)
        put_px(arr, c, c, WHITE)
        save_layer(os.path.join(FX_DIR, f"{name}.png"), arr)


def build_flames():
    # 3 animated 16x24 pixel candle flames
    offsets = [(0, 0), (-1, -1), (1, 0)]
    heights = [12, 14, 11]
    for idx, (dx, dy) in enumerate(offsets):
        arr = new_canvas(16, 24)
        h = heights[idx]
        fill_ellipse(arr, 8, 17, 4.2, 4.5, AMBER)
        fill_ellipse(arr, 8 + dx, 14 + dy, 2.8, h / 2.2, AMBER_HI)
        fill_ellipse(arr, 8 + dx, 16 + dy, 2.0, 3.0, GOLD)
        fill_rect(arr, 7 + dx, 16, 8 + dx, 19, CREAM)
        put_px(arr, 8 + dx, 8 + dy, GOLD)
        save_layer(os.path.join(FX_DIR, f"flame_{chr(97 + idx)}.png"), arr)


def build_emotes():
    emotes = ["exclaim", "question", "heart", "sparkle", "idea"]
    for em in emotes:
        arr = new_canvas(16, 16)
        # Bubble backdrop
        fill_rect(arr, 2, 1, 13, 12, CREAM)
        fill_rect(arr, 1, 2, 14, 11, CREAM)
        fill_rect(arr, 6, 13, 8, 14, CREAM)
        arr = add_selective_outline(arr, INK)
        if em == "exclaim":
            fill_rect(arr, 7, 3, 8, 8, RED)
            fill_rect(arr, 7, 10, 8, 11, RED)
        elif em == "question":
            fill_rect(arr, 6, 3, 9, 4, TEAL_M)
            fill_rect(arr, 8, 5, 9, 6, TEAL_M)
            fill_rect(arr, 7, 7, 8, 8, TEAL_M)
            fill_rect(arr, 7, 10, 8, 11, TEAL_M)
        elif em == "heart":
            fill_rect(arr, 4, 4, 6, 6, RED)
            fill_rect(arr, 9, 4, 11, 6, RED)
            fill_rect(arr, 5, 5, 10, 8, RED)
            fill_rect(arr, 6, 9, 9, 9, RED)
            fill_rect(arr, 7, 10, 8, 10, RED)
            put_px(arr, 5, 4, BLUSH)
        elif em == "sparkle":
            fill_rect(arr, 7, 3, 8, 10, AMBER)
            fill_rect(arr, 4, 6, 11, 7, AMBER)
            fill_rect(arr, 7, 6, 8, 7, GOLD)
        elif em == "idea":
            fill_ellipse(arr, 7.5, 6, 3.2, 3.2, GOLD)
            fill_rect(arr, 6, 9, 9, 10, STEEL)
            put_px(arr, 7, 5, WHITE)
        save_layer(os.path.join(FX_DIR, f"emote_{em}.png"), arr)


def build_giant_hand():
    """
    480x270 giant pixel hand sprites matching HAND_FILL tone (#C98A5E + shading).
    Split into palm + fingers_left + fingers_right for Stage 3 curtain reveal.
    """
    palm = new_canvas(480, 270)
    skin_base = TAN
    skin_mid = AMBER_SH
    skin_hi = hex_to_rgba("#DFAC8B")
    skin_dark = WOOD_M

    # Full-screen palm core with subtle rounded knuckles & pixel dither shading
    fill_rect(palm, 0, 0, 479, 269, skin_base)
    for y in range(0, 270, 4):
        for x in range(0, 480, 4):
            # Subtle warm vignette toward corners so it feels organic
            dx = (x - 240) / 240.0
            dy = (y - 160) / 160.0
            dist = dx * dx + dy * dy
            if dist > 0.85:
                fill_rect(palm, x, y, x + 3, y + 3, skin_dark)
            elif dist > 0.55 and ((x + y) // 4) % 2 == 0:
                fill_rect(palm, x, y, x + 3, y + 3, skin_mid)
            elif dist < 0.20 and ((x + y) // 4) % 3 == 0:
                fill_rect(palm, x, y, x + 3, y + 3, skin_hi)

    # Palm crease lines
    for i in range(120, 360, 4):
        fill_rect(palm, i, 150 + int(np.sin(i / 45.0) * 8), i + 3, 153 + int(np.sin(i / 45.0) * 8), skin_mid)
    save_layer(os.path.join(FX_DIR, "giant_palm.png"), palm)

    # Fingers left/right panels (vertical finger bars 60px wide x 270px tall)
    for side in ("left", "right"):
        fg = new_canvas(480, 270)
        x_start = 0 if side == "left" else 240
        x_end = 240 if side == "left" else 480
        fill_rect(fg, x_start, 0, x_end - 1, 269, skin_base)
        # Draw 2 vertical finger seam lines per half
        for seam in ([80, 160] if side == "left" else [320, 400]):
            fill_rect(fg, seam - 3, 0, seam + 3, 269, skin_dark)
            fill_rect(fg, seam + 4, 0, seam + 7, 269, skin_hi)
        # Inner seam edge
        edge_x = 234 if side == "left" else 240
        fill_rect(fg, edge_x, 0, edge_x + 5, 269, skin_dark)
        save_layer(os.path.join(FX_DIR, f"giant_fingers_{side}.png"), fg)


def build_props():
    # 1. Candle in glass jar (unlit + lit) 32x40
    for lit in (False, True):
        arr = new_canvas(32, 40)
        # Glass jar
        fill_rect(arr, 8, 16, 23, 35, SILVER)
        fill_rect(arr, 10, 18, 21, 33, CREAM)
        fill_rect(arr, 10, 22, 21, 33, AMBER_HI if lit else GOLD)
        # Glass shine
        fill_rect(arr, 11, 18, 11, 32, WHITE)
        # Rim
        fill_rect(arr, 7, 15, 24, 16, WHITE)
        # Wick
        fill_rect(arr, 15, 11, 16, 15, INK)
        arr = add_selective_outline(arr)
        if lit:
            fill_ellipse(arr, 15.5, 8, 2.5, 3.8, AMBER)
            fill_rect(arr, 15, 6, 16, 9, GOLD)
            put_px(arr, 15, 8, WHITE)
        save_layer(os.path.join(PROPS_DIR, f"candle_{'lit' if lit else 'unlit'}.png"), arr)

    # 2. Oil bottles (gold & dark used) 24x36
    for used in (False, True):
        arr = new_canvas(24, 36)
        liq = AMBER_SH if used else GOLD
        liq_hi = AMBER if used else CREAM
        fill_rect(arr, 9, 4, 14, 7, RED if not used else SLATE)  # cap
        fill_rect(arr, 10, 8, 13, 13, SILVER)  # neck
        fill_rect(arr, 6, 14, 17, 32, SILVER)  # body
        fill_rect(arr, 7, 18, 16, 31, liq)
        fill_rect(arr, 8, 19, 9, 30, liq_hi)
        fill_rect(arr, 8, 22, 15, 26, CREAM)  # label
        arr = add_selective_outline(arr)
        save_layer(os.path.join(PROPS_DIR, f"bottle_{'used' if used else 'gold'}.png"), arr)

    # 3. Frying pan on stove 48x32
    arr = new_canvas(48, 32)
    fill_rect(arr, 6, 20, 34, 28, SLATE)
    fill_rect(arr, 8, 22, 32, 24, STEEL)
    fill_rect(arr, 12, 14, 28, 19, SLATE)
    fill_rect(arr, 14, 15, 26, 17, AMBER_SH)
    fill_rect(arr, 28, 15, 42, 17, WOOD_M)
    arr = add_selective_outline(arr)
    save_layer(os.path.join(PROPS_DIR, "pan_stove.png"), arr)

    # 4. Beaker with strainer/funnel 36x40
    arr = new_canvas(36, 40)
    fill_rect(arr, 10, 18, 25, 35, SILVER)
    fill_rect(arr, 12, 23, 23, 33, AMBER)
    fill_rect(arr, 12, 19, 13, 33, WHITE)
    # Funnel
    for row in range(8, 18):
        hw = max(2, 18 - row)
        fill_rect(arr, 18 - hw, row, 18 + hw, row, STEEL)
    fill_rect(arr, 12, 10, 24, 11, SILVER)
    arr = add_selective_outline(arr)
    save_layer(os.path.join(PROPS_DIR, "beaker_funnel.png"), arr)

    # 5. CRT Retro TV 80x64
    arr = new_canvas(80, 64)
    # Antennas
    for i in range(10):
        put_px(arr, 35 - i, 10 - i, STEEL)
        put_px(arr, 44 + i, 10 - i, STEEL)
    # Outer wood/slate casing
    fill_rect(arr, 6, 12, 73, 56, WOOD_D)
    fill_rect(arr, 8, 14, 71, 54, WOOD_M)
    # Screen recess
    fill_rect(arr, 12, 18, 57, 50, SLATE)
    # Dials on right
    fill_rect(arr, 61, 20, 68, 26, STEEL)
    fill_rect(arr, 61, 30, 68, 36, STEEL)
    fill_rect(arr, 61, 40, 68, 49, SLATE)
    put_px(arr, 65, 51, GREEN)
    # Legs
    fill_rect(arr, 14, 57, 19, 61, WOOD_D)
    fill_rect(arr, 60, 57, 65, 61, WOOD_D)
    arr = add_selective_outline(arr)
    save_layer(os.path.join(PROPS_DIR, "crt_tv.png"), arr)

    # 6. Cozy Sofa 120x44
    arr = new_canvas(120, 44)
    fill_rect(arr, 10, 8, 109, 26, BURG)
    fill_rect(arr, 14, 10, 105, 24, hex_to_rgba("#8A2A4A"))
    fill_rect(arr, 6, 18, 16, 36, BURG)
    fill_rect(arr, 103, 18, 113, 36, BURG)
    fill_rect(arr, 16, 24, 103, 36, hex_to_rgba("#B23A5A"))
    fill_rect(arr, 14, 37, 20, 41, WOOD_D)
    fill_rect(arr, 99, 37, 105, 41, WOOD_D)
    arr = add_selective_outline(arr)
    save_layer(os.path.join(PROPS_DIR, "sofa.png"), arr)

    # 7. Podium 48x40
    arr = new_canvas(48, 40)
    fill_rect(arr, 6, 4, 41, 9, WOOD_L)
    fill_rect(arr, 10, 10, 37, 34, WOOD_M)
    fill_rect(arr, 14, 13, 33, 31, WOOD_D)
    fill_rect(arr, 4, 35, 43, 38, WOOD_D)
    arr = add_selective_outline(arr)
    save_layer(os.path.join(PROPS_DIR, "podium.png"), arr)

    # 8. Oil Barrel Drum 24x32
    arr = new_canvas(24, 32)
    fill_rect(arr, 4, 4, 19, 28, TEAL_D)
    fill_rect(arr, 6, 4, 13, 28, TEAL_M)
    fill_rect(arr, 3, 11, 20, 12, SILVER)
    fill_rect(arr, 3, 20, 20, 21, SILVER)
    fill_rect(arr, 8, 14, 15, 18, AMBER)
    arr = add_selective_outline(arr)
    save_layer(os.path.join(PROPS_DIR, "drum_oil.png"), arr)

    # 9. Safety warning sign 32x32
    arr = new_canvas(32, 32)
    for y in range(4, 28):
        hw = int((y - 4) * 0.55) + 1
        fill_rect(arr, 16 - hw, y, 16 + hw, y, GOLD)
    fill_rect(arr, 15, 11, 16, 19, INK)
    fill_rect(arr, 15, 22, 16, 24, INK)
    arr = add_selective_outline(arr)
    save_layer(os.path.join(PROPS_DIR, "safety_sign.png"), arr)

    # 10. UI Cross & Checkmark 16x16
    x_arr = new_canvas(16, 16)
    for i in range(3, 13):
        fill_rect(x_arr, i, i, i + 1, i + 1, RED)
        fill_rect(x_arr, 15 - i, i, 16 - i, i + 1, RED)
    x_arr = add_selective_outline(x_arr)
    save_layer(os.path.join(UI_DIR, "icon_x.png"), x_arr)

    ok_arr = new_canvas(16, 16)
    for i in range(4):
        fill_rect(ok_arr, 3 + i, 8 + i, 4 + i, 9 + i, GREEN)
    for i in range(7):
        fill_rect(ok_arr, 6 + i, 11 - i, 7 + i, 12 - i, GREEN)
    ok_arr = add_selective_outline(ok_arr)
    save_layer(os.path.join(UI_DIR, "icon_ok.png"), ok_arr)


def main():
    os.makedirs(PROPS_DIR, exist_ok=True)
    os.makedirs(FX_DIR, exist_ok=True)
    os.makedirs(UI_DIR, exist_ok=True)
    build_sparkles()
    build_flames()
    build_emotes()
    build_giant_hand()
    build_props()
    print("[DONE] All props, FX, giant hand, and UI sprites built.")


if __name__ == "__main__":
    main()
