import { parseResumeText } from "./heuristic";

const SAMPLE = `JORDAN LEE
you@example.com | +1 555-010-0199 | Austin, TX
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
    expect(parsed.basicInfo.email).toBe("you@example.com");
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


describe("resumes without bullet characters (Word lists, plain PDFs)", () => {
  const WORD_STYLE = `Daniel Okafor-Hale
Leeds, United Kingdom | daniel.okaforhale@example.com | +44 7700 900123 | danielokaforhale.example.com
EMPLOYMENT HISTORY
Clinical Pharmacist
Wrenfield Community Hospital, March 2021 - Present
Reviewed medication charts for 30 inpatients a day
Led antimicrobial stewardship rounds that reduced broad-spectrum use by 12%
Pharmacy Intern
Corvid Health Pharmacy, July 2019 - June 2020
Dispensed prescriptions under supervision
EDUCATION & TRAINING
University of Bradford
Master of Pharmacy (MPharm), 2015 - 2019
STRENGTHS
Clear communicator
Calm under pressure
VOLUNTEERING
Community Health Volunteer
Leeds Food Bank, 2018 - 2020
Ran monthly blood-pressure checks`;

  it("groups each role around its dates, with the lines after as bullets", () => {
    const { sections } = parseResumeText(WORD_STYLE);
    expect(sections.experience).toEqual([
      expect.objectContaining({
        role: "Clinical Pharmacist",
        company: "Wrenfield Community Hospital",
        startDate: "2021-03",
        current: true,
        bullets: [
          "Reviewed medication charts for 30 inpatients a day",
          "Led antimicrobial stewardship rounds that reduced broad-spectrum use by 12%",
        ],
      }),
    ]);
    // The intern role moves to Internships.
    expect(sections.internships?.[0]).toMatchObject({ role: "Pharmacy Intern", company: "Corvid Health Pharmacy" });
  });

  it("finds the school wherever it sits in the education lines", () => {
    expect(parseResumeText(WORD_STYLE).sections.education?.[0]).toMatchObject({
      institution: "University of Bradford",
      degree: "Master of Pharmacy (MPharm)",
    });
  });

  it("maps a Strengths heading to soft skills and keeps a volunteering entry's title", () => {
    const { sections } = parseResumeText(WORD_STYLE);
    expect(sections.softSkills).toEqual(["Clear communicator", "Calm under pressure"]);
    expect(sections.additional?.items[0]).toMatchObject({
      title: "Community Health Volunteer",
      subtitle: "Leeds Food Bank",
      bullets: ["Ran monthly blood-pressure checks"],
    });
  });

  it("keeps a one-line header ('Role | Company | Dates') and doesn't steal the bullet above it", () => {
    const { sections } = parseResumeText(`Sam Lee
sam@example.com
WORK EXPERIENCE
Engineer | Acme | Jan 2021 - Present
Built the billing service.
Analyst | Beta Corp | 2018 - 2020
Wrote reports`);
    expect(sections.experience?.map((e) => [e.role, e.company, e.bullets])).toEqual([
      ["Engineer", "Acme", ["Built the billing service."]],
      ["Analyst", "Beta Corp", ["Wrote reports"]],
    ]);
  });
});

describe("contact details", () => {
  it("doesn't mistake the email for a website, and finds the real one", () => {
    const { basicInfo } = parseResumeText(`Daniel Okafor-Hale
Leeds, United Kingdom | daniel.okaforhale@example.com | danielokaforhale.example.com
SKILLS
Audit`);
    expect(basicInfo.email).toBe("daniel.okaforhale@example.com");
    expect(basicInfo.links.portfolio).toBe("danielokaforhale.example.com");
  });

  it("rejoins a profile link the PDF wrapped at a hyphen", () => {
    const { basicInfo } = parseResumeText(`Priya Raghavan
Pune, Maharashtra | priya@example.com | linkedin.com/in/priya-raghavan-
sample
SKILLS
SQL`);
    expect(basicInfo.links.linkedin).toBe("linkedin.com/in/priya-raghavan-sample");
  });

  it("takes a one-word location like Singapore", () => {
    const { basicInfo } = parseResumeText(`Mei Tan
Singapore | mei@example.com | +65 8123 4567
SKILLS
Revit`);
    expect(basicInfo.location).toBe("Singapore");
  });
});

describe("more heading wordings", () => {
  it.each([
    ["Trainings & Certifications", "certifications"],
    ["Courses and Certifications", "certifications"],
    ["Academic Credentials", "education"],
    ["Educational Qualifications", "education"],
    ["Key Strengths", "softSkills"],
    ["Languages Known", "languages"],
    ["Awards & Honours", "additional"],
  ])("%s → %s", async (heading, key) => {
    const { resolveSectionHeading } = await import("./synonyms");
    expect(resolveSectionHeading(heading)).toBe(key);
  });
});
