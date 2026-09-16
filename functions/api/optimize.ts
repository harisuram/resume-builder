// Cloudflare Pages Function — the only server-side code in this otherwise
// fully static (output: "export") app. Keeps GROQ_API_KEY off the client
// and proxies a single, tightly-scoped rewrite request to Groq's free tier.

interface Env {
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
}

const MAX_BULLETS = 12;
const MAX_BULLET_LEN = 300;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT =
  "You rewrite resume experience bullets to be ATS-friendly: strong action verbs, " +
  "one concise line each (under ~20 words), plain text with no markdown or special " +
  "characters. Keep any numbers already present; never invent facts, metrics, or " +
  "outcomes that aren't implied by the input. Return exactly as many bullets as " +
  'given, same order, as strict JSON: {"bullets": ["...", ...]}.';

// Best-effort per-IP throttle. State is scoped to one warm isolate, not
// shared globally — it thins out a single spammy client, it isn't a hard cap.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function isThrottled(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function parseBullets(content: string | undefined): string[] | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content) as { bullets?: unknown };
    if (!Array.isArray(parsed.bullets)) return null;
    const bullets = parsed.bullets.filter((b): b is string => typeof b === "string" && b.trim().length > 0);
    return bullets.length > 0 ? bullets.map((b) => b.trim()) : null;
  } catch {
    return null;
  }
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  if (!env.GROQ_API_KEY) return json({ error: "AI optimization isn't configured." }, 503);

  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (isThrottled(ip)) return json({ error: "Too many requests. Wait a moment and try again." }, 429);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  const { role, company, bullets } = (body ?? {}) as { role?: unknown; company?: unknown; bullets?: unknown };
  const cleanBullets = Array.isArray(bullets)
    ? bullets.filter((b): b is string => typeof b === "string" && b.trim().length > 0 && b.length <= MAX_BULLET_LEN).map((b) => b.trim())
    : [];
  if (typeof role !== "string" || typeof company !== "string" || cleanBullets.length === 0 || cleanBullets.length > MAX_BULLETS) {
    return json({ error: "Invalid experience data." }, 400);
  }

  const userPrompt = `Role: ${role || "Unknown role"}\nCompany: ${company || "Unknown company"}\nBullets:\n${cleanBullets
    .map((b, i) => `${i + 1}. ${b}`)
    .join("\n")}`;

  let groqRes: Response;
  try {
    groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${env.GROQ_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: env.GROQ_MODEL || DEFAULT_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
        max_completion_tokens: 400,
      }),
    });
  } catch {
    return json({ error: "Couldn't reach the AI service. Try again later." }, 502);
  }

  if (groqRes.status === 429) return json({ error: "AI optimization has hit today's free limit. Try again tomorrow." }, 429);
  if (!groqRes.ok) return json({ error: "AI optimization failed. Try again later." }, 502);

  const data = (await groqRes.json()) as { choices?: { message?: { content?: string } }[] };
  const parsedBullets = parseBullets(data.choices?.[0]?.message?.content);
  if (!parsedBullets) return json({ error: "AI response was malformed. Try again." }, 502);

  return json({ bullets: parsedBullets }, 200);
}
