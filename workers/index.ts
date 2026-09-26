import { AI_MESSAGES } from "../lib/ai";
import { handleImportPost } from "../lib/importServer";
import { handleOptimizePost, jsonResponse } from "../lib/optimizeServer";
import { isThrottled } from "../lib/optimizeThrottle";

/** Only `/api/*` reaches this Worker (`run_worker_first` in wrangler.jsonc).
 * Everything else is a static asset on the free CDN. */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const handler = url.pathname === "/api/optimize" ? handleOptimizePost : url.pathname === "/api/import" ? handleImportPost : null;
    if (!handler) {
      return jsonResponse({ error: "Not found." }, 404);
    }
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed." }), {
        status: 405,
        headers: { "content-type": "application/json", allow: "POST" },
      });
    }

    const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
    if (isThrottled(ip)) {
      // `code: "throttled"` tells the browser this is a per-minute pause, not
      // the shared quota running out, so it doesn't hide the AI button.
      return new Response(JSON.stringify({ error: AI_MESSAGES.throttled, code: "throttled" }), {
        status: 429,
        headers: { "content-type": "application/json", "retry-after": "60" },
      });
    }

    return handler(request, {
      GROQ_API_KEY: env.GROQ_API_KEY,
      GROQ_MODEL: env.GROQ_MODEL,
    });
  },
};
