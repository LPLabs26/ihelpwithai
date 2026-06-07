"""Transactional emails for SkillForge, sent from info@ihelpwithai.com via
Resend. Two outcomes only: verified (link) or needs-review (reasons).
Never send the success email for a job that didn't pass the gate."""
from __future__ import annotations

import os
import smtplib
import ssl
from email.message import EmailMessage
from html import escape

import requests

SENDER = (
    os.environ.get("EMAIL_FROM")
    or os.environ.get("SMTP_FROM")
    or "SkillForge <info@ihelpwithai.com>"
)
RESEND_KEY = os.environ.get("RESEND_API_KEY", "")
REPLY_TO = "info@ihelpwithai.com"
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")


def _send(to: str, subject: str, html: str) -> None:
    if not RESEND_KEY:
        _send_smtp(to, subject, html)
        return
    r = requests.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {RESEND_KEY}",
                 "Content-Type": "application/json"},
        json={"from": SENDER, "to": [to], "reply_to": REPLY_TO,
              "subject": subject, "html": html},
        timeout=30,
    )
    r.raise_for_status()


def _send_smtp(to: str, subject: str, html: str) -> None:
    if not SMTP_HOST or not SMTP_USERNAME or not SMTP_PASSWORD:
        raise RuntimeError("No email backend configured: set RESEND_API_KEY or SMTP_* env vars.")

    msg = EmailMessage()
    msg["From"] = SENDER
    msg["To"] = to
    msg["Reply-To"] = REPLY_TO
    msg["Subject"] = subject
    msg.set_content("Your SkillForge update is ready. View this email in an HTML-capable client.")
    msg.add_alternative(html, subtype="html")

    context = ssl.create_default_context()
    if SMTP_PORT == 465:
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context, timeout=30) as smtp:
            smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
            smtp.send_message(msg)
    else:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30) as smtp:
            smtp.starttls(context=context)
            smtp.login(SMTP_USERNAME, SMTP_PASSWORD)
            smtp.send_message(msg)


def send_success(to: str, skill_name: str, link: str) -> None:
    safe_skill_name = escape(skill_name)
    safe_link = escape(link, quote=True)
    html = f"""
    <div style="font-family:system-ui,sans-serif;max-width:540px;margin:auto;color:#13202f">
      <h2 style="color:#0a1628">Your skill is ready ✅</h2>
      <p>We built and verified <strong>{safe_skill_name}</strong> from your tutorial.</p>
      <p><a href="{safe_link}" style="display:inline-block;background:#f5a623;color:#0a1628;
        padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:700">
        Download the .skill</a></p>
      <p style="font-size:13px;color:#526172">Drop it into Claude Code or Cursor and the
        agent can run the task — no rewatching the video. Link expires in 7 days.</p>
      <p style="font-size:12px;color:#7a8fad">— SkillForge · ihelpwithai.com</p>
    </div>"""
    _send(to, "Your SkillForge skill is ready", html)


def send_needs_review(to: str, reasons: list[str]) -> None:
    items = "".join(f"<li>{escape(str(r))}</li>" for r in (reasons or ["Unknown error"]))
    html = f"""
    <div style="font-family:system-ui,sans-serif;max-width:540px;margin:auto;color:#13202f">
      <h2 style="color:#0a1628">We couldn't fully verify your skill</h2>
      <p>We tried, but the skill didn't pass our automatic checks, so we're not
         sending something that might not work. Here's what tripped it up:</p>
      <ul style="color:#526172">{items}</ul>
      <p>Try another tutorial — clear, step-by-step how-tos work best.</p>
      <p style="font-size:12px;color:#7a8fad">— SkillForge · ihelpwithai.com</p>
    </div>"""
    _send(to, "About your SkillForge request", html)
