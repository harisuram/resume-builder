import { handleOptimizePost, jsonResponse } from "../../lib/optimizeServer";
import { isThrottled } from "../../lib/optimizeThrottle";

interface Env {
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
}

/** Pages adapter — same handler as `workers/index.ts`. Prefer `wrangler deploy`
 * (Workers + static assets) on the free plan; this file keeps a Git-connected
 * Pages project working if that is how the site is already hosted. */
export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (isThrottled(ip)) return jsonResponse({ error: "Too many requests. Wait a moment and try again." }, 429);
  return handleOptimizePost(request, env);
}
