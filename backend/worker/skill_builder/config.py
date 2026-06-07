"""Central config. Reads server-side .env. No secret ever leaves this process."""
from __future__ import annotations

import os
from dataclasses import dataclass

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:  # dotenv optional at runtime
    pass


def _int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


@dataclass(frozen=True)
class Config:
    # provider: "anthropic" | "openai" | "local"
    provider: str = os.environ.get("SKILLBUILDER_PROVIDER", "anthropic").lower()

    anthropic_api_key: str | None = os.environ.get("ANTHROPIC_API_KEY") or None
    openai_api_key: str | None = os.environ.get("OPENAI_API_KEY") or None

    # Local model (Ollama / LM Studio etc. — any OpenAI-compatible server).
    # Free; runs on your machine. Needs a vision-capable model for frame reading.
    local_base_url: str = os.environ.get(
        "SKILLBUILDER_LOCAL_BASE_URL", "http://localhost:11434/v1"
    )
    local_model: str = os.environ.get("SKILLBUILDER_LOCAL_MODEL", "llama3.2-vision")

    llm_model: str = os.environ.get("SKILLBUILDER_LLM_MODEL", "claude-sonnet-4-6")
    vision_model: str = os.environ.get("SKILLBUILDER_VISION_MODEL", "claude-sonnet-4-6")
    transcribe_model: str = os.environ.get(
        "SKILLBUILDER_TRANSCRIBE_MODEL", "gpt-4o-mini-transcribe"
    )

    max_video_minutes: int = _int("SKILLBUILDER_MAX_VIDEO_MINUTES", 30)
    max_frames: int = _int("SKILLBUILDER_MAX_FRAMES", 40)
    gate_max_retries: int = _int("SKILLBUILDER_GATE_MAX_RETRIES", 4)

    @property
    def has_llm(self) -> bool:
        """True when the AI stages can run."""
        if self.provider == "local":
            return True                      # local server needs no key
        if self.provider == "openai":
            return bool(self.openai_api_key)
        return bool(self.anthropic_api_key)  # anthropic (default)

    @property
    def has_transcription(self) -> bool:
        return bool(self.openai_api_key)


CONFIG = Config()
