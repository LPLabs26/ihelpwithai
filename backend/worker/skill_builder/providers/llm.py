"""Swappable LLM provider. The rest of the engine only talks to the model
through this interface, so the backend is a config switch:

    SKILLBUILDER_PROVIDER = anthropic | openai | local

  - anthropic : Claude (needs ANTHROPIC_API_KEY)
  - openai    : GPT (needs OPENAI_API_KEY)
  - local     : any OpenAI-compatible server (Ollama, LM Studio) — free, runs
                on your machine; needs a vision-capable model for frame reading.

This module is the ONLY place a model SDK is touched. With nothing configured,
instantiating LLM raises a clear error so the AI stages stay dark."""
from __future__ import annotations

import base64
import json
import mimetypes
from pathlib import Path

from ..config import CONFIG


class LLMUnavailable(RuntimeError):
    pass


class LLM:
    def __init__(self) -> None:
        if not CONFIG.has_llm:
            raise LLMUnavailable(
                f"No model configured for provider '{CONFIG.provider}'. Set an "
                "API key (anthropic/openai) or run a local server and set "
                "SKILLBUILDER_PROVIDER=local. A consumer chat subscription "
                "cannot be used here."
            )
        self.provider = CONFIG.provider
        if self.provider == "anthropic":
            from anthropic import Anthropic
            self._client = Anthropic(api_key=CONFIG.anthropic_api_key)
            self._text_model = CONFIG.llm_model
            self._vision_model = CONFIG.vision_model
        else:
            # openai + local both use the OpenAI SDK (local just points base_url
            # at the local server with a dummy key).
            from openai import OpenAI
            if self.provider == "local":
                self._client = OpenAI(base_url=CONFIG.local_base_url, api_key="local")
                self._text_model = self._vision_model = CONFIG.local_model
            else:
                self._client = OpenAI(api_key=CONFIG.openai_api_key)
                self._text_model = "gpt-4o"
                self._vision_model = "gpt-4o"

    # --- text ---
    def complete(self, system: str, user: str, model: str | None = None,
                 max_tokens: int = 4096) -> str:
        if self.provider == "anthropic":
            msg = self._client.messages.create(
                model=model or self._text_model, max_tokens=max_tokens,
                system=system, messages=[{"role": "user", "content": user}],
            )
            return "".join(b.text for b in msg.content if b.type == "text")
        # openai / local
        resp = self._client.chat.completions.create(
            model=model or self._text_model, max_tokens=max_tokens,
            messages=[{"role": "system", "content": system},
                      {"role": "user", "content": user}],
        )
        return resp.choices[0].message.content or ""

    def complete_json(self, system: str, user: str, model: str | None = None,
                      max_tokens: int = 4096) -> dict:
        raw = self.complete(system + "\n".join([
                                "",
                                "Return exactly one valid JSON object.",
                                "Do not include prose, markdown fences, comments, or trailing notes.",
                                "The first non-whitespace character must be { and the last must be }.",
                            ]),
                            user, model, max_tokens)
        return _loads_loose(raw)

    # --- vision ---
    def describe_image(self, image_path: str, prompt: str,
                       model: str | None = None, max_tokens: int = 1024) -> str:
        data = Path(image_path).read_bytes()
        media = mimetypes.guess_type(image_path)[0] or "image/jpeg"
        b64 = base64.standard_b64encode(data).decode()
        if self.provider == "anthropic":
            msg = self._client.messages.create(
                model=model or self._vision_model, max_tokens=max_tokens,
                messages=[{"role": "user", "content": [
                    {"type": "image", "source": {"type": "base64",
                     "media_type": media, "data": b64}},
                    {"type": "text", "text": prompt},
                ]}],
            )
            return "".join(b.text for b in msg.content if b.type == "text")
        # openai / local (OpenAI-compatible image_url with data URI)
        resp = self._client.chat.completions.create(
            model=model or self._vision_model, max_tokens=max_tokens,
            messages=[{"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url",
                 "image_url": {"url": f"data:{media};base64,{b64}"}},
            ]}],
        )
        return resp.choices[0].message.content or ""


def _loads_loose(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        decoder = json.JSONDecoder()
        last_error: json.JSONDecodeError | None = None
        for i, ch in enumerate(text):
            if ch != "{":
                continue
            try:
                data, _ = decoder.raw_decode(text[i:])
                break
            except json.JSONDecodeError as e:
                last_error = e
        else:
            if last_error:
                raise last_error
            raise json.JSONDecodeError("No JSON object found", text, 0)
    if not isinstance(data, dict):
        raise ValueError("Expected a JSON object from model response.")
    return data
