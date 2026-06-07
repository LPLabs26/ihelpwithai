# ihelpwithai.com — Go-Live Runbook

Everything is built. These are the steps to make it live. I can't run them for
you — they need your GitHub login, your Supabase project, and paid accounts
(AI + email). Each step says what it costs and why.

Order matters. Don't share the URL publicly until Step 6 (the guard).

---

## Accounts you need first (one-time)

| Service | Why | Cost |
|---|---|---|
| **Anthropic/OpenAI API key or local model server** | runs the engine (vision + writing the skill) | pay-per-use for cloud keys; local model is free after hardware |
| **Supabase** project | stores emails + skills, intake function, file storage | free tier is fine to start |
| **Resend** account | sends the result emails from info@ihelpwithai.com | free tier ~3k emails/mo |
| **Worker host** (Render / Railway / Fly) | runs the Python engine (needs ffmpeg) | ~$5–7/mo small instance |

---

## Step 1 — Push the new site (replaces the old one)

```bash
cd /path/to/your/ihelpwithai
git checkout main && git pull
git branch backup-old-site            # safety copy of the old site
git rm -rqf . ':!.github'             # keep the Pages workflow
cp -R /path/to/skill-builder/site/. .
git add -A && git commit -m "Launch ihelpwithai.com"
git push origin main
```
Live at https://ihelpwithai.com in ~1 min, in DEMO mode (no charges yet).

## Step 2 — Supabase: create the data repositories

1. Create a Supabase project. Copy the **Project URL** and **service_role key**.
2. SQL editor → paste and run `backend/schema.sql`.
   (Creates `submissions` = emails, `skills` = library, the storage bucket, and
   the public `public_skills` view.)

## Step 3 — Deploy the intake function

```bash
npm i -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
cp -R /path/to/skill-builder/site/backend/functions/submit-skill-job \
      supabase/functions/
supabase functions deploy submit-skill-job
```
Note the function URL it prints.

## Step 4 — Stand up the worker (runs the engine)

1. Make a folder with: `backend/worker/*` **plus** the engine's `skill_builder/`
   package copied in next to `worker.py`.
2. Deploy to Render/Railway as a **Docker** service (uses the included Dockerfile),
   or run it on the local model host if using a local model.
3. Set its environment variables:
   ```
   SUPABASE_URL=...           SUPABASE_SERVICE_ROLE_KEY=...
   SKILLBUILDER_PROVIDER=anthropic
   ANTHROPIC_API_KEY=...      (or OPENAI_API_KEY with PROVIDER=openai)
   RESEND_API_KEY=...         EMAIL_FROM=ihelpwithai.com <info@ihelpwithai.com>
   PUBLIC_STORAGE_BASE=https://YOUR.supabase.co/storage/v1/object/public/skills
   ```
   If Resend is not available, the worker can send with `SMTP_HOST`,
   `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and optional `SMTP_FROM`.

### Local Gemma on `mtj`

The `mtj` server is running OpenAI-compatible `llama-server` instances for
`gemma-4-12B-it-Q4_K_M.gguf` on `127.0.0.1:8000-8003`, with multimodal support.
Run the worker on that same host so it can call the local model without exposing
the model server publicly:

```bash
cd backend/worker
cp .env.gemma.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, email env vars,
# EMAIL_FROM, and PUBLIC_STORAGE_BASE.
docker compose -f docker-compose.gemma.yml up -d --build
```

The compose file uses host networking so the container can reach
`http://127.0.0.1:8000/v1`. No Anthropic or OpenAI key is needed for this path.
Captioned videos use YouTube captions. Uncaptioned videos use local
`faster-whisper` transcription in the worker (`small.en` by default), then Gemma
handles the multimodal frame understanding, synthesis, and verification.

## Step 5 — Email: verify your domain

In Resend, add `ihelpwithai.com` and set the DNS records (SPF/DKIM/DMARC) it
gives you. Without this, the result emails land in spam.

## Step 6 — Connect the site, then turn the guard on

1. In `index.html`, set `const ENDPOINT` to the Step-3 function URL.
2. In `skills/index.html`, set `SKILLS_SOURCE` to
   `https://YOUR.supabase.co/rest/v1/public_skills?select=*` (add the anon key
   header per Supabase REST docs).
3. The function already rate-limits (3/IP/day, 100/day global — your cost cap).
   Adjust `RATE_LIMIT_PER_IP` / `RATE_LIMIT_GLOBAL` as function secrets.
4. Commit + push those two edits. **Now it's fully live.**

---

## Where your two repositories are

- **Emails** → Supabase → Table editor → `submissions` (Export CSV anytime).
  Private; never shown on the site.
- **Built skills** → `skills` table + Storage `skills` bucket → shown
  automatically in the Skill Library.

## Sanity check before sharing

- Submit your own video on the live site → you get the "received" message.
- Worker logs show it processed → you get an email at your address.
- The skill appears in `/skills/`.
- A bad/unrelated video → you get the "couldn't verify" email, not a broken skill.
