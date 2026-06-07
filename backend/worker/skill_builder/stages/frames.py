"""Stage 2 — frame sampling.

Sample a bounded set of frames across the video. Fewer, higher-signal frames =
lower vision cost, which is the dominant cost on long videos. The sampler seeks
directly to target timestamps instead of scene-scanning the whole file first, so
job runtime stays predictable.
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
    if not shutil.which("ffprobe"):
        raise RuntimeError(
            "ffprobe not found. Install ffmpeg with ffprobe — required for "
            "bounded frame sampling."
        )


def _download_video(url: str, dest: Path) -> Path:
    import yt_dlp

    out = str(dest / "video.%(ext)s")
    # Video-only keeps downloads and decoding cheap; audio is handled by ingest.
    opts = {
        "quiet": True,
        "format": "bestvideo[height<=720]/best[height<=720]/bestvideo/best",
        "outtmpl": out,
        "noplaylist": True,
    }
    with yt_dlp.YoutubeDL(opts) as ydl:
        ydl.download([url])
    return next(dest.glob("video.*"))


def sample_frames(url: str, scene_threshold: float = 0.4) -> list[Frame]:
    """Extract evenly spaced frames, capped at CONFIG.max_frames.

    `scene_threshold` remains for API compatibility with older callers.
    """
    _ensure_ffmpeg()
    workdir = Path(tempfile.mkdtemp(prefix="sb_frames_"))
    video = _download_video(url, workdir)
    frames_dir = workdir / "frames"
    frames_dir.mkdir()

    duration = _video_duration(video)
    frames: list[Frame] = []
    for i, ts in enumerate(_target_timestamps(duration, CONFIG.max_frames)):
        out = frames_dir / f"f_{i:04d}.jpg"
        if _extract_frame(video, out, ts):
            frames.append(Frame(len(frames), ts, str(out)))
    return frames


def _video_duration(video: Path) -> float:
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(video),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
    try:
        return max(0.0, float(proc.stdout.strip()))
    except ValueError:
        return 0.0


def _target_timestamps(duration: float, max_frames: int) -> list[float]:
    if max_frames <= 0:
        return []
    if duration <= 0:
        return [0.0]
    if max_frames == 1:
        return [min(duration * 0.5, max(0.0, duration - 1.0))]

    end = max(0.0, duration - 1.0)
    start = min(3.0, end)
    if end <= start:
        return [start]
    count = min(max_frames, max(1, int(duration // 8) + 1))
    if count == 1:
        return [start]
    step = (end - start) / (count - 1)
    return [start + i * step for i in range(count)]


def _extract_frame(video: Path, out: Path, timestamp: float) -> bool:
    cmd = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel", "error",
        "-ss", f"{timestamp:.3f}",
        "-i", str(video),
        "-frames:v", "1",
        "-q:v", "3",
        str(out),
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
    return proc.returncode == 0 and out.exists() and out.stat().st_size > 0
