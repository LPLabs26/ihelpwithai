// Public SkillForge library endpoint.
// Returns only safe, non-PII fields from `public_skills` and converts storage
// paths into public download URLs. Deploy with JWT verification disabled.
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const PUBLIC_STORAGE_BASE = (Deno.env.get("PUBLIC_STORAGE_BASE") ?? "").replace(/\/$/, "");

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "https://ihelpwithai.com",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET") return json({ error: "method not allowed" }, 405, cors);

  const { data, error } = await supabase
    .from("public_skills")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return json({ error: "could not load skills" }, 500, cors);

  const skills = (data ?? []).map((skill) => ({
    name: skill.name,
    description: skill.description,
    category: skill.category,
    source_url: skill.source_url,
    created_at: skill.created_at,
    download_url:
      skill.download_path && PUBLIC_STORAGE_BASE
        ? `${PUBLIC_STORAGE_BASE}/${skill.download_path}`
        : undefined,
  }));

  return json(skills, 200, cors);
});

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "content-type": "application/json" },
  });
}
