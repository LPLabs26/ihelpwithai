// ihelpwithai.com intake — Supabase Edge Function (Deno).
// Receives the homepage form POST, guards against abuse, stores the email +
// source material in `submissions` (the email repository), returns immediately.
// The worker does the slow work. Deploy: supabase functions deploy submit-skill-job
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // server-side only, never shipped
);

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SOURCE_URL = /^https?:\/\/\S+$/i;
const MAX_SOURCE_CHARS = 180_000;
const MAX_UPLOAD_BYTES = Number(Deno.env.get("MAX_UPLOAD_BYTES") ?? "52428800");
const UPLOAD_BUCKET = "source-uploads";
const DAILY_PER_IP = Number(Deno.env.get("RATE_LIMIT_PER_IP") ?? "3");
const DAILY_GLOBAL = Number(Deno.env.get("RATE_LIMIT_GLOBAL") ?? "100"); // cost ceiling

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "https://ihelpwithai.com",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST")
    return json({ error: "method not allowed" }, 405, cors);

  const input = await parseInput(req);
  if (!EMAIL.test(input.email ?? "") || !input.rightsConfirmed)
    return json({ error: "invalid input" }, 400, cors);
  if (!input.sourceText && !input.sourceUrl && input.files.length === 0)
    return json({ error: "missing_source", message: "Upload a file, add a URL, or paste source text." }, 400, cors);
  if (input.sourceUrl && !SOURCE_URL.test(input.sourceUrl))
    return json({ error: "invalid_url", message: "Please enter a valid source URL." }, 400, cors);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const sinceDay = new Date(Date.now() - 86_400_000).toISOString();

  // GUARD — you pay per conversion, so cap per-IP and globally per day.
  const [{ count: ipCount }, { count: dayCount }] = await Promise.all([
    supabase.from("submissions").select("id", { count: "exact", head: true })
      .eq("ip", ip).gte("created_at", sinceDay),
    supabase.from("submissions").select("id", { count: "exact", head: true })
      .gte("created_at", sinceDay),
  ]);
  if ((ipCount ?? 0) >= DAILY_PER_IP || (dayCount ?? 0) >= DAILY_GLOBAL)
    return json({ error: "rate_limited" }, 429, cors);

  const queued = await buildSubmissionSource(input).catch((error) => ({
    error: "upload_failed",
    message: String(error?.message ?? error ?? "Could not upload source file."),
    status: 500,
  }));
  if ("error" in queued) return json(queued, queued.status, cors);

  const { error } = await supabase.from("submissions").insert({
    url: queued.url,
    email: input.email,
    ip,
    result_type: queued.resultType,
  });
  if (error) return json({ error: "could not queue" }, 500, cors);

  return json({ status: "queued" }, 202, cors);
});

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "content-type": "application/json" },
  });
}

type InputFile = {
  name: string;
  type: string;
  size: number;
  bytes: Uint8Array;
};

type SubmissionInput = {
  email: string;
  sourceText: string;
  sourceUrl: string;
  rightsConfirmed: boolean;
  files: InputFile[];
};

async function parseInput(req: Request): Promise<SubmissionInput> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const files: InputFile[] = [];
    for (const item of form.getAll("files")) {
      if (!(item instanceof File) || item.size === 0) continue;
      if (item.size > MAX_UPLOAD_BYTES) {
        files.push({
          name: item.name,
          type: item.type || "application/octet-stream",
          size: item.size,
          bytes: new Uint8Array(),
        });
        continue;
      }
      files.push({
        name: item.name,
        type: item.type || "application/octet-stream",
        size: item.size,
        bytes: new Uint8Array(await item.arrayBuffer()),
      });
    }
    return {
      email: String(form.get("email") ?? "").trim(),
      sourceText: String(form.get("source_text") ?? form.get("transcript") ?? "").trim().slice(0, MAX_SOURCE_CHARS),
      sourceUrl: String(form.get("url") ?? form.get("source_url") ?? "").trim(),
      rightsConfirmed: ["true", "1", "on", "yes"].includes(String(form.get("rights_confirmed") ?? "").toLowerCase()),
      files,
    };
  }

  const body = await req.json().catch(() => ({}));
  return {
    email: String(body.email ?? "").trim(),
    sourceText: String(body.source_text ?? body.transcript ?? "").trim().slice(0, MAX_SOURCE_CHARS),
    sourceUrl: String(body.url ?? body.source_url ?? "").trim(),
    rightsConfirmed: body.rights_confirmed === true,
    files: [],
  };
}

async function buildSubmissionSource(input: SubmissionInput): Promise<
  | { url: string; resultType: string }
  | { error: string; message: string; status: number }
> {
  const oversized = input.files.find((file) => file.size > MAX_UPLOAD_BYTES || file.bytes.length === 0);
  if (oversized) {
    return {
      error: "file_too_large",
      message: `File is larger than the ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB upload limit: ${oversized.name}`,
      status: 413,
    };
  }

  if (input.files.length > 0) {
    const refs = await uploadFiles(input.files);
    if (input.sourceText) {
      refs.unshift({
        bucket: UPLOAD_BUCKET,
        path: await uploadText(input.sourceText, "pasted-source.txt", "text/plain"),
      });
    }
    return {
      url: refs.length === 1 ? storageRef(refs[0]) : storageListRef(refs),
      resultType: "uploaded_file",
    };
  }

  if (input.sourceUrl) {
    return { url: input.sourceUrl, resultType: "tutorial" };
  }

  return { url: inlineSourceUrl(input.sourceText), resultType: "source_file" };
}

async function uploadFiles(files: InputFile[]): Promise<Array<{ bucket: string; path: string }>> {
  await ensureUploadBucket();
  const refs: Array<{ bucket: string; path: string }> = [];
  const batchId = crypto.randomUUID();
  for (const file of files) {
    const path = `${batchId}/${safeName(file.name)}`;
    const { error } = await supabase.storage
      .from(UPLOAD_BUCKET)
      .upload(path, file.bytes, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });
    if (error) throw error;
    refs.push({ bucket: UPLOAD_BUCKET, path });
  }
  return refs;
}

async function uploadText(text: string, name: string, contentType: string): Promise<string> {
  await ensureUploadBucket();
  const path = `${crypto.randomUUID()}/${safeName(name)}`;
  const { error } = await supabase.storage
    .from(UPLOAD_BUCKET)
    .upload(path, new TextEncoder().encode(text), { contentType, upsert: false });
  if (error) throw error;
  return path;
}

async function ensureUploadBucket(): Promise<void> {
  const { error } = await supabase.storage.createBucket(UPLOAD_BUCKET, { public: false });
  if (error && !String(error.message ?? error).toLowerCase().includes("already exists")) {
    throw error;
  }
}

function storageRef(ref: { bucket: string; path: string }): string {
  return `storage://${ref.bucket}/${ref.path}`;
}

function storageListRef(refs: Array<{ bucket: string; path: string }>): string {
  return "storage-list:application/json;base64," + base64Utf8(JSON.stringify(refs));
}

function safeName(name: string): string {
  return (name || "source-file")
    .replace(/[^A-Za-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140) || "source-file";
}

function inlineSourceUrl(text: string): string {
  return "inline-source:text/plain;base64," + base64Utf8(text);
}

function base64Utf8(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
}
