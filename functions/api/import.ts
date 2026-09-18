import { handleImportPost } from "../../lib/importServer";
import { jsonResponse } from "../../lib/optimizeServer";
import { isThrottled } from "../../lib/optimizeThrottle";

interface Env {
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
}

/** Pages adapter — same handler as `workers/index.ts`. */
export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (isThrottled(ip)) return jsonResponse({ error: "Too many requests. Wait a moment and try again." }, 429);
  return handleImportPost(request, env);
}
