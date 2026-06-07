"""Local archival for verified .skill files.

Supabase Storage remains the public download source. This module mirrors each
verified archive to a server-local disk when SKILL_ARCHIVE_DIR is configured.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import tempfile
from pathlib import Path
from typing import Any


ARCHIVE_DIR = os.environ.get("SKILL_ARCHIVE_DIR", "").strip()
ARCHIVE_MARKER = os.environ.get("SKILL_ARCHIVE_MARKER", "").strip()


def archive_skill_file(
    archive_path: Path,
    *,
    job: dict[str, Any],
    meta: dict[str, Any],
    storage_path: str,
) -> Path | None:
    if not ARCHIVE_DIR:
        return None
    _ensure_marker()

    dest_dir = _destination_dir(job)
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_dir.chmod(0o755)
    dest = dest_dir / _safe_filename(archive_path.name)
    _copy_atomic(archive_path, dest)
    _write_metadata(dest_dir, job=job, meta=meta, storage_path=storage_path,
                    archive_name=dest.name)
    return dest


def archive_skill_bytes(
    data: bytes,
    *,
    filename: str,
    job: dict[str, Any],
    meta: dict[str, Any],
    storage_path: str,
) -> Path | None:
    if not ARCHIVE_DIR:
        return None
    _ensure_marker()

    dest_dir = _destination_dir(job)
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_dir.chmod(0o755)
    dest = dest_dir / _safe_filename(filename)
    _write_bytes_atomic(data, dest)
    _write_metadata(dest_dir, job=job, meta=meta, storage_path=storage_path,
                    archive_name=dest.name)
    return dest


def _destination_dir(job: dict[str, Any]) -> Path:
    return Path(ARCHIVE_DIR) / _safe_component(str(job.get("id") or "unknown"))


def _ensure_marker() -> None:
    if ARCHIVE_MARKER and not Path(ARCHIVE_MARKER).exists():
        raise RuntimeError(f"skill archive marker missing: {ARCHIVE_MARKER}")


def _safe_component(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "-", value).strip(".-")
    return cleaned[:120] or "unknown"


def _safe_filename(value: str) -> str:
    name = Path(value).name
    cleaned = re.sub(r"[^A-Za-z0-9_.-]+", "-", name).strip(".-")
    return cleaned[:160] or "skill.skill"


def _copy_atomic(src: Path, dest: Path) -> None:
    with tempfile.NamedTemporaryFile(dir=dest.parent, delete=False) as tmp:
        tmp_path = Path(tmp.name)
    try:
        shutil.copy2(src, tmp_path)
        tmp_path.replace(dest)
        dest.chmod(0o644)
    finally:
        tmp_path.unlink(missing_ok=True)


def _write_bytes_atomic(data: bytes, dest: Path) -> None:
    with tempfile.NamedTemporaryFile(dir=dest.parent, delete=False) as tmp:
        tmp.write(data)
        tmp_path = Path(tmp.name)
    try:
        tmp_path.replace(dest)
        dest.chmod(0o644)
    finally:
        tmp_path.unlink(missing_ok=True)


def _write_metadata(
    dest_dir: Path,
    *,
    job: dict[str, Any],
    meta: dict[str, Any],
    storage_path: str,
    archive_name: str,
) -> None:
    payload = {
        "submission_id": job.get("id"),
        "email": job.get("email"),
        "source_url": job.get("url"),
        "skill_name": meta.get("name"),
        "description": meta.get("description"),
        "category": meta.get("category", "Skill"),
        "storage_path": storage_path,
        "archive_name": archive_name,
    }
    data = json.dumps(payload, indent=2, sort_keys=True).encode() + b"\n"
    _write_bytes_atomic(data, dest_dir / "metadata.json")
