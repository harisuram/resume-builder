import { getTheme } from "@/components/templates/shared/theme";
import type { ResumeData, ResumeSections, SectionKey, TemplateId } from "./types";

/** Demo resume shown in empty builder previews and the templates gallery.
 * Not written into the user's draft — preview-only. */
export const SAMPLE_RESUME: ResumeData = {
  basicInfo: {
    name: "Alexandra Montgomery-Whitfield",
    email: "alexandra@example.com",
    phone: "5550100199",
    phoneCountryCode: "+1",
    location: "San Francisco, CA",
    links: {
      linkedin: "linkedin.com/in/alexandra",
      github: "github.com/alexandra",
      portfolio: "alexandra.dev",
    },
  },
  sections: {
    summary: "Staff-level backend engineer with 9 years building resilient infrastructure.",
    keyAchievements: [
      "Cut infrastructure spend by 22% through a ground-up migration to spot instances",
      "Grew the platform team from 3 to 12 engineers over two years",
    ],
    education: [
      {
        institution: "Massachusetts Institute of Technology",
        degree: "M.S. Computer Science",
        fieldOfStudy: "Distributed Systems",
        startDate: "2014-08",
        endDate: "2016-05",
        gpa: "3.9",
        coursework: ["Distributed Systems", "Compilers"],
      },
    ],
    experience: [
      {
        company: "Nimbus Systems International",
        role: "Senior Staff Software Engineer",
        startDate: "2019-03",
        bullets: ["Led the redesign of the payments ledger", "Mentored a team of six engineers"],
      },
    ],
    internships: [
      {
        company: "Brightline Analytics",
        role: "Software Engineering Intern",
        startDate: "2015-06",
        endDate: "2015-08",
        bullets: ["Built an internal dashboard"],
      },
    ],
    partTime: [
      {
        company: "Campus Library",
        role: "Circulation Assistant",
        startDate: "2013-09",
        endDate: "2014-05",
        bullets: ["Staffed the front desk and managed reserve requests"],
      },
    ],
    projects: [
      {
        name: "Open-source Kafka connector",
        description: "A CDC connector bridging mainframe DB2 change streams into Kafka topics.",
        link: "github.com/alexandra/kafka-connector",
        technologies: ["Kafka", "Java"],
      },
    ],
    skills: ["TypeScript", "Kubernetes", "PostgreSQL", "Go", "AWS"],
    certifications: [{ name: "AWS Certified Solutions Architect", issuer: "Amazon Web Services", date: "2021-04" }],
    patents: [
      {
        title: "Distributed cache coherency protocol",
        number: "US 11,234,567",
        office: "USPTO",
        date: "2022-06",
        link: "https://patents.google.com/patent/US11234567",
      },
    ],
    languages: [
      { name: "English", level: "Native" },
      { name: "Spanish", level: "Professional" },
    ],
    hobbies: ["Trail running", "Film photography"],
    softSkills: ["Mentoring", "Stakeholder communication"],
    additional: {
      heading: "Publications",
      items: [
        {
          title: "Scaling ledger writes",
          subtitle: "ACM Queue",
          date: "2021",
          bullets: ["Surveyed consensus tradeoffs for payment systems"],
        },
      ],
    },
  },
  sectionStatus: {
    summary: "complete",
    keyAchievements: "complete",
    education: "complete",
    experience: "complete",
    internships: "complete",
    partTime: "complete",
    projects: "complete",
    skills: "complete",
    certifications: "complete",
    patents: "complete",
    languages: "complete",
    hobbies: "complete",
    softSkills: "complete",
    additional: "complete",
  },
  templateId: "jakes-resume",
};

/** Demo for gallery tiles. Every tile is a whole A4 sheet, so the sample has
 * to be long enough to reach the bottom of one — a five-section sample filled
 * barely half the paper and every card read as a mostly blank page. It also
 * has to span both halves of `NARROW_SECTION_KEYS`, or a sidebar template
 * shows an empty rail next to a full main column. Still short of a real
 * resume: the full `SAMPLE_RESUME` runs onto a second page, which a
 * single-page thumbnail would cut mid-entry. */
