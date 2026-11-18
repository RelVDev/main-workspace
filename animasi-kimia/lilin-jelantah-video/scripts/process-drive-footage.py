#!/usr/bin/env python3
"""
Select, trim, normalize (1920x1080 @ 30fps + loudness-matched audio),
and build pixel-art variants from the raw Drive videos in public/footage/_raw/.
Outputs F00_intro.mp4 .. F09_closing.mp4 + public/footage/pix/*_soft.mp4
and writes src/data/intro-segments.json for synced cast badges in S01A.
"""

import json
import math
import os
import pathlib
import struct
import subprocess
import tempfile
import wave

ROOT = pathlib.Path(__file__).resolve().parent.parent
RAW = ROOT / "public" / "footage" / "_raw"
OUT = ROOT / "public" / "footage"
PIX = OUT / "pix"
FFMPEG = str(ROOT / "node_modules" / "@remotion" / "compositor-linux-x64-gnu" / "ffmpeg")
FFPROBE = str(ROOT / "node_modules" / "@remotion" / "compositor-linux-x64-gnu" / "ffprobe")

OUT.mkdir(parents=True, exist_ok=True)
PIX.mkdir(parents=True, exist_ok=True)


def run(cmd):
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{res.stderr[-800:]}")
    return res


def normalize_wav_segment(in_video: pathlib.Path, ss: float, dur: float, out_wav: str):
    """Extract stereo 48kHz WAV, normalize loudness smoothly to p95~-16dB with tanh soft limiter & 20ms edge fades."""
    tmp_wav = out_wav + ".raw.wav"
    run([
        FFMPEG, "-y", "-v", "error",
        "-ss", f"{ss:.3f}", "-t", f"{dur:.3f}",
        "-i", str(in_video),
        "-ac", "2", "-ar", "48000",
        tmp_wav,
    ])
    with wave.open(tmp_wav, "rb") as r:
        ch = r.getnchannels()
        sr = r.getframerate()
        nf = r.getnframes()
        raw = r.readframes(nf)
    samples = list(struct.unpack(f"<{nf * ch}h", raw))
    mags = sorted(abs(s) for s in samples[::4])
    p95 = mags[min(len(mags) - 1, int(len(mags) * 0.95))] / 32768.0 if mags else 0.1
    target_p95 = math.pow(10, -16.5 / 20.0)
    gain = min(3.2, max(0.75, target_p95 / max(1e-4, p95)))

    fade_frames = int(0.025 * sr)
    total_frames = len(samples) // ch
    out_samples = [0] * len(samples)
    for f in range(total_frames):
        env = 1.0
        if f < fade_frames:
            env = f / max(1, fade_frames)
        elif f >= total_frames - fade_frames:
            env = (total_frames - 1 - f) / max(1, fade_frames)
        for c in range(ch):
            idx = f * ch + c
            x = (samples[idx] / 32768.0) * gain * env
            # Soft limiting above 0.78 to preserve conversational warmth without clipping
            if abs(x) > 0.78:
                x = math.copysign(0.78 + 0.2 * math.tanh((abs(x) - 0.78) / 0.2), x)
            out_samples[idx] = max(-32767, min(32767, int(round(x * 32767.0))))

    with wave.open(out_wav, "wb") as w:
        w.setnchannels(ch)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(struct.pack(f"<{len(out_samples)}h", *out_samples))
    os.remove(tmp_wav)


def cut_segment_video(in_video: pathlib.Path, ss: float, dur: float, out_mp4: str, vf: str = None):
    filter_str = vf or "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,format=yuv420p"
    run([
        FFMPEG, "-y", "-v", "error",
        "-ss", f"{ss:.3f}", "-t", f"{dur:.3f}",
        "-i", str(in_video),
        "-r", "30",
        "-vf", filter_str,
        "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-g", "30", "-keyint_min", "30",
        "-an",
        out_mp4,
    ])


def concat_segments_to_mp4(seg_specs, out_mp4: pathlib.Path, with_audio: bool):
    with tempfile.TemporaryDirectory() as tmp:
        v_inputs = []
        a_inputs = []
        fc_parts = []
        idx_map = 0
        for i, spec in enumerate(seg_specs):
            src = RAW / spec["src"]
            ss = spec["ss"]
            dur = spec["dur"]
            vf = spec.get("vf")
            v_file = os.path.join(tmp, f"v{i}.mp4")
            cut_segment_video(src, ss, dur, v_file, vf=vf)
            v_inputs.extend(["-i", v_file])
            fc_parts.append(f"[{idx_map}:v]")
            idx_map += 1
            if with_audio:
                a_file = os.path.join(tmp, f"a{i}.wav")
                normalize_wav_segment(src, ss, dur, a_file)
                a_inputs.extend(["-i", a_file])

        n = len(seg_specs)
        cmd = [FFMPEG, "-y", "-v", "error", *v_inputs, *a_inputs]
        if with_audio:
            v_tags = "".join(f"[{i}:v]" for i in range(n))
            a_tags = "".join(f"[{n + i}:a]" for i in range(n))
            # Build interleaved concat [v0][a0][v1][a1]...
            inter = "".join(f"[{i}:v][{n + i}:a]" for i in range(n))
            cmd += [
                "-filter_complex", f"{inter}concat=n={n}:v=1:a=1[v][a]",
                "-map", "[v]", "-map", "[a]",
                "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", "30", "-g", "30",
                "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
                str(out_mp4),
            ]
        else:
            tags = "".join(f"[{i}:v]" for i in range(n))
            cmd += [
                "-filter_complex", f"{tags}concat=n={n}:v=1:a=0[v]",
                "-map", "[v]",
                "-c:v", "libx264", "-crf", "17", "-preset", "medium", "-pix_fmt", "yuv420p", "-r", "30", "-g", "30",
                "-an",
                str(out_mp4),
            ]
        run(cmd)


