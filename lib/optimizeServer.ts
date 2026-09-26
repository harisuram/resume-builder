import { AI_LIMIT_MESSAGE, AI_MESSAGES, type AiErrorCode } from "./ai";

/** Shared Groq rewrite used by the Next.js `next dev` route, the Cloudflare
 * Worker, and the Pages Function adapter. The API key never reaches the browser. */

export const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
export const DEFAULT_MODEL = "openai/gpt-oss-120b";
export const MAX_BULLETS = 12;
export const MAX_BULLET_LEN = 300;
export const MAX_SUMMARY_LEN = 800;
/** Matches `MAX_DESCRIPTION_LENGTH` in validation.ts. */
export const MAX_PROJECT_DESCRIPTION_LEN = 600;

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

const PROJECT_SYSTEM_PROMPT =
  "You rewrite a resume project description to be ATS-friendly: 1–3 concise " +
  "sentences, plain text, no markdown, no first-person pronouns (no I/me/my). " +
  "Lead with what was built and the impact; weave in technologies already " +
  "listed when they fit naturally. Keep any numbers already present; never " +
  "invent features, metrics, or outcomes that aren't implied by the input. " +
  "Stay under 600 characters. Return strict JSON: {\"description\": \"...\"}.";

/** A failed rewrite: the HTTP status, a stable `code` the browser branches on,
 * and the user-facing `error` message shown in the toast. */
export interface AiFailure {
  status: number;
  code: AiErrorCode;
  error: string;
}

const fail = (status: number, code: AiErrorCode, error: string = AI_MESSAGES[code]): AiFailure => ({ status, code, error });

export function failureResponse(failure: AiFailure): Response {
  return jsonResponse({ error: failure.error, code: failure.code }, failure.status);
}

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

export function parseProjectDescription(content: string | undefined): string | null {
  if (!content) return null;
  const jsonText = extractJsonObject(content);
  if (!jsonText) return null;
  try {
    const parsed = JSON.parse(jsonText) as { description?: unknown };
    if (typeof parsed.description !== "string") return null;
    const text = parsed.description.trim();
    if (!text) return null;
    return text.length > MAX_PROJECT_DESCRIPTION_LEN ? text.slice(0, MAX_PROJECT_DESCRIPTION_LEN) : text;
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
    return { error: "Add at least one bullet to this role (up to 12, each under 300 characters), then try the AI rewrite." };
  }
  return { role, company, bullets: cleanBullets };
}

export function parseSummaryBody(body: unknown): { summary: string } | { error: string } {
  const { summary } = (body ?? {}) as { summary?: unknown };
  if (typeof summary !== "string" || summary.trim().length === 0 || summary.length > MAX_SUMMARY_LEN) {
    return { error: "Write your summary first (up to 800 characters), then try the AI rewrite." };
  }
  return { summary: summary.trim() };
}

export function parseProjectBody(
  body: unknown,
): { name: string; description: string; technologies: string[] } | { error: string } {
  const { name, description, technologies } = (body ?? {}) as {
    name?: unknown;
    description?: unknown;
    technologies?: unknown;
  };
  if (
    typeof name !== "string" ||
    typeof description !== "string" ||
    description.trim().length === 0 ||
    description.length > MAX_PROJECT_DESCRIPTION_LEN
  ) {
    return { error: "Add a project description (up to 600 characters), then try the AI rewrite." };
  }
  const techs = Array.isArray(technologies)
    ? technologies.filter((t): t is string => typeof t === "string" && t.trim().length > 0).map((t) => t.trim())
    : [];
  return { name: name.trim(), description: description.trim(), technologies: techs };
}

export interface GroqChatOptions {
  temperature?: number;
  maxCompletionTokens?: number;
  /** Setup hint logged (never shown to users) when GROQ_API_KEY is missing. */
  missingKeyError?: string;
}

/** gpt-oss models spend part of `max_completion_tokens` reasoning before they
 * answer. At the old 400-token cap a long summary ran out mid-answer and Groq
 * rejected it (`json_validate_failed`); low effort plus headroom fixes that. */
const REASONING_MODEL = /gpt-oss/i;
const DEFAULT_MAX_COMPLETION_TOKENS = 1500;

/** Pulls Groq's own error code/message out of a failed response for logging. */
async function groqErrorDetail(res: Response): Promise<{ code?: string; message?: string }> {
  try {
    const body = (await res.json()) as { error?: { code?: string; message?: string } };
    return { code: body.error?.code, message: body.error?.message };
  } catch {
    return {};
  }
}

/** Sorts a Groq HTTP failure into something the user can act on. */
export function classifyGroqFailure(status: number, detail: { code?: string; message?: string }): AiFailure {
  if (status === 429) return fail(429, "quota", AI_LIMIT_MESSAGE);
  const text = `${detail.code ?? ""} ${detail.message ?? ""}`.toLowerCase();
  if (text.includes("json_validate_failed") || text.includes("max completion tokens") || text.includes("max_tokens")) {
    return fail(502, "incomplete");
  }
  if (status === 413 || text.includes("context_length") || text.includes("too long")) return fail(413, "too_long");
  if (status === 401 || status === 403) return fail(503, "unavailable");
  if (status >= 500) return fail(503, "busy");
  return fail(502, "unavailable");
}