export const GALLERY_SAMPLE_RESUME: ResumeData = {
  ...SAMPLE_RESUME,
  sections: {
    summary: SAMPLE_RESUME.sections.summary,
    keyAchievements: SAMPLE_RESUME.sections.keyAchievements,
    experience: [
      {
        company: "Nimbus Systems International",
        role: "Senior Staff Software Engineer",
        startDate: "2019-03",
        bullets: [
          "Led the redesign of the payments ledger, cutting settlement time from hours to minutes",
          "Mentored a team of six engineers through two platform migrations",
          "Set the service-level objectives now used across all twelve backend services",
        ],
      },
      {
        company: "Delta Harbor Software",
        role: "Senior Backend Engineer",
        startDate: "2016-07",
        endDate: "2019-02",
        bullets: [
          "Rebuilt the ingestion pipeline to handle 40M events a day",
          "Introduced contract testing across eight teams",
        ],
      },
    ],
    projects: SAMPLE_RESUME.sections.projects,
    education: SAMPLE_RESUME.sections.education,
    skills: SAMPLE_RESUME.sections.skills,
    certifications: SAMPLE_RESUME.sections.certifications,
    languages: SAMPLE_RESUME.sections.languages,
  },
  sectionStatus: {
    summary: "complete",
    keyAchievements: "complete",
    experience: "complete",
    projects: "complete",
    education: "complete",
    skills: "complete",
    certifications: "complete",
    languages: "complete",
  },
};

function omitSkippedSection(
  sections: Partial<ResumeSections>,
  key: SectionKey,
): Partial<ResumeSections> {
  const next = { ...sections };
  delete next[key];
  return next;
}

/** Sample resume for the empty builder preview: follows the user's template,
 * section order, and skipped sections so the sneak peek matches what they'll print. */
export function sampleResumeForPreview(
  data: Pick<ResumeData, "templateId" | "sectionStatus" | "sectionOrder" | "sections">,
): ResumeData {
  let sections: Partial<ResumeSections> = { ...SAMPLE_RESUME.sections };
  const sectionStatus: ResumeData["sectionStatus"] = { ...SAMPLE_RESUME.sectionStatus };

  for (const key of Object.keys(SAMPLE_RESUME.sectionStatus) as SectionKey[]) {
    if (data.sectionStatus[key] === "skipped") {
      sectionStatus[key] = "skipped";
      sections = omitSkippedSection(sections, key);
    }
  }

  if (data.sectionStatus.photo === "skipped") {
    sectionStatus.photo = "skipped";
  }

  const customHeading = data.sections.additional?.heading?.trim();
  if (customHeading && sections.additional) {
    sections = {
      ...sections,
      additional: { ...sections.additional, heading: customHeading },
    };
  }

  return {
    ...SAMPLE_RESUME,
    templateId: data.templateId,
    sectionOrder: data.sectionOrder,
    sections,
    sectionStatus,
  };
}

/** Two-column templates split the same sections across two columns, so the
 * one-page gallery sample that fills a single-column sheet only reaches
 * halfway down theirs. These sections top up both columns — narrow gets
 * soft skills and hobbies, wide gets the publications block. */
const TWO_COLUMN_EXTRA_SECTIONS: Partial<ResumeSections> = {
  softSkills: SAMPLE_RESUME.sections.softSkills,
  hobbies: SAMPLE_RESUME.sections.hobbies,
  additional: SAMPLE_RESUME.sections.additional,
  internships: SAMPLE_RESUME.sections.internships,
  projects: [
    ...(GALLERY_SAMPLE_RESUME.sections.projects ?? []),
    {
      name: "Ledger replay tool",
      description: "Replays a day of payment events against a candidate build to diff the ledger.",
      technologies: ["Go", "PostgreSQL"],
    },
  ],
};

export function sampleResumeForTemplate(templateId: TemplateId): ResumeData {
  if (getTheme(templateId).layout !== "asymmetric") {
    return { ...GALLERY_SAMPLE_RESUME, templateId };
  }
  return {
    ...GALLERY_SAMPLE_RESUME,
    templateId,
    sections: { ...GALLERY_SAMPLE_RESUME.sections, ...TWO_COLUMN_EXTRA_SECTIONS },
    sectionStatus: {
      ...GALLERY_SAMPLE_RESUME.sectionStatus,
      softSkills: "complete",
      hobbies: "complete",
      additional: "complete",
      internships: "complete",
    },
  };
}
