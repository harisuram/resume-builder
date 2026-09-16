/**
 * @jest-environment node
 */
import { handleOptimizePost, parseBullets, parseExperienceBody, parseSummary, parseSummaryBody, rewriteBulletsWithGroq } from "./optimizeServer";

describe("parseBullets", () => {
  it("reads a raw JSON object", () => {
    expect(parseBullets('{"bullets":["Shipped a thing"]}')).toEqual(["Shipped a thing"]);
  });

  it("reads JSON wrapped in a markdown fence", () => {
    expect(parseBullets('```json\n{"bullets":["Led a team"]}\n```')).toEqual(["Led a team"]);
  });

  it("returns null for missing or empty bullets", () => {
    expect(parseBullets(undefined)).toBeNull();
    expect(parseBullets('{"bullets":[]}')).toBeNull();
    expect(parseBullets("not json")).toBeNull();
  });
});

describe("parseSummary", () => {
  it("reads a raw JSON object", () => {
    expect(parseSummary('{"summary":"Staff backend engineer."}')).toBe("Staff backend engineer.");
  });

  it("returns null for missing summary", () => {
    expect(parseSummary('{"bullets":["x"]}')).toBeNull();
    expect(parseSummary(undefined)).toBeNull();
  });
});

describe("parseSummaryBody", () => {
  it("accepts a non-empty summary", () => {
    expect(parseSummaryBody({ kind: "summary", summary: "  Backend engineer. " })).toEqual({
      summary: "Backend engineer.",
    });
  });

  it("rejects an empty summary", () => {
    expect(parseSummaryBody({ kind: "summary", summary: "  " })).toEqual({ error: "Invalid summary." });
  });
});

describe("parseExperienceBody", () => {
  it("accepts a role, company, and at least one bullet", () => {
    expect(parseExperienceBody({ role: "Eng", company: "Acme", bullets: [" Did a thing "] })).toEqual({
      role: "Eng",
      company: "Acme",
      bullets: ["Did a thing"],
    });
  });

  it("rejects empty or oversized input", () => {
    expect(parseExperienceBody({ role: "Eng", company: "Acme", bullets: [] })).toEqual({ error: "Invalid experience data." });
    expect(parseExperienceBody({ role: 1, company: "Acme", bullets: ["x"] })).toEqual({ error: "Invalid experience data." });
  });
});

describe("rewriteBulletsWithGroq", () => {
  const input = { role: "Eng", company: "Acme", bullets: ["Did a thing"] };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 503 when no API key is configured", async () => {
    await expect(rewriteBulletsWithGroq({}, input)).resolves.toMatchObject({ status: 503 });
  });

  it("returns rewritten bullets from Groq", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '{"bullets":["Shipped a thing"]}' } }] }),
    }) as unknown as typeof fetch;

    await expect(rewriteBulletsWithGroq({ GROQ_API_KEY: "gsk_test" }, input)).resolves.toEqual({
      bullets: ["Shipped a thing"],
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.groq.com/openai/v1/chat/completions",
      expect.objectContaining({ method: "POST" }),
    );
  });
});

describe("handleOptimizePost", () => {
  it("rejects invalid JSON", async () => {
    const res = await handleOptimizePost(new Request("http://localhost/api/optimize", { method: "POST", body: "nope" }), {
      GROQ_API_KEY: "gsk_test",
    });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid request body." });
  });

  it("routes kind=summary to a summary rewrite", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ choices: [{ message: { content: '{"summary":"Staff backend engineer."}' } }] }),
    }) as unknown as typeof fetch;

    const res = await handleOptimizePost(
      new Request("http://localhost/api/optimize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "summary", summary: "I work on backends." }),
      }),
      { GROQ_API_KEY: "gsk_test" },
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ summary: "Staff backend engineer." });
  });
});
