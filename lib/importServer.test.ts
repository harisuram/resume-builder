/**
 * @jest-environment node
 */
import { handleImportPost, parseImportBody, parseImportedResumeContent } from "./importServer";

describe("parseImportBody", () => {
  it("accepts a long enough string and rejects junk", () => {
    expect(parseImportBody({ text: "x".repeat(10) })).toEqual({ error: "That resume is too short to parse." });
    expect(parseImportBody({ text: 1 })).toEqual({ error: "Invalid resume text." });
    const parsed = parseImportBody({ text: `Jordan Lee\n${"Experience\n".repeat(8)}` });
    expect(parsed).toEqual({ text: expect.stringContaining("Jordan Lee") });
  });
});

describe("parseImportedResumeContent", () => {
  it("normalizes fenced JSON from the model", () => {
    const resume = parseImportedResumeContent(
      '```json\n{"basicInfo":{"name":"Jamie","email":"jamie@example.com","location":"Austin, TX"},"technicalSkills":["Go"]}\n```',
    );
    expect(resume?.basicInfo.name).toBe("Jamie");
    expect(resume?.sections.skills).toEqual(["Go"]);
  });

  it("returns null when nothing usable is present", () => {
    expect(parseImportedResumeContent("not json")).toBeNull();
    expect(parseImportedResumeContent('{"foo":1}')).toBeNull();
  });
});

describe("handleImportPost", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("rejects invalid JSON", async () => {
    const res = await handleImportPost(new Request("http://localhost/api/import", { method: "POST", body: "nope" }), {
      GROQ_API_KEY: "gsk_test",
    });
    expect(res.status).toBe(400);
  });

  it("returns 503 when the Groq secret is not configured", async () => {
    const res = await handleImportPost(
      new Request("http://localhost/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "Jordan Lee\nSoftware Engineer\nWork History\nAcme" }),
      }),
      {},
    );
    expect(res.status).toBe(503);
  });

  it("returns a normalized resume from Groq", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                basicInfo: { name: "Jamie", email: "jamie@example.com", location: "Austin, TX" },
                workExperience: [{ company: "Acme", role: "Eng", bullets: ["Shipped"] }],
              }),
            },
          },
        ],
      }),
    }) as unknown as typeof fetch;

    const res = await handleImportPost(
      new Request("http://localhost/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "Jamie\nAustin, TX\nWork History\nEng at Acme\n- Shipped" }),
      }),
      { GROQ_API_KEY: "gsk_test" },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { resume: { sections: { experience: unknown[] } } };
    expect(body.resume.sections.experience).toHaveLength(1);
  });
});
