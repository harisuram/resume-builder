import { handleOptimizePost, jsonResponse } from "../../lib/optimizeServer";

interface Env {
  GROQ_API_KEY?: string;
  GROQ_MODEL?: string;
}

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

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  if (isThrottled(ip)) return jsonResponse({ error: "Too many requests. Wait a moment and try again." }, 429);
  return handleOptimizePost(request, env);
}