/** Groq's JSON mode occasionally rejects a generation that would pass on a
 * second try (`json_validate_failed`); one quiet retry turns most of those
 * into a result instead of an error toast. */
const RETRYABLE: ReadonlySet<AiFailure["code"]> = new Set(["incomplete", "malformed"]);

export async function callGroqChat(
  env: OptimizeEnv,
  system: string,
  user: string,
  options: GroqChatOptions = {},
): Promise<{ content: string } | AiFailure> {
  const first = await callGroqChatOnce(env, system, user, options);
  if ("content" in first || !RETRYABLE.has(first.code)) return first;
  return callGroqChatOnce(env, system, user, options);
}

async function callGroqChatOnce(
  env: OptimizeEnv,
  system: string,
  user: string,
  options: GroqChatOptions,
): Promise<{ content: string } | AiFailure> {
  if (!env.GROQ_API_KEY) {
    // The setup hint is for whoever runs the site, not for the person
    // writing a resume — it goes to the logs, the toast stays plain.
    console.error(
      options.missingKeyError ??
        "AI optimization isn't configured. Add GROQ_API_KEY to .env.local (local) or as a Cloudflare Worker secret (production).",
    );
    return fail(503, "not_configured");
  }

  const model = env.GROQ_MODEL || DEFAULT_MODEL;
  let groqRes: Response;
  try {
    groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${env.GROQ_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: options.temperature ?? 0.4,
        max_completion_tokens: options.maxCompletionTokens ?? DEFAULT_MAX_COMPLETION_TOKENS,
        ...(REASONING_MODEL.test(model) ? { reasoning_effort: "low" } : {}),
      }),
    });
  } catch (err) {
    console.error("[groq] request failed", err);
    return fail(503, "unreachable");
  }

  if (!groqRes.ok) {
    const detail = await groqErrorDetail(groqRes);
    console.error("[groq] error", groqRes.status, detail.code ?? "", detail.message ?? "");
    return classifyGroqFailure(groqRes.status, detail);
  }

  const data = (await groqRes.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;
  if (!content) return fail(502, "malformed");
  return { content };
}

export async function rewriteBulletsWithGroq(
  env: OptimizeEnv,
  input: { role: string; company: string; bullets: string[] },
): Promise<{ bullets: string[] } | AiFailure> {
  const userPrompt = `Role: ${input.role || "Unknown role"}\nCompany: ${input.company || "Unknown company"}\nBullets:\n${input.bullets
    .map((b, i) => `${i + 1}. ${b}`)
    .join("\n")}`;
  const result = await callGroqChat(env, BULLETS_SYSTEM_PROMPT, userPrompt);
  if ("error" in result) return result;
  const parsedBullets = parseBullets(result.content);
  if (!parsedBullets) return fail(502, "malformed");
  return { bullets: parsedBullets };
}

export async function rewriteSummaryWithGroq(
  env: OptimizeEnv,
  input: { summary: string },
): Promise<{ summary: string } | AiFailure> {
  const result = await callGroqChat(env, SUMMARY_SYSTEM_PROMPT, `Summary:\n${input.summary}`);
  if ("error" in result) return result;
  const parsed = parseSummary(result.content);
  if (!parsed) return fail(502, "malformed");
  return { summary: parsed };
}

export async function rewriteProjectWithGroq(
  env: OptimizeEnv,
  input: { name: string; description: string; technologies: string[] },
): Promise<{ description: string } | AiFailure> {
  const techLine = input.technologies.length > 0 ? input.technologies.join(", ") : "(none listed)";
  const userPrompt =
    `Project: ${input.name || "Untitled project"}\n` +
    `Technologies: ${techLine}\n` +
    `Description:\n${input.description}`;
  const result = await callGroqChat(env, PROJECT_SYSTEM_PROMPT, userPrompt);
  if ("error" in result) return result;
  const parsed = parseProjectDescription(result.content);
  if (!parsed) return fail(502, "malformed");
  return { description: parsed };
}

export async function handleOptimizePost(request: Request, env: OptimizeEnv): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: AI_MESSAGES.invalid, code: "invalid" }, 400);
  }

  const kind = (body as { kind?: unknown } | null)?.kind;
  if (kind === "summary") {
    const parsed = parseSummaryBody(body);
    if ("error" in parsed) return jsonResponse({ error: parsed.error, code: "invalid" }, 400);
    const result = await rewriteSummaryWithGroq(env, parsed);
    if ("error" in result) return failureResponse(result);
    return jsonResponse({ summary: result.summary }, 200);
  }

  if (kind === "project") {
    const parsed = parseProjectBody(body);
    if ("error" in parsed) return jsonResponse({ error: parsed.error, code: "invalid" }, 400);
    const result = await rewriteProjectWithGroq(env, parsed);
    if ("error" in result) return failureResponse(result);
    return jsonResponse({ description: result.description }, 200);
  }

  const parsed = parseExperienceBody(body);
  if ("error" in parsed) return jsonResponse({ error: parsed.error, code: "invalid" }, 400);

  const result = await rewriteBulletsWithGroq(env, parsed);
  if ("error" in result) return failureResponse(result);
  return jsonResponse({ bullets: result.bullets }, 200);
}
