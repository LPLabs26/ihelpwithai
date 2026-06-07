// ihelpwithai.com intake — Supabase Edge Function (Deno).
// Receives the homepage form POST, guards against abuse, stores the email +
// URL in `submissions` (the email repository), returns immediately. The worker
// does the slow work. Deploy:  supabase functions deploy submit-skill-job
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // server-side only, never shipped
);

const YT = /(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
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

  const { url, email } = await req.json().catch(() => ({}));
  if (!YT.test(url ?? "") || !EMAIL.test(email ?? ""))
    return json({ error: "invalid input" }, 400, cors);

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

  const { error } = await supabase.from("submissions").insert({ url, email, ip });
  if (error) return json({ error: "could not queue" }, 500, cors);

  return json({ status: "queued" }, 202, cors);
});

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "content-type": "application/json" },
  });
}
