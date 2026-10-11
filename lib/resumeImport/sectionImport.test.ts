import { useBuilderStore } from "../store";
import { parseResumeText } from "./heuristic";
import { normalizeParsedResume } from "./normalize";
import { isLikelySectionHeading, resolveSectionHeading } from "./synonyms";

/**
 * Importing a resume whose section titles aren't the builder's own words.
 * The AI pass reads any wording; these cover the built-in parser, which is
 * all an import gets when the AI pass doesn't run (no key, quota used up,
 * offline) — and which every import runs first underneath the AI result.
 */

describe("section titles a resume might use", () => {
  const TITLES: Record<string, string[]> = {
    summary: ["Summary", "Professional Summary", "Career Objective", "Objective", "Profile", "About Me", "Career Summary", "Executive Summary"],
    experience: ["Experience", "Work Experience", "Professional Experience", "Work History", "Employment History", "Career History", "Relevant Experience"],
    education: ["Education", "Academic Background", "Educational Qualifications", "Academic Qualifications", "Qualifications", "Education & Training"],
    skills: [
      "Skills",
      "PROFESSIONAL SKILLS",
      "Technical Skills",
      "Key Skills:",
      "Core Competencies",
      "Areas of Expertise",
      "Tech Stack",
      "Tools & Technologies",
      "Skills & Tools",
      "Skill Set",
      "Skillset",
      "Relevant Skills",
      "My Skills",
      "Software Skills",
      "Digital Skills",
      "Technical Expertise",
      "Specialties",
      "Specialisations",
      "Proficiencies",
      "Toolkit",
    ],
    projects: ["Projects", "Academic Projects", "Personal Projects", "Key Projects", "Projects Undertaken", "Selected Projects"],
    internships: ["Internships", "Internship Experience", "Internship"],
    partTime: ["Part-time Work", "Part-Time Experience"],
    certifications: ["Certifications", "Certificates", "Licenses & Certifications", "Certifications & Trainings", "Courses & Certifications"],
    patents: ["Patents", "Intellectual Property"],
    languages: ["Languages", "Languages Known", "Language Proficiency", "Spoken Languages", "LANGUAGE SKILLS"],
    hobbies: ["Hobbies", "Interests", "Hobbies & Interests"],
    softSkills: ["Soft Skills", "Strengths", "Interpersonal Skills", "COMMUNICATION SKILLS", "Leadership Skills", "People Skills"],
    keyAchievements: ["Achievements", "Key Achievements", "Accomplishments", "Awards & Achievements"],
    personalDetails: ["Personal Details", "Personal Information", "Personal Particulars", "Personal Data", "Personal Info"],
  };

  for (const [section, titles] of Object.entries(TITLES)) {
    it.each(titles)(`"%s" starts the ${section} section`, (title) => {
      expect(isLikelySectionHeading(title)).toBe(true);
      expect(resolveSectionHeading(title)).toBe(section);
    });
  }

  describe("any other heading ending in Skills", () => {
    it.each(["MANAGEMENT SKILLS", "COMPUTER SKILLS", "Design Skills:", "SKILLS AND ABILITIES", "MARKETING SKILL SET"])(
      '"%s" is the skills section, written as a heading',
      (title) => {
        expect(resolveSectionHeading(title)).toBe("skills");
      },
    );

    it("leaves the more specific sections their own titles", () => {
      expect(resolveSectionHeading("SOFT SKILLS")).toBe("softSkills");
      expect(resolveSectionHeading("INTERPERSONAL SKILLS")).toBe("softSkills");
      expect(resolveSectionHeading("LANGUAGE SKILLS")).toBe("languages");
    });

    it("doesn't take a plain list item ending in 'skills' for a heading", () => {
      expect(resolveSectionHeading("Negotiation skills")).toBeNull();
      expect(resolveSectionHeading("Strong analytical and problem solving skills")).toBeNull();
    });
  });

  it("keeps a heading it doesn't know as its own section, under that title", () => {
    const parsed = parseResumeText(`ASHA RAO
asha@example.com | +91 98765 43210 | Pune

EXTRACURRICULAR ACTIVITIES
- Captain, college cricket team
- Volunteer, city marathon`);
    expect(parsed.sections.additional?.heading).toMatch(/extracurricular activities/i);
    // Both lines kept, as the bullets of one entry under that heading.
    expect(parsed.sections.additional?.items.flatMap((item) => item.bullets)).toEqual([
      "Captain, college cricket team",
      "Volunteer, city marathon",
    ]);
  });

  it.each([
    "Software Engineer | Acme Corp",
    "Senior Software Engineer",
    "React, Node, SQL",
    "B.Tech in Computer Science",
    "Date of Birth: 12 March 1995",
    "Gender: Female",
  ])('treats "%s" as body text, not a heading', (line) => {
    expect(isLikelySectionHeading(line)).toBe(false);
  });
});

