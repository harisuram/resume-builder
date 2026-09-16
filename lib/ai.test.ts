import { AiLimitError, optimizeExperienceBullets } from "./ai";

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
    await expect(optimizeExperienceBullets(input)).rejects.toBeInstanceOf(AiLimitError);
  });

  it("throws with the server's error message on other failures", async () => {
    mockFetch({ ok: false, status: 502, json: async () => ({ error: "AI optimization failed. Try again later." }) });
    await expect(optimizeExperienceBullets(input)).rejects.toThrow("AI optimization failed. Try again later.");
  });

  it("throws a generic error when the response body is malformed", async () => {
    mockFetch({ ok: true, status: 200, json: async () => ({ bullets: "not an array" }) });
    await expect(optimizeExperienceBullets(input)).rejects.toThrow("AI optimization failed. Try again later.");
  });
});
