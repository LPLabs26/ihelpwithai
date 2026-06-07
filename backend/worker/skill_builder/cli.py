"""CLI entry point for the standalone engine (no email/queue yet — that's the
later delivery layer). Usage:

    python -m skill_builder <youtube_url> [--out DIR]

Prints the outcome and, on a verified pass, the path to the .skill.
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .config import CONFIG
from .pipeline import run


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="skill_builder",
                                 description="YouTube tutorial -> verified .skill")
    ap.add_argument("url", help="YouTube video URL")
    ap.add_argument("--out", type=Path, default=Path("work"),
                    help="output directory (default: ./work)")
    args = ap.parse_args(argv)

    if not CONFIG.has_llm:
        print("WARNING: ANTHROPIC_API_KEY not set. The AI stages cannot run, so "
              "no verified skill can be produced. Set it in .env first.\n",
              file=sys.stderr)

    result = run(args.url, dest=args.out)

    print("\n".join(f"  {line}" for line in result.log))
    print()
    if result.verified:
        print(f"VERIFIED ✓  ({result.attempts} attempt(s))")
        print(f"  skill:   {result.skill_path}")
        return 0

    print(f"NEEDS REVIEW ✗  (not shipped) after {result.attempts} attempt(s)")
    for f in result.gate_failures:
        print(f"  - {f}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
