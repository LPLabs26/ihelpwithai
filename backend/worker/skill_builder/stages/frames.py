"""Stage 2 — frame sampling.

Sample frames where the screen *changes* (ffmpeg scene detection), then
enforce a hard cap. Fewer, higher-signal frames = lower vision cost, which
is the dominant cost on long videos.
"""
from __future__ import annotations

import json
import shutil
import subprocess
import tempfile
from dataclasses import dataclass
from pathlib import Path

from ..config import CONFIG


@dataclass
class Frame:
    index: int
    timestamp: float        # seconds into the video
    path: str               # local jpg path


def _ensure_ffmpeg() -> None:
    if not shutil.which("ffmpeg"):
        raise RuntimeError(
            "ffmpeg not found. Install it (brew install ffmpeg / apt-get "
            "install ffmpeg) — required for frame sampling."
        )


def _download_video(url: str, dest: Path) -> Path:
    import yt_dlp

    out = str(dest / "video.%(ext)s")
    # cap resolution: 720p is plenty for reading UI/terminal text and is cheaper
    opts = {"quiet": True, "format": "bestvideo[height<=720]+bestaudio/best",
            "outtmpl": out, "merge_output_format": "mp4"}
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([url])
    return next(dest.glob("video.*"))


def sample_frames(url: str, scene_threshold: float = 0.4) -> list[Frame]:
    """Extract scene-change frames, deduped and capped at CONFIG.max_frames."""
    _ensure_ffmpeg()
    workdir = Path(tempfile.mkdtemp(prefix="sb_frames_"))
    video = _download_video(url, workdir)
    frames_dir = workdir / "frames"
    frames_dir.mkdir()

    # Select scene-change frames; show_entries prints their timestamps.
    cmd = [
        "ffmpeg", "-i", str(video),
        "-vf", f"select='gt(scene,{scene_threshold})',showinfo",
        "-vsync", "vfr", str(frames_dir / "f_%04d.jpg"),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    timestamps = _parse_showinfo_pts(proc.stderr)

    files = sorted(frames_dir.glob("f_*.jpg"))
    frames = [
        Frame(i, timestamps[i] if i < len(timestamps) else 0.0, str(p))
        for i, p in enumerate(files)
    ]

    # Fallback: if scene detection yielded nothing, sample at fixed intervals.
    if not frames:
        frames = _fixed_interval(video, frames_dir)

    return _cap(frames, CONFIG.max_frames)


def _parse_showinfo_pts(stderr: str) -> list[float]:
    out = []
    for line in stderr.splitlines():
        if "pts_time:" in line:
            try:
                out.append(float(line.split("pts_time:")[1].split()[0]))
            except (IndexError, ValueError):
                pass
    return out


def _fixed_interval(video: Path, frames_dir: Path) -> list[Frame]:
    cmd = ["ffmpeg", "-i", str(video), "-vf", "fps=1/10",
           str(frames_dir / "g_%04d.jpg")]
    subprocess.run(cmd, capture_output=True, text=True)
    files = sorted(frames_dir.glob("g_*.jpg"))
    return [Frame(i, i * 10.0, str(p)) for i, p in enumerate(files)]


def _cap(frames: list[Frame], n: int) -> list[Frame]:
    """Evenly downsample to at most n frames, preserving order."""
    if len(frames) <= n:
        return frames
    step = len(frames) / n
    return [frames[int(i * step)] for i in range(n)]
