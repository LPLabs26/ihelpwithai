"""ihelpwithai.com worker — the off-site process that actually runs the engine.

Loop: claim a queued submission -> run the engine (build + verify) -> on a
verified pass, upload the .skill, record it in `skills` (the public library),
and email the user a link -> on failure after retries, mark needs_review and
email the reasons. Never emails a skill that didn't pass the gate.

Run this on a host that has Python + ffmpeg (Render / Railway / Fly / a VM).
It owns the API keys; the static site and edge function never see them.

Env required:
  SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  SKILLBUILDER_PROVIDER + the matching AI key (ANTHROPIC_API_KEY / OPENAI_API_KEY)
  RESEND_API_KEY, EMAIL_FROM   (see emails.py)
  PUBLIC_STORAGE_BASE  e.g. https://YOURPROJECT.supabase.co/storage/v1/object/public/skills
"""
from __future__ import annotations

import base64
import binascii
import json
import os
import time
import tempfile
from pathlib import Path
from urllib.parse import parse_qs, urlencode, urlsplit, urlunsplit

from supabase import create_client

# the engine (installed alongside this worker; see requirements.txt)
from skill_builder.pipeline import run, run_from_media_file, run_from_source_text, transcribe_media_file, run_pitch_to_skill
from skill_builder.gate.executor import SandboxExecutor
import emails
from email_outbox import send_success_email_for_submission
from skill_archive import archive_skill_file

sb = create_client(os.environ["SUPABASE_URL"],
                   os.environ["SUPABASE_SERVICE_ROLE_KEY"])
PUBLIC_BASE = os.environ.get("PUBLIC_STORAGE_BASE", "").rstrip("/")
POLL_SECONDS = int(os.environ.get("WORKER_POLL_SECONDS", "5"))
SANDBOX_EXECUTOR = SandboxExecutor.from_env()
MEDIA_EXTS = {".mp4", ".mov", ".m4v", ".webm", ".mkv", ".avi", ".mp3", ".m4a", ".wav", ".aac", ".ogg", ".flac"}
TEXT_EXTS = {
    ".txt", ".md", ".markdown", ".csv", ".json", ".yaml", ".yml", ".html", ".css",
    ".js", ".ts", ".tsx", ".jsx", ".py", ".rb", ".php", ".sh", ".sql", ".xml",
    ".toml", ".ini", ".env", ".log",
}


def claim_one() -> dict | None:
    rows = (sb.table("submissions").select("*").eq("status", "queued")
            .order("created_at").limit(1).execute().data)
    if not rows:
        return None
    job = rows[0]
    sb.table("submissions").update({"status": "running"}).eq("id", job["id"]).execute()
    return job


def process(job: dict) -> None:
    out = Path(tempfile.mkdtemp(prefix="sf_"))
    source_text = _job_source_text(job)
    upload_refs = _job_upload_refs(job)
    result_type = "uploaded_file" if upload_refs else "source_file" if source_text else _job_result_type(job)
    source_url = None if source_text or upload_refs else _clean_source_url(job["url"])
    archive_job = {
        **job,
        "url": source_url or "user-provided-source",
        "source_text": None,
        "result_type": result_type,
    }
    existing = None if source_text or upload_refs else _existing_public_skill(source_url, result_type)
    if existing:
        print("reusing existing skill", job["id"], existing["name"])
        _insert_skill({
            "submission_id": job["id"],
            "name": existing["name"],
            "description": existing.get("description", ""),
            "category": existing.get("category", "Skill"),
            "source_url": source_url,
            "storage_path": existing["storage_path"],
            "is_public": False,
            "result_type": result_type,
        })
        _update_submission(job["id"], {"status": "verified", "finished_at": _now()})
        _send_email_safely(job["id"], send_success_email_for_submission, sb, job["id"])
        return

    if upload_refs:
        result = _run_from_upload_refs(upload_refs, out)
    elif source_text:
        result = run_from_source_text(source_text, dest=out, executor=SANDBOX_EXECUTOR)
    elif result_type == "pitch_to_skill":
        result = run_pitch_to_skill(job["url"], dest=out)
    else:
        result = run(
            job["url"],
            dest=out,
            executor=SANDBOX_EXECUTOR,
        )  # ingest -> ... -> gate (bounded retries)

    if result.verified and result.skill_path:
        key = f'{job["id"]}/{result.skill_path.name}'
        with open(result.skill_path, "rb") as f:
            sb.storage.from_("skills").upload(
                key, f.read(),
                {"content-type": "application/zip", "upsert": "true"})
        # read the skill's name/description for the library row
        meta = _read_meta(result.skill_dir)
        row = {
            "submission_id": job["id"],
            "name": meta["name"], "description": meta["description"],
            "category": meta.get("category", "Skill"),
            "source_url": source_url,
            "storage_path": key, "is_public": True,
            "result_type": result_type,
        }
        row.update(_pitch_columns(result.metadata))
        _insert_skill(row)
        _archive_safely(job["id"], archive_skill_file,
                        result.skill_path, job=archive_job, meta=meta, storage_path=key)
        _update_submission(job["id"], {
            "status": "verified",
            "finished_at": _now(),
            **_source_cleanup(job, source_text, upload_refs),
        })
        _delete_upload_refs(upload_refs)
        _send_email_safely(job["id"], send_success_email_for_submission, sb, job["id"])
    else:
        _update_submission(job["id"], {
            "status": "needs_review",
            "failures": result.gate_failures,
            "finished_at": _now(),
            **_source_cleanup(job, source_text, upload_refs),
        })
        _delete_upload_refs(upload_refs)
        _send_email_safely(job["id"], emails.send_needs_review, job["email"], result.gate_failures)


