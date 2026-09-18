import { parseResumeText } from "./heuristic";

const SAMPLE = `JORDAN LEE
jordan@email.com | +1 555-010-0199 | Austin, TX
linkedin.com/in/jordan | github.com/jordan

PROFESSIONAL SUMMARY
Backend engineer with 6 years building payments infrastructure.

WORK HISTORY
Software Engineer | Acme Corp | Jan 2020 – Present
- Shipped billing APIs

Intern, Brightline Analytics, Jun 2015 to Aug 2015
- Built a dashboard

ACADEMIC BACKGROUND
B.S. Computer Science, MIT, 2014 – 2018
GPA 3.8 / 4.0

TECHNICAL SKILLS
TypeScript, Go, PostgreSQL

LICENSES AND CERTIFICATIONS
AWS Certified Solutions Architect, Amazon, 2021

SPOKEN LANGUAGES
English – Native
Spanish (Professional)

INTERESTS
Chess, photography

VOLUNTEER EXPERIENCE
Habitat for Humanity — Crew lead, 2019
- Built housing
`;

describe("parseResumeText", () => {
  it("fills matching sections from synonym headings", () => {
    const parsed = parseResumeText(SAMPLE);
    expect(parsed.basicInfo.name).toMatch(/jordan lee/i);
    expect(parsed.basicInfo.email).toBe("jordan@email.com");
    expect(parsed.basicInfo.location).toMatch(/Austin/);
    expect(parsed.basicInfo.links.linkedin).toMatch(/linkedin.com\/in\/jordan/i);
    expect(parsed.sections.summary).toMatch(/Backend engineer/);
    expect(parsed.sections.experience?.[0]).toMatchObject({
      company: "Acme Corp",
      role: "Software Engineer",
      current: true,
    });
    expect(parsed.sections.internships?.[0].company).toBe("Brightline Analytics");
    expect(parsed.sections.education?.[0]).toMatchObject({ degree: "B.S. Computer Science", institution: "MIT" });
    expect(parsed.sections.skills).toEqual(expect.arrayContaining(["TypeScript", "Go", "PostgreSQL"]));
    expect(parsed.sections.certifications?.[0].name).toMatch(/AWS Certified/);
    expect(parsed.sections.languages?.map((l) => l.name)).toEqual(expect.arrayContaining(["English", "Spanish"]));
    expect(parsed.sections.hobbies).toEqual(expect.arrayContaining(["Chess", "photography"]));
    expect(parsed.sections.additional?.heading).toMatch(/volunteer/i);
    expect(parsed.filled).toEqual(
      expect.arrayContaining([
        "basicInfo",
        "summary",
        "experience",
        "internships",
        "education",
        "skills",
        "certifications",
        "languages",
        "hobbies",
        "additional",
      ]),
    );
  });
});
