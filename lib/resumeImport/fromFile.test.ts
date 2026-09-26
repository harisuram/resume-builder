import { importResumeFromFile } from "./fromFile";
import { extractResumeText } from "./extractText";
import { parseResumeText } from "./heuristic";

jest.mock("./extractText", () => {
  const actual = jest.requireActual("./extractText") as typeof import("./extractText");
  return {
    ...actual,
    extractResumeText: jest.fn(),
  };
});

jest.mock("./heuristic", () => {
  const actual = jest.requireActual("./heuristic") as typeof import("./heuristic");
  return {
    ...actual,
    parseResumeText: jest.fn(),
  };
});

const mockExtract = extractResumeText as jest.MockedFunction<typeof extractResumeText>;
const mockHeuristic = parseResumeText as jest.MockedFunction<typeof parseResumeText>;

function mockFetch(response: Partial<Response> & { json: () => Promise<unknown> }) {
  global.fetch = jest.fn().mockResolvedValue(response) as unknown as typeof fetch;
}

const FILE = new File(["Jordan Lee\nWork History\nEngineer"], "resume.txt", { type: "text/plain" });

const HEURISTIC = {
  basicInfo: {
    name: "Jordan Lee",
    email: "you@example.com",
    phone: "",
    location: "Austin, TX",
    links: {},
  },
  sections: { skills: ["Go"] },
  filled: ["basicInfo", "skills"] as const,
};

beforeEach(() => {
  localStorage.clear();
  mockExtract.mockResolvedValue("Jordan Lee\nWork History\nEngineer at Acme");
  mockHeuristic.mockReturnValue(HEURISTIC as never);
});

describe("importResumeFromFile", () => {
  it("merges the AI payload over the local parse", async () => {
    mockFetch({
      ok: true,
      status: 200,
      json: async () => ({
        resume: {
          basicInfo: { name: "Jordan Lee", email: "you@example.com", location: "Austin, TX" },
          experience: [{ company: "Acme", role: "Engineer", bullets: ["Shipped"] }],
        },
      }),
    });
    const imported = await importResumeFromFile(FILE);
    expect(imported.sections.experience?.[0].company).toBe("Acme");
    expect(imported.sections.skills).toEqual(["Go"]);
  });

  it("falls back to the local parse when the API fails", async () => {
    mockFetch({ ok: false, status: 502, json: async () => ({ error: "nope" }) });
    const imported = await importResumeFromFile(FILE);
    expect(imported.basicInfo.name).toBe("Jordan Lee");
    expect(imported.sections.skills).toEqual(["Go"]);
  });
});
