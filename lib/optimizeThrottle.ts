/** Best-effort per-IP throttle. State is scoped to one warm isolate, not
 * shared globally — it thins out a single spammy client, it isn't a hard cap.
 * Fine for the Cloudflare free plan; a KV namespace would add setup without
 * changing the Groq quota that actually bounds this endpoint. */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

export function isThrottled(ip: string, now = Date.now()): boolean {
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export function resetThrottleForTests(): void {
  hits.clear();
}
