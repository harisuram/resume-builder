/**
 * @jest-environment node
 */
import { AI_MESSAGES } from "./ai";
import {
  classifyGroqFailure,
  rewriteSummaryWithGroq,
  handleOptimizePost,
  parseBullets,
  parseExperienceBody,
  parseProjectBody,
  parseProjectDescription,
  parseSummary,
  parseSummaryBody,
  rewriteBulletsWithGroq,
} from "./optimizeServer";

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
    expect(parseSummaryBody({ kind: "summary", summary: "  " })).toEqual({ error: "Write your summary first (up to 800 characters), then try the AI rewrite." });
  });
});

describe("parseProjectDescription", () => {
  it("reads a raw JSON object", () => {
    expect(parseProjectDescription('{"description":"Built a resume editor."}')).toBe("Built a resume editor.");
  });

  it("returns null for missing description", () => {
    expect(parseProjectDescription('{"summary":"x"}')).toBeNull();
    expect(parseProjectDescription(undefined)).toBeNull();
  });
});

describe("parseProjectBody", () => {
  it("accepts a name, description, and optional technologies", () => {
    expect(
      parseProjectBody({
        kind: "project",
        name: " Resume Builder ",
        description: "  Built a thing. ",
        technologies: [" React ", "", 1],
      }),
    ).toEqual({
      name: "Resume Builder",
      description: "Built a thing.",
      technologies: ["React"],
    });
  });

  it("rejects an empty description", () => {
    expect(parseProjectBody({ kind: "project", name: "P", description: "  " })).toEqual({
      error: "Add a project description (up to 600 characters), then try the AI rewrite.",
    });
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
    expect(parseExperienceBody({ role: "Eng", company: "Acme", bullets: [] })).toEqual({ error: "Add at least one bullet to this role (up to 12, each under 300 characters), then try the AI rewrite." });
    expect(parseExperienceBody({ role: 1, company: "Acme", bullets: ["x"] })).toEqual({ error: "Add at least one bullet to this role (up to 12, each under 300 characters), then try the AI rewrite." });
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
    await expect(res.json()).resolves.toEqual({ error: AI_MESSAGES.invalid, code: "invalid" });
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

  it("routes kind=project to a project description rewrite", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: '{"description":"Built a browser resume editor with live preview."}' } }],
      }),
    }) as unknown as typeof fetch;

    const res = await handleOptimizePost(
      new Request("http://localhost/api/optimize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "project",
          name: "Resume Builder",
          description: "I made a resume site.",
          technologies: ["React", "TypeScript"],
        }),
      }),
      { GROQ_API_KEY: "gsk_test" },
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      description: "Built a browser resume editor with live preview.",
    });
  });
});

describe("Groq request settings", () => {
  const groqOk = (content: string) =>
    jest.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content } }] }) });

  it("leaves reasoning room on gpt-oss so a long summary can finish", async () => {
    const fetchMock = groqOk('{"summary":"Staff backend engineer."}');
    global.fetch = fetchMock as unknown as typeof fetch;
    await rewriteSummaryWithGroq({ GROQ_API_KEY: "gsk_test", GROQ_MODEL: "openai/gpt-oss-120b" }, { summary: "x".repeat(790) });
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    // The old 400-token cap ran out mid-answer on long summaries (Groq 400 json_validate_failed).
    expect(sent.max_completion_tokens).toBeGreaterThanOrEqual(1500);
    expect(sent.reasoning_effort).toBe("low");
  });

  it("doesn't send reasoning_effort to models that don't take it", async () => {
    const fetchMock = groqOk('{"summary":"Staff backend engineer."}');
    global.fetch = fetchMock as unknown as typeof fetch;
    await rewriteSummaryWithGroq({ GROQ_API_KEY: "gsk_test", GROQ_MODEL: "llama-3.3-70b-versatile" }, { summary: "Hi" });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).not.toHaveProperty("reasoning_effort");
  });
});

describe("classifyGroqFailure", () => {
  it("sorts Groq failures into reasons the user can act on", () => {
    expect(classifyGroqFailure(429, {})).toMatchObject({ status: 429, code: "quota" });
    expect(classifyGroqFailure(400, { code: "json_validate_failed", message: "max completion tokens reached" })).toMatchObject({
      code: "incomplete",
      error: AI_MESSAGES.incomplete,
    });
    expect(classifyGroqFailure(400, { code: "context_length_exceeded" })).toMatchObject({ code: "too_long" });
    expect(classifyGroqFailure(401, { code: "invalid_api_key" })).toMatchObject({ status: 503, code: "unavailable" });
    expect(classifyGroqFailure(503, {})).toMatchObject({ status: 503, code: "busy" });
    expect(classifyGroqFailure(400, {})).toMatchObject({ code: "unavailable" });
  });

  it("reports a truncated Groq answer to the browser as incomplete, with its reason code", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: { code: "json_validate_failed", message: "max completion tokens reached before generating a valid document" } }),
    }) as unknown as typeof fetch;
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await handleOptimizePost(
      new Request("http://localhost/api/optimize", { method: "POST", body: JSON.stringify({ kind: "summary", summary: "A summary." }) }),
      { GROQ_API_KEY: "gsk_test" },
    );
    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ error: AI_MESSAGES.incomplete, code: "incomplete" });
    expect(errorLog).toHaveBeenCalledWith("[groq] error", 400, "json_validate_failed", expect.any(String));
    errorLog.mockRestore();
  });

  it("keeps the setup hint out of the toast when the key is missing", async () => {
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
    const result = await rewriteSummaryWithGroq({}, { summary: "A summary." });
    expect(result).toMatchObject({ status: 503, code: "not_configured", error: AI_MESSAGES.not_configured });
    expect(JSON.stringify(result)).not.toMatch(/GROQ_API_KEY|\.env/);
    expect(errorLog).toHaveBeenCalledWith(expect.stringContaining("GROQ_API_KEY"));
    errorLog.mockRestore();
  });
});


describe("retrying a rejected JSON generation", () => {
  const groq400 = {
    ok: false,
    status: 400,
    json: async () => ({ error: { code: "json_validate_failed", message: "Failed to generate JSON" } }),
  };
  const groq200 = { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: '{"summary":"Fixed."}' } }] }) };

  beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("tries once more and returns the second answer", async () => {
    const fetchMock = jest.fn().mockResolvedValueOnce(groq400).mockResolvedValueOnce(groq200);
    global.fetch = fetchMock as unknown as typeof fetch;
    await expect(rewriteSummaryWithGroq({ GROQ_API_KEY: "gsk_test" }, { summary: "A summary." })).resolves.toEqual({ summary: "Fixed." });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("gives up after the second rejection", async () => {
    const fetchMock = jest.fn().mockResolvedValue(groq400);
    global.fetch = fetchMock as unknown as typeof fetch;
    await expect(rewriteSummaryWithGroq({ GROQ_API_KEY: "gsk_test" }, { summary: "A summary." })).resolves.toMatchObject({ code: "incomplete" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("doesn't retry the used-up quota", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
    global.fetch = fetchMock as unknown as typeof fetch;
    await expect(rewriteSummaryWithGroq({ GROQ_API_KEY: "gsk_test" }, { summary: "A summary." })).resolves.toMatchObject({ code: "quota" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