def make_soft_pixel(src_mp4: pathlib.Path, out_pix_mp4: pathlib.Path):
    run([
        FFMPEG, "-y", "-v", "error",
        "-i", str(src_mp4),
        "-r", "30",
        "-vf", "scale=320:180:flags=area,scale=1920:1080:flags=neighbor,format=yuv420p",
        "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-an",
        str(out_pix_mp4),
    ])


def main():
    print("Building F00_intro.mp4 (opening + group perkenalan)...")
    f00_segs = [
        {"src": "opening closing/opening.MOV", "ss": 2.10, "dur": 9.60, "label": "Pembukaan Bersama", "speakers": ["all"]},
        {"src": "opening closing/perkenalan disa malika.MOV", "ss": 3.15, "dur": 16.70, "label": "Disa & Malika", "speakers": ["disa", "malika"]},
        {"src": "opening closing/perkenalan noya marsha.MOV", "ss": 4.60, "dur": 16.20, "label": "Noya & Marsha", "speakers": ["noya", "marsha"]},
        {"src": "opening closing/perkenalan ayuya lovyta.MOV", "ss": 1.15, "dur": 16.80, "label": "Ayuya & Lovyta", "speakers": ["ayuya", "lovyta"]},
        {"src": "opening closing/perkenalan sofi farel ais.MOV", "ss": 6.40, "dur": 25.00, "label": "Sofi, Farel & Ais", "speakers": ["sofi", "farel", "ais"]},
    ]
    concat_segments_to_mp4(f00_segs, OUT / "F00_intro.mp4", with_audio=True)

    cursor = 0.0
    intro_meta = []
    for s in f00_segs:
        intro_meta.append({
            "label": s["label"],
            "speakers": s["speakers"],
            "startSec": round(cursor, 2),
            "endSec": round(cursor + s["dur"], 2),
        })
        cursor += s["dur"]
    (ROOT / "src" / "data" / "intro-segments.json").write_text(json.dumps(intro_meta, indent=2) + "\n")

    specs = {
        "F01_filtering": [
            {"src": "alat dan bahan : kaleng dan minyak.MOV", "ss": 1.0, "dur": 4.5},
            {"src": "proses menuangkan minyak ke dalam gelas ukur.MOV", "ss": 1.5, "dur": 9.5},
        ],
        "F02_melting": [
            {"src": "proses menyalakan kompo.MOV", "ss": 3.2, "dur": 2.5},
            {"src": "proses meletakkan kaleng.MOV", "ss": 2.0, "dur": 2.5},
            {"src": "pelelehan parafin.MOV", "ss": 24.0, "dur": 3.5},
        ],
        "F03_mixing": [
            # Pot pouring oil from vertical clip cropped cleanly to 16:9 around pot center
            {"src": "proses meletakkan minyak ke dalam parafin.MOV", "ss": 13.0, "dur": 3.0, "vf": "crop=1080:608:0:656,scale=1920:1080,format=yuv420p"},
            {"src": "proses menuangkan essential oil.MOV", "ss": 2.0, "dur": 3.0},
            {"src": "proses meletakkan warna lilin.MOV", "ss": 28.0, "dur": 3.0},
        ],
        "F04_pouring": [
            {"src": "proses penuangan lilin.MOV", "ss": 0.5, "dur": 4.5},
            {"src": "proses merapikan cup (2).MOV", "ss": 2.0, "dur": 3.0},
        ],
        "F05_cooling": [
            {"src": "proses penuangan lilin.MOV", "ss": 22.0, "dur": 3.0},
            {"src": "produk hasil lilin.MOV", "ss": 0.5, "dur": 4.0},
        ],
        "F06_product": [
            {"src": "produk hasil lilin.MOV", "ss": 4.2, "dur": 10.0},
        ],
        "F08_bts": [
            {"src": "Alat : cup, anuan lilin, dan stick kayu.MOV", "ss": 1.5, "dur": 2.0},
            {"src": "Bahan : Crayon.MOV", "ss": 1.5, "dur": 2.0},
            {"src": "Penghancuran krayon untuk pewarna.MOV", "ss": 14.0, "dur": 2.0},
            {"src": "alat : kompor dan teflon.MOV", "ss": 1.5, "dur": 2.0},
            {"src": "bahan : essential oil.MOV", "ss": 1.5, "dur": 2.0},
            {"src": "bahan : parafin.MOV", "ss": 1.5, "dur": 2.0},
            {"src": "proses meletakkan warna lilin.MOV", "ss": 54.0, "dur": 2.0},
            {"src": "proses merapikan cup (2).MOV", "ss": 3.0, "dur": 2.0},
        ],
    }

    for name, segs in specs.items():
        print(f"Building {name}.mp4...")
        dst = OUT / f"{name}.mp4"
        concat_segments_to_mp4(segs, dst, with_audio=False)
        if name != "F06_product":
            print(f"  -> pixel variant {name}_soft.mp4...")
            make_soft_pixel(dst, PIX / f"{name}_soft.mp4")

    print("Building F09_closing.mp4...")
    concat_segments_to_mp4(
        [{"src": "opening closing/closing.MOV", "ss": 3.15, "dur": 7.00}],
        OUT / "F09_closing.mp4",
        with_audio=True,
    )
    print("All Drive footage prepared!")


if __name__ == "__main__":
    main()
