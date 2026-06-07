"""Stage 3 — vision: describe each sampled frame so synthesis can use
visual context the transcript misses (UI state, terminal output, code on
screen, diagrams, file trees)."""
from __future__ import annotations

from dataclasses import dataclass

from ..providers.llm import LLM
from .frames import Frame

_FRAME_PROMPT = (
    "This is a frame from a how-to tutorial video. Describe ONLY what is "
    "concretely visible and useful for reproducing the steps: exact text in "
    "terminals, code shown, UI elements clicked, menu paths, file/folder "
    "names, URLs, error messages, config values. Transcribe on-screen text "
    "verbatim. If the frame is just a face/intro/transition with no technical "
    "content, reply exactly: NO_TECHNICAL_CONTENT."
)


@dataclass
class FrameNote:
    index: int
    timestamp: float
    description: str


def describe_frames(frames: list[Frame], llm: LLM | None = None) -> list[FrameNote]:
    llm = llm or LLM()
    notes: list[FrameNote] = []
    for f in frames:
        desc = llm.describe_image(f.path, _FRAME_PROMPT).strip()
        if desc and desc != "NO_TECHNICAL_CONTENT":
            notes.append(FrameNote(f.index, f.timestamp, desc))
    return notes