def _send_email_safely(job_id: str, fn, *args) -> None:
    try:
        fn(*args)
    except Exception as e:
        print("email error on", job_id, e)


def _archive_safely(job_id: str, fn, *args, **kwargs) -> None:
    try:
        archived = fn(*args, **kwargs)
        if archived:
            print("archived skill", job_id, archived)
    except Exception as e:
        print("archive error on", job_id, e)


def _read_meta(skill_dir: Path) -> dict:
    import yaml
    text = (skill_dir / "SKILL.md").read_text()
    fm = yaml.safe_load(text.split("---", 2)[1])
    return {
        "name": fm.get("name", "skill"),
        "description": fm.get("description", ""),
        "category": fm.get("category", "Skill"),
    }


def _job_result_type(job: dict) -> str:
    if _job_upload_refs(job):
        return "uploaded_file"
    if _job_source_text(job):
        return "source_file"
    if job.get("result_type") == "pitch_to_skill":
        return "pitch_to_skill"
    qs = parse_qs(urlsplit(job.get("url") or "").query)
    return "pitch_to_skill" if qs.get("ihwa_result_type", [""])[0] == "pitch_to_skill" else "tutorial"


def _clean_source_url(url: str) -> str:
    if _decode_inline_source(url) or _decode_storage_refs(url):
        return ""
    parts = urlsplit(url)
    pairs = [
        (k, v)
        for k, values in parse_qs(parts.query, keep_blank_values=True).items()
        for v in values
        if k != "ihwa_result_type"
    ]
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(pairs), parts.fragment))


def _job_source_text(job: dict) -> str:
    explicit = str(job.get("source_text") or "").strip()
    if explicit:
        return explicit
    return _decode_inline_source(str(job.get("url") or ""))


def _decode_inline_source(value: str) -> str:
    prefixes = ("inline-source:text/plain;base64,", "data:text/plain;base64,")
    for prefix in prefixes:
        if not value.startswith(prefix):
            continue
        try:
            return base64.b64decode(value[len(prefix):], validate=True).decode("utf-8", "replace").strip()
        except (binascii.Error, ValueError):
            return ""
    return ""


def _job_upload_refs(job: dict) -> list[dict]:
    return _decode_storage_refs(str(job.get("url") or ""))


def _decode_storage_refs(value: str) -> list[dict]:
    if value.startswith("storage://"):
        rest = value[len("storage://"):]
        bucket, _, path = rest.partition("/")
        if bucket and path:
            return [{"bucket": bucket, "path": path}]
        return []
    prefix = "storage-list:application/json;base64,"
    if not value.startswith(prefix):
        return []
    try:
        raw = base64.b64decode(value[len(prefix):], validate=True).decode("utf-8")
        refs = json.loads(raw)
    except (binascii.Error, ValueError, json.JSONDecodeError):
        return []
    if not isinstance(refs, list):
        return []
    out = []
    for ref in refs:
        if isinstance(ref, dict) and ref.get("bucket") and ref.get("path"):
            out.append({"bucket": str(ref["bucket"]), "path": str(ref["path"])})
    return out


def _run_from_upload_refs(refs: list[dict], out: Path):
    with tempfile.TemporaryDirectory(prefix="sf_upload_") as tmp:
        root = Path(tmp)
        files = [_download_upload_ref(ref, root) for ref in refs]
        media_files = [path for path in files if _is_media_file(path)]
        text_files = [path for path in files if path not in media_files]

        if len(files) == 1 and media_files:
            return run_from_media_file(media_files[0], dest=out, executor=SANDBOX_EXECUTOR)

        chunks: list[str] = []
        for path in text_files:
            text = _extract_file_text(path)
            if text:
                chunks.append(f"--- FILE: {path.name} ---\n{text}")
        for path in media_files:
            transcript = transcribe_media_file(path, title=path.name)
            chunks.append(f"--- MEDIA TRANSCRIPT: {path.name} ---\n{transcript.full_text}")

        if not chunks:
            raise RuntimeError("Uploaded files did not contain readable text or transcribable media.")
        return run_from_source_text("\n\n".join(chunks), dest=out, executor=SANDBOX_EXECUTOR)


