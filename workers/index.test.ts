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