/** An Indian-style CV: personal details, "Languages Known", grouped skills
 * under "Skill Set", and titles that are rarely the builder's own. */
const INDIAN_CV = `ASHA RAO
asha.rao@example.com | +91 98765 43210 | Pune, Maharashtra
linkedin.com/in/asha-rao-sample

CAREER OBJECTIVE
Data analyst with 3 years turning messy sales data into weekly decisions.

WORK HISTORY
Data Analyst | Northwind Retail | Jun 2022 – Present
- Built the weekly sales dashboard used by 40 store managers
- Cut report preparation time from two days to two hours

ACADEMIC BACKGROUND
B.Tech, Computer Science | Example Institute of Technology | 2018 – 2022

SKILL SET
Languages: Python, SQL, R
Visualisation: Power BI, Tableau
Tools: Excel, Git

PROJECTS UNDERTAKEN
Churn predictor
Predicted subscriber churn from usage logs with 87% precision.

CERTIFICATIONS & TRAININGS
Google Data Analytics Certificate | Google | 2022

LANGUAGES KNOWN
English (Fluent), Hindi (Native), Marathi (Native)

HOBBIES & INTERESTS
Chess, Trekking

STRENGTHS
Attention to detail, Clear communication

PERSONAL DETAILS
Date of Birth: 12 March 2000
Gender: Female
Marital Status: Single
Nationality: Indian
Father's Name: R. Rao`;

/** A US-style resume with a different set of titles, and grouped skills
 * that include a "Languages:" line of programming languages. */
const US_RESUME = `JORDAN LEE
jordan@example.com | +1 555-010-0199 | Austin, TX

PROFESSIONAL SUMMARY
Backend engineer with 6 years building payments infrastructure.

PROFESSIONAL EXPERIENCE
Senior Software Engineer | Acme Payments | Jan 2020 – Present
- Led the ledger rewrite that cut settlement time from hours to minutes

INTERNSHIP EXPERIENCE
Software Engineering Intern | Brightline | Jun 2017 – Aug 2017
- Wrote the first version of the fraud rules engine

EDUCATION
B.S. Computer Science | University of Texas at Austin | 2014 – 2018

TECHNICAL EXPERTISE
• Languages: Go, Python, SQL
• Infrastructure: Kubernetes, Terraform, AWS

KEY ACHIEVEMENTS
- Reduced cloud spend by 22% in one quarter

LANGUAGES
English (Native), Spanish (Professional)

INTERESTS
Trail running, Film photography`;