def _download_upload_ref(ref: dict, root: Path) -> Path:
    bucket = str(ref["bucket"])
    storage_path = str(ref["path"])
    data = sb.storage.from_(bucket).download(storage_path)
    dest = root / Path(storage_path).name
    dest.write_bytes(data)
    return dest


def _is_media_file(path: Path) -> bool:
    return path.suffix.lower() in MEDIA_EXTS


def _extract_file_text(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in TEXT_EXTS or _looks_like_text(path):
        return path.read_text(errors="replace")[:180000]
    if suffix == ".pdf":
        try:
            from pypdf import PdfReader
            reader = PdfReader(str(path))
            return "\n".join(page.extract_text() or "" for page in reader.pages)[:180000]
        except Exception as exc:
            raise RuntimeError(f"Could not extract text from PDF {path.name}: {exc}") from exc
    if suffix == ".docx":
        try:
            import docx
            document = docx.Document(str(path))
            return "\n".join(p.text for p in document.paragraphs if p.text)[:180000]
        except Exception as exc:
            raise RuntimeError(f"Could not extract text from DOCX {path.name}: {exc}") from exc
    return path.read_text(errors="replace")[:180000]


def _looks_like_text(path: Path) -> bool:
    sample = path.read_bytes()[:2048]
    if not sample:
        return False
    return b"\x00" not in sample


def _delete_upload_refs(refs: list[dict]) -> None:
    for ref in refs:
        try:
            sb.storage.from_(str(ref["bucket"])).remove([str(ref["path"])])
        except Exception as exc:
            print("source upload cleanup error", ref.get("bucket"), ref.get("path"), exc)


def _source_cleanup(job: dict, source_text: str, upload_refs: list[dict] | None = None) -> dict:
    if not source_text and not upload_refs:
        return {}
    cleanup = {"url": "user-provided-source"}
    if "source_text" in job:
        cleanup["source_text"] = None
    return cleanup


def _update_submission(job_id: str, data: dict) -> None:
    try:
        sb.table("submissions").update(data).eq("id", job_id).execute()
    except Exception as e:
        if "source_text" not in data or "source_text" not in str(e):
            raise
        fallback = dict(data)
        fallback.pop("source_text", None)
        sb.table("submissions").update(fallback).eq("id", job_id).execute()


def _pitch_columns(metadata: dict) -> dict:
    allowed = {
        "detected_offer_name",
        "offer_type",
        "target_customer",
        "problem_solved",
        "promised_outcome",
        "public_components",
        "missing_or_proprietary_components",
        "generated_skill_name",
        "confidence_level",
        "high_confidence_findings",
        "medium_confidence_inferences",
        "low_confidence_assumptions",
        "source_video_url",
        "source_video_title",
        "source_timestamps",
        "guardrail_notes",
    }
    return {k: v for k, v in (metadata or {}).items() if k in allowed}


def _existing_public_skill(url: str, result_type: str) -> dict | None:
    try:
        rows = (sb.table("skills")
                .select("name,description,category,storage_path,is_public")
                .eq("source_url", url).eq("result_type", result_type)
                .eq("is_public", True).limit(1).execute().data)
    except Exception as e:
        if not _missing_pitch_columns(e):
            raise
        rows = (sb.table("skills")
                .select("name,description,category,storage_path,is_public")
                .eq("source_url", url).eq("is_public", True)
                .limit(1).execute().data)
    return rows[0] if rows else None


def _insert_skill(row: dict) -> None:
    try:
        sb.table("skills").insert(row).execute()
    except Exception as e:
        if not _missing_pitch_columns(e):
            raise
        fallback = {
            k: v for k, v in row.items()
            if k in {
                "submission_id",
                "name",
                "description",
                "category",
                "source_url",
                "storage_path",
                "is_public",
            }
        }
        print("skills table is missing Pitch-to-Skill columns; inserted legacy row")
        sb.table("skills").insert(fallback).execute()


def _missing_pitch_columns(exc: Exception) -> bool:
    text = str(exc)
    return "column skills." in text and "does not exist" in text


def _now() -> str:
    import datetime
    return datetime.datetime.utcnow().isoformat()


def main() -> None:
    print("ihelpwithai.com worker started.")
    while True:
        job = claim_one()
        if not job:
            time.sleep(POLL_SECONDS)
            continue
        print("processing", job["id"], _job_result_type(job) if (_job_source_text(job) or _job_upload_refs(job)) else job["url"])
        try:
            process(job)
        except Exception as e:  # never crash the loop
            source_text = _job_source_text(job)
            upload_refs = _job_upload_refs(job)
            _update_submission(job["id"], {
                "status": "error",
                "failures": [str(e)[:500]],
                "finished_at": _now(),
                **_source_cleanup(job, source_text, upload_refs),
            })
            _delete_upload_refs(upload_refs)
            print("error on", job["id"], e)


if __name__ == "__main__":
    main()
