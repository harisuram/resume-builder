/**
 * @jest-environment node
 */
import worker from "./index";
import { resetThrottleForTests } from "../lib/optimizeThrottle";

const env: Env = { GROQ_API_KEY: "", GROQ_MODEL: "openai/gpt-oss-120b" };

function post(path: string, body: unknown = {}) {
  return worker.fetch(new Request(`https://example.com${path}`, { method: "POST", body: JSON.stringify(body) }), env);
}

beforeEach(() => {
  resetThrottleForTests();
});

describe("optimize Worker", () => {
  it("404s unknown API paths so they never proxy to Groq", async () => {
    const res = await post("/api/other");
    expect(res.status).toBe(404);
  });

  it("rejects non-POST on /api/optimize", async () => {
    const res = await worker.fetch(new Request("https://example.com/api/optimize"), env);
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("POST");
  });

  it("rejects non-POST on /api/import", async () => {
    const res = await worker.fetch(new Request("https://example.com/api/import"), env);
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("POST");
  });

  it("returns 503 on /api/import when the Groq secret is not configured", async () => {
    const res = await post("/api/import", { text: "Jordan Lee\nSoftware Engineer\nWork History\nAcme Corp" });
    expect(res.status).toBe(503);
  });
});

describe("per-minute throttle", () => {
  it("answers 429 with code 'throttled' so the browser doesn't mistake it for the used-up quota", async () => {
    resetThrottleForTests();
    const call = () =>
      worker.fetch(
        new Request("https://example.com/api/optimize", { method: "POST", headers: { "cf-connecting-ip": "203.0.113.9" }, body: "{}" }),
        env,
      );
    for (let i = 0; i < 5; i++) await call();
    const res = await call();
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("60");
    await expect(res.json()).resolves.toMatchObject({ code: "throttled" });
  });
});
