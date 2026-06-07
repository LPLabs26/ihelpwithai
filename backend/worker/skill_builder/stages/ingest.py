"""Stage 1 — ingest: resolve the video, get a transcript.

Strategy (your call: captions-first, transcribe fallback):
  1. Pull YouTube's own captions if present  -> free, fast, no key.
  2. Otherwise download audio and transcribe  -> needs OPENAI_API_KEY.

Returns a Transcript with timestamped segments so later stages can align
frames to words.
"""
from __future__ import annotations

import re
import subprocess
import tempfile
from dataclasses import dataclass, field
from pathlib import Path

from ..config import CONFIG


@dataclass
class Segment:
    start: float          # seconds
    duration: float
    text: str


@dataclass
class Transcript:
    video_id: str
    title: str
    duration_s: float
    segments: list[Segment] = field(default_factory=list)
    source: str = "captions"   # "captions" | "whisper"

    @property
    def full_text(self) -> str:
        return " ".join(s.text.strip() for s in self.segments).strip()


_YT_ID = re.compile(r"(?:v=|youtu\.be/|/shorts/|/embed/)([A-Za-z0-9_-]{11})")


def parse_video_id(url: str) -> str:
    m = _YT_ID.search(url)
    if not m:
        raise ValueError(f"Could not parse a YouTube video id from: {url}")
    return m.group(1)


def _metadata(url: str) -> tuple[str, float]:
    """Title + duration via yt-dlp, without downloading the video."""
    import yt_dlp  # local import so non-ingest stages don't need it

    with yt_dlp.YoutubeDL({"quiet": True, "skip_download": True}) as ydl:
        info = ydl.extract_info(url, download=False)
    return info.get("title", "Untitled"), float(info.get("duration", 0) or 0)


def _captions(video_id: str) -> list[Segment]:
    from youtube_transcript_api import YouTubeTranscriptApi

    raw = YouTubeTranscriptApi.get_transcript(video_id)
    return [Segment(s["start"], s.get("duration", 0.0), s["text"]) for s in raw]


def _transcribe_audio(url: str) -> list[Segment]:
    if not CONFIG.has_transcription:
        raise RuntimeError(
            "Video has no captions and OPENAI_API_KEY is not set, so audio "
            "cannot be transcribed. Add a key or pick a captioned video."
        )
    import yt_dlp
    from openai import OpenAI

    with tempfile.TemporaryDirectory() as tmp:
        out = str(Path(tmp) / "audio.%(ext)s")
        opts = {
            "quiet": True,
            "format": "bestaudio/best",
            "outtmpl": out,
            "postprocessors": [
                {"key": "FFmpegExtractAudio", "preferredcodec": "mp3"}
            ],
        }
        with yt_dlp.YoutubeDL(opts) as ydl:
            ydl.download([url])
        audio = next(Path(tmp).glob("audio.*"))
        client = OpenAI(api_key=CONFIG.openai_api_key)
        with open(audio, "rb") as fh:
            resp = client.audio.transcriptions.create(
                model=CONFIG.transcribe_model,
                file=fh,
                response_format="verbose_json",
                timestamp_granularities=["segment"],
            )
    segs = getattr(resp, "segments", None) or []
    return [Segment(float(s.start), float(s.end) - float(s.start), s.text) for s in segs]


def ingest(url: str) -> Transcript:
    video_id = parse_video_id(url)
    title, duration = _metadata(url)

    if duration and duration > CONFIG.max_video_minutes * 60:
        raise ValueError(
            f"Video is {duration/60:.0f} min; v1 cap is "
            f"{CONFIG.max_video_minutes} min (vision cost guard)."
        )

    try:
        segments = _captions(video_id)
        source = "captions"
    except Exception:
        segments = _transcribe_audio(url)
        source = "whisper"

    if not segments:
        raise RuntimeError("No transcript could be obtained for this video.")

    return Transcript(video_id, title, duration, segments, source)
