// Public, no-auth counter endpoint for ihelpwithai.com. Records a page visit or
// a skill download in `events`. Deploy with JWT verification DISABLED:
//   supabase functions deploy track --no-verify-jwt
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const cors = {
    "Access-Control-Allow-Origin": "https://ihelpwithai.com",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("no", { status: 405, headers: cors });

  const body = await req.json().catch(() => ({}));
  const type = body.type === "download" ? "download" : "visit";
  await supabase.from("events").insert({
    type,
    path: (body.path ?? "").slice(0, 200),
    skill: (body.skill ?? "").slice(0, 200),
    visitor: (body.visitor ?? "").slice(0, 64),
  });
  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { ...cors, "content-type": "application/json" },
  });
});