describe("importing a whole resume, section by section", () => {
  it("files every section of an Indian-style CV where it belongs", () => {
    const parsed = parseResumeText(INDIAN_CV);
    const s = parsed.sections;

    // The name as the file writes it; the user can recase it in Basic info.
    expect(parsed.basicInfo).toMatchObject({ name: "ASHA RAO", email: "asha.rao@example.com", location: "Pune, Maharashtra" });
    expect(s.summary).toBe("Data analyst with 3 years turning messy sales data into weekly decisions.");
    expect(s.experience).toEqual([
      expect.objectContaining({
        role: "Data Analyst",
        company: "Northwind Retail",
        bullets: ["Built the weekly sales dashboard used by 40 store managers", "Cut report preparation time from two days to two hours"],
      }),
    ]);
    expect(s.education?.[0]).toMatchObject({ institution: "Example Institute of Technology" });
    expect(parsed.skillGroups).toEqual([
      { title: "Languages", skills: ["Python", "SQL", "R"] },
      { title: "Visualisation", skills: ["Power BI", "Tableau"] },
      { title: "Tools", skills: ["Excel", "Git"] },
    ]);
    expect(s.skills).toEqual(["Python", "SQL", "R", "Power BI", "Tableau", "Excel", "Git"]);
    expect(s.projects?.[0]).toMatchObject({ name: "Churn predictor" });
    expect(s.certifications?.[0]).toMatchObject({ name: "Google Data Analytics Certificate", issuer: "Google" });
    // Spoken languages stay spoken languages; "Languages:" under Skill Set
    // was a skill group.
    expect(s.languages).toEqual([
      { name: "English", level: "Fluent" },
      { name: "Hindi", level: "Native" },
      { name: "Marathi", level: "Native" },
    ]);
    expect(s.hobbies).toEqual(["Chess", "Trekking"]);
    expect(s.softSkills).toEqual(["Attention to detail", "Clear communication"]);
    // Only the four fields the builder has; the father's name is dropped.
    expect(s.personalDetails).toEqual({
      dateOfBirth: "2000-03-12",
      gender: "Female",
      maritalStatus: "Single",
      nationality: "Indian",
    });
    expect(JSON.stringify(s)).not.toContain("R. Rao");
  });

  it("files every section of a US-style resume with other titles", () => {
    const parsed = parseResumeText(US_RESUME);
    const s = parsed.sections;

    expect(s.summary).toMatch(/^Backend engineer/);
    expect(s.experience?.map((e) => e.company)).toEqual(["Acme Payments"]);
    expect(s.internships?.map((e) => e.company)).toEqual(["Brightline"]);
    expect(s.education?.[0]).toMatchObject({ institution: "University of Texas at Austin" });
    expect(parsed.skillGroups?.map((group) => group.title)).toEqual(["Languages", "Infrastructure"]);
    expect(s.keyAchievements).toEqual(["Reduced cloud spend by 22% in one quarter"]);
    expect(s.languages).toEqual([
      { name: "English", level: "Native" },
      { name: "Spanish", level: "Professional" },
    ]);
    expect(s.hobbies).toEqual(["Trail running", "Film photography"]);
    expect(s.personalDetails).toBeUndefined();
  });

  it("lands in the builder with every imported section complete, grouped skills on, and the rest left on to fill in", () => {
    useBuilderStore.getState().resetStore();
    useBuilderStore.getState().applyImportedResume(parseResumeText(INDIAN_CV));
    const state = useBuilderStore.getState();

    for (const section of [
      "summary",
      "experience",
      "education",
      "skills",
      "projects",
      "certifications",
      "languages",
      "hobbies",
      "softSkills",
      "personalDetails",
    ]) {
      expect([section, state.sectionStatus[section]]).toEqual([section, "complete"]);
    }
    // Sections the file didn't have are empty and still on, not skipped.
    for (const section of ["internships", "partTime", "patents", "keyAchievements"]) {
      expect([section, state.sectionStatus[section]]).toEqual([section, "not_started"]);
    }
    expect(state.skillsLayout).toBe("grouped");
    expect(state.basicInfo.name).toBe("ASHA RAO");
    expect(state.getResumeData().sections.personalDetails).toMatchObject({ nationality: "Indian" });
  });
});

describe("the AI pass's answer, with its own field names", () => {
  it("maps alternative keys, personal details and skill groups onto the builder's sections", () => {
    const parsed = normalizeParsedResume({
      basicInfo: { name: "Asha Rao", email: "asha@example.com", phone: "+91 98765 43210", location: "Pune" },
      sections: {
        "Career Objective": "Data analyst with 3 years of retail analytics.",
        "Work History": [{ company: "Northwind Retail", role: "Data Analyst", startDate: "2022-06", bullets: ["Built dashboards"] }],
        "Languages Known": ["English (Fluent)", "Hindi (Native)"],
        personalDetails: { dateOfBirth: "12/03/2000", gender: "female", maritalStatus: "unmarried", nationality: "Indian" },
      },
      skillGroups: [
        { title: "Languages", skills: ["Python", "SQL"] },
        { title: "Tools", skills: ["Excel"] },
      ],
    });
    const s = parsed.sections;
    expect(s.summary).toBe("Data analyst with 3 years of retail analytics.");
    expect(s.experience?.[0]).toMatchObject({ company: "Northwind Retail", role: "Data Analyst" });
    expect(s.languages).toEqual([
      { name: "English", level: "Fluent" },
      { name: "Hindi", level: "Native" },
    ]);
    expect(s.personalDetails).toMatchObject({ dateOfBirth: "2000-03-12", gender: "Female", nationality: "Indian" });
    expect(s.skills).toEqual(["Python", "SQL", "Excel"]);
    expect(parsed.skillGroups?.map((group) => group.title)).toEqual(["Languages", "Tools"]);
  });
});
