import { createClient } from "@supabase/supabase-js";

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function send(res, origin, status, body) {
  const headers = cors(origin);
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));
  res.status(status).json(body);
}

export default async function handler(req, res) {
  const origin = req.headers.origin || null;

  if (req.method === "OPTIONS") {
    Object.entries(cors(origin)).forEach(([k, v]) => res.setHeader(k, v));
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    send(res, origin, 405, { error: "Method not allowed." });
    return;
  }

  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  if (!url || !serviceKey) {
    send(res, origin, 503, { error: "Server is not configured for team creation." });
    return;
  }

  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  const token = m?.[1]?.trim();
  if (!token) {
    send(res, origin, 401, { error: "Unauthorized." });
    return;
  }

  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authUser, error: authErr } = await sb.auth.getUser(token);
  if (authErr || !authUser.user) {
    send(res, origin, 401, { error: "Unauthorized." });
    return;
  }

  const { data: profile, error: pErr } = await sb
    .from("profiles")
    .select("role")
    .eq("id", authUser.user.id)
    .maybeSingle();

  if (pErr || !profile || profile.role !== "super") {
    send(res, origin, 403, { error: "Only super admin can create team members." });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "").trim();
  const displayName = String(body.displayName || "").trim();
  const phone = String(body.phone || "").trim();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    send(res, origin, 400, { error: "Valid email is required." });
    return;
  }
  if (password.length < 8) {
    send(res, origin, 400, { error: "Password must be at least 8 characters." });
    return;
  }
  if (!displayName) {
    send(res, origin, 400, { error: "Display name is required." });
    return;
  }

  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      phone,
    },
  });

  if (createErr || !created.user) {
    send(res, origin, 400, { error: createErr?.message || "User creation failed." });
    return;
  }

  const { error: upErr } = await sb.from("profiles").upsert({
    id: created.user.id,
    email,
    role: "team",
    display_name: displayName,
    phone,
    updated_at: new Date().toISOString(),
  });

  if (upErr) {
    send(res, origin, 502, { error: upErr.message });
    return;
  }

  send(res, origin, 200, {
    ok: true,
    user: {
      id: created.user.id,
      email,
      role: "team",
      displayName,
      phone,
    },
  });
}
