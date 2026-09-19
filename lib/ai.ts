/** Thrown when the shared free AI quota is exhausted — callers use this to
 * hide the feature instead of surfacing it as a one-off failure. */
export class AiLimitError extends Error {}

/** Once the shared free quota is hit, hide the ATS button for a while.
 * Same key for experience, summary, and projects so one 429 backs off all. */
export const AI_LIMITED_UNTIL_KEY = "ai-optimize-limited-until";
export const AI_BACKOFF_MS = 4 * 60 * 60 * 1000;

/** Shown when Groq (or our own cap) refuses another rewrite. */
export const AI_LIMIT_MESSAGE =
  "The free AI rewrite limit is used up. Try another writing tool, or polish this section yourself.";

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

async function postOptimize(body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch("/api/optimize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    throw new AiLimitError(AI_LIMIT_MESSAGE);
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    throw new Error((errBody as { error?: string } | null)?.error || "AI optimization failed. Try again later.");
  }

  return (await res.json()) as Record<string, unknown>;
}

/** Rewrites one experience entry's bullets for ATS-friendliness via the
 * server-side Groq proxy at /api/optimize (a Cloudflare Worker — the API
 * key never reaches the browser). */
export async function optimizeExperienceBullets({ role, company, bullets }: OptimizeBulletsInput): Promise<string[]> {
  const body = await postOptimize({ role, company, bullets });
  if (!Array.isArray(body.bullets) || body.bullets.some((b) => typeof b !== "string")) {
    throw new Error("AI optimization failed. Try again later.");
  }
  return body.bullets as string[];
}

/** Rewrites the professional summary the same way as experience bullets. */
export async function optimizeSummary(summary: string): Promise<string> {
  const body = await postOptimize({ kind: "summary", summary });
  if (typeof body.summary !== "string" || !body.summary.trim()) {
    throw new Error("AI optimization failed. Try again later.");
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
    throw new Error("AI optimization failed. Try again later.");
  }
  return body.description;
}
