import { AI_LIMIT_MESSAGE } from "./ai";

/** Shared Groq rewrite used by the Next.js `next dev` route, the Cloudflare
 * Worker, and the Pages Function adapter. The API key never reaches the browser. */

export const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_MODEL = "openai/gpt-oss-120b";
export const MAX_BULLETS = 12;
export const MAX_BULLET_LEN = 300;
export const MAX_SUMMARY_LEN = 800;

export interface OptimizeEnv {
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
}

const BULLETS_SYSTEM_PROMPT =
  "You rewrite resume experience bullets to be ATS-friendly: strong action verbs, " +
  "one concise line each (under ~20 words), plain text with no markdown or special " +
  "characters. Keep any numbers already present; never invent facts, metrics, or " +
  "outcomes that aren't implied by the input. Return exactly as many bullets as " +
  'given, same order, as strict JSON: {"bullets": ["...", ...]}.';

const SUMMARY_SYSTEM_PROMPT =
  "You rewrite a professional resume summary to be ATS-friendly: 2–4 concise " +
  "sentences, plain text, no markdown, no first-person pronouns (no I/me/my). " +
  "Keep any numbers already present; never invent employers, titles, skills, " +
  "metrics, or outcomes that aren't implied by the input. Stay under 800 " +
  'characters. Return strict JSON: {"summary": "..."}.';

export function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export function parseBullets(content: string | undefined): string[] | null {
  if (!content) return null;
  const jsonText = extractJsonObject(content);
  if (!jsonText) return null;
  try {
    const parsed = JSON.parse(jsonText) as { bullets?: unknown };
    if (!Array.isArray(parsed.bullets)) return null;
    const bullets = parsed.bullets.filter((b): b is string => typeof b === "string" && b.trim().length > 0);
    return bullets.length > 0 ? bullets.map((b) => b.trim()) : null;
  } catch {
    return null;
  }
}

export function parseSummary(content: string | undefined): string | null {
  if (!content) return null;
  const jsonText = extractJsonObject(content);
  if (!jsonText) return null;
  try {
    const parsed = JSON.parse(jsonText) as { summary?: unknown };
    if (typeof parsed.summary !== "string") return null;
    const text = parsed.summary.trim();
    if (!text) return null;
    return text.length > MAX_SUMMARY_LEN ? text.slice(0, MAX_SUMMARY_LEN) : text;
  } catch {
    return null;
  }
}

export function extractJsonObject(content: string): string | null {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : trimmed).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  return candidate.slice(start, end + 1);
}

export function parseExperienceBody(body: unknown): { role: string; company: string; bullets: string[] } | { error: string } {
  const { role, company, bullets } = (body ?? {}) as { role?: unknown; company?: unknown; bullets?: unknown };
  const cleanBullets = Array.isArray(bullets)
    ? bullets
        .filter((b): b is string => typeof b === "string" && b.trim().length > 0 && b.length <= MAX_BULLET_LEN)
        .map((b) => b.trim())
    : [];
  if (typeof role !== "string" || typeof company !== "string" || cleanBullets.length === 0 || cleanBullets.length > MAX_BULLETS) {
    return { error: "Invalid experience data." };
  }
  return { role, company, bullets: cleanBullets };
}

export function parseSummaryBody(body: unknown): { summary: string } | { error: string } {
  const { summary } = (body ?? {}) as { summary?: unknown };
  if (typeof summary !== "string" || summary.trim().length === 0 || summary.length > MAX_SUMMARY_LEN) {
    return { error: "Invalid summary." };
  }
  return { summary: summary.trim() };
}

export interface GroqChatOptions {
  temperature?: number;
  maxCompletionTokens?: number;
  missingKeyError?: string;
}

export async function callGroqChat(
  env: OptimizeEnv,
  system: string,
  user: string,
  options: GroqChatOptions = {},
): Promise<{ content: string } | { error: string; status: number }> {
  if (!env.GROQ_API_KEY) {
    return {
      status: 503,
      error:
        options.missingKeyError ??
        "AI optimization isn't configured. Add GROQ_API_KEY to .env.local (local) or as a Cloudflare Worker secret (production).",
    };
  }

  let groqRes: Response;
  try {
    groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${env.GROQ_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        model: env.GROQ_MODEL || DEFAULT_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: options.temperature ?? 0.4,
        max_completion_tokens: options.maxCompletionTokens ?? 400,
      }),
    });
  } catch {
    return { status: 502, error: "Couldn't reach the AI service. Try again later." };
  }

  if (groqRes.status === 429) {
    return { status: 429, error: AI_LIMIT_MESSAGE };
  }
  if (!groqRes.ok) {
    return { status: 502, error: "AI optimization failed. Try again later." };
  }

  const data = (await groqRes.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return { status: 502, error: "AI response was malformed. Try again." };
  return { content };
}

export async function rewriteBulletsWithGroq(
  env: OptimizeEnv,
  input: { role: string; company: string; bullets: string[] },
): Promise<{ bullets: string[] } | { error: string; status: number }> {
  const userPrompt = `Role: ${input.role || "Unknown role"}\nCompany: ${input.company || "Unknown company"}\nBullets:\n${input.bullets
    .map((b, i) => `${i + 1}. ${b}`)
    .join("\n")}`;
  const result = await callGroqChat(env, BULLETS_SYSTEM_PROMPT, userPrompt);
  if ("error" in result) return result;
  const parsedBullets = parseBullets(result.content);
  if (!parsedBullets) return { status: 502, error: "AI response was malformed. Try again." };
  return { bullets: parsedBullets };
}

export async function rewriteSummaryWithGroq(
  env: OptimizeEnv,
  input: { summary: string },
): Promise<{ summary: string } | { error: string; status: number }> {
  const result = await callGroqChat(env, SUMMARY_SYSTEM_PROMPT, `Summary:\n${input.summary}`);
  if ("error" in result) return result;
  const parsed = parseSummary(result.content);
  if (!parsed) return { status: 502, error: "AI response was malformed. Try again." };
  return { summary: parsed };
}

export async function handleOptimizePost(request: Request, env: OptimizeEnv): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }

  const kind = (body as { kind?: unknown } | null)?.kind;
  if (kind === "summary") {
    const parsed = parseSummaryBody(body);
    if ("error" in parsed) return jsonResponse({ error: parsed.error }, 400);
    const result = await rewriteSummaryWithGroq(env, parsed);
    if ("error" in result) return jsonResponse({ error: result.error }, result.status);
    return jsonResponse({ summary: result.summary }, 200);
  }

  const parsed = parseExperienceBody(body);
  if ("error" in parsed) return jsonResponse({ error: parsed.error }, 400);

  const result = await rewriteBulletsWithGroq(env, parsed);
  if ("error" in result) return jsonResponse({ error: result.error }, result.status);
  return jsonResponse({ bullets: result.bullets }, 200);
}
