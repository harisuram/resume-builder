/** Thrown when the shared free AI quota is exhausted — callers use this to
 * hide the feature instead of surfacing it as a one-off failure. */
export class AiLimitError extends Error {}

export interface OptimizeBulletsInput {
  role: string;
  company: string;
  bullets: string[];
}

/** Rewrites one experience entry's bullets for ATS-friendliness via the
 * server-side Groq proxy at /api/optimize (a Cloudflare Pages Function —
 * the API key never reaches the browser). */
export async function optimizeExperienceBullets({ role, company, bullets }: OptimizeBulletsInput): Promise<string[]> {
  const res = await fetch("/api/optimize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role, company, bullets }),
  });

  if (res.status === 429) {
    throw new AiLimitError("AI optimization has hit today's free limit. Try again tomorrow.");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || "AI optimization failed. Try again later.");
  }

  const body = (await res.json()) as { bullets?: unknown };
  if (!Array.isArray(body.bullets) || body.bullets.some((b) => typeof b !== "string")) {
    throw new Error("AI optimization failed. Try again later.");
  }
  return body.bullets as string[];
}
