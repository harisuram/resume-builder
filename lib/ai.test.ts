import { AI_MESSAGES, AiError, AiLimitError, optimizeExperienceBullets, optimizeProjectDescription, optimizeSummary } from "./ai";

function mockFetch(response: Partial<Response> & { json: () => Promise<unknown> }) {
  global.fetch = jest.fn().mockResolvedValue(response) as unknown as typeof fetch;
}

describe("optimizeExperienceBullets", () => {
  const input = { role: "Engineer", company: "Acme", bullets: ["Did a thing"] };

  it("returns the rewritten bullets on success", async () => {
    mockFetch({ ok: true, status: 200, json: async () => ({ bullets: ["Shipped a thing"] }) });
    await expect(optimizeExperienceBullets(input)).resolves.toEqual(["Shipped a thing"]);
  });

  it("throws AiLimitError on 429 without needing a response body", async () => {
    mockFetch({ ok: false, status: 429, json: async () => ({}) });
    await expect(optimizeExperienceBullets(input)).rejects.toMatchObject({
      name: "AiLimitError",
      code: "quota",
      message: expect.stringMatching(/free AI rewrite limit is used up/i),
    });
    await expect(optimizeExperienceBullets(input)).rejects.toBeInstanceOf(AiLimitError);
  });

  it("throws with the server's error message on other failures", async () => {
    mockFetch({ ok: false, status: 502, json: async () => ({ error: "AI optimization failed. Try again later." }) });
    await expect(optimizeExperienceBullets(input)).rejects.toThrow("AI optimization failed. Try again later.");
  });

  it("says the rewrite came back unusable when the response body is malformed", async () => {
    mockFetch({ ok: true, status: 200, json: async () => ({ bullets: "not an array" }) });
    await expect(optimizeExperienceBullets(input)).rejects.toMatchObject({ code: "malformed", message: AI_MESSAGES.malformed });
  });

  it("treats the per-minute throttle as a short pause, not the used-up quota", async () => {
    mockFetch({ ok: false, status: 429, json: async () => ({ error: AI_MESSAGES.throttled, code: "throttled" }) });
    const err = await optimizeExperienceBullets(input).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AiError);
    expect(err).not.toBeInstanceOf(AiLimitError);
    expect(err).toMatchObject({ code: "throttled", message: AI_MESSAGES.throttled });
  });

  it("passes the server's reason code through", async () => {
    mockFetch({ ok: false, status: 502, json: async () => ({ error: AI_MESSAGES.incomplete, code: "incomplete" }) });
    await expect(optimizeExperienceBullets(input)).rejects.toMatchObject({ code: "incomplete", message: AI_MESSAGES.incomplete });
  });

  it("says the user is offline when the request never leaves the browser", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch")) as unknown as typeof fetch;
    const online = jest.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    await expect(optimizeExperienceBullets(input)).rejects.toMatchObject({ code: "offline", message: AI_MESSAGES.offline });
    online.mockReturnValue(true);
    await expect(optimizeExperienceBullets(input)).rejects.toMatchObject({ code: "unreachable", message: AI_MESSAGES.unreachable });
    online.mockRestore();
  });

  it("falls back to a clear message when the error body is empty", async () => {
    mockFetch({ ok: false, status: 500, json: async () => { throw new Error("no body"); } });
    await expect(optimizeExperienceBullets(input)).rejects.toMatchObject({ code: "unavailable", message: AI_MESSAGES.unavailable });
  });
});

describe("optimizeSummary", () => {
  it("returns the rewritten summary on success", async () => {
    mockFetch({ ok: true, status: 200, json: async () => ({ summary: "Staff backend engineer." }) });
    await expect(optimizeSummary("I work on backends.")).resolves.toBe("Staff backend engineer.");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/optimize",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ kind: "summary", summary: "I work on backends." }),
      }),
    );
  });

  it("throws AiLimitError on 429", async () => {
    mockFetch({ ok: false, status: 429, json: async () => ({}) });
    await expect(optimizeSummary("A summary.")).rejects.toBeInstanceOf(AiLimitError);
  });
});

describe("optimizeProjectDescription", () => {
  const input = {
    name: "Resume Builder",
    description: "I made a resume site.",
    technologies: ["React"],
  };

  it("returns the rewritten description on success", async () => {
    mockFetch({
      ok: true,
      status: 200,
      json: async () => ({ description: "Built a browser resume editor with live preview." }),
    });
    await expect(optimizeProjectDescription(input)).resolves.toBe(
      "Built a browser resume editor with live preview.",
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/optimize",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ kind: "project", ...input }),
      }),
    );
  });

  it("throws AiLimitError on 429", async () => {
    mockFetch({ ok: false, status: 429, json: async () => ({}) });
    await expect(optimizeProjectDescription(input)).rejects.toBeInstanceOf(AiLimitError);
  });
});
