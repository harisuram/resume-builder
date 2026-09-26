/** Why a rewrite failed. The server sends one of these as `code`; the
 * browser adds `offline` and `throttled` from what it sees itself. */
export type AiErrorCode =
  | "invalid"
  | "not_configured"
  | "unreachable"
  | "offline"
  | "busy"
  | "unavailable"
  | "incomplete"
  | "too_long"
  | "malformed"
  | "throttled"
  | "quota";

/** What the toast says for each failure: what happened and what to do next.
 * Every one that leaves the text alone says so, since the rewrite replaces
 * the field in place. */
export const AI_MESSAGES: Record<AiErrorCode, string> = {
  invalid: "There's nothing to rewrite yet. Add some text first, then try the AI rewrite.",
  not_configured: "AI rewrite isn't available right now. Your text wasn't changed, so keep editing it yourself.",
  unreachable: "Couldn't reach the AI service. Check your connection and try again. Your text wasn't changed.",
  offline: "You're offline. Reconnect to the internet, then try the AI rewrite again. Your text wasn't changed.",
  busy: "The AI service is busy right now. Try again in a minute. Your text wasn't changed.",
  unavailable: "The AI rewrite didn't work this time. Try again in a moment. Your text wasn't changed.",
  incomplete: "The AI couldn't finish this rewrite. Try again, or shorten the text a little. Your text wasn't changed.",
  too_long: "This is too long for the AI to rewrite in one go. Shorten it a little and try again.",
  malformed: "The AI sent back a rewrite it couldn't use. Try again. Your text wasn't changed.",
  throttled: "You're rewriting quickly. Wait a minute, then try again. Your text wasn't changed.",
  quota: "The free AI rewrite limit is used up. Try another writing tool, or polish this section yourself.",
};

/** A rewrite that failed, with the reason callers can branch on. */
export class AiError extends Error {
  constructor(
    message: string,
    readonly code: AiErrorCode,
  ) {
    super(message);
    this.name = "AiError";
  }
}

/** Thrown when the shared free AI quota is exhausted — callers use this to
 * hide the feature instead of surfacing it as a one-off failure. */
export class AiLimitError extends AiError {
  constructor(message: string = AI_MESSAGES.quota) {
    super(message, "quota");
    this.name = "AiLimitError";
  }
}

/** Once the shared free quota is hit, hide the ATS button for a while.
 * Same key for experience, summary, and projects so one 429 backs off all. */
export const AI_LIMITED_UNTIL_KEY = "ai-optimize-limited-until";
export const AI_BACKOFF_MS = 4 * 60 * 60 * 1000;

/** Shown when Groq's shared free quota refuses another rewrite. */
export const AI_LIMIT_MESSAGE = AI_MESSAGES.quota;

export interface OptimizeBulletsInput {
  role: string;
  company: string;
  bullets: string[];
}

export interface OptimizeProjectInput {
  name: string;
  description: string;
  technologies?: string[];
}

const isAiErrorCode = (value: unknown): value is AiErrorCode =>
  typeof value === "string" && Object.hasOwn(AI_MESSAGES, value);

/** Turns a failed /api/* response into an AiError. A 429 is only the shared
 * quota when the server says so — our own per-minute throttle also answers
 * 429, and treating that as "limit used up" hid the button for hours after a
 * few quick clicks. */
export async function aiErrorFromResponse(res: Response): Promise<AiError> {
  const body = (await res.json().catch(() => null)) as { error?: unknown; code?: unknown } | null;
  const code: AiErrorCode = isAiErrorCode(body?.code) ? body.code : res.status === 429 ? "quota" : "unavailable";
  const message = typeof body?.error === "string" && body.error ? body.error : AI_MESSAGES[code];
  return code === "quota" ? new AiLimitError(message) : new AiError(message, code);
}

/** A fetch that never reached the server: offline, or the network dropped. */
export function aiNetworkError(): AiError {
  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  return new AiError(AI_MESSAGES[offline ? "offline" : "unreachable"], offline ? "offline" : "unreachable");
}

async function postOptimize(body: unknown): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch("/api/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw aiNetworkError();
  }
  if (!res.ok) throw await aiErrorFromResponse(res);
  return (await res.json()) as Record<string, unknown>;
}

/** Rewrites one experience entry's bullets for ATS-friendliness via the
 * server-side Groq proxy at /api/optimize (a Cloudflare Worker — the API
 * key never reaches the browser). */
export async function optimizeExperienceBullets({ role, company, bullets }: OptimizeBulletsInput): Promise<string[]> {
  const body = await postOptimize({ role, company, bullets });
  if (!Array.isArray(body.bullets) || body.bullets.some((b) => typeof b !== "string")) {
    throw new AiError(AI_MESSAGES.malformed, "malformed");
  }
  return body.bullets as string[];
}

/** Rewrites the professional summary the same way as experience bullets. */
export async function optimizeSummary(summary: string): Promise<string> {
  const body = await postOptimize({ kind: "summary", summary });
  if (typeof body.summary !== "string" || !body.summary.trim()) {
    throw new AiError(AI_MESSAGES.malformed, "malformed");
  }
  return body.summary;
}

/** Rewrites one project's description the same way as the summary. */
export async function optimizeProjectDescription({
  name,
  description,
  technologies = [],
}: OptimizeProjectInput): Promise<string> {
  const body = await postOptimize({ kind: "project", name, description, technologies });
  if (typeof body.description !== "string" || !body.description.trim()) {
    throw new AiError(AI_MESSAGES.malformed, "malformed");
  }
  return body.description;
}
